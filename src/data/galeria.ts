/**
 * The gallery's photos: every image in src/assets/galeria/, in file-name
 * order, with its alt text. A new photo only needs a file there and its alt
 * text below. The gallery page shows them all; a product page shows the ones
 * of its product (`galeria` in oferta.ts).
 */
import type { ImageMetadata } from "astro";

export interface Zdjecie {
  /** The file name without its extension, e.g. "05-hiton-palety". */
  nazwa: string;
  src: ImageMetadata;
  alt: string;
}

const files = import.meta.glob<{ default: ImageMetadata }>("../assets/galeria/*.{jpg,jpeg,png,webp}", {
  eager: true,
});

/** Alt text by file name. */
const alts: Record<string, string> = {
  "01-flota": "Samochody Pellet Bieżuń w rzędzie, przodem, na tle sosnowego lasu",
  "02-magazyn": "Jasna hala magazynu z rzędem palet pelletu",
  "03-zabudowa-grafika": "Zabudowa ciężarówki z grafiką worków pelletu",
  "04-volvo": "Dwie ciężarówki Volvo z zabudową PELLET na placu, w tle hala i silosy",
  "05-hiton-palety": "Dwie palety pelletu HITON w workach 15 kg",
  "06-pellet-z-bliska": "Pellet drzewny z bliska",
  "07-magazyn-palety": "Palety pelletu w magazynie",
  "08-volvo-przod": "Ciężarówka Volvo Pellet Bieżuń z przodu",
  "09-iveco": "Dwa auta Iveco Daily z czarną zabudową PELLET, mniejsze samochody na dojazd w trudno dostępne miejsca",
  "11-hiton-worki": "Paleta worków pelletu HITON owinięta folią w magazynie",
  "12-zabudowa-bok": "Bok zabudowy z grafiką worków pelletu HITON",
  "13-volvo-hala": "Ciężarówka Volvo w nowej hali magazynu",
  "15-hiton-granulat": "Granulki pelletu HITON z bliska",
  "16-zabudowa-tyl": "Tył zabudowy ciężarówki z numerem telefonu",
  "17-flota-trzy-auta": "Dwie czerwone ciężarówki Volvo i Iveco Daily z zabudową PELLET na placu przy silosach",
  "19-iveco-winda": "Iveco Daily z czarną zabudową PELLET od tyłu, widać złożoną windę",
  "20-volvo-fh-tyl": "Volvo FH z białą zabudową PELLET od tyłu, z windą i numerem telefonu na drzwiach",
  "21-iveco-bok": "Iveco Daily z czarną zabudową PELLET z boku",
  "23-magazyn-hala": "Hala magazynu z rzędami palet pelletu pod foliowymi kapturami, po prawej palety worków Wood Pellets",
  "24-magazyn-wood-pellets": "Hala magazynu pełna palet z workami Wood Pellets, widok z góry",
  "25-wood-pellets-trzy-palety": "Trzy palety pelletu w przezroczystych workach, owinięte folią, z etykietami 1080 kg",
  "26-wood-pellets-paleta": "Paleta pelletu owinięta folią, z przodu: worki 15 kg i etykieta „72 worki, 1080 kg”",
  "27-wood-pellets-z-gory": "Palety worków z napisem „WOOD PELLETS” pod foliowymi kapturami, widok z góry",
  "28-magazyn-rzad-palet": "Rzędy palet pelletu pod foliowymi kapturami w hali magazynu",
};

export const zdjeciaGalerii: Zdjecie[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, mod]) => {
    const name = path.split("/").pop()!.replace(/\.\w+$/, "");
    return { nazwa: name, src: mod.default, alt: alts[name] ?? "Zdjęcie z magazynu Pellet Bieżuń" };
  });

/** The photos with these names, in the order given; a name with no file stops the build. */
export function zdjeciaONazwach(nazwy: readonly string[]): Zdjecie[] {
  return nazwy.map((n) => {
    const z = zdjeciaGalerii.find((x) => x.nazwa === n);
    if (!z) throw new Error(`No gallery photo "${n}" in src/assets/galeria/`);
    return z;
  });
}
