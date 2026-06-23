import { MODES, SETTING_FUNCTIONS, TIMER_FUNCTIONS } from '../constants';
import { DoorGlyph, HeatUpGlyph, ProbeGlyph, StandbyGlyph } from '../glyphs/Icons';
import ModeGlyph from '../glyphs/ModeGlyph';
import SevenSeg from '../SevenSeg';
import type { Action, OvenState } from '../types';
import { cookEndTime, formatClock, formatMinutes, formatSeconds } from '../utils';

const TopBar = ({ children }: { children?: React.ReactNode }) => (
  <div className="text-lcd-ink flex h-7 items-center justify-center px-3">{children}</div>
);

// The scrolling icon row at the top of a menu (manual p10/p19): a strip of
// small function icons with the active one boxed. Icons are tappable to jump
// directly to a function.
function MenuStrip({
  icons,
  active,
  onSelect,
}: {
  icons: string[];
  active: number;
  onSelect?: (i: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-0.75 pt-1">
      {icons.map((label, i) => (
        <button
          type="button"
          key={i}
          onClick={() => onSelect?.(i)}
          className={`flex h-5 min-w-5 items-center justify-center rounded-[3px] px-1 text-[10px] leading-none ${
            i === active ? 'bg-lcd-ink/15 text-lcd-ink ring-lcd-ink/40 ring-1' : 'text-lcd-ink/40'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
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

  // Tap a strip icon to jump to that function via repeated relative nav.
  const jumpTimer = (i: number) => {
    const d = i - state.timerIndex;
    for (let k = 0; k < Math.abs(d); k++) dispatch({ type: 'TIMER_NAV', dir: d > 0 ? 1 : -1 });
  };
  const jumpSetting = (i: number) => {
    const d = i - state.settingIndex;
    for (let k = 0; k < Math.abs(d); k++) dispatch({ type: 'SETTINGS_NAV', dir: d > 0 ? 1 : -1 });
  };
  const unit = state.celsius ? '°C' : '°F';
  const toDisp = (c: number) => (state.celsius ? c : Math.round((c * 9) / 5 + 32));

  switch (state.screen) {
    case 'standby':
      return (
        <div className="flex h-full flex-col">
          <div className="flex-1" />
          <div className="flex items-center justify-center">
            <SevenSeg value={formatClock(state)} className="text-5xl" />
          </div>
          <div className="flex-1" />
        </div>
      );

    case 'locked':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1">
          <SevenSeg value={formatClock(state)} className="text-4xl" />
          <span className="text-lcd-ink/60 text-[11px] tracking-wide">Kindersicherung aktiv</span>
        </div>
      );

    case 'operating':
      return (
        <div className="flex h-full flex-col">
          <TopBar>
            <StandbyGlyph className="text-lcd-ink/35 absolute left-3 h-5 w-5" />
            <SevenSeg value={formatClock(state)} className="text-base" />
            <DoorGlyph className="text-lcd-ink/60 absolute right-3 h-5 w-5" />
          </TopBar>
          <div className="flex flex-1 items-center justify-center gap-3 px-4">
            <ModeGlyph mode={mode.id} className="text-lcd-ink/85 h-12 w-12" />
            <div className="flex items-start">
              <SevenSeg value={String(toDisp(state.temp))} className="text-[68px] leading-none" />
              <span className="text-lcd-ink/80 mt-2 ml-1 text-lg">{unit}</span>
            </div>
            <div className="flex w-12 flex-col items-center gap-2">
              {state.heating ? <HeatUpGlyph className="h-7 w-10" /> : <span className="h-7 w-10" />}
              <ProbeGlyph className="text-lcd-ink/45 h-5 w-7" />
            </div>
          </div>
          <div className="text-lcd-ink/55 h-7 px-3 text-center text-[11px]">{mode.label}</div>
        </div>
      );

    case 'info':
      return (
        <div className="flex h-full flex-col">
          <TopBar />
          <div className="flex flex-1 items-center justify-center">
            <SevenSeg
              value={String(toDisp(state.currentTemp))}
              className="text-[64px] leading-none"
            />
            <span className="text-lcd-ink/80 mt-2 ml-1 text-lg">{unit}</span>
          </div>
          <div className="text-lcd-ink/55 h-7 text-center text-[11px]">Aktuelle Temperatur</div>
        </div>
      );

    case 'timer': {
      const fn = TIMER_FUNCTIONS[state.timerIndex];
      let big = formatMinutes(state.minuteMinder);
      let caption = '';
      if (fn.id === 'minuteMinder') {
        big = formatMinutes(state.minuteMinder);
        caption = 'min';
      } else if (fn.id === 'stopwatch') {
        big = formatSeconds(state.stopwatch);
        caption = state.stopwatchRunning ? 'läuft' : 'min:sek';
      } else if (fn.id === 'cookDuration') {
        big = formatMinutes(state.cookDuration);
        caption = 'std:min';
      } else {
        big = cookEndTime(state);
        caption = 'Ende';
      }
      return (
        <div className="flex h-full flex-col">
          <MenuStrip
            icons={['⏲', '⏱', '⌛', '⏰']}
            active={state.timerIndex}
            onSelect={jumpTimer}
          />
          <div className="flex flex-1 items-center justify-center">
            <SevenSeg value={big} className="text-5xl" />
          </div>
          <div className="text-lcd-ink/55 h-6 text-center text-[11px]">
            {fn.label} · {caption}
          </div>
        </div>
      );
    }

    case 'settings':
    case 'firstSettings': {
      const fn = SETTING_FUNCTIONS[state.settingIndex];
      let big = '';
      let caption = fn.label;
      if (fn.id === 'clock') big = formatClock(state);
      else if (fn.id === 'timeFormat') big = state.use24h ? '24:00' : '12 AM';
      else if (fn.id === 'tempUnit') big = state.celsius ? '°C' : '°F';
      else if (fn.id === 'childLock') {
        big = state.childLockAvailable ? 'ON' : 'OFF';
        caption = 'Taste Kindersicherung';
      } else big = 'OFF';
      return (
        <div className="flex h-full flex-col">
          <MenuStrip
            icons={['🕐', 'HM', '°', '🔒', '◌']}
            active={state.settingIndex}
            onSelect={jumpSetting}
          />
          <div className="flex flex-1 items-center justify-center">
            <SevenSeg value={big} className="text-5xl" />
          </div>
          <div className="text-lcd-ink/55 h-6 text-center text-[11px]">{caption}</div>
        </div>
      );
    }
  }
}
