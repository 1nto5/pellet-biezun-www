# pellet-biezun-www

Website for a wood pellet seller in Bieżuń (Poland): offer, order form
without payment, gallery, distribution map, contact form.

## Plan and decisions

The plan, decisions, stages and open questions for the client live in
`~/iCloud/PelletBiezun/strona-www.md` (Polish). Read it before starting
work; record progress and decisions there, not here.

## Working rules

- Commit messages, branch names, PR titles and descriptions in English.
  Site content is in Polish.
- Package manager: bun.
- Stack: Astro 5 + Tailwind 4, hosted on Cloudflare Pages; forms through
  Pages Functions and Resend. Secrets (Resend API key, Turnstile secret)
  live only in Cloudflare, never in the repo.
