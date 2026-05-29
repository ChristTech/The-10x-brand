// api/contact.js — Vercel Serverless Function
// Handles POST /api/contact from the contact form

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const { name, email, brand, goal } = req.body;

  // Basic validation
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required.' });
  }

  const submission = {
    id:        Date.now(),
    timestamp: new Date().toISOString(),
    name,
    email,
    brand:     brand || '—',
    goal:      goal  || '—',
  };

  // Log to Vercel function logs (visible in Vercel dashboard)
  console.log('New contact submission:', JSON.stringify(submission));

  // ─────────────────────────────────────────────────────────────
  // OPTIONAL: Send email via a service like Resend or Nodemailer
  // Uncomment and configure if you want email notifications:
  //
  // const { Resend } = require('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'website@the10xbrand.com',
  //   to: 'hello@the10xbrand.com',
  //   subject: `New enquiry from ${name}`,
  //   text: `Name: ${name}\nEmail: ${email}\nBrand: ${brand}\nGoal: ${goal}`,
  // });
  // ─────────────────────────────────────────────────────────────

  return res.status(200).json({
    success: true,
    message: "Thanks! We'll be in touch soon.",
  });
};
