// API Endpoint: Live verification and test email dispatch for Gmail SMTP / Brevo
const { sendEmail } = require('./lib/email');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const {
      gmailUser,
      gmailAppPassword,
      testRecipient,
      senderName,
      provider = 'gmail'
    } = req.body || {};

    const effectiveRecipient = (testRecipient && testRecipient.trim()) ||
                               (gmailUser && gmailUser.trim()) ||
                               process.env.ADMIN_NOTIFICATION_EMAIL ||
                               process.env.GMAIL_USER;

    if (!effectiveRecipient) {
      return res.status(400).json({ error: 'Please enter a test recipient email address.' });
    }

    const testSubject = '✅ [Test Verification] Apex Electro Email System Active!';
    const testHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #d8c8b0; border-radius: 10px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 20px 24px; border-bottom: 3px solid #d97706;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Apex<span style="color: #fbbf24;">Electro</span> Supplies</h2>
          <div style="color: #d6d3d1; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px;">B2B Electrical Procurement Notification Desk</div>
        </div>

        <div style="padding: 24px;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
            <strong style="color: #15803d; font-size: 16px;">✓ Connection Test Successful!</strong>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #166534; line-height: 1.5;">
              Aapka email notification connection live ho chuka hai.
            </p>
          </div>

          <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            Ab jab bhi koi customer aapki website par RFQ inquiry dale ga:
          </p>
          <ul style="font-size: 13px; color: #334155; line-height: 1.8;">
            <li><strong>Customer ke paas:</strong> Official Quotation Request Confirmation Token & Itemized List jayegi.</li>
            <li><strong>Aapke paas (Admin Desk):</strong> Instant purchase alert with customer phone, GST, site location & material list aayegi.</li>
          </ul>

          <div style="font-size: 11px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center;">
            Dispatched via ${provider === 'gmail' ? 'Gmail SMTP (Nodemailer)' : 'Email API'} on ${new Date().toLocaleString('en-IN')}.
          </div>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: effectiveRecipient,
      toName: 'Store Admin',
      subject: testSubject,
      htmlContent: testHtml,
      config: {
        gmailUser,
        gmailAppPassword,
        senderName
      }
    });

    if (!result.sent) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to send test email. Check your Gmail address and 16-character App Password.'
      });
    }

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
      recipient: effectiveRecipient,
      provider: result.provider,
      message: `Test email successfully sent to ${effectiveRecipient}!`
    });

  } catch (err) {
    console.error('Test Email API Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
