"""Cooking assistant: voice → oven program suggestion.

Claudia tells the oven what she's cooking; Gemini transcribes the audio and
picks the right operating mode + temperature from the BO 210/211's program
catalogue. The frontend renders the suggestion on the LCD and only applies it
once she confirms (suggest-then-confirm).

No auth, no persistence — this is a prototype side-feature.
"""

import asyncio
import base64
import json
import logging
from pathlib import Path

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from google import genai
from google.genai import types
from pydantic import BaseModel

from ..config import settings

logger = logging.getLogger(__name__)


async def _send_error(websocket: WebSocket, detail: str) -> None:
    """Best-effort: report an error to the client, then close.

    If the client has already gone away the socket is dead and any send/close
    raises; that's expected, so we swallow it rather than letting a routine
    disconnect surface as an unhandled ASGI exception.
    """
    try:
        await websocket.send_json({"type": "error", "detail": detail})
        await websocket.close()
    except Exception:  # noqa: BLE001
        pass


router = APIRouter(prefix="/api/assistant", tags=["assistant"])

# Gemini Live both transcribes the recorded blob AND speaks the Sous-Chef reply;
# the flash text model selects the program in parallel.
LIVE_MODEL = "models/gemini-3.1-flash-live-preview"
TEXT_MODEL = "gemini-2.5-flash"
INPUT_SAMPLE_RATE = 16000
# The Live API returns 24 kHz mono int16 PCM; the frontend plays it at this rate.
OUTPUT_SAMPLE_RATE = 24000
# A calm, low voice fits the "discreet luxury Sous-Chef" persona.
VOICE_NAME = "Charon"

# The spoken Sous-Chef persona/system prompt, authored in souschef.en.txt so it
# can be edited without touching code. Loaded once at import.
_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "souschef.en.txt"
SOUSCHEF_PROMPT = _PROMPT_PATH.read_text(encoding="utf-8").strip()

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
    """Structured program suggestion returned to the LCD.

    The device talks back via `reply_audio_b64` (the spoken Sous-Chef answer)
    while simultaneously offering the program the user can confirm
    (mode_id/temp_c). The user listens — there is no on-screen reply text.
    """

    transcript: str
    mode_id: str
    mode_label: str
    temp_c: int
    rationale: str
    dish: str
    # The spoken Sous-Chef reply as base64 PCM @ OUTPUT_SAMPLE_RATE. Empty on
    # the typed path (no input audio → no spoken reply).
    reply_audio_b64: str = ""


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


def _speak_config() -> types.LiveConnectConfig:
    """Live API config for one push-to-talk Sous-Chef turn.

    AUDIO out + a prebuilt voice so the device speaks; input transcription so we
    still get the user's words; a sliding context window per the reference. VAD
    is DISABLED: we send one finished blob bracketed by explicit
    activity_start/activity_end. With auto-VAD on, the server ignores our
    activity_end and waits for speech to "end" naturally on a blob that never
    streams more — so turn_complete never arrives and the turn hangs to timeout
    (verified: 40s TimeoutError). Disabling VAD makes our markers authoritative.
    """
    return types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        system_instruction=SOUSCHEF_PROMPT,
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=VOICE_NAME)
            )
        ),
        context_window_compression=types.ContextWindowCompressionConfig(
            sliding_window=types.SlidingWindow(),
        ),
        realtime_input_config=types.RealtimeInputConfig(
            automatic_activity_detection=types.AutomaticActivityDetection(disabled=True)
        ),
    )


