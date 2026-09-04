export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed.' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (body.website) return res.status(400).json({ message: 'Invalid submission.' });

  const required = body.formType === 'admission'
    ? ['parentName', 'childName', 'phone', 'classFor']
    : ['cName', 'cPhone', 'cSubject', 'cMessage'];
  const missing = required.filter(key => !String(body[key] || '').trim());
  if (missing.length) return res.status(422).json({ message: 'Please complete all required fields.' });

  const phone = String(body.phone || body.cPhone || '').replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(phone)) return res.status(422).json({ message: 'Please enter a valid Indian mobile number.' });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SCHOOL_ENQUIRY_EMAIL;
  if (!apiKey || !to) return res.status(503).json({ message: 'The enquiry service is not configured yet.' });

  const subject = body.formType === 'admission'
    ? `Admission enquiry — ${body.childName} — ${body.classFor}`
    : `Website enquiry — ${body.cSubject}`;
  const lines = Object.entries(body)
    .filter(([key]) => !['website','page'].includes(key))
    .map(([key, value]) => `<p><strong>${key}</strong><br>${escapeHtml(String(value ?? ''))}</p>`)
    .join('');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.SCHOOL_EMAIL_FROM || 'Website Enquiry <onboarding@resend.dev>',
      to: [to], subject,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.5">${lines}</div>`
    })
  });
  if (!response.ok) return res.status(502).json({ message: 'The enquiry service could not accept the submission. Please call the school.' });
  return res.status(200).json({ message: 'Your enquiry was submitted successfully. The school team will follow up with you.' });
}
function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
