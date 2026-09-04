# S.R.D. Public Convent — Production Frontend Rebuild

A six-page, responsive school website rebuilt around the approved green/ivory/gold visual direction and supplied school imagery.

## Included
- Home, About, Academics, Facilities, Admissions and Contact pages
- Real supplied imagery converted to optimized WebP
- Accessible mobile navigation with focus restoration
- Accessible gallery lightbox with Previous/Next, Escape and keyboard controls
- Client-side validation with visible error states
- Reduced-motion support
- GA4/GTM-ready click and form events when `gtag` is present
- Vite multi-page build configuration
- Vercel-ready `/api/enquiry` endpoint
- No fake social links and no false form-success messages

## Run locally
```bash
npm install
npm run dev
```

## Production form setup (Vercel)
The frontend posts to `/api/enquiry`. To enable email delivery, configure these Vercel environment variables:

- `RESEND_API_KEY` — API key for the email provider
- `SCHOOL_ENQUIRY_EMAIL` — verified destination mailbox
- `SCHOOL_EMAIL_FROM` — optional verified sender, e.g. `S.R.D. Public Convent <admissions@your-domain.com>`

Until these are configured, the site deliberately shows a truthful error/fallback rather than claiming that an enquiry was recorded.

## Analytics
If GA4 is installed and exposes `window.gtag`, the site emits:
- `call_click`
- `whatsapp_click`
- `form_submit`
- `form_success`
- `form_error`

## Production checklist
- Verify every school statistic and claim before publishing.
- Replace the default Resend sender with a verified school-domain sender.
- Add the school's actual Facebook/Instagram/YouTube URLs only when available.
- Test the website at mobile, tablet and desktop breakpoints.
- Run Lighthouse after deployment and confirm Core Web Vitals.
