import type { APIRoute, GetStaticPaths } from "astro";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { produkty, type Produkt } from "../../data/oferta";

/**
 * The link preview of a product page (Base.astro, `podglad`): the bag photo
 * whole on a 1200×630 card. Not `getImage`: its `fit: "contain"` only scales
 * the photo down to 470×630 and does not pad it out to the card.
 */
export const getStaticPaths = (() =>
  produkty.map((produkt) => ({ params: { produkt: produkt.slug }, props: { produkt } }))) satisfies GetStaticPaths;

/** The card's size, the one link previews ask for. */
const PODGLAD = { width: 1200, height: 630 } as const;

export const GET: APIRoute<{ produkt: Produkt }> = async ({ props }) => {
  // Astro keeps the source file's path on the imported image, hidden.
  const { fsPath } = props.produkt.zdjecie.src as ImageMetadata & { fsPath: string };
  const jpg = await sharp(await readFile(fsPath))
    .rotate()
    // The photo's own white, the page's (global.css: `--color-page`), on both
    // sides of the upright bag, so the card shows no seam.
    .resize({ ...PODGLAD, fit: "contain", background: "#ffffff" })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg" } });
};
