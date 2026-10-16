/** The guard on unconfirmed town texts. Run with `bun test src`. */
import { describe, expect, test } from "bun:test";
import { niepotwierdzone, sprawdzOpisy } from "./opis";

const miejsca = [
  { nazwa: "Bieżuń" },
  { nazwa: "Płock", podstrona: { opis: { tekst: "Szkic.", potwierdzony: false } } },
  { nazwa: "Sierpc", podstrona: { opis: { tekst: "Gotowe.", potwierdzony: true } } },
  { nazwa: "Mława", podstrona: {} },
];

describe("sprawdzOpisy", () => {
  test("lists only the towns with a draft text", () => {
    expect(niepotwierdzone(miejsca)).toEqual(["Płock"]);
  });

  test("the production branch refuses a draft and names the town", () => {
    expect(() => sprawdzOpisy(miejsca, "main")).toThrow(/Płock/);
  });

  test("a preview branch or a local build passes", () => {
    expect(() => sprawdzOpisy(miejsca, "city-pages-draft-notes")).not.toThrow();
    expect(() => sprawdzOpisy(miejsca, undefined)).not.toThrow();
  });

  test("the production branch passes once every text is confirmed", () => {
    expect(() => sprawdzOpisy(miejsca.filter((m) => m.nazwa !== "Płock"), "main")).not.toThrow();
  });
});
