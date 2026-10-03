/**
 * The drive played by itself, for the screens where the live drive does not
 * run (droga.css): one scene, the same timeline (`stanAt`), on a loop.
 *
 * Built to be light on a phone. Every moving part moves by a transform or an
 * opacity, set up once as Web Animations keyframes sampled from the
 * timeline; after that the browser plays them on its own, with no script per
 * frame and nothing tied to the scroll. The scene's custom properties stay
 * at the start, as rendered, and each animation adds only the difference
 * from it. The bands behind the road cannot slide their pattern without
 * being repainted, so they are widened to the left and slide as a whole.
 *
 * It plays only while the scene is on screen, and not at all once the reader
 * has paused it.
 */
import { stanAt, start, stanVars, KM_U, type Stan } from "./trasa";

/**
 * One loop: the scene fades in on the start frame, the drive takes most of
 * the loop, its last frame holds, and the scene fades out.
 */
const PETLA_MS = 22000;
const HISTORIA = 0.88;
const ZANIK = 0.025;
/** Where a new loop begins: faded in, on the start frame the page already shows. */
export const POCZATEK_MS = ZANIK * PETLA_MS;
/** Samples per loop; the browser draws straight lines between them. */
const PROBKI = 240;

/** As in droga.css: how fast the forest and the verge pass, against the road. */
const PARALAKSA = { las: 0.3, pola: 0.6 };
/** As in droga.css: how far the tail lift goes down, in the truck drawing's units. */
const WINDA_W_DOL = 22.4;

type Ruch = [Element, (s: Stan) => Keyframe];

/** The state at a point of the loop (0–1): the start frame while it fades in, the drive, then its last frame held. */
const stanPetli = (offset: number) => stanAt(100 * Math.min(1, Math.max(0, (offset - ZANIK) / (HISTORIA - ZANIK))));

export interface Jazda {
  /** The scene width it was set up for; another one needs a new setup. */
  szerokosc: number;
  /** Where in the loop it is, in ms, to carry over to a new setup. */
  pozycja(): number;
  /** Pauses the loop at the reader's request, or lets it play again. */
  wstrzymaj(tak: boolean): void;
  zatrzymaj(): void;
}

/**
 * Sets up the loop on the live scene (`[data-scena-live]`) from `odMs` and
 * plays it while `pudelko` (the box around the scene) is on screen.
 * `naKm` gets the odometer's whole km whenever it changes.
 */
export function uruchomJazde(scena: HTMLElement, pudelko: HTMLElement, naKm: (km: number) => void, odMs = POCZATEK_MS): Jazda {
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

  const czasy = Array.from({ length: PROBKI + 1 }, (_, i) => i / PROBKI);
  const stany = czasy.map(stanPetli);
  const opcje: KeyframeAnimationOptions = { duration: PETLA_MS, iterations: Infinity };

  const animacje = ruchy.map(([el, klatka]) => el.animate(bezPowtorzen(czasy.map((offset, i) => ({ offset, ...klatka(stany[i]!) }))), opcje));
  animacje.push(
    scena.animate(
      [
        { offset: 0, opacity: 0 },
        { offset: ZANIK, opacity: 1 },
        { offset: 1 - ZANIK, opacity: 1 },
        { offset: 1, opacity: 0 },
      ],
      opcje,
    ),
  );
  for (const a of animacje) {
    a.pause();
    a.currentTime = odMs;
  }

  // All of them start from one moment of the timeline, so they stay in step.
  const graj = () => {
    const teraz = document.timeline.currentTime;
    if (typeof teraz !== "number") return;
    const od = teraz - Number(animacje[0]!.currentTime ?? 0);
    for (const a of animacje) a.startTime = od;
  };
  const stoj = () => {
    for (const a of animacje) a.pause();
  };

  // The odometer is text, so it is the one thing written from here: a few
  // times a second, and only when the whole km changes.
  const pozycja = () => Number(animacje[0]!.currentTime ?? 0) % PETLA_MS;
  let km = -1;
  const licz = () => {
    const k = Math.round(stanPetli(pozycja() / PETLA_MS).km);
    if (k !== km) naKm(k);
    km = k;
  };
  let licznik: number | undefined;

  let naEkranie = false;
  let wstrzymana = false;
  const uaktualnij = () => {
    if (naEkranie && !wstrzymana) {
      graj();
      licz();
      licznik ??= window.setInterval(licz, 150);
    } else {
      stoj();
      window.clearInterval(licznik);
      licznik = undefined;
    }
  };

  // Entries can arrive several at once; the newest one tells where the box is now.
  const obserwator = new IntersectionObserver((wpisy) => {
    naEkranie = wpisy.at(-1)?.isIntersecting ?? false;
    uaktualnij();
  });
  obserwator.observe(pudelko);

  return {
    szerokosc,
    pozycja,
    wstrzymaj(tak) {
      wstrzymana = tak;
      uaktualnij();
      if (!tak) return;
      // Paused while the scene fades between loops, it would stay faded:
      // it stops on the nearest frame shown in full instead.
      const ms = Math.min(Math.max(pozycja(), ZANIK * PETLA_MS), (1 - ZANIK) * PETLA_MS);
      if (ms === pozycja()) return;
      for (const a of animacje) a.currentTime = ms;
      licz();
    },
    zatrzymaj() {
      obserwator.disconnect();
      window.clearInterval(licznik);
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
