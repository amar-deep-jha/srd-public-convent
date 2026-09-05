# S.R.D. Public Convent — Official Website

Official static website for **S.R.D. Public Convent**, Santha, Sant Kabir Nagar,
Uttar Pradesh (272270). A UP Board school nurturing learners from **Nursery to
Class 8**.

Motto: **Learn • Grow • Shine**

## Pages

| Page | Path |
| --- | --- |
| Home | `index.html` |
| About Us | `about.html` |
| Academics | `academics.html` |
| Facilities | `facilities.html` |
| Admissions (session 2026–27) | `admissions.html` |
| Contact | `contact.html` |

## Tech stack

- **Vite 7** — multi-page static build (`index`, `about`, `academics`,
  `facilities`, `admissions`, `contact`)
- **Vanilla JS** (`src/scripts/main.js`) — accessible mobile drawer & lightbox,
  form validation, reveal animations, analytics hooks
- **Plain CSS** (`src/styles/`) — token-driven design system
- **Vercel serverless function** (`api/enquiry.js`) — enquiry form backend

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

## Enquiry forms

Both forms (`admissions.html` and `contact.html`) POST to `/api/enquiry`:

- In **production**, deploy the `api/` folder as a Vercel serverless function.
- In **development**, a small Vite middleware plugin answers `/api/enquiry`
  with an honest `503` unless a dev inbox is configured.

### Environment variables (production)

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | until configured, forms return 503 | Email provider API key |
| `SCHOOL_ENQUIRY_EMAIL` | until configured, forms return 503 | Verified inbox for enquiries |
| `SCHOOL_EMAIL_FROM` | optional | Verified sender address |
| `WEBSITE_ALLOWED_ORIGINS` | optional | Comma-separated origin allow-list (CSRF) |
| `VITE_GA_MEASUREMENT_ID` | optional | GA4 id; enables analytics when set |

The site **never shows a fake success**. Until the email provider is
configured, submissions show a truthful error with phone/WhatsApp fallbacks.

## Analytics

Google Analytics 4 is optional. Create a `.env` file:

```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Analytics calls are safe no-ops when unset. Event contract:
`admission_cta_click`, `phone_click`, `whatsapp_click`, `campus_visit_click`,
`gallery_open`, `form_start`, `form_submit`, `form_success`, `form_error`.

## Images

All photography lives in `public/images/*.webp` (23 files) and is served via
`/images/...`. Brand marks are inline SVGs in `public/icons/`. No external
image dependencies — the site works fully offline once built.

## Accessibility

- Skip link, `inert`-based drawer & lightbox with focus traps and Escape
- `prefers-reduced-motion` support
- `aria-expanded`, `aria-invalid`, `aria-describedby`, `role="alert"` wiring
- Semantic landsections, keyboard-operable gallery, honest form statuses

## Deployment

Any static host works (`dist/`). Vercel is recommended because `api/enquiry.js`
deploys natively as a serverless function.