/**
 * Motion for the whole site: content arrives like traffic on the road, and a
 * small truck (the real Volvo FM, facing left) drives right to left along the
 * road band under the header as the page scrolls. The home page's big drive
 * has its own script; this is the rest.
 *
 * Markup API (ruch.css draws each kind):
 *
 *   data-ruch                  the element arrives from the right, slanted
 *                              like the livery stripes, and settles.
 *   data-ruch="tablica"        a green board: it rises on its posts.
 *   data-ruch-grupa[="…"]      on a container: each child element arrives on
 *                              its own. The value is the kind for the
 *                              children ("tablica", "paleta" = the pallet
 *                              blocks fill in, "wiersz" = table rows fade
 *                              in; "auto" = the child's
 *                              [data-ruch-auto] truck drives in on its road;
 *                              empty = arrive from the right).
 *   data-ruch-start            the band starts after this element has scrolled
 *                              by (the home drive's spacer, when the live
 *                              drive shows it); the band's truck is hidden
 *                              until then.
 *
 * An arrival plays once. The element waits off its place (`.czeka`) until a
 * sliver of it comes into view; then the class goes and a CSS transition
 * brings it in, moving only transform and opacity, which the browser
 * animates off the main thread. It stays after that, whichever way the
 * reader scrolls, and what is on the screen when the page opens never waits.
 * Elements that come into view together arrive one after another, top to
 * bottom and left to right.
 *
 * The road band is the one thing tied to the scroll position: its truck's
 * place is a pure function of it, written as a single custom property, and
 * the positions it needs are measured on load, resize and layout changes,
 * never in the scroll handler.
 *
 * Nothing runs without motion allowed; the page is complete before this runs
 * and `html.ruch` (set here) is what lets the CSS move anything.
 */

/** The wait between neighbours arriving together, and the most any of them waits. */
const KROK_MS = 90;
const MAKS_OPOZNIENIE_MS = 360;

const clamp = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export function initRuch(): void {
  if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
  document.documentElement.classList.add("ruch");
  initPrzyjazdy();
  initPasek();
}

function initPrzyjazdy(): void {
  const elementy = [
    ...document.querySelectorAll<HTMLElement>("[data-ruch]"),
    ...[...document.querySelectorAll<HTMLElement>("[data-ruch-grupa]")].flatMap((g) => [...g.children] as HTMLElement[]),
  ];

  const obserwator = new IntersectionObserver(
    (wpisy) => {
      const przyjezdza = wpisy
        .filter((w) => w.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .map((w) => w.target as HTMLElement);
      const krok = Math.min(KROK_MS, MAKS_OPOZNIENIE_MS / Math.max(1, przyjezdza.length - 1));
      przyjezdza.forEach((el, i) => {
        el.style.transitionDelay = `${Math.round(i * krok)}ms`;
        el.classList.remove("czeka");
        obserwator.unobserve(el);
      });
    },
    // A little above the bottom edge, so the arrival is seen, not missed.
    { rootMargin: "0px 0px -6% 0px" },
  );

  // Every position is read before any element moves, so the page is laid
  // out once, not once per element.
  const wysokoscOkna = window.innerHeight;
  const pozaEkranem = elementy.filter((el) => {
    const { top, bottom } = el.getBoundingClientRect();
    return top >= wysokoscOkna || bottom <= 0;
  });
  for (const el of pozaEkranem) {
    el.classList.add("czeka");
    obserwator.observe(el);
  }
}

function initPasek(): void {
  const pasek = document.querySelector<HTMLElement>("[data-pasek]");
  if (!pasek) return;
  const doc = document.documentElement;
  const start = document.querySelector<HTMLElement>("[data-ruch-start]");

  let poczatek = 0;
  let koniec = 1;
  let czekaNaStart = false;
  let p = -1;
  let widac = -1;

  const zmierz = () => {
    koniec = Math.max(1, doc.scrollHeight - window.innerHeight);
    // The start element counts only while it is shown (droga.css).
    const pokazanyStart = start?.offsetParent ? start : null;
    czekaNaStart = pokazanyStart !== null;
    poczatek = pokazanyStart
      ? Math.min(koniec - 1, pokazanyStart.getBoundingClientRect().bottom + window.scrollY - window.innerHeight)
      : 0;
  };

  const klatka = () => {
    const y = window.scrollY;
    const noweP = Math.round(clamp((y - poczatek) / (koniec - poczatek)) * 1000) / 1000;
    const noweWidac = czekaNaStart && y < poczatek ? 0 : 1;
    if (noweP !== p) {
      pasek.style.setProperty("--p", String(noweP));
      p = noweP;
    }
    if (noweWidac !== widac) {
      pasek.style.setProperty("--widac", String(noweWidac));
      widac = noweWidac;
    }
  };

  const odswiez = () => {
    zmierz();
    klatka();
  };

  odswiez();
  window.addEventListener("scroll", klatka, { passive: true });
  window.addEventListener("resize", odswiez);
  window.addEventListener("load", odswiez);
  document.fonts?.ready.then(odswiez);
  // Content that changes height (an opened FAQ answer, an image) changes how
  // far the page scrolls; measure again, in the next frame, off the scroll path.
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
