/**
 * The drive's photos, made small enough for the page. The PNG masters in
 * `src/assets/droga/` stay as they are; the build serves WebP at about twice
 * the largest size each one shows at in a 1440 px wide window.
 *
 * Only for the server side: `trasa.ts` also goes to the browser, so it must
 * not import this.
 */
import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import auto from "../../assets/droga/auto-fm.png";
import paleta from "../../assets/droga/paleta.png";
import wozek from "../../assets/droga/wozek.png";
import las from "../../assets/droga/las.png";
import pobocze from "../../assets/droga/pobocze.png";

export { default as hala } from "../../assets/droga/hala.png";
export { default as dom } from "../../assets/droga/dom.png";
export { default as ladowarka } from "../../assets/droga/ladowarka.png";

const webp = (src: ImageMetadata, width: number) => getImage({ src, width, format: "webp", quality: 75 }).then((i) => i.src);

/**
 * The truck photo (2149 px master) is served 1800 px wide, sharp on a
 * high-density screen where the truck is about 900 px across. The widths are
 * written out because reading them from the import makes the build ship the
 * master PNG too.
 */

export const obrazy = {
  auto: await webp(auto, 1800),
  paleta: await webp(paleta, 100),
  wozek: await webp(wozek, 180),
  las: await webp(las, 2000),
  pobocze: await webp(pobocze, 1100),
};
