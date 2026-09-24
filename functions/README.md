# functions/

Cloudflare Pages Functions: small pieces of server code that Cloudflare runs
on request, next to the static site. A file's path here is its URL, so
`functions/api/zamowienie.ts` answers `/api/zamowienie`. Astro does not build
this folder; Cloudflare picks it up on deploy.

Stage 3 adds:

- `api/zamowienie.ts`: receives the order form, sends an e-mail to the seller
  and a confirmation to the buyer through Resend.
- `api/kontakt.ts`: receives the contact form, sends it to the seller.

Both check the Turnstile token and drop any request where the trap field
`strona_www` is filled. The Resend API key and the Turnstile secret are set as
secrets in the Cloudflare Pages project, never in this repo. For local runs
they go in `.dev.vars`, which git ignores.

Until then `formularzeWlaczone` in `src/data/strona.ts` is false and the forms
do not send.
