const nodemailer = require('nodemailer');

// Build Customer Confirmation Email HTML
function buildCustomerEmailHtml(inquiry, items, profile = {}) {
  const companyTitle = profile.name || 'Apex Electro Supplies & Switchgear Pvt. Ltd.';
  const hotline = profile.phone || '+91 98201 44520';
  const supportEmail = profile.email || 'procurement@apexelectro.in';
  const itemsList = Array.isArray(items) ? items : [];

  const itemsRows = itemsList.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e9decb;">
      <td style="padding: 10px 12px; font-size: 13px; color: #1c1917; text-align: center;">${idx + 1}</td>
      <td style="padding: 10px 12px; font-size: 13px; color: #1c1917;">
        <strong style="color: #1c1917;">${item.productName || item.title || 'Industrial Electrical Product'}</strong><br/>
        <span style="font-size: 12px; color: #b45309; font-weight: 600;">${item.variantName || 'Standard Variant'}</span>
        ${item.sku ? `<span style="font-size: 11px; color: #78716c; font-family: monospace;"> (SKU: ${item.sku})</span>` : ''}
        ${item.notes ? `<div style="font-size: 11px; color: #57534e; margin-top: 2px;"><em>Note: ${item.notes}</em></div>` : ''}
      </td>
      <td style="padding: 10px 12px; font-size: 13px; color: #1c1917; text-align: center; font-weight: bold;">
        ${item.quantity || 1} ${item.unit || 'Units'}
      </td>
      <td style="padding: 10px 12px; font-size: 13px; color: #1c1917; text-align: right;">
        ${item.targetPrice ? `₹${Number(item.targetPrice).toLocaleString('en-IN')}` : 'Market B2B Best'}
      </td>
    </tr>
  `).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Inquiry Confirmation</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #fbf9f5; font-family: 'Segoe UI', Arial, sans-serif; color: #1c1917;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fbf9f5; padding: 30px 15px;">
      <tr>
        <td align="center">
          <table width="620" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #d8c8b0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
            
            <!-- Header Banner -->
            <tr>
              <td style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 25px 30px; text-align: left; border-bottom: 3px solid #d97706;">
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                  Apex<span style="color: #fbbf24;">Electro</span>
                </h1>
                <p style="margin: 4px 0 0 0; color: #d6d3d1; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                  Industrial Electrical Supplies & Switchgear Procurement
                </p>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding: 30px 30px 20px 30px;">
                <h2 style="margin: 0 0 10px 0; color: #1c1917; font-size: 18px; font-weight: 700;">
                  Quotation Request Received (RFQ Confirmed)
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #57534e; line-height: 1.6;">
                  Dear <strong>${inquiry.customerName || inquiry.contactPerson || 'Procurement Executive'}</strong>,<br/>
                  Thank you for submitting your procurement requirement to ${companyTitle}. Our technical estimation and dispatch desk has logged your request and started reviewing ex-stock availability.
                </p>

                <!-- Token Pill -->
                <div style="background-color: #fef3c7; border: 1.5px dashed #b45309; border-radius: 8px; padding: 14px 20px; text-align: center; margin-bottom: 25px;">
                  <span style="display: block; font-size: 11px; text-transform: uppercase; color: #92400e; font-weight: 700; letter-spacing: 1px;">Your Official RFQ Reference Number</span>
                  <strong style="display: block; font-size: 22px; color: #b45309; font-family: monospace; margin-top: 4px;">${inquiry.inquiryNumber}</strong>
                  <span style="display: block; font-size: 12px; color: #78350f; margin-top: 4px;">Estimated quotation turnaround: Within 2 to 4 business hours</span>
                </div>

                <!-- Procurement Specs Summary -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; font-size: 13px; color: #57534e; background: #faf8f5; border: 1px solid #ebdcc6; border-radius: 6px; padding: 10px 14px;">
                  <tr>
                    <td style="padding: 4px 8px;"><strong>Company:</strong> ${inquiry.companyName || 'Direct Requisition'}</td>
                    <td style="padding: 4px 8px;"><strong>Project / Role:</strong> ${inquiry.projectType || 'Procurement'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px;"><strong>GSTIN:</strong> ${inquiry.gstin || inquiry.gstNumber || 'Not Provided / Retail'}</td>
                    <td style="padding: 4px 8px;"><strong>Site / Pincode:</strong> ${inquiry.deliveryPincode || inquiry.deliveryLocation || 'Customer Site'}</td>
                  </tr>
                </table>

                <!-- Requested Items Table -->
                <h3 style="margin: 20px 0 10px 0; font-size: 14px; text-transform: uppercase; color: #1c1917; letter-spacing: 0.5px;">
                  Requested Material Breakdown (${itemsList.length} line items)
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #e9decb; border-radius: 6px; overflow: hidden; margin-bottom: 25px;">
                  <thead>
                    <tr style="background-color: #f4ece1; text-align: left;">
                      <th style="padding: 10px 12px; font-size: 12px; color: #78350f; text-align: center;">#</th>
                      <th style="padding: 10px 12px; font-size: 12px; color: #78350f;">Item & Specifications</th>
                      <th style="padding: 10px 12px; font-size: 12px; color: #78350f; text-align: center;">Qty</th>
                      <th style="padding: 10px 12px; font-size: 12px; color: #78350f; text-align: right;">Target Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsRows}
                  </tbody>
                </table>

                ${inquiry.notes ? `
                  <div style="background-color: #f5f5f4; border-left: 3px solid #b45309; padding: 10px 15px; margin-bottom: 20px; font-size: 12px; color: #44403c;">
                    <strong>Special Instructions / Delivery Notes:</strong><br/>
                    ${inquiry.notes}
                  </div>
                ` : ''}

                <p style="margin: 20px 0 0 0; font-size: 13px; color: #78716c; line-height: 1.5;">
                  Our sales engineer will prepare a formal GST-compliant proforma quotation with volume slabs and freight timelines. For urgent priority dispatch, reach our desk directly at <strong>${hotline}</strong> or email <strong>${supportEmail}</strong>.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f8f6f0; border-top: 1px solid #e9decb; padding: 20px 30px; text-align: center; font-size: 11px; color: #78716c;">
                ${companyTitle}<br/>
                MIDC Industrial Zone, Mumbai, MH | Authorized B2B Electrical Distributor
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

// Build Admin Alert Email HTML
function buildAdminAlertEmailHtml(inquiry, items, siteUrl = 'http://localhost:3000') {
  const itemsList = Array.isArray(items) ? items : [];

  const itemsRows = itemsList.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 8px 10px; font-size: 13px; color: #334155; text-align: center;">${idx + 1}</td>
      <td style="padding: 8px 10px; font-size: 13px; color: #0f172a;">
        <strong>${item.productName || item.title || 'Item'}</strong><br/>
        <span style="color: #b45309; font-weight: 600; font-size: 12px;">${item.variantName || 'Standard'}</span>
        ${item.sku ? `<span style="color: #64748b; font-size: 11px; font-family: monospace;"> (${item.sku})</span>` : ''}
        ${item.notes ? `<div style="color: #475569; font-size: 11px;"><em>Note: ${item.notes}</em></div>` : ''}
      </td>
      <td style="padding: 8px 10px; font-size: 13px; font-weight: bold; color: #0f172a; text-align: center;">
        ${item.quantity || 1} ${item.unit || 'Units'}
      </td>
      <td style="padding: 8px 10px; font-size: 13px; color: #475569; text-align: right;">
        ${item.targetPrice ? `₹${Number(item.targetPrice).toLocaleString('en-IN')}` : 'Market B2B'}
      </td>
    </tr>
  `).join('');

  const phone = inquiry.phone || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin: 0; padding: 0; background: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b;">
    <div style="max-width: 650px; margin: 25px auto; background: #ffffff; border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      
      <!-- Top Alert Bar -->
      <div style="background: linear-gradient(135deg, #b45309 0%, #d97706 100%); padding: 18px 24px; color: #ffffff;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #fef3c7;">
          ⚡ Urgent Storefront Alert
        </div>
        <h2 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">
          New RFQ Inquiry: ${inquiry.inquiryNumber}
        </h2>
      </div>

      <!-- Main Container -->
      <div style="padding: 24px;">
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.5;">
          A customer has just submitted a purchase quotation request on your B2B storefront. Details below:
        </p>

        <!-- Customer Card -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px;">
            👤 Client / Buyer Details
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.6;">
            <tr>
              <td width="50%" style="padding: 3px 0;"><strong>Name:</strong> ${inquiry.customerName || inquiry.contactPerson}</td>
              <td width="50%" style="padding: 3px 0;"><strong>Company:</strong> ${inquiry.companyName || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0;"><strong>Email:</strong> <a href="mailto:${inquiry.email}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${inquiry.email}</a></td>
              <td style="padding: 3px 0;"><strong>Phone:</strong> <a href="tel:${phone}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 3px 0;"><strong>GSTIN:</strong> ${inquiry.gstin || inquiry.gstNumber || 'Unregistered'}</td>
              <td style="padding: 3px 0;"><strong>Role / Project:</strong> ${inquiry.projectType || 'Procurement'}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 3px 0;"><strong>Delivery Site / Address:</strong> ${inquiry.deliveryPincode || inquiry.deliveryLocation || 'Customer Address'}</td>
            </tr>
          </table>
        </div>

        <!-- Material Items Table -->
        <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px;">
          📦 Requested Materials (${itemsList.length} items)
        </h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left; color: #475569; font-size: 12px;">
              <th style="padding: 8px 10px; text-align: center;">#</th>
              <th style="padding: 8px 10px;">Product & Variant</th>
              <th style="padding: 8px 10px; text-align: center;">Quantity</th>
              <th style="padding: 8px 10px; text-align: right;">Target Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        ${inquiry.notes ? `
          <div style="background: #fffbeb; border-left: 4px solid #d97706; padding: 12px 14px; margin-bottom: 20px; font-size: 13px; color: #78350f;">
            <strong>Customer Technical Notes / Requirements:</strong><br/>
            ${inquiry.notes}
          </div>
        ` : ''}

        <!-- Quick Action Buttons -->
        <div style="margin-top: 24px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <a href="${siteUrl}" style="background: #b45309; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block; margin-right: 8px; margin-bottom: 8px;">
            Open Admin Portal to Issue Quote →
          </a>
          ${phone ? `
            <a href="https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(inquiry.customerName || '')},%20we%20received%20your%20RFQ%20${inquiry.inquiryNumber}%20at%20Apex%20Electro." style="background: #16a34a; color: #ffffff; text-decoration: none; padding: 11px 20px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block; margin-right: 8px; margin-bottom: 8px;">
              WhatsApp Customer
            </a>
          ` : ''}
          <a href="mailto:${inquiry.email}?subject=Regarding%20Quotation%20RFQ%20${inquiry.inquiryNumber}" style="background: #0284c7; color: #ffffff; text-decoration: none; padding: 11px 20px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block; margin-bottom: 8px;">
            Email Customer
          </a>
        </div>

      </div>

      <!-- Footer -->
      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
        Automated RFQ Notification System &bull; Apex Electro Platform
      </div>

    </div>
  </body>
  </html>
  `;
}

// Universal Sender: Sends via Gmail SMTP (Nodemailer) or Brevo API fallback
async function sendEmail({ to, toName, subject, htmlContent, config = {} }) {
  if (!to || !to.trim()) {
    return { sent: false, error: 'Recipient email is missing' };
  }

  const effectiveTo = to.trim();
  const gmailUser = (config.gmailUser && config.gmailUser.trim()) || process.env.GMAIL_USER || (config.smtpUser && config.smtpUser.trim()) || process.env.SMTP_USER;
  const gmailPass = (config.gmailAppPassword && config.gmailAppPassword.trim()) || process.env.GMAIL_APP_PASSWORD || (config.smtpPass && config.smtpPass.trim()) || process.env.SMTP_PASS;
  const senderName = (config.senderName && config.senderName.trim()) || process.env.BREVO_SENDER_NAME || 'Apex Electro B2B Procurement';

  // 1. GMAIL SMTP DISPATCH (Primary / User Choice)
  if (gmailUser && gmailPass) {
    try {
      const cleanPass = gmailPass.replace(/\s+/g, '');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: cleanPass
        }
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${gmailUser}>`,
        to: toName ? `"${toName}" <${effectiveTo}>` : effectiveTo,
        subject: subject,
        html: htmlContent
      });

      return {
        sent: true,
        provider: 'gmail_smtp',
        messageId: info.messageId,
        recipient: effectiveTo
      };
    } catch (err) {
      console.error('Gmail SMTP Dispatch Error:', err.message);
      return {
        sent: false,
        provider: 'gmail_smtp',
        error: err.message,
        recipient: effectiveTo
      };
    }
  }

  // 2. BREVO REST API (Fallback / Secondary)
  const brevoApiKey = (config.apiKey && config.apiKey.trim()) || (config.brevoApiKey && config.brevoApiKey.trim()) || process.env.BREVO_API_KEY;
  const brevoSender = (config.senderEmail && config.senderEmail.trim()) || (config.brevoSenderEmail && config.brevoSenderEmail.trim()) || process.env.BREVO_SENDER_EMAIL;

  if (brevoApiKey && brevoSender) {
    try {
      const payload = {
        sender: { name: senderName, email: brevoSender },
        to: [{ email: effectiveTo, name: toName || effectiveTo }],
        subject: subject,
        htmlContent: htmlContent
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          sent: false,
          provider: 'brevo_api',
          error: errText,
          recipient: effectiveTo
        };
      }

      const data = await response.json();
      return {
        sent: true,
        provider: 'brevo_api',
        messageId: data.messageId,
        recipient: effectiveTo
      };
    } catch (err) {
      return {
        sent: false,
        provider: 'brevo_api',
        error: err.message,
        recipient: effectiveTo
      };
    }
  }

  return {
    sent: false,
    error: 'NO_CONFIG',
    message: 'No email service configured. Please provide Gmail user & App Password or Brevo API key.'
  };
}

