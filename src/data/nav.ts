/**
 * The navigation tree. The header and the footer show the top level; the
 * children only appear in the breadcrumbs. The local pages hang under the map,
 * one per place in `miejsca.ts`, even though their addresses sit under /dostawa/.
 */
import { miejsca, miejsceHref } from "./miejsca";

export interface NavItem {
  href: string;
  label: string;
  children?: readonly NavItem[];
}

export const home: NavItem = { href: "/", label: "Strona główna" };

/** The header row, left to right. „Zamówienie" is the button beside it. */
export const mainNav: readonly NavItem[] = [
  { href: "/oferta/", label: "Oferta" },
  { href: "/galeria/", label: "Galeria" },
  {
    href: "/mapa-dystrybucji/",
    label: "Mapa dystrybucji",
    children: miejsca.map((m) => ({ href: miejsceHref(m), label: m.nazwa })),
  },
  { href: "/faq/", label: "FAQ" },
  { href: "/kontakt/", label: "Kontakt" },
];

export const orderLink: NavItem = { href: "/zamowienie/", label: "Zamów pellet" };

/** Pages outside the header: reached from the footer and from forms. */
export const otherPages: readonly NavItem[] = [
  { href: "/zamowienie/", label: "Zamówienie" },
  { href: "/polityka-prywatnosci/", label: "Polityka prywatności" },
];

export interface Crumb {
  href: string;
  label: string;
}

const tree: readonly NavItem[] = [...mainNav, ...otherPages];

/** Home → section → page. Only pages in the tree get a trail. */
export function breadcrumbsFor(pathname: string): Crumb[] {
  for (const item of tree) {
    if (item.href === pathname) return [home, item];
    const child = item.children?.find((c) => c.href === pathname);
    if (child) return [home, item, child];
  }
  return [home];
}

/** The header entry a page belongs to, for `aria-current`. */
export function activeSection(pathname: string): NavItem | undefined {
  return mainNav.find(
    (item) => item.href === pathname || item.children?.some((c) => c.href === pathname),
  );
}
