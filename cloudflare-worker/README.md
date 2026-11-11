# Secure Gemini endpoint for KIIP Dictionary

The GitHub Pages site is static, so it cannot safely store a Gemini API key or run server code. This Cloudflare Worker provides the server-side proxy. The browser receives only the Worker URL; the Gemini key is stored as an encrypted Worker secret.

## Setup

1. Create a Cloudflare account and install Node.js/npm if needed.
2. Get a Gemini API key from Google AI Studio. **Do not paste it into GitHub files, this chat, or `gemini-config.js`.**
3. In a terminal, from this folder, run:

   ```sh
   npm create cloudflare@latest -- --existing
   npx wrangler login
   npx wrangler secret put GEMINI_API_KEY --config wrangler.toml
   ```

   Paste the key only into Wrangler's secure prompt. If the `--existing` setup prompt is unsuitable, install Wrangler with `npm install --save-dev wrangler` and deploy with `npx wrangler deploy --config wrangler.toml`.

4. Deploy the Worker:

   ```sh
   npx wrangler deploy --config wrangler.toml
   ```

   Wrangler prints a URL similar to `https://kiip-gemini-api.YOUR-SUBDOMAIN.workers.dev`.
5. In repository-root `gemini-config.js`, set `window.GEMINI_API_ENDPOINT` to that URL plus `/api/gemini`, e.g. `https://kiip-gemini-api.YOUR-SUBDOMAIN.workers.dev/api/gemini`, then commit/push the config file.
6. Refresh the website and test with a Korean word.

The Worker allows requests only from the GitHub Pages site origin and validates the input length. CORS is not authentication: anyone can still call a public endpoint outside browsers. In Cloudflare, add a rate-limiting rule for this Worker route and review usage/billing limits. Rotate the key immediately if it is ever exposed. Model is configurable in `wrangler.toml` (`GEMINI_MODEL`); change it to a model available to your Google AI Studio key if needed.
