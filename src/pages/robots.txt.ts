import type { APIRoute } from "astro";
import { isPreview } from "../lib/env";

/**
 * Generated rather than static, so a preview build of another branch closes
 * itself to crawlers while production stays open.
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

export const GET: APIRoute = ({ site }) => {
  const lines = isPreview
    ? ["User-agent: *", "Disallow: /"]
    : [
        "User-agent: *",
        "Allow: /",
        "",
        "# Wyszukiwarki i asystenci AI: zapraszamy.",
        ...aiBots.map((bot) => `User-agent: ${bot}`),
        "Allow: /",
        "",
        `Sitemap: ${new URL("/sitemap-index.xml", site)}`,
      ];

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
