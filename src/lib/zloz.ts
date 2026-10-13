/**
 * A name as the town search compares it: without case, Polish marks or
 * punctuation, so "mlawa" finds Mława and "golub dobrzyn" Golub-Dobrzyń.
 * ł is a letter of its own, not l with a mark, so it is replaced by hand.
 *
 * The page's search and the script that makes the place index
 * (`scripts/indeks-miejscowosci.mjs`) both use it: the index is cut into
 * files by the first letter of the name folded this way.
 */
export const zloz = (tekst: string) =>
  tekst
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
