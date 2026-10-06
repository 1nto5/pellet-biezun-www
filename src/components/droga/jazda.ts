/**
 * The drive on the screens where the live drive does not run (droga.css):
 * one scene pinned above the stops' texts, the same timeline (`stanAt`),
 * following the moment the scroll position stands for (Droga.astro).
 *
 * Built to run smoothly on a phone. Every moving part moves by a transform or
 * an opacity, set up once as Web Animations keyframes sampled from the
 * timeline. The scroll only sets where the drive should be; the animations
 * then play there by themselves, faster the further they have to go, and
 * stop on it. Played, they run in the browser's compositor, as the loop
 * phones once had did, and stay smooth while the page scrolls.
 *
 * Tied to the scroll step by step, they were not: on an iPhone the page
 * scrolls apart from its script, which learns of each step late and
 * unevenly, so a scene moved from the script trailed the finger and
 * stuttered. Safari's own scroll timelines in turn never drew a part that
 * starts off screen (the house) and ran the drive behind the texts.
 *
 * The scene's custom properties stay at the start, as rendered, and each
 * animation adds only the difference from it. The bands behind the road
 * cannot slide their pattern without being repainted, so they are widened to
 * the left and slide as a whole.
 */
import { stanAt, start, stanVars, KM_U, type Stan } from "./trasa";

/** Samples of the 0–100 clock, two per moment; the browser draws straight lines between them. */
const PROBKI = 200;
/** The whole drive at its own pace, in ms. */
const CALOSC_MS = 20000;
/**
 * Catching up with the scroll: the pace that would get there in this time,
 * held between the slowest and the fastest pace (1 = its own).
 */
const DOGON_MS = 100;
const TEMPO_MIN = 0.5;
const TEMPO_MAX = 60;

/** As in droga.css: how fast the forest and the verge pass, against the road. */
const PARALAKSA = { las: 0.3, pola: 0.6 };

type Ruch = [Element, (s: Stan) => Keyframe];

export interface Jazda {
  /**
   * The scene width and unit (px) and the picture's width it was set up
   * for; others need a new setup.
   */
  szerokosc: number;
  u: number;
  widok: number;
  /** Shows the moment `t` (0–100) of the drive at once. */
  ustaw(t: number): void;
  /** Plays the drive on to the moment `t` (0–100), or back to it. */
  jedz(t: number): void;
  zatrzymaj(): void;
}

/**
 * Sets up the drive on the live scene (`[data-scena-live]`), at its start.
 * For a scene the page draws smaller (Droga.astro), `margines` widens the
 * bands behind the road by that many px on both sides, so they still reach
 * the picture's edges, and `widok` is how many times the scene's own width
 * the picture is at the end of the drive: the truck drives off past its
 * left edge.
 */
