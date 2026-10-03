/**
 * The drive tied to the scroll, for the screens where the live drive does
 * not run (droga.css): one scene pinned above the stops' texts, the same
 * timeline (`stanAt`), set by how far the reader has scrolled.
 *
 * Built to be light on a phone. Every moving part moves by a transform or an
 * opacity, set up once as Web Animations keyframes sampled from the
 * timeline. Where the browser can tie an animation to the scroll itself
 * (ScrollTimeline), it moves them with the finger, off the page's script,
 * and the script only writes the odometer; elsewhere the script sets the
 * animations' place on each scroll step, which is still far less work than
 * restyling the scene. The scene's custom properties stay at the start, as
 * rendered, and each animation adds only the difference from it. The bands
 * behind the road cannot slide their pattern without being repainted, so
 * they are widened to the left and slide as a whole.
 */
import { stanAt, start, stanVars, KM_U, type Stan } from "./trasa";

/** Samples of the drive; the browser draws straight lines between them. */
const PROBKI = 240;
/** The animations' length where the script sets their place itself. */
const CALOSC_MS = 1000;

/** As in droga.css: how fast the forest and the verge pass, against the road. */
const PARALAKSA = { las: 0.3, pola: 0.6 };
/** As in droga.css: how far the tail lift goes down, in the truck drawing's units. */
const WINDA_W_DOL = 22.4;

type Ruch = [Element, (s: Stan) => Keyframe];

/**
 * Where the drive is along the page: pairs of a scroll position and a moment
 * on the 0–100 clock, both growing. Before the first pair the scene stands
 * at the start, after the last at the end, and between two pairs the drive
 * moves evenly with the scroll.
 */
export type Os = [y: number, t: number][];

/** The moment of the drive at scroll position `y`. */
export function chwila(os: Os, y: number): number {
  return poOsi(os, y, 0, 1);
}

/** The scroll position at which the drive reaches the moment `t`. */
function miejsce(os: Os, t: number): number {
  return poOsi(os, t, 1, 0);
}

/** Reads the axis from column `z` to column `na`, evenly between the pairs. */
function poOsi(os: Os, x: number, z: 0 | 1, na: 0 | 1): number {
  const pierwsza = os[0]!;
  if (x <= pierwsza[z]) return pierwsza[na];
  for (let i = 1; i < os.length; i++) {
    const b = os[i]!;
    if (x <= b[z]) {
      const a = os[i - 1]!;
      return b[z] === a[z] ? b[na] : a[na] + ((b[na] - a[na]) * (x - a[z])) / (b[z] - a[z]);
    }
  }
  return os[os.length - 1]![na];
}

const clamp = (x: number) => Math.min(1, Math.max(0, x));

/** The page's scroller, whose scroll timeline the drive runs on. */
const strona = () => document.scrollingElement ?? document.documentElement;

/** How far the page scrolls, in px. */
export function zasiegStrony(): number {
  const s = strona();
  return Math.max(1, s.scrollHeight - s.clientHeight);
}

export interface Jazda {
  /** What it was set up for: the scene width, the axis and the page's scroll range; a change in any needs a new setup. */
  szerokosc: number;
  os: Os;
  zasieg: number;
  /** Follows the scroll position `y`. */
  przewin(y: number): void;
  zatrzymaj(): void;
}

/**
 * Sets up the drive on the live scene (`[data-scena-live]`) along the axis
 * `os`. `naKm` gets the odometer's whole km whenever it changes.
 */
