/**
 * The drive's photos, made small enough for the page. The PNG masters in
 * `src/assets/droga/` stay as they are; the build serves WebP at about twice
 * the largest size each one shows at in a 1440 px wide window. The truck, the
 * hall and the house are <img> with a `srcset` (Ciezarowka.astro and the
 * rest), whose `sizes` is the widest share of the window each takes in the
 * scene; the truck's and the house's were set when the camera still closed
 * in at the end, so they are a little generous. The forest and the verge
 * are background bands, so they come in two sizes, the small one for phones
 * (droga.css).
 *
 * Only for the server side: `trasa.ts` also goes to the browser, so it must
 * not import this.
 */
import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import las from "../../assets/droga/las.png";
import pobocze from "../../assets/droga/pobocze.png";

export { default as hala } from "../../assets/droga/hala.png";
export { default as dom } from "../../assets/droga/dom.png";

const webp = (src: ImageMetadata, width: number, quality = 75) => getImage({ src, width, format: "webp", quality }).then((i) => i.src);
const avif = (src: ImageMetadata, width: number) => getImage({ src, width, format: "avif", quality: 50 }).then((i) => i.src);
/**
 * The forest and the verge are busy texture, seen in passing behind the
 * truck: a lower quality does not show. They also come as AVIF, about half
 * the WebP's size, for the browsers that take it (droga.css).
 */
const TLO = 55;

/**
 * The widths are written out because reading them from the import makes the
 * build ship the master PNG too. A phone shows the forest band about 140 and
 * the verge about 45 device pixels tall.
 */
export const obrazy = {
  /** A tiny AVIF: the page decodes it to learn whether the browser takes the AVIF bands (Droga.astro). */
  probaAvif: (await getImage({ src: pobocze, width: 2, format: "avif" })).src,
  las: { duzy: await webp(las, 1500, TLO), maly: await webp(las, 640, TLO), duzyAvif: await avif(las, 1500), malyAvif: await avif(las, 640) },
  pobocze: {
    duzy: await webp(pobocze, 800, TLO),
    maly: await webp(pobocze, 320, TLO),
    duzyAvif: await avif(pobocze, 800),
    malyAvif: await avif(pobocze, 320),
  },
};
