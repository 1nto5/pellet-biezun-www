/**
 * The drive on the home page: what the scene looks like at each moment. The
 * drawings, the still frames and the scripts all read this file, so the
 * timeline is described once. It runs in the browser too, so it imports
 * nothing that brings the company data along; what stands by the road is in
 * `tablice.ts`.
 *
 * The scene is a pure function of one number, the time `t` from 0 to 100:
 * `stanAt(t)` gives every moving part's place. The scroll script maps the
 * scroll position to `t`; the still frames are `stanAt` at fixed moments.
 * The same scroll position therefore always shows the same frame.
 */
import { DARMOWA_DOSTAWA_KM } from "../../data/dostawa";

/** Road length of one km, in scene units (`--u`). */
export const KM_U = 8;

/**
 * Where the truck stops at the customer's: inside the free zone, close
 * enough to its edge that the end-of-zone sign shows ahead of the parked
 * truck.
 */
export const KM_DOJAZD = DARMOWA_DOSTAWA_KM - 6;

/**
 * The scene's state. The truck faces left and drives left, so its back and
 * the tail lift are on the right. `km` odometer; `cam` 1 = truck shifted left
 * so the hall behind its back shows, 0 = truck centred; `lift` 0 = tail lift
 * at the floor of the box, 1 = on the ground; `fold` 1 = lift folded up
 * against the back; `fork` the loader's left edge in scene units, from the
 * truck's front; `palX`, `palY` the pallet's bottom-left corner in the truck
 * drawing's units (4 per scene unit, front of the truck at 0, back of the box
 * at 239, ground at 108, the scene's bottom edge at 120); `jack` 1 = the
 * electric pallet truck shows; `park` 1 = the truck stands at a fixed place
 * near the right edge, so the house behind it and the sign ahead both fit.
 */
export interface Stan {
  km: number;
  cam: number;
  lift: number;
  fold: number;
  fork: number;
  palX: number;
  palY: number;
  jack: number;
  park: number;
}

/**
 * The pallet's places. On the loader's forks it rides 0.9 units from the
 * loader's left edge and 1.7 units up; on the lift it stands on the plate
 * (back of the box at 239, plate top at 82.6 up, 105 down); in the garage it
 * stands on the garage floor (see `.w-dom` in droga.css).
 */
const WIDLAK = { wHali: 74, przyWindzie: 59.1 };
const PAL = {
  naWidlach: { x: (WIDLAK.wHali + 0.9) * 4, y: 101 },
  naWindzie: { x: 240, y: 105 },
  gora: 82.6,
  wSrodku: 170,
  wGarazu: { x: 318, y: 109 },
};

/** Moments on the 0–100 clock. */
export const CZAS = {
  odjazd: 13,
  rozped: 20,
  hamowanie: 64,
  postoj: 76,
  koniec: 100,
};
/** Km reached when the truck is up to speed, and when it starts to brake. */
const KM_ROZPED = 6;
const KM_HAMOWANIE = KM_DOJAZD - 8;

type Ease = (x: number) => number;
const liniowo: Ease = (x) => x;
const przyspiesz: Ease = (x) => x * x;
const hamuj: Ease = (x) => 1 - (1 - x) * (1 - x);
const lagodnie: Ease = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

/** A track: [time, value] points, with the ease used on the way to each point. */
type Tor = [number, number, Ease?][];

const tory: Record<keyof Stan, Tor> = {
  km: [
    [CZAS.odjazd, 0],
    [CZAS.rozped, KM_ROZPED, przyspiesz],
    [CZAS.hamowanie, KM_HAMOWANIE],
    [CZAS.postoj, KM_DOJAZD, hamuj],
  ],
  cam: [
    [CZAS.odjazd, 1],
    [CZAS.odjazd + 9, 0, lagodnie],
  ],
  fork: [
    [0, WIDLAK.wHali],
    [4, WIDLAK.przyWindzie],
    [6, WIDLAK.wHali],
  ],
  lift: [
    [6, 1],
    [9, 0],
    [CZAS.postoj + 7, 0],
    [CZAS.postoj + 12, 1],
  ],
  fold: [
    [11, 0],
    [CZAS.odjazd, 1],
    [CZAS.postoj, 1],
    [CZAS.postoj + 3, 0],
  ],
  palX: [
    [0, PAL.naWidlach.x],
    [4, PAL.naWindzie.x],
    [9, PAL.naWindzie.x],
    [11, PAL.wSrodku],
    [CZAS.postoj + 3, PAL.wSrodku],
    [CZAS.postoj + 7, PAL.naWindzie.x],
    [CZAS.postoj + 13, PAL.naWindzie.x],
    [CZAS.koniec - 1, PAL.wGarazu.x, lagodnie],
  ],
  palY: [
    [0, PAL.naWidlach.y],
    [4, PAL.naWindzie.y],
    [6, PAL.naWindzie.y],
    [9, PAL.gora],
    [CZAS.postoj + 7, PAL.gora],
    [CZAS.postoj + 12, PAL.naWindzie.y],
    [CZAS.postoj + 13, PAL.naWindzie.y],
    [CZAS.koniec - 1, PAL.wGarazu.y, lagodnie],
  ],
  jack: [
    [CZAS.postoj + 12, 0],
    [CZAS.postoj + 13, 1],
  ],
  park: [
    [CZAS.hamowanie, 0],
    [CZAS.postoj, 1, lagodnie],
  ],
};

function naTorze(tor: Tor, t: number): number {
  if (t <= tor[0]![0]) return tor[0]![1];
  for (let i = 1; i < tor.length; i++) {
    const [t1, v1, ease = liniowo] = tor[i]!;
    if (t <= t1) {
      const [t0, v0] = tor[i - 1]!;
      return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
    }
  }
  return tor[tor.length - 1]![1];
}

/** Every moving part's place at time `t` (0–100). */
export function stanAt(t: number): Stan {
  const s = {} as Stan;
  for (const key of Object.keys(tory) as (keyof Stan)[]) s[key] = naTorze(tory[key], t);
  return s;
}

/** The moment the odometer shows `km`, while driving at steady speed. */
export function czasKm(km: number): number {
  return CZAS.rozped + ((km - KM_ROZPED) / (KM_HAMOWANIE - KM_ROZPED)) * (CZAS.hamowanie - CZAS.rozped);
}

/** The start: truck at the hall, lift down, pallet on the loader. */
export const start = stanAt(0);

/** CSS custom properties for a state, for a `style` attribute or the script. */
export function stanVars(s: Stan): Record<string, string> {
  return {
    "--km": String(s.km),
    "--cam": String(s.cam),
    "--lift": String(s.lift),
    "--fold": String(s.fold),
    "--fork": String(s.fork),
    "--pal-x": String(s.palX),
    "--pal-y": String(s.palY),
    "--jack": String(s.jack),
    "--park": String(s.park),
  };
}
export function stanStyle(s: Stan): string {
  return Object.entries(stanVars(s))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
