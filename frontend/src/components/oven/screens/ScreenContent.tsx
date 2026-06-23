import { MODES, SETTING_FUNCTIONS, TIMER_FUNCTIONS } from '../constants';
import { DoorGlyph, GridGlyph, ProbeGlyph, StandbyGlyph, WifiGlyph } from '../glyphs/Icons';
import ModeGlyph from '../glyphs/ModeGlyph';
import SevenSeg from '../SevenSeg';
import type { Action, OvenState } from '../types';
import { cookEndTime, formatClock, formatMinutes, formatSeconds } from '../utils';

// Persistent connectivity marks, bottom-left of the glass on every screen.
function ConnBadge() {
  return (
    <div className="text-lcd-ink/40 absolute bottom-[6%] left-[4%] flex items-end gap-[1.8vh]">
      <WifiGlyph className="h-[9vh] w-[10vh]" />
      <GridGlyph className="h-[8vh] w-[8vh]" />
    </div>
  );
}

// Small tappable corner icon (door, standby, info, timer…).
function CornerIcon({
  children,
  onTap,
  className,
}: {
  children: React.ReactNode;
  onTap?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={!onTap}
      className={`text-lcd-ink/70 active:text-lcd-ink absolute z-10 flex min-h-[8vh] min-w-[8vh] items-center justify-center transition disabled:opacity-100 ${className ?? ''}`}
    >
      {children}
    </button>
  );
}

