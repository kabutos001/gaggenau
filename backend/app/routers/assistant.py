"""Cooking assistant: voice → oven program suggestion.

Claudia tells the oven what she's cooking; Gemini transcribes the audio and
picks the right operating mode + temperature from the BO 210/211's program
catalogue. The frontend renders the suggestion on the LCD and only applies it
once she confirms (suggest-then-confirm).

No auth, no persistence — this is a prototype side-feature.
"""

import asyncio
import json
import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from google import genai
from google.genai import types
from pydantic import BaseModel

from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

# Gemini Live transcribes the recorded blob; the flash text model selects the
# program. Mirrors the reference stack (batch25 tactic_toaster).
LIVE_MODEL = "models/gemini-3.1-flash-live-preview"
TEXT_MODEL = "gemini-2.5-flash"
INPUT_SAMPLE_RATE = 16000

# Operating-mode catalogue — ground truth from the BO 210/211 manual
# (Betriebsarten p9 + Back-/Brattabelle). `id` matches the frontend ModeId so
# the UI can apply the suggestion directly. Temp ranges guide the model.
PROGRAMS: list[dict[str, object]] = [
    {
        "id": "hotair",
        "label": "Heißluft",
        "use": "Kuchen, Plätzchen, Blätterteig auf mehreren Ebenen; Hefegebäck.",
        "range": [50, 300],
    },
    {
        "id": "eco",
        "label": "Eco",
        "use": "Energiesparender Heißluftbetrieb für Kuchen, Aufläufe, Gratins.",
        "range": [50, 300],
    },
    {
        "id": "hotair-bottom",
        "label": "Heißluft + Unterhitze",
        "use": "Zusätzliche Hitze von unten für feuchte Kuchen, z. B. Obstkuchen.",
        "range": [50, 300],
    },
    {
        "id": "bottom",
        "label": "Unterhitze",
        "use": "Nachbacken, Einkochen, Gerichte im Wasserbad.",
        "range": [50, 300],
    },
    {
        "id": "top-bottom",
        "label": "Ober- und Unterhitze",
        "use": "Kuchen in Formen/auf dem Blech, Aufläufe, Braten, Brot.",
        "range": [50, 300],
    },
    {
        "id": "top",
        "label": "Oberhitze",
        "use": "Gezielte Hitze von oben, Überbacken z. B. Baiser.",
        "range": [50, 300],
    },
    {
        "id": "grill-hotair",
        "label": "Grill + Heißluft",
        "use": "Rundum-Erwärmung für Fleisch, Geflügel, ganzen Fisch, Braten.",
        "range": [50, 250],
    },
    {
        "id": "grill",
        "label": "Grill",
        "use": "Flache Fleischstücke, Würstchen, Fischfilet grillen; Gratinieren.",
        "range": [50, 300],
    },
    {
        "id": "pizza",
        "label": "Backstein-Funktion",
        "use": "Knusprige Pizza, Brot, Brötchen wie aus dem Steinofen.",
        "range": [250, 300],
    },
    {
        "id": "catalysis",
        "label": "Katalyse",
        "use": "Katalytische Selbstreinigung des Garraums (kein Garen).",
        "range": [300, 300],
    },
]

_VALID_IDS = {p["id"] for p in PROGRAMS}

# The app is assumed to know the wider Gaggenau kitchen — surface that so the
# assistant can reason across appliances when relevant.
KITCHEN_CONTEXT = (
    "You are the assistant for a full Gaggenau kitchen: this oven (BO 210/211), "
    "plus a fridge/freezer, dishwasher, and a toaster. You may reference the "
    'other appliances briefly when genuinely helpful (e.g. "take the tart out of '
    'the fridge first"), but your job here is to set THIS oven.'
)

SELECT_INSTRUCTION = (
    "You are a Gaggenau oven cooking assistant for a busy home cook who has never "
    "read the manual. From what the user says they are cooking, pick exactly ONE "
    "operating mode from the catalogue and a sensible temperature in °C, using the "
    "manual's guidance. Prefer the bold/recommended mode for the dish. "
    "Return concise, warm, plain-language reasoning in ENGLISH (max ~20 words) — "
    "no jargon, no manual citations. " + KITCHEN_CONTEXT
)


class CookSuggestion(BaseModel):
    """Structured program suggestion returned to the LCD."""

    transcript: str
    mode_id: str
    mode_label: str
    temp_c: int
    rationale: str
    dish: str


# Schema the model must fill (German field semantics kept in English for the UI).
_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "mode_id": {"type": "string", "enum": sorted(_VALID_IDS)},
        "temp_c": {"type": "integer"},
        "dish": {
            "type": "string",
            "description": "Short name of what the user is cooking.",
        },
        "rationale": {
            "type": "string",
            "description": "Warm, plain-language reason, max ~20 words.",
        },
    },
    "required": ["mode_id", "temp_c", "dish", "rationale"],
}


