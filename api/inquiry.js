// Vercel Serverless Function: RFQ Submission -> Supabase Sync & Dual Email Dispatch (Customer + Admin)
const { createClient } = require('@supabase/supabase-js');
const { dispatchInquiryEmails } = require('./lib/email');

// Initialize Supabase Client if environment variables exist
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Main Handler
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { inquiry, items, emailConfig, brevoConfig, businessProfile } = req.body || {};

    if (!inquiry || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid request: inquiry details and items array are required.' });
    }

    const inquiryId = inquiry.id || `inq-${Date.now()}`;
    const inquiryNumber = inquiry.inquiryNumber || inquiry.id || `INQ-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    let supabaseSynced = false;
    const supabase = getSupabaseClient();

    // 1. SUPABASE SYNC (Insert inquiry + line items if database configured)
    if (supabase) {
      try {
        const { error: inqErr } = await supabase.from('inquiries').upsert({
          id: inquiryId,
          inquiry_number: inquiryNumber,
          customer_name: inquiry.customerName || inquiry.contactPerson,
          company_name: inquiry.companyName,
          gstin: inquiry.gstin || inquiry.gstNumber,
          email: inquiry.email,
          phone: inquiry.phone,
          delivery_pincode: inquiry.deliveryPincode || inquiry.deliveryLocation,
          project_type: inquiry.projectType,
          notes: inquiry.notes,
          total_items: items.length,
          status: 'New'
        });

        if (inqErr) {
          console.error('Supabase Inquiries Insert Error:', inqErr);
        } else {
          // Insert line items
          const dbItems = items.map(item => ({
            inquiry_id: inquiryId,
            product_id: item.productId || null,
            variant_id: item.variantId || null,
            product_title: item.productName || item.title || 'Product',
            variant_name: item.variantName || null,
            sku: item.sku || null,
            quantity: item.quantity || 1,
            target_price: item.targetPrice ? Number(item.targetPrice) : null,
            notes: item.notes || null
          }));

          const { error: itemsErr } = await supabase.from('inquiry_items').insert(dbItems);
          if (itemsErr) console.error('Supabase Items Insert Error:', itemsErr);
          else supabaseSynced = true;
        }
      } catch (dbEx) {
        console.error('Supabase sync exception:', dbEx);
      }
    }

    // 2. DUAL EMAIL DISPATCH (Customer Confirmation + Admin Alert)
    const mergedConfig = {
      ...(brevoConfig || {}),
      ...(emailConfig || {})
    };

    const emailResults = await dispatchInquiryEmails({
      inquiry: { ...inquiry, inquiryId, inquiryNumber },
      items,
      config: mergedConfig,
      businessProfile: businessProfile || {}
    });

    console.log(`[Inquiry ${inquiryNumber}] Email Results:`, {
      customer: emailResults.customerEmail?.sent ? 'SENT' : (emailResults.customerEmail?.error || 'FAILED'),
      admin: emailResults.adminEmail?.sent ? 'SENT' : (emailResults.adminEmail?.error || 'FAILED'),
      adminRecipient: emailResults.adminRecipient,
      customerRecipient: emailResults.customerRecipient
    });

    return res.status(200).json({
      success: true,
      inquiryId: inquiryId,
      inquiryNumber: inquiryNumber,
      supabaseSynced: supabaseSynced,
      emailResults: emailResults,
      brevo: {
        customerEmail: emailResults.customerEmail,
        adminAlert: emailResults.adminEmail
      },
      message: 'Inquiry processed and dual email dispatch triggered.'
    });

  } catch (error) {
    console.error('Inquiry API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