// Master Dispatcher: Sends to BOTH Customer and Admin
async function dispatchInquiryEmails({ inquiry, items, config = {}, businessProfile = {} }) {
  const customerEmail = inquiry.email;
  const adminEmail = (config.adminNotificationEmail && config.adminNotificationEmail.trim()) ||
                     (config.adminEmail && config.adminEmail.trim()) ||
                     (inquiry.adminEmail && inquiry.adminEmail.trim()) ||
                     process.env.ADMIN_NOTIFICATION_EMAIL ||
                     (businessProfile && businessProfile.email) ||
                     (config.gmailUser && config.gmailUser.trim()) ||
                     process.env.GMAIL_USER ||
                     'admin@apexelectro.in';

  const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

  const customerHtml = buildCustomerEmailHtml(inquiry, items, businessProfile);
  const adminHtml = buildAdminAlertEmailHtml(inquiry, items, siteUrl);

  const customerSubject = `Quotation Request Confirmed [${inquiry.inquiryNumber}] | Apex Electro Supplies`;
  const adminSubject = `⚡ [New RFQ Alert] ${inquiry.inquiryNumber} from ${inquiry.companyName || inquiry.customerName}`;

  // Execute both dispatches simultaneously
  const [customerResult, adminResult] = await Promise.all([
    customerEmail ? sendEmail({
      to: customerEmail,
      toName: inquiry.customerName || inquiry.companyName,
      subject: customerSubject,
      htmlContent: customerHtml,
      config
    }) : Promise.resolve({ sent: false, error: 'Customer email missing' }),

    adminEmail ? sendEmail({
      to: adminEmail,
      toName: 'Store Admin',
      subject: adminSubject,
      htmlContent: adminHtml,
      config
    }) : Promise.resolve({ sent: false, error: 'Admin email missing' })
  ]);

  return {
    customerEmail: customerResult,
    adminEmail: adminResult,
    adminRecipient: adminEmail,
    customerRecipient: customerEmail
  };
}

module.exports = {
  sendEmail,
  dispatchInquiryEmails,
  buildCustomerEmailHtml,
  buildAdminAlertEmailHtml
};
