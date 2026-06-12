# GolfGenie AI

AI-powered golf travel planning platform specializing in Myrtle Beach golf vacations —
trip planning, course bookings, hotel reservations, and personalized recommendations.

## Tech stack

- **React 18 + TypeScript**, bundled with **Vite**
- **Tailwind CSS** for styling
- **Supabase** (`@supabase/supabase-js`) for backend/auth/data
- **OpenAI** for AI-powered recommendations
- **Stripe** (`@stripe/stripe-js`, `@stripe/react-stripe-js`) for payments
- **Google Maps** (`@googlemaps/js-api-loader`)
- **Redux Toolkit** + `redux-persist` for state
- `jspdf` / `html2canvas` for PDF itinerary export

## Getting started

```bash
git clone https://github.com/cognis-digital/golfgenie-ai.git
cd golfgenie-ai
npm install
npm run dev
```

The dev server is served by Vite (default `http://localhost:5173`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Configuration

This app integrates with several third-party services (Supabase, OpenAI, Stripe,
Google Maps). Provide the corresponding API keys via Vite environment variables in a
local `.env` file (see `vite.config.ts` and the `src/` integration modules for the exact
variable names). Do not commit secrets.

## License

See [LICENSE](LICENSE).