async def _speak_turn(
    client: genai.Client, audio_bytes: bytes, sample_rate: int
) -> tuple[str, bytes]:
    """One Live turn over a recorded PCM blob (buffered; used by POST /cook).

    Returns (user_transcript, reply_audio_bytes). The Live model takes the
    user's audio, transcribes it (input_transcription), and speaks the
    Sous-Chef answer back (we collect the reply audio frames). The persona comes
    from SOUSCHEF_PROMPT.
    """
    config = _speak_config()
    transcript = ""
    audio_chunks: list[bytes] = []
    async with client.aio.live.connect(model=LIVE_MODEL, config=config) as session:
        await session.send_realtime_input(activity_start=types.ActivityStart())
        await session.send_realtime_input(
            audio=types.Blob(
                data=audio_bytes, mime_type=f"audio/pcm;rate={sample_rate}"
            )
        )
        await session.send_realtime_input(activity_end=types.ActivityEnd())

        # Run the turn to turn_complete so the WHOLE spoken reply arrives — the
        # audio streams in many frames after the input transcript.
        async for response in session.receive():
            sc = response.server_content
            if not sc:
                continue
            if response.data:
                audio_chunks.append(response.data)
            it = getattr(sc, "input_transcription", None)
            if it and getattr(it, "text", None):
                transcript += it.text
            if getattr(sc, "turn_complete", False):
                break

    audio = b"".join(audio_chunks)
    logger.info(
        "[assistant] _speak_turn DONE — user: %r | %d B audio (%d frames)",
        transcript[:80],
        len(audio),
        len(audio_chunks),
    )
    return transcript.strip(), audio


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
            # Disable thinking: this is a tiny constrained classification, and
            # the default thinking budget was adding ~5s for no quality gain.
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    )
    return json.loads(result.text or "{}")


def _finalize_program(chosen: dict[str, object]) -> tuple[str, str, int, str, str]:
    """Validate + clamp a raw selection into (mode_id, label, temp, rationale, dish)."""
    mode_id = str(chosen.get("mode_id", ""))
    if mode_id not in _VALID_IDS:
        mode_id = "top-bottom"  # safe default (Ober- und Unterhitze)
    label = next(p["label"] for p in PROGRAMS if p["id"] == mode_id)
    temp = max(50, min(300, int(chosen.get("temp_c") or 180)))
    return (
        mode_id,
        str(label),
        temp,
        str(chosen.get("rationale", "")),
        str(chosen.get("dish", "")),
    )


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
    reply_audio = b""

    if not said:
        # Voice path: one Live turn transcribes the audio AND speaks the reply.
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(
                status_code=400, detail="No audio or transcript provided"
            )
        try:
            said, reply_audio = await asyncio.wait_for(
                _speak_turn(client, audio_bytes, sample_rate), timeout=40.0
            )
        except Exception as exc:  # noqa: BLE001 — surface any failure as 502
            logger.exception("live turn failed")
            raise HTTPException(
                status_code=502, detail="Could not transcribe audio"
            ) from exc
    # Typed path: no input audio to feed the Live API → no spoken reply. We
    # still pick and offer the program for confirmation.

    if not said:
        raise HTTPException(status_code=422, detail="Could not make out what you said")

    try:
        chosen = await asyncio.to_thread(_select_program, client, said)
    except Exception as exc:  # noqa: BLE001
        logger.exception("program selection failed")
        raise HTTPException(status_code=502, detail="Assistant is unavailable") from exc

    mode_id, label, temp, rationale, dish = _finalize_program(chosen)

    logger.info(
        "[assistant] %r → %s @ %d°C (%d bytes reply audio)",
        said[:60],
        mode_id,
        temp,
        len(reply_audio),
    )
    return CookSuggestion(
        transcript=said,
        mode_id=mode_id,
        mode_label=label,
        temp_c=temp,
        rationale=rationale,
        dish=dish,
        reply_audio_b64=base64.b64encode(reply_audio).decode() if reply_audio else "",
    )


