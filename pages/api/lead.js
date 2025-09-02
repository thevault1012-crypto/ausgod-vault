
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const { name, email, phone, consent, utms = {} } = req.body || {};
  if (!name || !email || !phone || !consent) return res.status(400).json({ ok: false });

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: process.env.LEAD_FROM_EMAIL || 'leads@ausgodvault.com',
      to: process.env.LEAD_TO_EMAIL || 'thevault1012@gmail.com',
      subject: `New Lead — ${name}`,
      html: `<h2>New Lead Submission</h2>
             <p><b>Name:</b> ${name}</p>
             <p><b>Email:</b> ${email}</p>
             <p><b>Phone:</b> ${phone}</p>
             <p><b>Consent:</b> ${consent}</p>
             <pre>${JSON.stringify(utms, null, 2)}</pre>`,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
