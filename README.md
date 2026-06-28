# golfgenie-ai

GolfGenie is a Vite + React + TypeScript web application (with a Supabase
backend) in the Cognis Digital suite. It uses Tailwind CSS for styling, Redux
Toolkit for state, and integrates Supabase, OpenAI, Google Maps, and Stripe.


<!-- cognis:example:start -->
## 🔎 Example output

**Sample result format** _(illustrative values — run on your own data for real findings):_

```
{
  "rounds": [
    {
      "date": "2023-02-15",
      "course": "Pebble Beach",
      "score": 85,
      "par": 72,
      "handicap_index": 12.5
    },
    {
      "date": "2023-03-01",
      "course": "St Andrews",
      "score": 78,
      "par": 70,
      "handicap_index": 11.2
    }
  ]
}
```

<!-- cognis:example:end -->

## Usage — step by step

This is a Vite front-end; the lifecycle uses the npm scripts defined in
`package.json` (`dev`, `build`, `lint`, `preview`):

1. **Install dependencies** after cloning:

   ```bash
   git clone https://github.com/cognis-digital/golfgenie-ai.git
   cd golfgenie-ai
   npm install
   ```

2. **Configure environment.** Copy the example env file and fill in your keys
   (the app reads `VITE_`-prefixed vars — Supabase URL/anon key, OpenAI, Google
   Maps, and Stripe; see `.env.example` for the full list):

   ```bash
   cp .env.example .env
   # then edit .env and set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, etc.
   ```

3. **Run the dev server.** `npm run dev` starts Vite with hot-module reload
   (Vite prints the local URL, by default http://localhost:5173):

   ```bash
   npm run dev
   ```

4. **Build and preview the production bundle.** `npm run build` emits static
   assets to `dist/`; `npm run preview` serves that build locally so you can
   verify it before deploying:

   ```bash
   npm run build
   npm run preview
   ```

5. **Use it in CI.** Lint and build to catch regressions on every push
   (a non-zero exit from either step fails the pipeline):

   ```bash
   npm ci
   npm run lint
   npm run build
   ```

Licensed under the Cognis Open Collaboration License (COCL) 1.0 — see [LICENSE](LICENSE).

## Interoperability

`golfgenie-ai` composes with the 300+ tool Cognis suite — JSON in/out and a shared
OpenAI-compatible `/v1` backbone. See **[INTEROP.md](INTEROP.md)** for the
suite map, composition patterns, and reference stacks.

## Integrations

Forward `golfgenie-ai`'s findings to STIX/MISP/Sigma/Splunk/Elastic/Slack/webhooks via
[`cognis-connect`](https://github.com/cognis-digital/cognis-connect). See **[INTEGRATIONS.md](INTEGRATIONS.md)**.
