import { ButtonGlyph } from './glyphs/Icons';
import ScreenContent from './screens/ScreenContent';
import type { Action, ButtonConfig, ButtonSlot, OvenState } from './types';
import { buttonsFor } from './utils';

interface Props {
  state: OvenState;
  dispatch: (a: Action) => void;
  /** Rendered on top of the glass (e.g. the assistant overlay). */
  overlay?: React.ReactNode;
}

// One of the four touch buttons. On the real oven the icon sits *inside* the
// glass next to a contact pad; here the whole row is one tap target. An active
// button shows the bright edge dash seen in the reference photo.
function EdgeButton({
  cfg,
  side,
  onTap,
}: {
  cfg: ButtonConfig;
  side: 'left' | 'right';
  onTap: () => void;
}) {
  const active = cfg.icon !== 'none';
  return (
    <button
      type="button"
      disabled={!active}
      onClick={onTap}
      aria-label={cfg.icon}
      className={`group flex h-1/2 items-center gap-2 px-2 ${
        side === 'right' ? 'flex-row-reverse' : ''
      } ${active ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {/* bright edge tick — lit only when the button is assigned */}
      <span
        className={`h-0.75 w-7 rounded-full transition ${
          active ? 'bg-lcd-ink/80 group-active:bg-lcd-ink' : 'bg-lcd-ink/15'
        }`}
      />
      <ButtonGlyph icon={cfg.icon} className="h-5 w-5 text-lcd-ink/85" />
    </button>
  );
}

export default function DisplayPanel({ state, dispatch, overlay }: Props) {
  const buttons = buttonsFor(state);
  const tap = (slot: ButtonSlot) => {
    const a = buttons[slot].action;
    if (a) dispatch(a);
  };

  const dark = state.screen === 'standby' || state.screen === 'locked';

  return (
    <div className="flex w-full items-stretch">
      {/* left button column */}
      <div className="flex w-16 flex-col justify-center">
        <EdgeButton cfg={buttons.topLeft} side="left" onTap={() => tap('topLeft')} />
        <EdgeButton cfg={buttons.bottomLeft} side="left" onTap={() => tap('bottomLeft')} />
      </div>

      {/* the glass display. Tapping wakes it from stand-by; on menu screens the
          inner controls (strip, buttons) handle their own taps. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => state.screen === 'standby' && dispatch({ type: 'ACTIVATE' })}
        className="relative aspect-16/10 flex-1 cursor-pointer overflow-hidden rounded-md text-left"
        style={{
          background:
            'radial-gradient(120% 140% at 50% 0%, #323a42 0%, var(--color-lcd-glass) 45%, var(--color-lcd-glass-2) 100%)',
          boxShadow:
            'inset 0 1px 2px rgba(255,255,255,0.08), inset 0 -10px 24px rgba(0,0,0,0.45)',
        }}
      >
        <div
          className={`h-full transition-opacity duration-300 ${dark ? 'opacity-70' : 'opacity-100'}`}
        >
          <ScreenContent state={state} dispatch={dispatch} />
        </div>
        {/* glass glare */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.05), transparent 40%)' }}
        />
        {overlay}
      </div>

      {/* right button column */}
      <div className="flex w-16 flex-col justify-center">
        <EdgeButton cfg={buttons.topRight} side="right" onTap={() => tap('topRight')} />
        <EdgeButton cfg={buttons.bottomRight} side="right" onTap={() => tap('bottomRight')} />
      </div>
    </div>
  );
}
