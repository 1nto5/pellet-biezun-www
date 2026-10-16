/**
 * The guard on the town pages' own words (`podstrona.opis` in
 * `data/miejsca.ts`). Each text is a draft until the client confirms it:
 * drafts may name a day, the villages around the town or the car that
 * usually goes there only as examples. A preview shows them; the production
 * build (Cloudflare Pages, branch main) stops while any is unconfirmed.
 *
 * No imports, so a test can feed it plain objects.
 */
export interface Opis {
  tekst: string;
  /** True once the client has confirmed the text, every fact in it included. */
  potwierdzony: boolean;
}

interface ZOpisem {
  nazwa: string;
  podstrona?: { opis?: Opis };
}

/** The towns whose text is still a draft. */
export const niepotwierdzone = (miejsca: readonly ZOpisem[]): string[] =>
  miejsca.filter((m) => m.podstrona?.opis && !m.podstrona.opis.potwierdzony).map((m) => m.nazwa);

/** Throws on the production branch while any town's text is a draft; any other branch or a local build passes. */
export function sprawdzOpisy(miejsca: readonly ZOpisem[], branch: string | undefined): void {
  if (branch !== "main") return;
  const szkice = niepotwierdzone(miejsca);
  if (szkice.length === 0) return;
  throw new Error(
    `Unconfirmed town texts (podstrona.opis) on the production branch: ${szkice.join(", ")}. ` +
      "Set potwierdzony: true in src/data/miejsca.ts once the client has confirmed each text, or remove it.",
  );
}
