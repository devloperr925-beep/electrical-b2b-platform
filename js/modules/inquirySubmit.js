// ===================================================================
// APEX ELECTRO - MODULE: INQUIRY SUBMISSION (SUPABASE & BREVO SYNC)
// ===================================================================

const InquirySubmitModule = {
  openModal() {
    if (AppState.data.inquiryCart.length === 0) {
      DOMUtils.showToast('Please add at least one product to your inquiry list.', 'warning');
      return;
    }

    InquiryCartModule.toggleDrawer(false);
    const countEl = document.getElementById('inqFormItemsCount');
    const summaryEl = document.getElementById('inqFormItemsSummary');

    if (countEl) countEl.textContent = AppState.data.inquiryCart.length;

    if (summaryEl) {
      summaryEl.innerHTML = `
        <div style="background: #ffffff; border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 0.85rem; max-height: 180px; overflow-y: auto;">
          <table style="width: 100%; font-size: 0.775rem; border-collapse: collapse;">
            <tbody>
              ${AppState.data.inquiryCart.map(item => `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 0.4rem 0;">
                    <strong style="color: var(--text-main);">${item.productName}</strong><br>
                    <span style="color: #b45309; font-weight: 700;">${item.variantName}</span> (SKU: ${item.sku})
                    ${item.notes ? `<div style="font-style: italic; color: var(--text-dim); font-size: 0.7rem;">Note: ${item.notes}</div>` : ''}
                  </td>
                  <td style="text-align: right; font-weight: 800; color: var(--text-main); font-family: var(--font-mono); white-space: nowrap; padding-left: 1rem;">
                    ${item.quantity} ${item.unit}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    DOMUtils.openModal('inquirySubmitModal');
  },

  handleSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('inqFullName').value.trim();
    const mobile = document.getElementById('inqMobile').value.trim();
    const email = document.getElementById('inqEmail').value.trim();
    const company = document.getElementById('inqCompany').value.trim() || 'Direct Client';
    const designation = document.getElementById('inqDesignation').value.trim() || 'Procurement';
    const gstin = document.getElementById('inqGst').value.trim() || 'N/A';
    const deliveryDate = document.getElementById('inqDeliveryDate').value || 'Immediate';
    const billingAddress = document.getElementById('inqBillingAddress').value.trim() || 'Same as site address';
    const deliveryLocation = document.getElementById('inqDeliveryLocation').value.trim() || 'Customer Site';
    const message = document.getElementById('inqMessage').value.trim();

    const nextSeq = AppState.data.inquiries.length + 1;
    const newInquiryId = Formatters.generateInquiryNumber(nextSeq);

    const newInquiry = {
      id: newInquiryId,
      customer: {
        name,
        mobile,
        email,
        company,
        designation,
        gstin,
        billingAddress,
        deliveryLocation,
        preferredDeliveryDate: deliveryDate
      },
      items: JSON.parse(JSON.stringify(AppState.data.inquiryCart)),
      additionalMessage: message,
      status: 'New',
      quotationNumber: null,
      submittedAt: new Date().toISOString(),
      adminNotes: "Automated submission via public portal. Awaiting technical sales review."
    };

    AppState.data.inquiries.unshift(newInquiry);
    AppState.data.inquiryCart = [];
    AppState.save();

    InquiryCartModule.renderHeaderCount();
    DOMUtils.closeModal('inquirySubmitModal');
    this.openSuccessModal(newInquiry);

    // Asynchronous backend dispatch for Dual Email (Customer Confirmation + Store Admin Alert)
    const currentEmailConfig = AppState.data.emailConfig || AppState.data.brevoConfig || {};
    const adminOfficialEmail = AppState.data.businessProfile?.email;

    fetch(DOMUtils.getApiUrl('/api/inquiry'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inquiry: {
          id: newInquiryId,
          inquiryNumber: newInquiryId,
          customerName: name,
          contactPerson: name,
          companyName: company,
          gstin: gstin,
          email: email,
          phone: mobile,
          deliveryPincode: deliveryLocation,
          projectType: designation,
          notes: message
        },
        items: newInquiry.items,
        emailConfig: {
          ...currentEmailConfig,
          adminEmail: currentEmailConfig.adminEmail || adminOfficialEmail
        },
        brevoConfig: currentEmailConfig,
        businessProfile: AppState.data.businessProfile || {}
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.success) {
        const er = data.emailResults || {};
        const custSent = er.customerEmail && er.customerEmail.sent;
        const adminSent = er.adminEmail && er.adminEmail.sent;

        if (custSent && adminSent) {
          DOMUtils.showToast(`✓ Emails sent to both: Customer (${email}) & Admin (${er.adminRecipient || 'Owner'})!`, 'success');
        } else if (custSent) {
          DOMUtils.showToast(`✓ Confirmation email sent to ${email}`, 'success');
        } else if (adminSent) {
          DOMUtils.showToast(`✓ Admin alert email sent to ${er.adminRecipient}`, 'success');
        } else if (er.customerEmail?.error === 'NO_CONFIG') {
          DOMUtils.showToast('Inquiry saved! Please configure Gmail/Brevo in Admin Settings to enable automated emails.', 'info');
        }
      }
    })
    .catch((err) => {
      console.warn('API /api/inquiry note:', err);
    });
  },

  openSuccessModal(inquiry) {
    const modal = document.getElementById('inquirySuccessModal');
    const bodyEl = document.getElementById('inquirySuccessBody');
    AppState.data.lastSubmittedInquiry = inquiry;

    const bp = AppState.data.businessProfile || {};

    bodyEl.innerHTML = `
      <div style="text-align: center; padding: 1rem 0 1.25rem; border-bottom: 1px solid var(--border-medium); margin-bottom: 1.25rem;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: #dcfce7; color: #15803d; margin-bottom: 0.75rem;">
          <i data-lucide="check" style="width: 30px; height: 30px; stroke-width: 3;"></i>
        </div>
        <div style="font-size: 0.75rem; color: #166534; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800;">Official Material Requisition Dispatched</div>
        <h3 style="font-size: 1.4rem; color: var(--text-main); margin-top: 0.35rem; font-weight: 800;">RFQ Submission Confirmed</h3>
        
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: #fef3c7; border: 1px solid #fde68a; border-radius: var(--radius-md); padding: 0.45rem 1rem; margin-top: 0.65rem;">
          <span style="font-size: 0.75rem; color: #92400e; font-weight: 700; text-transform: uppercase;">RFQ Reference ID:</span>
          <span style="font-family: var(--font-mono); font-size: 1.15rem; font-weight: 800; color: #b45309; letter-spacing: 0.05em;">${inquiry.id}</span>
        </div>

        <p style="font-size: 0.875rem; color: var(--text-muted); max-width: 520px; margin: 0.75rem auto 0; line-height: 1.5;">
          Thank you, <strong>${inquiry.customer.name}</strong> (${inquiry.customer.company}). Our technical sales & dispatch desk at <strong>${bp.name || 'Apex Electro'}</strong> has received your material inquiry and is reviewing ex-stock availability.
        </p>
      </div>

      <!-- Customer Summary & Requisition Details -->
      <div style="background: var(--surface-secondary, #fafaf9); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 0.9rem; margin-bottom: 1.2rem;">
        <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 0.5rem;">
          Requisition Details & Delivery Destination
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; font-size: 0.825rem; color: var(--text-main);">
          <div>
            <span style="color: var(--text-muted);">Client / Buyer:</span><br>
            <strong>${inquiry.customer.name}</strong> (${inquiry.customer.company})
          </div>
          <div>
            <span style="color: var(--text-muted);">Contact:</span><br>
            <strong>${inquiry.customer.mobile}</strong> &bull; ${inquiry.customer.email}
          </div>
          <div>
            <span style="color: var(--text-muted);">Project Delivery Site:</span><br>
            <strong>${inquiry.customer.deliveryLocation}</strong>
          </div>
          <div>
            <span style="color: var(--text-muted);">GSTIN:</span><br>
            <strong>${inquiry.customer.gstin || 'N/A'}</strong>
          </div>
        </div>
      </div>

      <!-- Itemized Requisition List -->
      <div style="margin-bottom: 1.2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">
            Requested Material List (${inquiry.items.length} ${inquiry.items.length === 1 ? 'Product' : 'Products'})
          </div>
          <span style="font-size: 0.75rem; color: #16a34a; font-weight: 700;">Status: Commercial Review</span>
        </div>
        <div style="max-height: 170px; overflow-y: auto; border: 1px solid var(--border-medium); border-radius: var(--radius-md);">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; background: #ffffff;">
            <thead>
              <tr style="background: #f5f5f4; border-bottom: 1px solid var(--border-medium); text-align: left; color: var(--text-muted);">
                <th style="padding: 0.45rem 0.75rem;">Material Description</th>
                <th style="padding: 0.45rem 0.75rem;">Variant / SKU</th>
                <th style="padding: 0.45rem 0.75rem; text-align: right;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${inquiry.items.map(it => `
                <tr style="border-bottom: 1px solid var(--border-subtle, #f0eeee);">
                  <td style="padding: 0.5rem 0.75rem; font-weight: 600; color: var(--text-main);">${it.productName}</td>
                  <td style="padding: 0.5rem 0.75rem; color: #b45309; font-weight: 700;">${it.variantName} <span style="color: var(--text-dim); font-weight: normal; font-size: 0.725rem;">(${it.sku})</span></td>
                  <td style="padding: 0.5rem 0.75rem; text-align: right; font-weight: 800; font-family: var(--font-mono);">${it.quantity} ${it.unit}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Commercial Assurance Notice -->
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-md); padding: 0.8rem 1rem; display: flex; align-items: flex-start; gap: 0.75rem;">
        <i data-lucide="mail-check" style="color: #2563eb; width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px;"></i>
        <div style="font-size: 0.825rem; color: #1e3a8a; line-height: 1.45;">
          <strong>Dual Notification Dispatched:</strong> Quotation Request confirmation is sent to your email <strong>${inquiry.customer.email}</strong>, and an urgent purchase alert with your material breakdown has been notified to our central sales desk (<strong>${bp.email || 'Admin'}</strong>).
        </div>
      </div>
    `;

    DOMUtils.openModal('inquirySuccessModal');
    DOMUtils.refreshIcons();
  },

  switchEmailTab(tab) {
    // Deprecated tab switcher
  }
};

window.InquirySubmitModule = InquirySubmitModule;
