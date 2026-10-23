// Vercel Serverless Function: System Health & Configuration Check
module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseConfigured = Boolean(
    process.env.SUPABASE_URL && 
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
  );

  const gmailConfigured = Boolean(
    process.env.GMAIL_USER && 
    process.env.GMAIL_APP_PASSWORD
  );

  const brevoConfigured = Boolean(
    process.env.BREVO_API_KEY && 
    process.env.BREVO_SENDER_EMAIL
  );

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Apex Electro B2B Procurement API',
    integrations: {
      gmail: {
        configured: gmailConfigured,
        user: process.env.GMAIL_USER ? process.env.GMAIL_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'Not Configured'
      },
      brevo: {
        configured: brevoConfigured,
        senderEmail: process.env.BREVO_SENDER_EMAIL || 'Not Configured'
      },
      adminNotification: {
        email: process.env.ADMIN_NOTIFICATION_EMAIL || process.env.GMAIL_USER || 'Not Configured'
      },
      supabase: {
        configured: supabaseConfigured,
        url: process.env.SUPABASE_URL ? 'Connected' : 'Missing (Optional)'
      }
    }
  });
};
