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
 * at 239, ground at 108, the scene's bottom edge at 120); `przod` 1 = the
 * pallet is drawn in front of everything (on the ground, off the lift), 0 =
 * inside the truck's drawing, so the box can hide it; `woz` how much the
 * electric pallet truck shows, `wozDx` how far it has backed away from the
 * pallet, in the drawing's units; `park` 1 = the truck stands at a fixed
 * place near the right edge, so the house behind it and the sign ahead both
 * fit; `zoom` 1 = the camera close on the unloading; `odjazd` 1 = the truck
 * has driven off the left edge, leaving the house and the pallet behind.
 */
export interface Stan {
  km: number;
  cam: number;
  lift: number;
  fold: number;
  fork: number;
  palX: number;
  palY: number;
  przod: number;
  woz: number;
  wozDx: number;
  park: number;
  zoom: number;
  odjazd: number;
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

/**
 * Moments on the 0–100 clock. The loading takes the first eighth, the road
 * two fifths, and the unloading at the customer's, with the truck driving
 * off, nearly half: it is what the reader most wants to see.
 */
export const CZAS = {
  odjazd: 13,
  rozped: 19,
  hamowanie: 46,
  postoj: 54,
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

/**
 * At the customer's, from the stop (`U`): the camera closes in while the lift
 * unfolds, the pallet slides out onto it and goes down, the pallet truck
 * shows under it and takes it into the garage, then backs away into the
 * truck; the lift goes up and folds, the camera draws back, and the truck
 * drives off.
 */
const U = CZAS.postoj;

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
    [U + 7, 0],
    [U + 12, 1],
    [U + 27, 1],
    [U + 31, 0],
  ],
  fold: [
    [11, 0],
    [CZAS.odjazd, 1],
    [U, 1],
    [U + 3, 0],
    [U + 31, 0],
    [U + 33, 1],
  ],
  palX: [
    [0, PAL.naWidlach.x],
    [4, PAL.naWindzie.x],
    [9, PAL.naWindzie.x],
    [11, PAL.wSrodku],
    [U + 3, PAL.wSrodku],
    [U + 7, PAL.naWindzie.x],
    [U + 14, PAL.naWindzie.x],
    [U + 23, PAL.wGarazu.x, lagodnie],
  ],
  palY: [
    [0, PAL.naWidlach.y],
    [4, PAL.naWindzie.y],
    [6, PAL.naWindzie.y],
    [9, PAL.gora],
    [U + 7, PAL.gora],
    [U + 12, PAL.naWindzie.y],
    [U + 14, PAL.naWindzie.y],
    [U + 23, PAL.wGarazu.y, lagodnie],
  ],
  // Once the pallet stands on the ground, the copy in front takes over at
  // the same place, so the change does not show.
  przod: [
    [U + 12, 0],
    [U + 12.5, 1],
  ],
  woz: [
    [U + 12, 0],
    [U + 14, 1],
    [U + 23, 1],
    [U + 27, 0],
  ],
  wozDx: [
    [U + 23, 0],
    [U + 27, -50],
  ],
  park: [
    [CZAS.hamowanie, 0],
    [CZAS.postoj, 1, lagodnie],
  ],
  zoom: [
    [U + 1, 0],
    [U + 6, 1, lagodnie],
    [U + 32, 1],
    [U + 37, 0, lagodnie],
  ],
  odjazd: [
    [U + 36, 0],
    [U + 45, 1, przyspiesz],
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
    "--przod": String(s.przod),
    "--woz": String(s.woz),
    "--woz-dx": String(s.wozDx),
    "--park": String(s.park),
    "--zoom": String(s.zoom),
    "--odjazd": String(s.odjazd),
  };
}
export function stanStyle(s: Stan): string {
  return Object.entries(stanVars(s))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
