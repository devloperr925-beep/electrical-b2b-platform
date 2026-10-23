// Vercel Serverless Function: Contact Form Submission -> Supabase + Brevo Alert
const { createClient } = require('@supabase/supabase-js');

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { name, email, phone, subject, message, brevoConfig } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    // 1. Supabase sync
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('contact_messages').insert({
        name,
        email,
        phone: phone || '',
        subject: subject || 'Storefront Inquiry',
        message,
        status: 'Unread'
      });
    }

    // 2. Email Admin Alert (Gmail SMTP or Brevo)
    const { sendEmail } = require('./lib/email');
    const adminEmail = (req.body.emailConfig && req.body.emailConfig.adminNotificationEmail) ||
                       (brevoConfig && brevoConfig.adminNotificationEmail) ||
                       process.env.ADMIN_NOTIFICATION_EMAIL ||
                       process.env.GMAIL_USER ||
                       'admin@apexelectro.in';

    await sendEmail({
      to: adminEmail,
      toName: 'Store Admin',
      subject: `📩 [New Message] ${subject || 'Storefront Contact'} from ${name}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #d8c8b0; border-radius: 8px;">
          <h3 style="color: #b45309; margin-top: 0;">New Customer Contact Message</h3>
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Subject:</strong> ${subject || 'General'}</p>
          <div style="background: #fdfaf5; padding: 15px; border-radius: 6px; border: 1px solid #e9decb; margin-top: 10px;">
            ${(message || '').replace(/\n/g, '<br/>')}
          </div>
        </div>
      `,
      config: {
        ...(brevoConfig || {}),
        ...(req.body.emailConfig || {})
      }
    });

    return res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
