/**
 * The two form endpoints, called directly with `fetch` replaced: no request
 * leaves the machine. Run with `bun test functions`.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { onRequestPost as zamowienie } from "./zamowienie";
import { onRequestPost as kontakt } from "./kontakt";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND = "https://api.resend.com/emails";

const env = {
  RESEND_API_KEY: "re_test",
  TURNSTILE_SECRET: "prawdziwy-sekret",
  MAIL_TO: "sprzedawca@example.com",
  MAIL_FROM: "Pellet <formularz@example.com>",
};

const zamowieniePola = {
  produkt: "hiton",
  ilosc: "2 palety",
  ulica: "Tajna 7",
  kod: "09-320",
  miejscowosc: "Sekretowo",
  imie: "Jan Kowalski",
  telefon: "600 100 200",
  email: "jan@example.org",
  uwagi: "Brama od podwórza, kod 1234",
  "cf-turnstile-response": "token",
};

const kontaktPola = {
  imie: "Anna",
  email: "anna@example.org",
  telefon: "",
  wiadomosc: "Czy dowozicie do Sierpca?\nDziękuję",
  zgoda: "tak",
  "cf-turnstile-response": "token",
};

interface Wyslany {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
}

let wywolania: { url: string; init: RequestInit }[];
let turnstileOk: boolean;
/** Resend's status for each e-mail in turn; 200 once the list runs out. */
let resendStatusy: number[];
const prawdziwyFetch = globalThis.fetch;
const prawdziwyError = console.error;
const prawdziwyWarn = console.warn;

beforeEach(() => {
  wywolania = [];
  turnstileOk = true;
  resendStatusy = [];
  console.error = () => {};
  console.warn = () => {};
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    wywolania.push({ url, init });
    if (url === SITEVERIFY) return Response.json({ success: turnstileOk });
    if (url === RESEND) return Response.json({ id: "x" }, { status: resendStatusy.shift() ?? 200 });
    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = prawdziwyFetch;
  console.error = prawdziwyError;
  console.warn = prawdziwyWarn;
});

const maile = (): Wyslany[] => wywolania.filter((w) => w.url === RESEND).map((w) => JSON.parse(w.init.body as string) as Wyslany);
const sprawdzeniaTurnstile = () => wywolania.filter((w) => w.url === SITEVERIFY);

type Handler = typeof zamowienie;

function wyslij(
  handler: Handler,
  pola: Record<string, string>,
  opcje: { json?: boolean; env?: Record<string, string | undefined>; url?: string; headers?: Record<string, string>; body?: BodyInit } = {},
): Promise<Response> {
  const sciezka = handler === zamowienie ? "zamowienie" : "kontakt";
  const request = new Request(opcje.url ?? `https://pelletbiezun.pl/api/${sciezka}`, {
    method: "POST",
    headers: { ...(opcje.json === false ? {} : { Accept: "application/json" }), "CF-Connecting-IP": "203.0.113.9", ...opcje.headers },
    body: opcje.body ?? new URLSearchParams(pola),
  });
  return handler({ request, env: opcje.env ?? env } as unknown as Parameters<Handler>[0]) as Promise<Response>;
}

async function oczekujBledu(res: Response, blad: string, status: number) {
  expect(res.status).toBe(status);
  expect(await res.json()).toEqual({ ok: false, blad });
}

