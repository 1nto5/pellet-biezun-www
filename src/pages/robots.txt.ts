import type { APIRoute } from "astro";
import { isPreview } from "../lib/env";
import { absoluteUrl } from "../lib/url";

/**
 * Generated rather than static, so a preview build (lib/env.ts) leaves out
 * the sitemap and the invitations. It does not shut crawlers out: its pages
 * carry `noindex`, and a crawler kept out by robots.txt never sees that, so
 * a linked preview page could still be listed. Crawlers only read robots.txt
 * at the root of a host, so a copy under a sub-path relies on `noindex`
 * alone anyway.
 *
 * AI crawlers are named one by one with an explicit Allow, so the intent is
 * clear to anyone reading the file. Cloudflare's "block AI bots" and "managed
 * robots.txt" settings must stay off for the zone, or Cloudflare adds its own
 * Disallow lines in front of these.
 */
const aiBots = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export const GET: APIRoute = () => {
  const lines = isPreview
    ? ["User-agent: *", "Allow: /"]
    : [
        "User-agent: *",
        "Allow: /",
        "",
        "# Wyszukiwarki i asystenci AI: zapraszamy.",
        ...aiBots.map((bot) => `User-agent: ${bot}`),
        "Allow: /",
        "",
        `Sitemap: ${absoluteUrl("/sitemap-index.xml")}`,
      ];

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
