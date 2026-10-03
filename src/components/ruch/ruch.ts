/**
 * Scroll motion for the whole site: content arrives like traffic on the road
 * and a small truck (the real Volvo FM, facing left) drives right to left
 * along the road band under the header as the page scrolls. The home page's
 * big drive has its own script; this is the rest.
 *
 * Markup API (the CSS in ruch.css draws each kind from `--r`):
 *
 *   data-ruch                  the element arrives from the right, slanted
 *                              like the livery stripes, and settles.
 *   data-ruch="tablica"        a green board: it rises on its posts.
 *   data-ruch-grupa[="…"]      on a container: each child element arrives on
 *                              its own; children on one line come one after
 *                              another. The value is the kind for the
 *                              children ("tablica", "paleta" = the pallet
 *                              blocks fill in, "wiersz" = table rows fade
 *                              in; "auto" = the child's
 *                              [data-ruch-auto] truck drives in on its road;
 *                              empty = arrive from the right).
 *   data-ruch-start            the band starts after this element has scrolled
 *                              by (the home drive's spacer); the band's truck
 *                              is hidden until then.
 *
 * Rules, the same as the drive's: every element's state is a pure function of
 * the scroll position (the same position gives the same frame both ways);
 * positions are measured only on load, resize and layout changes, never in
 * the scroll handler; a frame writes only custom properties.
 *
 * An element arrives while it travels the bottom part of the window and has
 * settled once it is about a third of the way up. Two exceptions keep every
 * word readable: what is on the first screen when the page opens stands
 * still, and what sits too near the end of the page to get that far up
 * settles by the time the page is scrolled to the bottom.
 *
 * Nothing runs without motion allowed; the page is complete before this runs
 * and `html.ruch` (set here) is what lets the CSS move anything.
 */

interface Jednostka {
  el: HTMLElement;
  /** Top edge in page coordinates, without transforms. */
  gora: number;
  /** Delay in progress units, for children on one line. */
  opoznienie: number;
  /** Last written value, to skip writes that change nothing. */
  r: number;
}

/** From entering the window's bottom to settled: this share of its height. */
const DROGA = 0.3;
/** Delay between neighbours on one line, and the most any child waits. */
const KROK = 0.18;
const MAKS_OPOZNIENIE = 0.3;

const ease = (x: number) => 1 - (1 - x) ** 2;
const clamp = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Top in page coordinates from the offset chain, which transforms do not change. */
function gornaKrawedz(el: HTMLElement): number {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

export function initRuch(): void {
  const doc = document.documentElement;
  if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;

  const pasek = document.querySelector<HTMLElement>("[data-pasek]");
  const start = document.querySelector<HTMLElement>("[data-ruch-start]");
  const pojedyncze = [...document.querySelectorAll<HTMLElement>("[data-ruch]")];
  const grupy = [...document.querySelectorAll<HTMLElement>("[data-ruch-grupa]")];

  let jednostki: Jednostka[] = [];
  let wysokoscOkna = window.innerHeight;
  let koniec = 1;
  let poczatek = 0;
  let pasekP = -1;
  let pasekWidac = -1;

  const zmierz = () => {
    wysokoscOkna = window.innerHeight;
    koniec = Math.max(1, doc.scrollHeight - wysokoscOkna);
    poczatek = start ? Math.min(koniec - 1, gornaKrawedz(start) + start.offsetHeight - wysokoscOkna) : 0;

    const wszystkie: Omit<Jednostka, "r">[] = pojedyncze.map((el) => ({ el, gora: gornaKrawedz(el), opoznienie: 0 }));
    for (const grupa of grupy) {
      // Children whose tops line up share a line: each waits for the one
      // before it, and the last on the longest line waits MAKS_OPOZNIENIE.
      const dzieci = ([...grupa.children] as HTMLElement[]).map((el) => ({ el, gora: gornaKrawedz(el), wLinii: 0 }));
      let linia = Number.NaN;
      let n = 0;
      let najdluzsza = 1;
      for (const d of dzieci) {
        n = Math.abs(d.gora - linia) < 4 ? n + 1 : 0;
        if (n === 0) linia = d.gora;
        d.gora = linia;
        d.wLinii = n;
        najdluzsza = Math.max(najdluzsza, n + 1);
      }
      const krok = Math.min(KROK, MAKS_OPOZNIENIE / Math.max(1, najdluzsza - 1));
      for (const d of dzieci) wszystkie.push({ el: d.el, gora: d.gora, opoznienie: d.wLinii * krok });
    }

    jednostki = [];
    for (const j of wszystkie) {
      // On the first screen: standing still, the CSS default.
      if (j.gora < wysokoscOkna) {
        j.el.style.removeProperty("--r");
        continue;
      }
      // The lowest top that still settles at the bottom of the page.
      const najnizej = koniec + wysokoscOkna * (1 - DROGA * (1 + j.opoznienie));
      jednostki.push({ ...j, gora: Math.min(j.gora, najnizej), r: -1 });
    }
  };

  const klatka = () => {
    const y = window.scrollY;
    for (const j of jednostki) {
      const top = j.gora - y;
      const r = Math.round(ease(clamp((wysokoscOkna - top) / (wysokoscOkna * DROGA) - j.opoznienie)) * 1000) / 1000;
      if (r !== j.r) {
        j.el.style.setProperty("--r", String(r));
        j.r = r;
      }
    }
    if (pasek) {
      const p = Math.round(clamp((y - poczatek) / (koniec - poczatek)) * 1000) / 1000;
      const widac = start && y < poczatek ? 0 : 1;
      if (p !== pasekP) {
        pasek.style.setProperty("--p", String(p));
        pasekP = p;
      }
      if (widac !== pasekWidac) {
        pasek.style.setProperty("--widac", String(widac));
        pasekWidac = widac;
      }
    }
  };

  const odswiez = () => {
    zmierz();
    pasekP = -1;
    pasekWidac = -1;
    klatka();
  };

  // Measure once, write the first frame, then let the CSS move things.
  odswiez();
  doc.classList.add("ruch");

  window.addEventListener("scroll", klatka, { passive: true });
  window.addEventListener("resize", odswiez);
  window.addEventListener("load", odswiez);
  document.fonts?.ready.then(odswiez);
  // Content that changes height (an opened FAQ answer, an image) moves what is
  // below it; measure again, in the next frame, off the scroll path.
  let czeka = false;
  new ResizeObserver(() => {
    if (czeka) return;
    czeka = true;
    requestAnimationFrame(() => {
      czeka = false;
      odswiez();
    });
  }).observe(document.body);
}