async def _transcribe(
    client: genai.Client, audio_bytes: bytes, sample_rate: int
) -> str:
    """Transcribe a recorded PCM blob via the Live API (bracketed PTT turn).

    Workaround: the live model only supports AUDIO output (TEXT raises a 1007
    "modality not supported"). We must request AUDIO and then read the
    `input_transcription` field — that's what actually gives us the user's
    words. The model's audio reply is generated but discarded; we only want
    the transcript here. (Same trick as the batch25 reference stack.)
    """
    # Disable automatic VAD: we send a single pre-recorded blob bracketed by
    # explicit activity_start/activity_end markers. With auto-VAD left on, the
    # server ignores our activity_end and keeps waiting for speech to "end"
    # naturally — which never happens on a finished blob, so no turn_complete
    # ever arrives and the turn hangs until timeout (observed: frames arrive
    # empty, then silence). Disabling VAD makes our markers authoritative.
    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        input_audio_transcription=types.AudioTranscriptionConfig(),
        realtime_input_config=types.RealtimeInputConfig(
            automatic_activity_detection=types.AutomaticActivityDetection(disabled=True)
        ),
    )
    transcript = ""
    # The Live API streams its (discarded) audio reply in many small frames;
    # we only want the input transcript. Tally the discarded chunks for one
    # summary line at the end rather than logging per frame.
    audio_chunks = 0
    async with client.aio.live.connect(model=LIVE_MODEL, config=config) as session:
        await session.send_realtime_input(activity_start=types.ActivityStart())
        await session.send_realtime_input(
            audio=types.Blob(
                data=audio_bytes, mime_type=f"audio/pcm;rate={sample_rate}"
            )
        )
        await session.send_realtime_input(activity_end=types.ActivityEnd())

        async for response in session.receive():
            sc = response.server_content
            if not sc:
                continue
            if getattr(response, "data", None):
                audio_chunks += 1
            it = getattr(sc, "input_transcription", None)
            if it and getattr(it, "text", None):
                transcript += it.text
            # We only need the input transcript. Once the model starts its
            # reply (generation_complete) or the turn ends, the transcript is
            # final — stop instead of waiting for the whole audio answer, which
            # can run past the request timeout.
            if getattr(sc, "generation_complete", False) and transcript:
                break
            if getattr(sc, "turn_complete", False):
                break
    logger.info(
        "[assistant] transcribed %d bytes @ %d Hz — %r (%d audio chunks discarded)",
        len(audio_bytes),
        sample_rate,
        transcript[:80],
        audio_chunks,
    )
    return transcript.strip()


def _select_program(client: genai.Client, transcript: str) -> dict[str, object]:
    """Pick a mode + temperature for the dish (structured JSON output)."""
    catalogue = json.dumps(PROGRAMS, ensure_ascii=False)
    prompt = (
        f"Program catalogue (JSON):\n{catalogue}\n\n"
        f'The user said: "{transcript}"\n\n'
        "Pick the best single program and temperature."
    )
    result = client.models.generate_content(
        model=TEXT_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SELECT_INSTRUCTION,
            response_mime_type="application/json",
            response_schema=_RESPONSE_SCHEMA,
            temperature=0.4,
        ),
    )
    return json.loads(result.text or "{}")


@router.post("/cook", response_model=CookSuggestion)
async def cook(
    audio: UploadFile = File(...),
    transcript: str | None = Form(None),
    sample_rate: int = Form(INPUT_SAMPLE_RATE),
) -> CookSuggestion:
    """Voice (or typed transcript) → suggested oven program.

    Send either an audio blob (mono int16 PCM at `sample_rate` Hz) or a typed
    `transcript`. Browsers often ignore a requested 16 kHz capture rate, so the
    client reports the actual rate and we pass it through to the decoder.
    """
    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    client = genai.Client(api_key=settings.gemini_api_key)

    said = (transcript or "").strip()
    if not said:
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(
                status_code=400, detail="No audio or transcript provided"
            )
        try:
            said = await asyncio.wait_for(
                _transcribe(client, audio_bytes, sample_rate), timeout=30.0
            )
        except Exception as exc:  # noqa: BLE001 — surface any failure as 502
            logger.exception("transcription failed")
            raise HTTPException(
                status_code=502, detail="Could not transcribe audio"
            ) from exc

    if not said:
        raise HTTPException(status_code=422, detail="Could not make out what you said")

    try:
        chosen = await asyncio.to_thread(_select_program, client, said)
    except Exception as exc:  # noqa: BLE001
        logger.exception("program selection failed")
        raise HTTPException(status_code=502, detail="Assistant is unavailable") from exc

    mode_id = str(chosen.get("mode_id", ""))
    if mode_id not in _VALID_IDS:
        mode_id = "top-bottom"  # safe default (Ober- und Unterhitze)
    label = next(p["label"] for p in PROGRAMS if p["id"] == mode_id)
    temp = int(chosen.get("temp_c") or 180)
    temp = max(50, min(300, temp))

    logger.info("[assistant] %r → %s @ %d°C", said[:60], mode_id, temp)
    return CookSuggestion(
        transcript=said,
        mode_id=mode_id,
        mode_label=str(label),
        temp_c=temp,
        rationale=str(chosen.get("rationale", "")),
        dish=str(chosen.get("dish", "")),
    )