describe("zamówienie", () => {
  test("a valid order sends the seller's mail, then the confirmation", async () => {
    const res = await wyslij(zamowienie, zamowieniePola);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, redirect: "/zamowienie/dziekujemy/" });

    const [check] = sprawdzeniaTurnstile();
    const wyslane = new URLSearchParams(String(check!.init.body));
    expect(wyslane.get("secret")).toBe(env.TURNSTILE_SECRET);
    expect(wyslane.get("response")).toBe("token");
    expect(wyslane.get("remoteip")).toBe("203.0.113.9");

    const resend = wywolania.filter((w) => w.url === RESEND);
    expect(resend).toHaveLength(2);
    expect(new Headers(resend[0]!.init.headers).get("Authorization")).toBe("Bearer re_test");

    const [sprzedawca, kupujacy] = maile();
    expect(sprzedawca!.to).toEqual([env.MAIL_TO]);
    expect(sprzedawca!.from).toBe(env.MAIL_FROM);
    expect(sprzedawca!.reply_to).toBe("jan@example.org");
    for (const wartosc of ["Pellet HITON", "2 palety", "Tajna 7", "09-320", "Sekretowo", "Jan Kowalski", "600 100 200", "jan@example.org", "kod 1234"]) {
      expect(sprzedawca!.text).toContain(wartosc);
    }
    expect(sprzedawca).not.toHaveProperty("html");

    expect(kupujacy!.to).toEqual(["jan@example.org"]);
    expect(kupujacy!.reply_to).toBe(env.MAIL_TO);
    expect(kupujacy!.text).toContain("Pellet HITON");
    expect(kupujacy!.text).toContain("2 palety");
    expect(kupujacy).not.toHaveProperty("html");
    // Nothing else the buyer typed goes to the address the buyer typed.
    const odKupujacego = `${kupujacy!.subject}\n${kupujacy!.text}`;
    for (const wartosc of ["Brama", "1234", "Tajna", "09-320", "Sekretowo", "Kowalski", "600 100 200"]) {
      expect(odKupujacego).not.toContain(wartosc);
    }
  });

  test("a multipart body, as the page's script sends it, works the same", async () => {
    const body = new FormData();
    for (const [k, v] of Object.entries(zamowieniePola)) body.set(k, v);
    const res = await wyslij(zamowienie, {}, { body });
    expect(await res.json()).toEqual({ ok: true, redirect: "/zamowienie/dziekujemy/" });
    expect(maile()).toHaveLength(2);
  });

  test("without Accept: application/json the reply is a 303 to the thank-you page", async () => {
    const res = await wyslij(zamowienie, zamowieniePola, { json: false });
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe("/zamowienie/dziekujemy/");
    expect(maile()).toHaveLength(2);
  });

  test("without Accept: application/json an error is a 303 back to the form", async () => {
    const res = await wyslij(zamowienie, { ...zamowieniePola, imie: "" }, { json: false });
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe("/zamowienie/?blad=pola");
    expect(wywolania).toHaveLength(0);
  });

  test("a filled trap field looks like a success and sends nothing", async () => {
    const json = await wyslij(zamowienie, { ...zamowieniePola, strona_www: "https://spam.example" });
    expect(json.status).toBe(200);
    expect(await json.json()).toEqual({ ok: true, redirect: "/zamowienie/dziekujemy/" });
    const zwykly = await wyslij(zamowienie, { ...zamowieniePola, strona_www: "x" }, { json: false });
    expect(zwykly.status).toBe(303);
    expect(zwykly.headers.get("Location")).toBe("/zamowienie/dziekujemy/");
    expect(wywolania).toHaveLength(0);
  });

  const zlePola: [string, Record<string, string>][] = [
    ["a missing required field", { ...zamowieniePola, telefon: "" }],
    ["a required field of spaces only", { ...zamowieniePola, ulica: "   " }],
    ["a bad e-mail", { ...zamowieniePola, email: "jan(at)example.org" }],
    ["two addresses in the e-mail", { ...zamowieniePola, email: "jan@example.org,ofiara@example.net" }],
    ["a bad postal code", { ...zamowieniePola, kod: "9-320" }],
    ["an unknown product", { ...zamowieniePola, produkt: "wegiel" }],
    ["a product named like an object's built-in", { ...zamowieniePola, produkt: "toString" }],
    ["an over-long short field", { ...zamowieniePola, imie: "a".repeat(101) }],
    ["an over-long quantity", { ...zamowieniePola, ilosc: "9".repeat(61) }],
    ["over-long notes", { ...zamowieniePola, uwagi: "a".repeat(2001) }],
  ];
  for (const [nazwa, pola] of zlePola) {
    test(`${nazwa} is "pola" and nothing is sent`, async () => {
      await oczekujBledu(await wyslij(zamowienie, pola), "pola", 400);
      expect(wywolania).toHaveLength(0);
    });
  }

  test("the field without a value in the body counts as missing", async () => {
    const { miejscowosc: _, ...bez } = zamowieniePola;
    await oczekujBledu(await wyslij(zamowienie, bez), "pola", 400);
    expect(wywolania).toHaveLength(0);
  });

  test("the notes are optional and the postal code may come without a hyphen", async () => {
    const res = await wyslij(zamowienie, { ...zamowieniePola, uwagi: "", kod: "09320" });
    expect(res.status).toBe(200);
    expect(maile()).toHaveLength(2);
  });

  test("a body that is not form data is \"pola\"", async () => {
    const res = await wyslij(zamowienie, {}, { body: JSON.stringify(zamowieniePola), headers: { "Content-Type": "application/json" } });
    await oczekujBledu(res, "pola", 400);
    expect(wywolania).toHaveLength(0);
  });

  test("an oversized body is \"pola\"", async () => {
    await oczekujBledu(await wyslij(zamowienie, { ...zamowieniePola, smiec: "a".repeat(30_000) }), "pola", 400);
    expect(wywolania).toHaveLength(0);
  });

  test("a failed Turnstile check is \"turnstile\" and no mail goes out", async () => {
    turnstileOk = false;
    await oczekujBledu(await wyslij(zamowienie, zamowieniePola), "turnstile", 400);
    expect(sprawdzeniaTurnstile()).toHaveLength(1);
    expect(maile()).toHaveLength(0);

    const zwykly = await wyslij(zamowienie, zamowieniePola, { json: false });
    expect(zwykly.status).toBe(303);
    expect(zwykly.headers.get("Location")).toBe("/zamowienie/?blad=turnstile");
  });

  test("a missing Turnstile token is \"turnstile\" without asking Cloudflare", async () => {
    const { "cf-turnstile-response": _, ...bez } = zamowieniePola;
    await oczekujBledu(await wyslij(zamowienie, bez), "turnstile", 400);
    expect(wywolania).toHaveLength(0);
  });

  test("Resend refusing the seller's mail is \"wysylka\" and no confirmation goes out", async () => {
    resendStatusy = [500];
    await oczekujBledu(await wyslij(zamowienie, zamowieniePola), "wysylka", 502);
    expect(maile()).toHaveLength(1);

    resendStatusy = [500];
    const zwykly = await wyslij(zamowienie, zamowieniePola, { json: false });
    expect(zwykly.headers.get("Location")).toBe("/zamowienie/?blad=wysylka");
  });

  test("a network error on the seller's mail is \"wysylka\"", async () => {
    const stub = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === RESEND) throw new Error("network");
      return stub(input, init);
    }) as typeof fetch;
    await oczekujBledu(await wyslij(zamowienie, zamowieniePola), "wysylka", 502);
  });

  test("only the confirmation failing still counts as received", async () => {
    resendStatusy = [200, 500];
    const res = await wyslij(zamowienie, zamowieniePola);
    expect(await res.json()).toEqual({ ok: true, redirect: "/zamowienie/dziekujemy/" });
    expect(maile()).toHaveLength(2);
  });

  for (const brak of ["RESEND_API_KEY", "TURNSTILE_SECRET", "MAIL_TO", "MAIL_FROM"] as const) {
    test(`without ${brak} the reply is "wysylka", never a success`, async () => {
      await oczekujBledu(await wyslij(zamowienie, zamowieniePola, { env: { ...env, [brak]: undefined } }), "wysylka", 502);
      expect(maile()).toHaveLength(0);
      await oczekujBledu(await wyslij(zamowienie, zamowieniePola, { env: { ...env, [brak]: "" } }), "wysylka", 502);
      expect(maile()).toHaveLength(0);
    });
  }

  for (const sekret of ["1x0000000000000000000000000000000AA", "2x0000000000000000000000000000000AA", "3x0000000000000000000000000000000AA"]) {
    test(`the test secret ${sekret.slice(0, 2)}… outside a local run is "wysylka"`, async () => {
      for (const url of ["https://pelletbiezun.pl/api/zamowienie", "https://forms.pellet-biezun-www.pages.dev/api/zamowienie"]) {
        await oczekujBledu(await wyslij(zamowienie, zamowieniePola, { env: { ...env, TURNSTILE_SECRET: sekret }, url }), "wysylka", 502);
      }
      expect(wywolania).toHaveLength(0);
    });
  }

  test("the test secret works on localhost and 127.0.0.1", async () => {
    for (const url of ["http://localhost:8788/api/zamowienie", "http://127.0.0.1:8788/api/zamowienie"]) {
      const res = await wyslij(zamowienie, zamowieniePola, { env: { ...env, TURNSTILE_SECRET: "1x0000000000000000000000000000000AA" }, url });
      expect(res.status).toBe(200);
    }
    expect(sprawdzeniaTurnstile()).toHaveLength(2);
  });

  test("a line break in the name or the quantity never reaches a subject or an address", async () => {
    const res = await wyslij(zamowienie, {
      ...zamowieniePola,
      imie: "Jan\r\nBcc: ofiara@example.net",
      ilosc: "2 palety\ni 3 worki",
    });
    expect(res.status).toBe(200);
    const wyslane = maile();
    expect(wyslane).toHaveLength(2);
    for (const mail of wyslane) {
      for (const pole of [mail.from, mail.reply_to, mail.subject, ...mail.to]) expect(pole).not.toMatch(/[\r\n]/);
    }
    // The confirmation's text keeps the quantity on its own single line.
    expect(wyslane[1]!.text).toContain("Ilość: 2 palety i 3 worki\n");
  });

  test("a line break in the e-mail is \"pola\"", async () => {
    await oczekujBledu(await wyslij(zamowienie, { ...zamowieniePola, email: "jan@example.org\r\nBcc: ofiara@example.net" }), "pola", 400);
    await oczekujBledu(await wyslij(zamowienie, { ...zamowieniePola, email: "jan@example.org\nofiara@example.net" }), "pola", 400);
    expect(wywolania).toHaveLength(0);
  });

  test("a line break in MAIL_FROM or MAIL_TO does not reach Resend either", async () => {
    await wyslij(zamowienie, zamowieniePola, { env: { ...env, MAIL_TO: "sprzedawca@example.com\n", MAIL_FROM: "formularz@example.com\r\n" } });
    for (const mail of maile()) {
      for (const pole of [mail.from, mail.reply_to, ...mail.to]) expect(pole).not.toMatch(/[\r\n]/);
    }
  });
});