export function uruchomJazde(scena: HTMLElement, margines = 0, widok = 1): Jazda {
  for (const [k, v] of Object.entries(stanVars(start))) scena.style.setProperty(k, v);
  scena.style.setProperty("--z", "1");

  // Both from the layout, which the page's own scale of the scene
  // (Droga.astro) leaves out: measured with that scale in, the unit came out
  // short, and the truck parked over the house.
  const szerokosc = scena.clientWidth;
  const u = parseFloat(getComputedStyle(scena.querySelector(".rig")!).width) / 60;
  const px = (x: number) => `${Math.round(x * 100) / 100}px`;

  // The truck's front: the same formula as `--x0` in droga.css, in pixels.
  const x0 = (s: Stan) =>
    (1 - s.park) * (szerokosc / 2 - 30 * u - s.cam * Math.min(22 * u, szerokosc / 2 - 30 * u)) + s.park * (szerokosc - 100 * u);
  const przesuniecie = (s: Stan) => s.km * KM_U * u;
  const kamera = (s: Stan) => x0(s) - x0(start);

  const jeden = <T extends Element>(selektor: string) => scena.querySelector<T>(selektor)!;
  const wszystkie = (selektor: string) => [...scena.querySelectorAll<HTMLElement | SVGElement>(selektor)];

  // The bands reach as far to the left as they will slide, and the margin
  // beyond on both sides.
  const najdalej = przesuniecie(stanAt(100));
  const pasma: [HTMLElement, number][] = [
    [jeden(".las"), PARALAKSA.las],
    [jeden(".pola"), PARALAKSA.pola],
    [jeden(".jezdnia"), 1],
  ];
  for (const [el, ile] of pasma) {
    el.style.left = px(-najdalej * ile - margines);
    el.style.right = px(-margines);
  }

  // Driving off, the truck's front goes 65 units past the picture's left
  // edge (droga.css), which a scene drawn smaller about its bottom centre
  // shows left of its own.
  const odjazdDo = (szerokosc / 2) * (1 - widok) - 65 * u;

  // Each moving part and its frame for a given state.
  const ruchy: Ruch[] = [
    ...wszystkie(".swiat").map((el): Ruch => [el, (s) => ({ transform: `translateX(${px(przesuniecie(s) + kamera(s))})` })]),
    [jeden(".rig-auto"), (s) => ({ transform: `translateX(${px(kamera(s) - s.odjazd * (x0(s) - odjazdDo))})` })],
    ...pasma.map(([el, ile]): Ruch => [el, (s) => ({ transform: `translateX(${px(przesuniecie(s) * ile)})` })]),
    ...wszystkie(".w-tablica").map((el): Ruch => [el, (s) => ({ opacity: Math.min(1, s.km / 2) })]),
  ];

  const chwile = Array.from({ length: PROBKI + 1 }, (_, i) => (100 * i) / PROBKI);
  const stany = chwile.map(stanAt);
  const animacje = ruchy.map(([el, klatka]) =>
    el.animate(bezPowtorzen(chwile.map((t, i) => ({ offset: t / 100, ...klatka(stany[i]!) }))), { duration: CALOSC_MS, fill: "both" }),
  );
  for (const a of animacje) a.pause();

  const naMs = (t: number) => (CALOSC_MS * Math.min(100, Math.max(0, t))) / 100;

  // Back up the drive plays its animations reversed at a positive pace, never
  // at a negative one: Chrome's compositor draws an animation with a negative
  // pace as if it had not started yet, so scrolling up flashed the hall.
  // Reversed, an animation's own clock runs from the drive's end, so `zegar`
  // turns the drive's ms into it and back.
  let wstecz = false;
  const zegar = (ms: number) => (wstecz ? CALOSC_MS - ms : ms);
  const teraz = () => zegar(Number(animacje[0]!.currentTime ?? 0));

  /** Where the drive is going, in ms, and its pace there; 0 = standing. */
  let cel = 0;
  let tempo = 0;
  let klatka: number | undefined;

  const stoj = (ms: number) => {
    for (const a of animacje) {
      a.pause();
      a.currentTime = zegar(ms);
    }
    tempo = 0;
  };
  // All of them start from one moment of the timeline, so they stay in step.
  const graj = (noweTempo: number) => {
    const czas = document.timeline.currentTime;
    if (typeof czas !== "number") return;
    const od = teraz();
    const naWstecz = noweTempo < 0;
    if (naWstecz !== wstecz) {
      for (const a of animacje) a.effect?.updateTiming({ direction: naWstecz ? "reverse" : "normal" });
      wstecz = naWstecz;
    }
    for (const a of animacje) {
      a.playbackRate = Math.abs(noweTempo);
      a.startTime = czas - zegar(od) / Math.abs(noweTempo);
    }
    tempo = noweTempo;
  };
  // A new pace only for a real change: each one restarts the animations.
  const dobierzTempo = (ms: number) => {
    const roznica = cel - ms;
    const potrzebne = Math.sign(roznica) * Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, Math.abs(roznica) / DOGON_MS));
    const iloraz = tempo ? potrzebne / tempo : 0;
    if (iloraz < 0.65 || iloraz > 1.5) graj(potrzebne);
  };
  // While it plays, once a frame: stop on the goal, ease off nearing it.
  const sledz = () => {
    klatka = undefined;
    if (!tempo) return;
    const ms = teraz();
    if (tempo > 0 ? ms >= cel : ms <= cel) {
      stoj(cel);
      return;
    }
    dobierzTempo(ms);
    klatka = requestAnimationFrame(sledz);
  };

  const ustaw = (t: number) => {
    cel = naMs(t);
    stoj(cel);
  };
  const jedz = (t: number) => {
    cel = naMs(t);
    const ms = teraz();
    if (Math.abs(cel - ms) < 1) {
      if (tempo) stoj(cel);
      return;
    }
    dobierzTempo(ms);
    klatka ??= requestAnimationFrame(sledz);
  };
  ustaw(0);

  return {
    szerokosc,
    u,
    widok,
    ustaw,
    jedz,
    zatrzymaj() {
      if (klatka !== undefined) cancelAnimationFrame(klatka);
      for (const a of animacje) a.cancel();
      for (const [el] of pasma) {
        el.style.removeProperty("left");
        el.style.removeProperty("right");
      }
    },
  };
}

/** Leaves out a keyframe that only repeats both its neighbours: the browser has less to step through. */
function bezPowtorzen(klatki: Keyframe[]): Keyframe[] {
  const wartosci = klatki.map((k) => `${k.transform ?? ""}|${k.opacity ?? ""}`);
  return klatki.filter((_k, i) => i === 0 || i === klatki.length - 1 || wartosci[i] !== wartosci[i - 1] || wartosci[i] !== wartosci[i + 1]);
}
