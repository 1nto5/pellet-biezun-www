/**
 * Lines of roads as the scripts here share them: reading the encoded
 * polyline a route server sends, thinning it for the map and writing it
 * back as a shorter encoded polyline. Used by odleglosci-drogowe.mjs (roads
 * to the listed towns) and trasy-gmin.mjs (roads to the gminas).
 */

/**
 * Valhalla draws a route as an encoded polyline with six decimal places.
 * Pass 1e5 as `skala` to read a line written by `zakoduj`.
 */
export function linia(shape, skala = 1e6) {
  const punkty = [];
  let i = 0;
  let lat = 0;
  let lon = 0;
  const liczba = () => {
    let wynik = 0;
    let przesuniecie = 0;
    let bajt;
    do {
      bajt = shape.charCodeAt(i++) - 63;
      wynik |= (bajt & 0x1f) << przesuniecie;
      przesuniecie += 5;
    } while (bajt >= 0x20);
    return wynik & 1 ? ~(wynik >> 1) : wynik >> 1;
  };
  while (i < shape.length) {
    lat += liczba();
    lon += liczba();
    punkty.push({ lat: lat / skala, lon: lon / skala });
  }
  return punkty;
}

/** Metres from point `p` to the segment a-b, on a flat map: exact enough over a few km. */
function odcinekM(p, a, b) {
  const skala = 111200 * Math.cos(p.lat * (Math.PI / 180));
  const [ax, ay] = [(a.lon - p.lon) * skala, (a.lat - p.lat) * 111200];
  const [bx, by] = [(b.lon - p.lon) * skala, (b.lat - p.lat) * 111200];
  const [dx, dy] = [bx - ax, by - ay];
  const dlugosc = dx * dx + dy * dy;
  const t = dlugosc === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / dlugosc));
  return Math.hypot(ax + t * dx, ay + t * dy);
}

/**
 * Douglas-Peucker: keeps the ends of a line and, between them, only the
 * points that stand further than the tolerance from the line drawn without
 * them. A stack instead of recursion, as a route has thousands of points.
 */
export function uprosc(punkty, tolerancjaM) {
  const zostaje = new Uint8Array(punkty.length);
  zostaje[0] = zostaje[punkty.length - 1] = 1;
  const stos = [[0, punkty.length - 1]];
  while (stos.length > 0) {
    const [od, po] = stos.pop();
    let najdalej = 0;
    let gdzie = -1;
    for (let i = od + 1; i < po; i++) {
      const d = odcinekM(punkty[i], punkty[od], punkty[po]);
      if (d > najdalej) [najdalej, gdzie] = [d, i];
    }
    if (najdalej > tolerancjaM) {
      zostaje[gdzie] = 1;
      stos.push([od, gdzie], [gdzie, po]);
    }
  }
  return punkty.filter((_, i) => zostaje[i]);
}

/**
 * The reverse of `linia`, with five decimal places (about a metre), which is
 * what the map needs and a third shorter than six.
 */
export function zakoduj(punkty) {
  let tekst = "";
  let [lat, lon] = [0, 0];
  const liczba = (roznica) => {
    let v = roznica < 0 ? ~(roznica << 1) : roznica << 1;
    while (v >= 0x20) {
      tekst += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    tekst += String.fromCharCode(v + 63);
  };
  for (const p of punkty) {
    const [nLat, nLon] = [Math.round(p.lat * 1e5), Math.round(p.lon * 1e5)];
    liczba(nLat - lat);
    liczba(nLon - lon);
    [lat, lon] = [nLat, nLon];
  }
  return tekst;
}
