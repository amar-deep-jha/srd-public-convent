/**
 * S.R.D. Public Convent — enquiry API (Vercel serverless function)
 *
 * This is the server-side boundary for the enquiry forms. It performs its
 * own validation (client validation is never the only line of defence) and
 * forwards the submission to the email provider only when configured.
 *
 * Environment variables (set in the hosting platform, never committed):
 *   RESEND_API_KEY          — API key for the email provider
 *   SCHOOL_ENQUIRY_EMAIL    — verified destination mailbox for enquiries
 *   SCHOOL_EMAIL_FROM       — optional verified sender address
 *   WEBSITE_ALLOWED_ORIGINS — optional comma-separated origin allow-list
 *
 * Until RESEND_API_KEY + SCHOOL_ENQUIRY_EMAIL are configured the endpoint
 * intentionally returns 503. The frontend then shows a truthful error state
 * with direct phone/WhatsApp fallbacks — never a fake success.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  // Origin allow-list (CSRF defence) when configured.
  const allowed = (process.env.WEBSITE_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin || req.headers.referer || '';
  const originHost = origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (allowed.length && originHost && !allowed.includes(originHost)) {
    return res.status(403).json({ message: 'Request origin not allowed.' });
  }

  // Payload size guard.
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (raw.length > 12000) {
    return res.status(413).json({ message: 'The enquiry is too large to submit.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ message: 'Invalid submission payload.' });
  }

  // Honeypot field — bots fill it, humans do not.
  if (body.website) {
    return res.status(200).json({ message: 'Your enquiry was submitted successfully. Our team will contact you shortly.' });
  }

  const isAdmission = body.formType === 'admission';
  const required = isAdmission
    ? ['parentName', 'childName', 'phone', 'classFor']
    : ['cName', 'cPhone', 'cSubject', 'cMessage'];

  const missing = required.filter((key) => !String(body[key] || '').trim());
  if (missing.length) {
    return res.status(422).json({ message: 'Please complete all required fields.' });
  }

  const phone = String(body.phone || body.cPhone || '').replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return res.status(422).json({ message: 'Please enter a valid Indian mobile number.' });
  }

  if (isAdmission && !/^(Nursery|LKG|UKG|Class [1-8])$/.test(String(body.classFor || '').trim())) {
    return res.status(422).json({ message: 'Please select a valid class.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SCHOOL_ENQUIRY_EMAIL;
  if (!apiKey || !to) {
    return res.status(503).json({ message: 'The enquiry service is not configured yet.' });
  }

  const subject = isAdmission
    ? `Admission enquiry — ${body.childName} — ${body.classFor}`
    : `Website enquiry — ${body.cSubject}`;

  const lines = Object.entries(body)
    .filter(([key]) => !['website', 'page', 'formType', 'dob'].includes(key))
    .map(([key, value]) => `<p><strong>${escapeHtml(titleCase(key))}</strong><br>${escapeHtml(String(value ?? ''))}</p>`)
    .join('');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.SCHOOL_EMAIL_FROM || 'Website Enquiry <onboarding@resend.dev>',
      to: [to],
      subject,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6">${lines}</div>`
    })
  });

  if (!response.ok) {
    return res.status(502).json({
      message: 'The enquiry service could not accept the submission. Please call the school directly.'
    });
  }

  return res.status(200).json({
    message: 'Your enquiry was submitted successfully. Our team will contact you shortly.'
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function titleCase(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}