describe("kontakt", () => {
  test("a valid message sends one mail to the seller", async () => {
    const res = await wyslij(kontakt, kontaktPola);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, redirect: "/kontakt/dziekujemy/" });
    const wyslane = maile();
    expect(wyslane).toHaveLength(1);
    expect(wyslane[0]!.to).toEqual([env.MAIL_TO]);
    expect(wyslane[0]!.reply_to).toBe("anna@example.org");
    expect(wyslane[0]!.text).toContain("Czy dowozicie do Sierpca?\nDziękuję");
    expect(wyslane[0]).not.toHaveProperty("html");
  });

  test("both replies without Accept: application/json are 303", async () => {
    const dobrze = await wyslij(kontakt, kontaktPola, { json: false });
    expect(dobrze.status).toBe(303);
    expect(dobrze.headers.get("Location")).toBe("/kontakt/dziekujemy/");
    const zle = await wyslij(kontakt, { ...kontaktPola, wiadomosc: "" }, { json: false });
    expect(zle.status).toBe(303);
    expect(zle.headers.get("Location")).toBe("/kontakt/?blad=pola");
  });

  test("a filled trap field looks like a success and sends nothing", async () => {
    const res = await wyslij(kontakt, { ...kontaktPola, strona_www: "x" });
    expect(await res.json()).toEqual({ ok: true, redirect: "/kontakt/dziekujemy/" });
    expect(wywolania).toHaveLength(0);
  });

  const zlePola: [string, Record<string, string>][] = [
    ["a missing name", { ...kontaktPola, imie: "" }],
    ["a missing message", { ...kontaktPola, wiadomosc: " \n " }],
    ["a bad e-mail", { ...kontaktPola, email: "anna@" }],
    ["consent not given", { ...kontaktPola, zgoda: "" }],
    ["consent with another value", { ...kontaktPola, zgoda: "nie" }],
    ["an over-long message", { ...kontaktPola, wiadomosc: "a".repeat(2001) }],
    ["an over-long phone", { ...kontaktPola, telefon: "1".repeat(31) }],
  ];
  for (const [nazwa, pola] of zlePola) {
    test(`${nazwa} is "pola" and nothing is sent`, async () => {
      await oczekujBledu(await wyslij(kontakt, pola), "pola", 400);
      expect(wywolania).toHaveLength(0);
    });
  }

  test("no consent field at all is \"pola\"", async () => {
    const { zgoda: _, ...bez } = kontaktPola;
    await oczekujBledu(await wyslij(kontakt, bez), "pola", 400);
    expect(wywolania).toHaveLength(0);
  });

  test("a failed Turnstile check is \"turnstile\"", async () => {
    turnstileOk = false;
    await oczekujBledu(await wyslij(kontakt, kontaktPola), "turnstile", 400);
    expect(maile()).toHaveLength(0);
  });

  test("Resend refusing the mail is \"wysylka\"", async () => {
    resendStatusy = [500];
    await oczekujBledu(await wyslij(kontakt, kontaktPola), "wysylka", 502);
  });

  test("without the settings the reply is \"wysylka\"", async () => {
    await oczekujBledu(await wyslij(kontakt, kontaktPola, { env: {} }), "wysylka", 502);
    expect(wywolania).toHaveLength(0);
  });

  test("a line break in the name never reaches the subject", async () => {
    await wyslij(kontakt, { ...kontaktPola, imie: "Anna\r\nBcc: ofiara@example.net" });
    const [mail] = maile();
    expect(mail!.subject).not.toMatch(/[\r\n]/);
    expect(mail!.reply_to).toBe("anna@example.org");
  });
});