export function uruchomJazde(scena: HTMLElement, os: Os, naKm: (km: number) => void): Jazda {
  for (const [k, v] of Object.entries(stanVars(start))) scena.style.setProperty(k, v);
  scena.style.setProperty("--z", "1");

  const szerokosc = scena.clientWidth;
  const u = scena.querySelector<HTMLElement>(".rig")!.getBoundingClientRect().width / 60;
  const px = (x: number) => `${Math.round(x * 100) / 100}px`;

  // The truck's front: the same formula as `--x0` in droga.css, in pixels.
  const x0 = (s: Stan) =>
    (1 - s.park) * (szerokosc / 2 - 30 * u - s.cam * Math.min(22 * u, szerokosc / 2 - 30 * u)) + s.park * (szerokosc - 100 * u);
  const przesuniecie = (s: Stan) => s.km * KM_U * u;
  const kamera = (s: Stan) => x0(s) - x0(start);

  const jeden = <T extends Element>(selektor: string) => scena.querySelector<T>(selektor)!;
  const wszystkie = (selektor: string) => [...scena.querySelectorAll<HTMLElement | SVGElement>(selektor)];

  // The bands reach as far to the left as they will slide.
  const najdalej = przesuniecie(stanAt(100));
  const pasma: [HTMLElement, number][] = [
    [jeden(".las"), PARALAKSA.las],
    [jeden(".pola"), PARALAKSA.pola],
    [jeden(".jezdnia"), 1],
  ];
  for (const [el, ile] of pasma) el.style.left = px(-najdalej * ile);

  // Each moving part and its frame for a given state.
  const ruchy: Ruch[] = [
    ...wszystkie(".swiat").map((el): Ruch => [el, (s) => ({ transform: `translateX(${px(przesuniecie(s) + kamera(s))})` })]),
    ...wszystkie(".rig").map((el): Ruch => [el, (s) => ({ transform: `translateX(${px(kamera(s))})` })]),
    ...pasma.map(([el, ile]): Ruch => [el, (s) => ({ transform: `translateX(${px(przesuniecie(s) * ile)})` })]),
    ...wszystkie(".w-tablica").map((el): Ruch => [el, (s) => ({ opacity: Math.min(1, s.km / 2) })]),
    [jeden(".w-widlak"), (s) => ({ transform: `translateX(${px((s.fork - start.fork) * u)})` })],
    [jeden(".paleta-w-aucie"), (s) => ({ transform: `translate(${s.palX}px, ${s.palY}px)`, opacity: 1 - s.jack })],
    [jeden(".paleta-przed-domem"), (s) => ({ transform: `translate(${s.palX}px, ${s.palY}px)`, opacity: s.jack })],
    [jeden(".winda"), (s) => ({ transform: `translateY(${s.lift * WINDA_W_DOL}px)` })],
    [jeden(".winda-ramie"), (s) => ({ transform: `scaleY(${s.lift})` })],
    [jeden(".winda-plyta"), (s) => ({ transform: `rotate(${s.fold * -90}deg)`, opacity: 1 - s.fold })],
  ];

  // The keyframes stand at evenly spaced moments of the drive, each at the
  // scroll position that shows it, as a share of the page's whole scroll
  // range: that is what a scroll timeline of the page runs over.
  const zasieg = zasiegStrony();
  const chwile = Array.from({ length: PROBKI + 1 }, (_, i) => (100 * i) / PROBKI);
  const offsety = [0, ...chwile.map((t) => clamp(miejsce(os, t) / zasieg)), 1];
  const stany = [start, ...chwile.map(stanAt), stanAt(100)];

  const timeline = typeof ScrollTimeline === "function" ? new ScrollTimeline({ source: strona(), axis: "block" }) : null;
  const opcje: KeyframeAnimationOptions = timeline ? { timeline, fill: "both" } : { duration: CALOSC_MS, fill: "both" };
  const animacje = ruchy.map(([el, klatka]) => el.animate(bezPowtorzen(offsety.map((offset, i) => ({ offset, ...klatka(stany[i]!) }))), opcje));
  if (!timeline) for (const a of animacje) a.pause();

  // The odometer is text, so it is written from here, only when the whole
  // km changes.
  let km = -1;
  const przewin = (y: number) => {
    if (!timeline) for (const a of animacje) a.currentTime = CALOSC_MS * clamp(y / zasieg);
    const k = Math.round(stanAt(chwila(os, y)).km);
    if (k !== km) naKm(k);
    km = k;
  };
  przewin(window.scrollY);

  return {
    szerokosc,
    os,
    zasieg,
    przewin,
    zatrzymaj() {
      for (const a of animacje) a.cancel();
      for (const [el] of pasma) el.style.removeProperty("left");
    },
  };
}

/** Leaves out a keyframe that only repeats both its neighbours: the browser has less to step through. */
function bezPowtorzen(klatki: Keyframe[]): Keyframe[] {
  const wartosc = ({ offset: _offset, ...reszta }: Keyframe) => JSON.stringify(reszta);
  return klatki.filter((k, i) => {
    if (i === 0 || i === klatki.length - 1) return true;
    const w = wartosc(k);
    return w !== wartosc(klatki[i - 1]!) || w !== wartosc(klatki[i + 1]!);
  });
}