@router.websocket("/cook_ws")
async def cook_ws(websocket: WebSocket) -> None:
    """Streaming voice → program. Lower latency than POST /cook.

    Protocol (one push-to-talk turn):
      client → init JSON  {"sample_rate": 16000}
      client → one binary message: the recorded mono int16 PCM blob
      client → JSON {"end": true}
      server → binary frames: the spoken reply audio (24 kHz PCM) as it streams
      server → JSON {"type": "suggestion", ...CookSuggestion}
      server closes.

    Streaming the reply frames means playback can start within a few seconds
    instead of after the whole clip is buffered, and the program selection runs
    concurrently so it adds no extra wait.
    """
    await websocket.accept()

    if not settings.gemini_api_key:
        await websocket.send_json(
            {"type": "error", "detail": "GEMINI_API_KEY not configured"}
        )
        await websocket.close()
        return

    try:
        init = await websocket.receive_json()
    except Exception:
        await websocket.close(code=1003)
        return
    sample_rate = int(init.get("sample_rate") or INPUT_SAMPLE_RATE)

    # Collect the recorded blob (sent as one or more binary messages, ended by
    # a small JSON sentinel).
    audio_buf = bytearray()
    try:
        while True:
            msg = await websocket.receive()
            if msg.get("type") == "websocket.disconnect":
                return
            if msg.get("bytes") is not None:
                audio_buf.extend(msg["bytes"])
            elif msg.get("text"):
                data = json.loads(msg["text"])
                if data.get("end"):
                    break
    except WebSocketDisconnect:
        return

    if not audio_buf:
        await websocket.send_json({"type": "error", "detail": "No audio received"})
        await websocket.close()
        return

    client = genai.Client(api_key=settings.gemini_api_key)
    config = _speak_config()

    transcript = ""
    audio_frames = 0
    select_task: asyncio.Task[dict[str, object]] | None = None

    logger.info("[assistant:ws] turn — %d B audio @ %d Hz", len(audio_buf), sample_rate)
    try:
        async with client.aio.live.connect(model=LIVE_MODEL, config=config) as session:
            await session.send_realtime_input(activity_start=types.ActivityStart())
            await session.send_realtime_input(
                audio=types.Blob(
                    data=bytes(audio_buf), mime_type=f"audio/pcm;rate={sample_rate}"
                )
            )
            await session.send_realtime_input(activity_end=types.ActivityEnd())

            async for response in session.receive():
                sc = response.server_content
                if not sc:
                    continue
                # Relay reply audio to the client the instant it arrives.
                if response.data:
                    audio_frames += 1
                    await websocket.send_bytes(response.data)
                it = getattr(sc, "input_transcription", None)
                if it and getattr(it, "text", None):
                    transcript += it.text
                    # As soon as we have the user's words, start picking the
                    # program in parallel with the still-streaming audio.
                    if select_task is None and transcript.strip():
                        select_task = asyncio.create_task(
                            asyncio.to_thread(
                                _select_program, client, transcript.strip()
                            )
                        )
                if getattr(sc, "turn_complete", False):
                    break
    except WebSocketDisconnect:
        # Client left mid-stream (closed tab, navigated, lost network). Routine
        # — not an error; just stop relaying.
        logger.info("[assistant:ws] client disconnected mid-turn")
        return
    except Exception:  # noqa: BLE001
        logger.exception("[assistant:ws] live turn failed")
        await _send_error(websocket, "Could not transcribe audio")
        return

    said = transcript.strip()
    if not said:
        await _send_error(websocket, "Could not make out what you said")
        return

    # Selection may already be running; if the transcript never triggered it
    # (race), run it now.
    if select_task is None:
        select_task = asyncio.create_task(
            asyncio.to_thread(_select_program, client, said)
        )
    try:
        chosen = await select_task
    except Exception:  # noqa: BLE001
        logger.exception("[assistant:ws] program selection failed")
        await _send_error(websocket, "Assistant is unavailable")
        return

    mode_id, label, temp, rationale, dish = _finalize_program(chosen)
    logger.info(
        "[assistant:ws] %r → %s @ %d°C (%d audio frames streamed)",
        said[:60],
        mode_id,
        temp,
        audio_frames,
    )
    try:
        await websocket.send_json(
            {
                "type": "suggestion",
                "transcript": said,
                "mode_id": mode_id,
                "mode_label": label,
                "temp_c": temp,
                "rationale": rationale,
                "dish": dish,
            }
        )
        await websocket.close()
    except (WebSocketDisconnect, RuntimeError):
        # Client left before we delivered the suggestion — harmless.
        logger.info("[assistant:ws] client gone before suggestion delivered")
