# functions/

Cloudflare Pages Functions: small pieces of server code that Cloudflare runs
on request, next to the static site. A file's path here is its URL, so
`functions/api/zamowienie.ts` answers `/api/zamowienie`. Astro does not build
this folder; Cloudflare picks it up on deploy.

## What is here

- `api/zamowienie.ts`: receives the order form (`POST /api/zamowienie`), sends
  an e-mail to the seller and a confirmation to the buyer through Resend.
- `api/kontakt.ts`: receives the contact form (`POST /api/kontakt`), sends it
  to the seller.
- `lib/formularz.ts`: what the two share. It exports no `onRequest…` handler,
  so it gets no address of its own.
- `api/formularze.test.ts`: tests of both, with no real request sent.

Both endpoints drop any request where the trap field `strona_www` is filled,
check the fields again, check the Turnstile token with Cloudflare, and only
then send. A filled trap field is logged, so an order lost that way can be
found in the project's logs. The steps and the two kinds of reply (JSON for
the page's script, a 303 redirect for a plain post) are described at the top
of `lib/formularz.ts`. The pages themselves send only with scripts on, because
the Turnstile widget needs them.

The buyer's confirmation repeats only the product and the quantity, and the
quantity only when it reads like one ("2 palety"): with a dot, slash, colon
or @ in it, it stays out, so the form cannot mail a link to a stranger. The
seller's mail always has everything.

The product names in the e-mails come from `src/data/produkty.ts`, the same
list the offer is built on. That file must stay plain data: the functions
cannot load anything that needs Astro.

`formularzeWlaczone` in `src/data/strona.ts` turns the forms on the pages on
and off; `turnstileSiteKey` next to it is the widget's public key.

## Settings

Set in the Cloudflare Pages project (Settings → Variables and Secrets), for
production and for preview, never in this repo:

| Name               | What it is                                                           |
| ------------------ | -------------------------------------------------------------------- |
| `RESEND_API_KEY`   | Resend's API key (secret).                                           |
| `TURNSTILE_SECRET` | The Turnstile widget's secret key (secret).                          |
| `MAIL_TO`          | The seller's inbox, where orders and messages go.                    |
| `MAIL_FROM`        | The sender, an address on the domain verified in Resend, e.g. `Pellet Bieżuń <formularz@pelletbiezun.pl>`. |

If any of them is missing, the form answers with the "could not send" error
and the phone number, never with a thank-you page.

Cloudflare's test Turnstile keys let everyone through, so the functions accept
a test secret only when the request's host is `localhost` or `127.0.0.1`.
Anywhere else it counts as a missing setting. The preview and production
therefore need a real widget: its site key in `turnstileSiteKey`, its secret
in `TURNSTILE_SECRET`.

## Local run

`astro dev` does not run the functions. Wrangler, Cloudflare's command-line
tool, serves the built site together with them:

```sh
bun run build
bunx wrangler pages dev dist --port 8799
```

Run it from the repo root, so it finds `functions/` and `.dev.vars`. Pick any
free port.

Local settings go in two files in the repo root, both ignored by git.
`.dev.vars`, read by Wrangler:

```
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
MAIL_TO=sprzedawca@example.com
MAIL_FROM=Pellet Bieżuń <formularz@example.com>
```

`.env`, read by `bun run build` and `bun run dev`:

```
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

The real widget does not work on localhost, so a local build swaps its site
key for Cloudflare's test key, whose widget always passes; the secret above is
the test secret that pairs with it
(https://developers.cloudflare.com/turnstile/troubleshooting/testing/). With
no `RESEND_API_KEY` a valid form ends in the "could not send" error, which is
enough to check everything up to the e-mail. Never put a real Resend key in a
file here; real e-mails are tested on the branch's preview.

## Checks

`bun run check` runs `astro check`, then `tsc -p functions --noEmit`, then
`bun test functions`. This folder has its own `tsconfig.json` with
`@cloudflare/workers-types`, because the functions run on Cloudflare's
runtime, not in a browser; the site's `tsconfig.json` leaves the folder out.
The test file is left out of `tsc` (Bun's test types clash with the workers
types); Bun still runs it.
