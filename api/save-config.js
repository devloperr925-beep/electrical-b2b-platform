// API Endpoint to save environment configuration (.env)
const fs = require('fs');
const path = require('path');

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
      adminNotificationEmail,
      brevoApiKey,
      brevoSenderEmail,
      brevoSenderName,
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceRoleKey,
      siteUrl
    } = req.body || {};

    const envPath = path.resolve(__dirname, '..', '.env');
    let existingEnv = {};

    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      lines.forEach(l => {
        const parts = l.split('=');
        if (parts.length >= 2 && !parts[0].trim().startsWith('#')) {
          existingEnv[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
      });
    }

    // Gmail SMTP credentials
    if (gmailUser !== undefined) existingEnv['GMAIL_USER'] = gmailUser.trim();
    if (gmailAppPassword !== undefined) existingEnv['GMAIL_APP_PASSWORD'] = gmailAppPassword.replace(/\s+/g, '').trim();
    if (adminNotificationEmail !== undefined) existingEnv['ADMIN_NOTIFICATION_EMAIL'] = adminNotificationEmail.trim();

    // Brevo credentials (optional/alternative)
    if (brevoApiKey !== undefined) existingEnv['BREVO_API_KEY'] = brevoApiKey.trim();
    if (brevoSenderEmail !== undefined) existingEnv['BREVO_SENDER_EMAIL'] = brevoSenderEmail.trim();
    if (brevoSenderName !== undefined) existingEnv['BREVO_SENDER_NAME'] = brevoSenderName.trim();

    // Supabase credentials
    if (supabaseUrl !== undefined) existingEnv['SUPABASE_URL'] = supabaseUrl.trim();
    if (supabaseAnonKey !== undefined) existingEnv['SUPABASE_ANON_KEY'] = supabaseAnonKey.trim();
    if (supabaseServiceRoleKey !== undefined) existingEnv['SUPABASE_SERVICE_ROLE_KEY'] = supabaseServiceRoleKey.trim();
    if (siteUrl !== undefined) existingEnv['SITE_URL'] = siteUrl.trim();

    // Update running process.env immediately
    Object.keys(existingEnv).forEach(k => {
      process.env[k] = existingEnv[k];
    });

    // Write to .env
    const content = [
      '# ===================================================================',
      '# APEX ELECTRO B2B PLATFORM - ENVIRONMENT CONFIGURATION',
      '# ===================================================================',
      '',
      '# 1. GMAIL SMTP (Transactional Email Dispatch to Customer & Admin)',
      `GMAIL_USER=${existingEnv['GMAIL_USER'] || ''}`,
      `GMAIL_APP_PASSWORD=${existingEnv['GMAIL_APP_PASSWORD'] || ''}`,
      `ADMIN_NOTIFICATION_EMAIL=${existingEnv['ADMIN_NOTIFICATION_EMAIL'] || existingEnv['GMAIL_USER'] || ''}`,
      '',
      '# 2. BREVO (SENDINBLUE) FALLBACK SERVICE',
      `BREVO_API_KEY=${existingEnv['BREVO_API_KEY'] || ''}`,
      `BREVO_SENDER_EMAIL=${existingEnv['BREVO_SENDER_EMAIL'] || ''}`,
      `BREVO_SENDER_NAME=${existingEnv['BREVO_SENDER_NAME'] || 'Apex Electro B2B Procurement'}`,
      '',
      '# 3. SUPABASE DATABASE (Optional)',
      `SUPABASE_URL=${existingEnv['SUPABASE_URL'] || ''}`,
      `SUPABASE_ANON_KEY=${existingEnv['SUPABASE_ANON_KEY'] || ''}`,
      `SUPABASE_SERVICE_ROLE_KEY=${existingEnv['SUPABASE_SERVICE_ROLE_KEY'] || ''}`,
      '',
      '# 4. APPLICATION DOMAIN',
      `SITE_URL=${existingEnv['SITE_URL'] || 'http://localhost:3000'}`,
      ''
    ].join('\n');

    try {
      fs.writeFileSync(envPath, content, 'utf8');
    } catch (fsErr) {
      console.warn('Filesystem read-only (serverless host):', fsErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Configuration saved successfully and loaded into runtime memory!',
      configured: {
        gmail: Boolean(existingEnv['GMAIL_USER'] && existingEnv['GMAIL_APP_PASSWORD']),
        adminEmail: existingEnv['ADMIN_NOTIFICATION_EMAIL'] || existingEnv['GMAIL_USER'],
        brevo: Boolean(existingEnv['BREVO_API_KEY'])
      }
    });
  } catch (err) {
    console.error('Error saving .env:', err);
    return res.status(500).json({ error: err.message });
  }
};
