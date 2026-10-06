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
 * enough to its edge that the free delivery sign shows ahead of the parked
 * truck.
 */
export const KM_DOJAZD = DARMOWA_DOSTAWA_KM - 6;

/**
 * The scene's state. The truck faces left and drives left. `km` odometer;
 * `cam` 1 = truck shifted left so the hall behind its back shows, 0 = truck
 * centred; `park` 1 = the truck stands at a fixed place near the right edge,
 * past the house behind it, with the sign ahead; `odjazd` 1 = the truck has
 * driven off the left edge, leaving the house behind.
 */
export interface Stan {
  km: number;
  cam: number;
  park: number;
  odjazd: number;
}

/**
 * Moments on the 0–100 clock. The truck stands at the hall only briefly, the
 * road takes three fifths, and the stop at the customer's, the truck
 * standing at the house and then driving off, the last third: it is what
 * the reader most wants to see.
 */
export const CZAS = {
  odjazd: 6,
  rozped: 12,
  hamowanie: 56,
  postoj: 66,
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
 * At the customer's, from the stop (`U`): the truck stands past the house
 * while the reader takes in the last stop, then drives off out of the
 * picture.
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
  park: [
    [CZAS.hamowanie, 0],
    [CZAS.postoj, 1, lagodnie],
  ],
  // Gone a little before the end, so the drive ends on the house alone.
  odjazd: [
    [U + 22, 0],
    [97, 1, przyspiesz],
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

/** The start: the truck at the hall. */
export const start = stanAt(0);

/** CSS custom properties for a state, for a `style` attribute or the script. */
export function stanVars(s: Stan): Record<string, string> {
  return {
    "--km": String(s.km),
    "--cam": String(s.cam),
    "--park": String(s.park),
    "--odjazd": String(s.odjazd),
  };
}
export function stanStyle(s: Stan): string {
  return Object.entries(stanVars(s))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