describe("edge cases", () => {
  test("a quantity that could carry a link stays out of the confirmation, not out of the seller's mail", async () => {
    const ilosc = "Zwrot 500 zl: potwierdz na https://zlo.example/pellet-biezun";
    const res = await wyslij(zamowienie, { ...zamowieniePola, ilosc });
    expect(res.status).toBe(200);
    const [doSprzedawcy, potwierdzenie] = maile();
    expect(doSprzedawcy!.text).toContain(`Ilość: ${ilosc}`);
    expect(potwierdzenie!.text).not.toContain("zlo.example");
    expect(potwierdzenie!.text).not.toContain("Ilość");
    expect(potwierdzenie!.text).toContain("Produkt: Pellet HITON");
  });

  test("ordinary quantities are repeated in the confirmation", async () => {
    for (const ilosc of ["2 palety", "1,5 tony", "30 worków + paleta", "pół palety (36 worków)"]) {
      await wyslij(zamowienie, { ...zamowieniePola, ilosc });
      expect(maile().at(-1)!.text).toContain(`Ilość: ${ilosc}\n`);
    }
  });

  test("the confirmation carries nothing else the buyer typed", async () => {
    await wyslij(zamowienie, zamowieniePola);
    const tekst = maile()[1]!.text;
    for (const pole of ["ulica", "kod", "miejscowosc", "imie", "telefon", "email", "uwagi"] as const) {
      expect(tekst).not.toContain(zamowieniePola[pole]);
    }
  });

  test("unseen separators and direction marks never reach a mail", async () => {
    for (const znak of ["\u2028", "\u2029", "\u0085", "\v", "\f", "\t", "\0", "\u001b", "\u200b", "\u202e"]) {
      wywolania = [];
      const res = await wyslij(zamowienie, { ...zamowieniePola, imie: `Jan${znak}Kowalski`, ilosc: `2${znak}palety`, uwagi: `brama${znak}kod` });
      expect(res.status).toBe(200);
      for (const mail of maile()) {
        expect(mail.subject).not.toContain(znak);
        expect(mail.text).not.toContain(znak);
      }
      expect(maile()[1]!.text).toContain("Ilość: 2 palety\n");
    }
  });

  test("the notes keep their own line breaks", async () => {
    await wyslij(zamowienie, { ...zamowieniePola, uwagi: "pierwsza\r\ndruga\rtrzecia\nczwarta" });
    expect(maile()[0]!.text).toContain("Uwagi: pierwsza\ndruga\ntrzecia\nczwarta\n");
  });

  test("an unseen character in the e-mail is \"pola\"", async () => {
    for (const email of ["a\u0085b@example.org", "a\0@example.org", "jan@example.org\u2028ofiara@example.net"]) {
      await oczekujBledu(await wyslij(zamowienie, { ...zamowieniePola, email }), "pola", 400);
    }
    expect(wywolania).toHaveLength(0);
  });

  test("Turnstile not answering, or answering with an error page, is \"turnstile\" and no mail goes out", async () => {
    const zatkany = globalThis.fetch;
    for (const odpowiedz of [() => Promise.reject(new Error("no network")), () => Promise.resolve(new Response("<html>", { status: 500 }))]) {
      wywolania = [];
      globalThis.fetch = ((input: RequestInfo | URL, init: RequestInit = {}) =>
        String(input) === SITEVERIFY ? odpowiedz() : zatkany(input, init)) as typeof fetch;
      await oczekujBledu(await wyslij(zamowienie, zamowieniePola), "turnstile", 400);
      expect(maile()).toHaveLength(0);
    }
  });

  test("Turnstile's answer counts only when success is exactly true", async () => {
    const zatkany = globalThis.fetch;
    for (const success of ["true", 1, null]) {
      wywolania = [];
      globalThis.fetch = ((input: RequestInfo | URL, init: RequestInit = {}) =>
        String(input) === SITEVERIFY ? Promise.resolve(Response.json({ success })) : zatkany(input, init)) as typeof fetch;
      await oczekujBledu(await wyslij(zamowienie, zamowieniePola), "turnstile", 400);
      expect(maile()).toHaveLength(0);
    }
  });

  test("an empty or over-long token is \"turnstile\" without asking Cloudflare", async () => {
    for (const token of ["", "x".repeat(2049)]) {
      await oczekujBledu(await wyslij(zamowienie, { ...zamowieniePola, "cf-turnstile-response": token }), "turnstile", 400);
    }
    expect(wywolania).toHaveLength(0);
  });

  test("the test secret is refused on a host that only starts like a local one", async () => {
    const testowy = { ...env, TURNSTILE_SECRET: "1x0000000000000000000000000000000AA" };
    for (const url of ["https://localhost.evil.example/api/zamowienie", "https://127.0.0.1.evil.example/api/zamowienie", "https://pelletbiezun.pl/api/zamowienie"]) {
      await oczekujBledu(await wyslij(zamowienie, zamowieniePola, { env: testowy, url }), "wysylka", 502);
    }
    expect(wywolania).toHaveLength(0);
  });

  test("a file in place of a text field is \"pola\"", async () => {
    const body = new FormData();
    for (const [nazwa, wartosc] of Object.entries(zamowieniePola)) body.set(nazwa, wartosc);
    body.set("imie", new File(["x"], "imie.txt"));
    await oczekujBledu(await wyslij(zamowienie, {}, { body }), "pola", 400);
    expect(wywolania).toHaveLength(0);
  });

  test("a filled trap field looks like a success even when the fields are wrong", async () => {
    const res = await wyslij(zamowienie, { strona_www: "x" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, redirect: "/zamowienie/dziekujemy/" });
    expect(wywolania).toHaveLength(0);
  });

  test("the postal code is matched whole", async () => {
    for (const kod of ["109-320", "09-3201", "x09-320"]) {
      await oczekujBledu(await wyslij(zamowienie, { ...zamowieniePola, kod }), "pola", 400);
    }
  });

  test("Accept is read whatever its letter case", async () => {
    const res = await wyslij(zamowienie, zamowieniePola, { json: false, headers: { Accept: "APPLICATION/JSON" } });
    expect(res.status).toBe(200);
  });
});
