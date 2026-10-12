/**
 * What both form endpoints share: reading the body, the checks, Turnstile,
 * Resend and the two kinds of reply. `api/zamowienie.ts` and `api/kontakt.ts`
 * only say which fields they take and which e-mails they send.
 *
 * This file exports no `onRequest…` handler, so Cloudflare makes no address
 * for it.
 *
 * The steps, in order:
 * 1. A filled trap field gets the same reply as a sent form, and nothing is
 *    sent: a bot learns nothing from it.
 * 2. The fields are checked again; the page's own checks can be skipped.
 * 3. Turnstile's token is checked with Cloudflare.
 * 4. The e-mails go out through Resend.
 *
 * The reply comes in two forms. The page's script asks for JSON
 * (`Accept: application/json`) and gets `{ ok, redirect }` or `{ ok, blad }`.
 * A browser without scripts posts the form itself and gets a 303 redirect: to
 * the thank-you page, or back to the form with `?blad=<code>`.
 */

export interface Env {
  /** Resend's API key. */
  RESEND_API_KEY?: string;
  /** The Turnstile widget's secret key. */
  TURNSTILE_SECRET?: string;
  /** The seller's inbox. */
  MAIL_TO?: string;
  /** The sender, an address on the site's domain. */
  MAIL_FROM?: string;
}

/** "pola": the fields are wrong; "turnstile": the anti-spam check failed; "wysylka": the e-mail did not go out. */
export type Blad = "pola" | "turnstile" | "wysylka";

export interface Pole {
  wymagane?: boolean;
  /** The longest value taken, in characters. */
  max: number;
  /** A textarea: line breaks stay. Everywhere else they become spaces. */
  wielolinijkowe?: boolean;
  wzor?: RegExp;
}

export interface Mail {
  to: string;
  subject: string;
  text: string;
  reply_to: string;
}

export interface Formularz<P extends string> {
  /**
   * The form's page. Functions run only on Cloudflare, where the site sits at
   * the domain root, so this path is typed whole; the pages themselves keep
   * using `href()` and `strony`.
   */
  strona: `/${string}/`;
  pola: Record<P, Pole>;
  /** Checks that go beyond one field's own rules. */
  sprawdz?: (dane: Record<P, string>) => boolean;
  /** The e-mail to the seller; the form counts as sent only if this one goes out. */
  doSprzedawcy: (dane: Record<P, string>, mailTo: string) => Mail;
  /** The confirmation to the sender, where the form has one. */
  potwierdzenie?: (dane: Record<P, string>, mailTo: string) => Mail;
}

/** The hidden field people never see; only bots fill it in. */
const PULAPKA = "strona_www";

/** The forms' longest honest body is a few kB; nothing bigger is read into fields. */
const MAX_BODY = 20_000;

const MAX_TOKEN = 2048;

export const EMAIL = /^[^\s@<>,;:"()[\]\\]+@[^\s@<>,;:"()[\]\\]+\.[^\s@<>,;:"()[\]\\]+$/;

/**
 * Cloudflare's test secrets, which accept the dummy token of the test site
 * keys and so let anyone through. They are for local runs only.
 * https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
const TESTOWE_SEKRETY = ["1x0000000000000000000000000000000AA", "2x0000000000000000000000000000000AA", "3x0000000000000000000000000000000AA"];

const LOKALNE_HOSTY = ["localhost", "127.0.0.1"];

/**
 * Line breaks of every kind, control characters and invisible formatting
 * characters (such as the one that reverses the text's direction): none of
 * them belongs in what a person types into a form.
 */
const NIEWIDOCZNE = /[\p{Cc}\p{Cf}\u2028\u2029]+/gu;

/** For a subject or an address: a line break there could start a new header. */
export function jednaLinia(tekst: string): string {
  return tekst.replace(NIEWIDOCZNE, " ").trim();
}

/** For a textarea: the reader's own line breaks stay, nothing else unseen does. */
function wieleLinii(tekst: string): string {
  return tekst
    .split(/\r\n?|\n/)
    .map((linia) => linia.replace(NIEWIDOCZNE, " "))
    .join("\n")
    .trim();
}

function odpowiedz(request: Request, strona: string, blad?: Blad): Response {
  const sukces = `${strona}dziekujemy/`;
  if (request.headers.get("Accept")?.toLowerCase().includes("application/json")) {
    return blad
      ? Response.json({ ok: false, blad }, { status: blad === "wysylka" ? 502 : 400 })
      : Response.json({ ok: true, redirect: sukces });
  }
  return new Response(null, { status: 303, headers: { Location: blad ? `${strona}?blad=${blad}` : sukces } });
}

/** The body as form fields, or null when it is not a form or is too big. */
async function czytaj(request: Request): Promise<FormData | null> {
  const typ = request.headers.get("Content-Type") ?? "";
  if (!/^(application\/x-www-form-urlencoded|multipart\/form-data)\b/i.test(typ)) return null;
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY) return null;
  try {
    // The header may be missing or wrong, so the body itself is measured too.
    const body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY) return null;
    return await new Response(body, { headers: { "Content-Type": typ } }).formData();
  } catch {
    return null;
  }
}

