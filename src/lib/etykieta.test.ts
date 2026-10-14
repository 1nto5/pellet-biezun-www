/** The search labels of places from the index. Run with `bun test src`. The labels keep a no-break space after "gm." and "pow.". */
import { describe, expect, test } from "bun:test";
import { etykietyZIndeksu } from "./etykieta";

const lista = new Set(["gorzno", "kozlowo", "lidzbark welski"]);

describe("etykietyZIndeksu", () => {
  test("a place in a gmina of its own name, named like a listed town, gets its powiat", () => {
    const wpisy = [
      { nazwa: "Górzno", gmina: "Dominowo", powiat: "średzki" },
      { nazwa: "Górzno", gmina: "Górzno", powiat: "garwoliński" },
      { nazwa: "Górzno", gmina: "Ostrów Wielkopolski", powiat: "ostrowski" },
    ];
    expect(etykietyZIndeksu(wpisy, lista)).toEqual([
      "Górzno (gm.\u00a0Dominowo)",
      "Górzno (gm.\u00a0Górzno, pow.\u00a0garwoliński)",
      "Górzno (gm.\u00a0Ostrów Wielkopolski)",
    ]);
  });

  test("a place named like a listed town in another gmina keeps the short label", () => {
    expect(etykietyZIndeksu([{ nazwa: "Kozłowo", gmina: "Gzy", powiat: "pułtuski" }], lista)).toEqual(["Kozłowo (gm.\u00a0Gzy)"]);
  });

  test("a place whose gmina has its name, but no listed town does, keeps the short label", () => {
    expect(etykietyZIndeksu([{ nazwa: "Szczutowo", gmina: "Szczutowo", powiat: "sierpecki" }], lista)).toEqual(["Szczutowo (gm.\u00a0Szczutowo)"]);
  });

  test("two places that would read the same both get their powiat", () => {
    const wpisy = [
      { nazwa: "Nowa Wieś", gmina: "Wąsewo", powiat: "ostrowski" },
      { nazwa: "Nowa Wieś", gmina: "Wąsewo", powiat: "inny" },
    ];
    expect(etykietyZIndeksu(wpisy, lista)).toEqual(["Nowa Wieś (gm.\u00a0Wąsewo, pow.\u00a0ostrowski)", "Nowa Wieś (gm.\u00a0Wąsewo, pow.\u00a0inny)"]);
  });
});
