/**
 * The drive's photos, made small enough for the page. The PNG masters in
 * `src/assets/droga/` stay as they are; the build serves WebP at about twice
 * the largest size each one shows at in a 1440 px wide window. The truck, the
 * hall, the house and the loader are <img> with a `srcset` (Ciezarowka.astro
 * and the rest), whose `sizes` is the widest share of the window each takes
 * in the scene. The forest and the verge are background bands, so they come
 * in two sizes, the small one for phones (droga.css); the pallet and the
 * pallet truck are small enough to have one.
 *
 * Only for the server side: `trasa.ts` also goes to the browser, so it must
 * not import this.
 */
import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import paleta from "../../assets/droga/paleta.png";
import wozek from "../../assets/droga/wozek.png";
import las from "../../assets/droga/las.png";
import pobocze from "../../assets/droga/pobocze.png";

export { default as hala } from "../../assets/droga/hala.png";
export { default as dom } from "../../assets/droga/dom.png";
export { default as ladowarka } from "../../assets/droga/ladowarka.png";

const webp = (src: ImageMetadata, width: number) => getImage({ src, width, format: "webp", quality: 75 }).then((i) => i.src);

/**
 * The widths are written out because reading them from the import makes the
 * build ship the master PNG too. A phone shows the forest band about 140 and
 * the verge about 45 device pixels tall.
 */
export const obrazy = {
  paleta: await webp(paleta, 100),
  wozek: await webp(wozek, 180),
  las: { duzy: await webp(las, 1500), maly: await webp(las, 640) },
  pobocze: { duzy: await webp(pobocze, 800), maly: await webp(pobocze, 320) },
};