/** The form's own fields, cleaned and checked; null when any of them is wrong. */
function pola<P extends string>(form: FormData, formularz: Formularz<P>): Record<P, string> | null {
  const dane = {} as Record<P, string>;
  for (const nazwa of Object.keys(formularz.pola) as P[]) {
    const pole = formularz.pola[nazwa];
    const surowe = form.get(nazwa) ?? "";
    if (typeof surowe !== "string") return null;
    const wartosc = pole.wielolinijkowe ? wieleLinii(surowe) : jednaLinia(surowe);
    if (pole.wymagane && !wartosc) return null;
    if (wartosc.length > pole.max) return null;
    if (wartosc && pole.wzor && !pole.wzor.test(wartosc)) return null;
    dane[nazwa] = wartosc;
  }
  return formularz.sprawdz && !formularz.sprawdz(dane) ? null : dane;
}

async function turnstile(token: string, secret: string, request: Request): Promise<boolean> {
  try {
    const body = new URLSearchParams({ secret, response: token });
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const wynik = (await res.json()) as { success?: boolean };
    return wynik.success === true;
  } catch (e) {
    console.error("Turnstile: the check did not answer", e);
    return false;
  }
}

async function wyslij(mail: Mail, env: { key: string; from: string }): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.key}`, "Content-Type": "application/json" },
      // Plain text only, so nothing a sender typed is ever read as HTML.
      body: JSON.stringify({
        from: jednaLinia(env.from),
        to: [jednaLinia(mail.to)],
        reply_to: jednaLinia(mail.reply_to),
        subject: jednaLinia(mail.subject),
        text: mail.text,
      }),
    });
    if (!res.ok) console.error(`Resend: ${res.status}`, await res.text());
    return res.ok;
  } catch (e) {
    console.error("Resend: the request failed", e);
    return false;
  }
}

export async function obsluz<P extends string>(context: { request: Request; env: Env }, formularz: Formularz<P>): Promise<Response> {
  const { request, env } = context;
  const blad = (kod?: Blad) => odpowiedz(request, formularz.strona, kod);

  const form = await czytaj(request);
  if (!form) return blad("pola");

  if (form.get(PULAPKA)) {
    // Logged so that a real order lost to a browser's autofill can be found.
    console.warn(`The trap field was filled on ${formularz.strona}: nothing sent`);
    return blad();
  }

  const dane = pola(form, formularz);
  if (!dane) return blad("pola");

  // A missing setting is our fault, not the sender's: never a success.
  const secret = env.TURNSTILE_SECRET;
  if (!secret) {
    console.error("TURNSTILE_SECRET is not set");
    return blad("wysylka");
  }
  if (TESTOWE_SEKRETY.includes(secret) && !LOKALNE_HOSTY.includes(new URL(request.url).hostname)) {
    console.error("TURNSTILE_SECRET is a test secret outside a local run");
    return blad("wysylka");
  }
  const token = form.get("cf-turnstile-response");
  if (typeof token !== "string" || !token || token.length > MAX_TOKEN) return blad("turnstile");
  if (!(await turnstile(token, secret, request))) return blad("turnstile");

  const { RESEND_API_KEY: key, MAIL_TO: mailTo, MAIL_FROM: from } = env;
  if (!key || !mailTo || !from) {
    console.error("RESEND_API_KEY, MAIL_TO or MAIL_FROM is not set");
    return blad("wysylka");
  }
  if (!(await wyslij(formularz.doSprzedawcy(dane, mailTo), { key, from }))) return blad("wysylka");

  // The seller has the form, so it is received even if this one fails.
  if (formularz.potwierdzenie && !(await wyslij(formularz.potwierdzenie(dane, mailTo), { key, from }))) {
    console.error("The confirmation to the sender did not go out");
  }
  return blad();
}