export default function ScreenContent({
  state,
  dispatch,
}: {
  state: OvenState;
  dispatch: (a: Action) => void;
}) {
  const mode = MODES[state.modeIndex];
  const unit = state.celsius ? '°C' : '°F';
  const toDisp = (c: number) => (state.celsius ? c : Math.round((c * 9) / 5 + 32));

  switch (state.screen) {
    case 'standby':
      return (
        <div className="relative h-full w-full">
          {/* GAGGENAU wordmark sits centred-high, knob is dark below it */}
          <div className="absolute inset-x-0 top-[16%] flex flex-col items-center gap-[1vh]">
            <span className="text-lcd-ink/85 text-[clamp(18px,4.4vh,34px)] font-light uppercase tracking-[0.45em]">
              Gaggenau
            </span>
            <SevenSeg value={formatClock(state)} className="text-[clamp(20px,4.6vh,48px)]" />
          </div>
          <ConnBadge />
        </div>
      );

    case 'locked':
      return (
        <div className="relative h-full w-full">
          <div className="absolute inset-x-0 top-[20%] flex flex-col items-center gap-[1vh]">
            <SevenSeg value={formatClock(state)} className="text-[clamp(26px,6.2vh,50px)]" />
            <span className="text-lcd-ink/55 text-[clamp(12px,2.2vh,16px)] tracking-wide">
              Kindersicherung aktiv
            </span>
          </div>
          <CornerIcon
            onTap={() => dispatch({ type: 'TOGGLE_LOCK' })}
            className="right-[4%] top-[8%]"
          >
            <span className="text-[clamp(12px,2.2vh,16px)]">Entsperren</span>
          </CornerIcon>
          <ConnBadge />
        </div>
      );

    case 'operating':
      return (
        <div className="relative h-full w-full">
          {/* big set-temperature, upper-left */}
          <div className="absolute left-[6%] top-[13%] flex items-start">
            <SevenSeg value={String(toDisp(state.temp))} className="text-[clamp(36px,10vh,80px)]" />
            <span className="text-lcd-ink/75 mt-[0.6vh] ml-[0.4vh] text-[clamp(43px,43vh,46px)]">
              °
            </span>
          </div>

          {/* mode glyph, upper-centre */}
          <div className="absolute left-1/2 top-[11%] flex -translate-x-1/2 flex-col items-center gap-[0.8vh]">
            <ModeGlyph mode={mode.id} className="text-lcd-ink/90 h-[12vh] w-[10vh]" />
            <span className="text-lcd-ink/55 max-w-[32vh] text-center text-[clamp(11px,2.1vh,15px)] leading-tight">
              {mode.label}
            </span>
          </div>

          {/* probe + door, upper-right */}
          <div className="absolute right-[5%] top-[13%] flex items-center gap-[2.6vh]">
            <ProbeGlyph className="text-lcd-ink/45 h-[9vh] w-[9vh]" />
            <CornerIcon
              onTap={() => dispatch({ type: 'OPEN_SETTINGS' })}
              className="relative right-auto top-auto"
            >
              <DoorGlyph className="h-[9vh] w-[9vh]" />
            </CornerIcon>
          </div>

          {/* orange start/heat triangle on the right edge */}
          <button
            type="button"
            aria-label="Start"
            onClick={() => dispatch({ type: 'CYCLE_MODE', dir: 1 })}
            className="absolute right-[2%] top-1/2 z-10 flex min-h-[10vh] min-w-[8vh] -translate-y-1/2 items-center justify-center"
          >
            <svg viewBox="0 0 24 24" className="h-[7vh] w-[7vh]">
              <path d="M7 4 l13 8 -13 8 z" fill="var(--color-lcd-heat)" />
            </svg>
          </button>

          {/* timer + info, lower-left near the badge */}
          <CornerIcon onTap={() => dispatch({ type: 'OPEN_TIMER' })} className="bottom-[6%] right-[5%]">
            <svg viewBox="0 0 24 24" className="h-[10vh] w-[10vh]" fill="none">
              <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 8 v5 l4 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </CornerIcon>
          <ConnBadge />
        </div>
      );

    case 'info':
      return (
        <div className="relative h-full w-full">
          <div className="absolute inset-x-0 top-[14%] flex flex-col items-center">
            <div className="flex items-start">
              <SevenSeg
                value={String(toDisp(state.currentTemp))}
                className="text-[clamp(36px,10vh,76px)]"
              />
              <span className="text-lcd-ink/75 mt-[0.6vh] ml-[0.4vh] text-[clamp(13px,3vh,26px)]">
                {unit}
              </span>
            </div>
            <span className="text-lcd-ink/55 text-[clamp(11px,2.2vh,16px)]">Aktuelle Temperatur</span>
          </div>
          <CornerIcon onTap={() => dispatch({ type: 'BACK' })} className="right-[4%] top-[8%]">
            <StandbyGlyph className="h-[10vh] w-[10vh]" />
          </CornerIcon>
          <ConnBadge />
        </div>
      );

    case 'timer': {
      const fn = TIMER_FUNCTIONS[state.timerIndex];
      let big = formatMinutes(state.minuteMinder);
      let caption = '';
      if (fn.id === 'minuteMinder') {
        big = formatMinutes(state.minuteMinder);
        caption = 'Kurzzeit-Wecker';
      } else if (fn.id === 'stopwatch') {
        big = formatSeconds(state.stopwatch);
        caption = state.stopwatchRunning ? 'Stoppuhr · läuft' : 'Stoppuhr';
      } else if (fn.id === 'cookDuration') {
        big = formatMinutes(state.cookDuration);
        caption = 'Garzeit-Dauer';
      } else {
        big = cookEndTime(state);
        caption = 'Garzeit-Ende';
      }
      return (
        <div className="relative h-full w-full">
          <div className="absolute inset-x-0 top-[10%] flex flex-col items-center gap-[0.6vh]">
            <span className="text-lcd-ink/55 text-[clamp(11px,2.2vh,16px)]">{caption}</span>
            <SevenSeg value={big} className="text-[clamp(30px,8.6vh,64px)]" />
          </div>
          {/* prev / next function arrows along the top */}
          <CornerIcon
            onTap={() => dispatch({ type: 'TIMER_NAV', dir: -1 })}
            className="left-[5%] top-1/2 -translate-y-1/2"
          >
            <Chevron dir="left" />
          </CornerIcon>
          <CornerIcon
            onTap={() => dispatch({ type: 'TIMER_NAV', dir: 1 })}
            className="right-[5%] top-1/2 -translate-y-1/2"
          >
            <Chevron dir="right" />
          </CornerIcon>
          <CornerIcon onTap={() => dispatch({ type: 'BACK' })} className="right-[4%] top-[8%]">
            <StandbyGlyph className="h-[5.8vh] w-[5.8vh]" />
          </CornerIcon>
          <ConnBadge />
        </div>
      );
    }

    case 'settings':
    case 'firstSettings': {
      const fn = SETTING_FUNCTIONS[state.settingIndex];
      let big = '';
      let caption = fn.label;
      if (fn.id === 'clock') big = formatClock(state);
      else if (fn.id === 'timeFormat') big = state.use24h ? '24H' : '12H';
      else if (fn.id === 'tempUnit') big = state.celsius ? '°C' : '°F';
      else if (fn.id === 'childLock') {
        big = state.childLockAvailable ? 'ON' : 'OFF';
        caption = 'Kindersicherung';
      } else big = 'OFF';
      return (
        <div className="relative h-full w-full">
          <div className="absolute inset-x-0 top-[10%] flex flex-col items-center gap-[0.6vh]">
            <span className="text-lcd-ink/55 text-[clamp(11px,2.2vh,16px)]">{caption}</span>
            <SevenSeg value={big} className="text-[clamp(30px,8.6vh,64px)]" />
          </div>
          <CornerIcon
            onTap={() => dispatch({ type: 'SETTINGS_NAV', dir: -1 })}
            className="left-[5%] top-1/2 -translate-y-1/2"
          >
            <Chevron dir="left" />
          </CornerIcon>
          <CornerIcon
            onTap={() => dispatch({ type: 'SETTINGS_NAV', dir: 1 })}
            className="right-[5%] top-1/2 -translate-y-1/2"
          >
            <Chevron dir="right" />
          </CornerIcon>
          <CornerIcon onTap={() => dispatch({ type: 'BACK' })} className="right-[4%] top-[8%]">
            <StandbyGlyph className="h-[5.8vh] w-[5.8vh]" />
          </CornerIcon>
          <ConnBadge />
        </div>
      );
    }
  }
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[4.8vh] w-[4.8vh]" fill="none">
      <polyline
        points={dir === 'left' ? '15,5 8,12 15,19' : '9,5 16,12 9,19'}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
