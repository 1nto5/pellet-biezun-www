/**
 * Draws a map for Mapa.astro with Leaflet and OpenStreetMap tiles. Loaded on
 * demand, with Leaflet's own stylesheet, when a map comes near the screen:
 * a page whose map is never seen never pays for Leaflet.
 */
import L from "leaflet";
import leafletCss from "leaflet/dist/leaflet.css?url";

/**
 * Leaflet's stylesheet, added to the page once, with the first map: imported
 * the usual way it would be linked, render-blocking, on every page with a map.
 */
let arkusz: Promise<void> | undefined;
function wczytajArkusz(): Promise<void> {
  arkusz ??= new Promise((gotowe) => {
    const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href: leafletCss });
    link.addEventListener("load", () => gotowe(), { once: true });
    link.addEventListener("error", () => gotowe(), { once: true });
    document.head.append(link);
  });
  return arkusz;
}

/** What Mapa.astro hands over in `data-mapa`. */
export interface DaneMapy {
  magazyn: { nazwa: string; adres: string; tel: string; telHref: string; lat: number; lng: number };
  promienKm: number | null;
  miejsca: {
    nazwa: string;
    lat: number;
    lng: number;
    km: number;
    wStrefie: boolean;
    href: string | null;
    wyroznione: boolean;
  }[];
}

// Popups are built from DOM nodes, not an HTML string, so a name with an
// odd character cannot break the markup.
function popup(...lines: (string | Node)[]): HTMLElement {
  const box = document.createElement("div");
  lines.forEach((line, i) => {
    if (i > 0) box.append(document.createElement("br"));
    box.append(line);
  });
  return box;
}
function strong(text: string): HTMLElement {
  const el = document.createElement("strong");
  el.textContent = text;
  return el;
}
function link(href: string, text: string): HTMLAnchorElement {
  const a = document.createElement("a");
  a.href = href;
  a.textContent = text;
  return a;
}

/** Draws the map into `el`, from its `data-mapa` and `data-zoom`. */
export async function narysujMape(el: HTMLElement): Promise<void> {
  await wczytajArkusz();
  const dane: DaneMapy = JSON.parse(el.dataset.mapa ?? "{}");
  const { magazyn } = dane;

  // A page scrolling past the map must not get caught by it: no
  // scroll-wheel zoom, and on a touch screen one finger scrolls the page
  // instead of dragging the map. The +/- buttons zoom, and two fingers
  // still move and zoom the map.
  const map = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const bounds = L.latLngBounds([[magazyn.lat, magazyn.lng]]);

  // The zone first, so the dots sit on top of it. Not interactive: it would
  // otherwise catch clicks meant for the map. Its extent comes from the
  // coordinates: the circle's own getBounds() needs a map that already has
  // a view, and this one gets its view only at the end.
  if (dane.promienKm !== null) {
    L.circle([magazyn.lat, magazyn.lng], {
      radius: dane.promienKm * 1000,
      className: "mapa-strefa",
      interactive: false,
    }).addTo(map);
    bounds.extend(L.latLng(magazyn.lat, magazyn.lng).toBounds(dane.promienKm * 2000));
  }

  for (const m of dane.miejsca) {
    const lines: (string | Node)[] = [
      strong(m.nazwa),
      `ok. ${m.km} km od magazynu w linii prostej`,
      m.wStrefie ? "dostawa gratis" : "dostawa po uzgodnieniu",
    ];
    if (m.href) lines.push(link(m.href, "Dostawa i ceny"));

    L.circleMarker([m.lat, m.lng], {
      radius: m.wyroznione ? 9 : 5,
      className: [
        "mapa-miejsce",
        m.wStrefie ? "mapa-miejsce-strefa" : "mapa-miejsce-poza",
        m.wyroznione ? "mapa-miejsce-wyroznione" : "",
      ].join(" "),
    })
      .addTo(map)
      .bindPopup(popup(...lines));
    bounds.extend([m.lat, m.lng]);
  }

  // The warehouse last, so its pin is above every dot.
  const icon = L.divIcon({
    className: "",
    html: '<div class="pin"></div>',
    iconSize: [28, 28],
    iconAnchor: [4, 30],
    popupAnchor: [10, -26],
  });
  L.marker([magazyn.lat, magazyn.lng], { icon, title: `Magazyn ${magazyn.nazwa}`, alt: `Magazyn ${magazyn.nazwa}` })
    .addTo(map)
    .bindPopup(popup(strong(`Magazyn ${magazyn.nazwa}`), magazyn.adres, link(magazyn.telHref, `tel. ${magazyn.tel}`)));

  if (dane.miejsca.length === 0 && dane.promienKm === null) {
    map.setView([magazyn.lat, magazyn.lng], Number(el.dataset.zoom));
  } else {
    map.fitBounds(bounds, { padding: [24, 24] });
  }
}
