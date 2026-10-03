/**
 * Every page with a fixed address, and the navigation built from them. Pages
 * link to each other through `strony`, never through a typed path, so a
 * changed address or the site's `base` (src/lib/url.ts) is set in one place.
 *
 * The header and the footer show the top level; the children only appear in
 * the breadcrumbs. The local pages hang under the map, one per town in
 * `podstrony` (miejsca.ts), even though their addresses sit under /dostawa/.
 */
import { podstrony, miejsceHref } from "./miejsca";
import { href } from "../lib/url";

export interface NavItem {
  href: string;
  label: string;
  children?: readonly NavItem[];
}

export const strony = {
  home: { href: href("/"), label: "Strona główna" },
  oferta: { href: href("/oferta/"), label: "Oferta" },
  galeria: { href: href("/galeria/"), label: "Galeria" },
  mapa: { href: href("/mapa-dystrybucji/"), label: "Mapa dystrybucji" },
  faq: { href: href("/faq/"), label: "FAQ" },
  kontakt: { href: href("/kontakt/"), label: "Kontakt" },
  zamowienie: { href: href("/zamowienie/"), label: "Zamówienie" },
  polityka: { href: href("/polityka-prywatnosci/"), label: "Polityka prywatności" },
} satisfies Record<string, NavItem>;

/** The header row, left to right. „Zamów pellet" is the button beside it. */
export const mainNav: readonly NavItem[] = [
  strony.oferta,
  strony.galeria,
  { ...strony.mapa, children: podstrony.map((m) => ({ href: miejsceHref(m), label: m.nazwa })) },
  strony.faq,
  strony.kontakt,
];

/** The order page as the call to action in the header and on the pages. */
export const orderLink: NavItem = { href: strony.zamowienie.href, label: "Zamów pellet" };

/** Pages outside the header: reached from the footer and from forms. */
export const otherPages: readonly NavItem[] = [strony.zamowienie, strony.polityka];

const tree: readonly NavItem[] = [...mainNav, ...otherPages];

/** Home → section → page. Only pages in the tree get a trail. */
export function breadcrumbsFor(pathname: string): NavItem[] {
  for (const item of tree) {
    if (item.href === pathname) return [strony.home, item];
    const child = item.children?.find((c) => c.href === pathname);
    if (child) return [strony.home, item, child];
  }
  return [strony.home];
}

/** The header entry a page belongs to, for `aria-current`. */
export function activeSection(pathname: string): NavItem | undefined {
  return mainNav.find((item) => item.href === pathname || item.children?.some((c) => c.href === pathname));
}
