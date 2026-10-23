// ===================================================================
// APEX ELECTRO - MODULE: CLOUD SERVICES & EMAIL INTEGRATION DISPATCHER
// ===================================================================

const CloudServicesModule = {
  checkHealth() {
    const box = document.getElementById('cloudHealthStatusBox');
    if (!box) return;

    box.style.display = 'block';
    box.innerHTML = `<div style="color: var(--text-muted);"><i data-lucide="loader" style="width: 14px; height: 14px; animation: spin 1s linear infinite;"></i> Checking API endpoints (/api/health)...</div>`;
    DOMUtils.refreshIcons();

    fetch(DOMUtils.getApiUrl('/api/health'))
      .then(r => r.json())
      .then(data => {
        const gmailOk = data.integrations?.gmail?.configured;
        const brevoOk = data.integrations?.brevo?.configured;
        const adminEmail = data.integrations?.adminNotification?.email || 'Not Configured';

        box.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            <div style="font-weight: 800; color: #15803d; display: flex; align-items: center; gap: 0.4rem;">
              <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
              Backend API Server Online (${data.service})
            </div>
            <div style="font-size: 0.8rem; color: #44403c; line-height: 1.6;">
              • <strong>Gmail SMTP Dispatch:</strong> ${gmailOk ? '<span style="color: #15803d; font-weight: bold;">Active ✓ (' + data.integrations.gmail.user + ')</span>' : '<span style="color: #d97706; font-weight: bold;">Not Configured (Enter Gmail credentials below)</span>'}<br/>
              • <strong>Inquiry Alert Destination (Mere Pe):</strong> <span style="color: #0369a1; font-weight: bold;">${adminEmail}</span><br/>
              • <strong>Brevo (Alternative Engine):</strong> ${brevoOk ? '<span style="color: #15803d; font-weight: bold;">Configured ✓</span>' : '<span style="color: #78716c;">Standby / Optional</span>'}<br/>
              • <strong>Customer Delivery:</strong> <span style="color: #15803d; font-weight: bold;">Automated confirmation dispatched to buyer email upon RFQ submit</span>
            </div>
          </div>
        `;
        DOMUtils.refreshIcons();
      })
      .catch((err) => {
        box.innerHTML = `
          <div style="color: #dc2626; line-height: 1.5;">
            <strong>⚠️ API Server Connection Notice:</strong><br/>
            ${err.message || 'Unable to connect to /api/health. Ensure local server is running (npm start).'}
          </div>
        `;
      });
  },

  async handleSaveAndTestEmail(event) {
    if (event) event.preventDefault();
    const btn = document.getElementById('btnSaveTestEmail') || document.getElementById('btnSaveTestBrevo');
    const msg = document.getElementById('emailTestResultMsg') || document.getElementById('brevoTestResultMsg');

    const gmailUser = document.getElementById('cfgGmailUser')?.value.trim();
    const gmailAppPassword = document.getElementById('cfgGmailPassword')?.value.trim();
    const adminEmail = document.getElementById('cfgAdminEmail')?.value.trim() || AppState.data.businessProfile?.email;
    const senderName = document.getElementById('cfgSenderName')?.value.trim() || 'Apex Electro B2B Procurement';
    const brevoKey = document.getElementById('cfgBrevoKey')?.value.trim();
    const brevoSender = document.getElementById('cfgBrevoSender')?.value.trim();

    if (!gmailUser && !brevoKey) {
      DOMUtils.showToast('Please enter your Gmail address and 16-character App Password (or Brevo API Key).', 'warning');
      return;
    }

    if (gmailUser && !gmailAppPassword) {
      DOMUtils.showToast('Please enter your 16-character Google App Password.', 'warning');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader" style="width: 16px; height: 16px; animation: spin 1s linear infinite;"></i> Testing Connection...`;
    }
    if (msg) {
      msg.style.display = 'inline-block';
      msg.style.color = '#78716c';
      msg.textContent = 'Connecting to mail server...';
    }

    try {
      // 1. Update client-side AppState
      AppState.data.emailConfig = {
        gmailUser,
        gmailAppPassword,
        adminEmail: adminEmail || gmailUser,
        senderName,
        brevoApiKey: brevoKey,
        brevoSenderEmail: brevoSender
      };
      // Keep backward compatible brevoConfig
      AppState.data.brevoConfig = {
        apiKey: brevoKey,
        senderEmail: brevoSender,
        adminNotificationEmail: adminEmail || gmailUser
      };
      AppState.save();

      // 2. Persist to server (.env and process.env)
      const saveRes = await fetch(DOMUtils.getApiUrl('/api/save-config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmailUser,
          gmailAppPassword,
          adminNotificationEmail: adminEmail || gmailUser,
          brevoApiKey: brevoKey,
          brevoSenderEmail: brevoSender,
          brevoSenderName: senderName
        })
      });
      const saveJson = await saveRes.json();
      if (!saveJson.success) {
        throw new Error(saveJson.error || 'Failed to save configuration to backend');
      }

      // 3. Dispatch Live Test Email
      const testRes = await fetch(DOMUtils.getApiUrl('/api/test-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmailUser,
          gmailAppPassword,
          senderName,
          testRecipient: adminEmail || gmailUser,
          provider: gmailUser ? 'gmail' : 'brevo'
        })
      });
      const testJson = await testRes.json();

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="send" style="width: 16px; height: 16px;"></i> Save & Send Live Test Email`;
      }

      if (testJson.success) {
        DOMUtils.showToast(`✓ Email system verified! Test email sent to ${adminEmail || gmailUser}`, 'success');
        if (msg) {
          msg.style.display = 'inline-block';
          msg.style.color = '#15803d';
          msg.innerHTML = `✓ Active! Test email sent to <strong>${adminEmail || gmailUser}</strong>. Check inbox/spam.`;
        }
        this.checkHealth();
      } else {
        DOMUtils.showToast(`Mail Error: ${testJson.error || 'Authentication failed'}`, 'error');
        if (msg) {
          msg.style.display = 'inline-block';
          msg.style.color = '#dc2626';
          msg.textContent = `❌ ${testJson.error}`;
        }
      }
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="send" style="width: 16px; height: 16px;"></i> Save & Send Live Test Email`;
      }
      DOMUtils.showToast(`Error: ${err.message}`, 'error');
      if (msg) {
        msg.style.display = 'inline-block';
        msg.style.color = '#dc2626';
        msg.textContent = `❌ ${err.message}`;
      }
    }

    DOMUtils.refreshIcons();
  },

  // Backward compatibility alias
  handleBrevoSaveAndTest(event) {
    return this.handleSaveAndTestEmail(event);
  },

  loadEmailConfigUI() {
    const cfg = AppState.data.emailConfig || AppState.data.brevoConfig || {};
    const bp = AppState.data.businessProfile || {};

    const gmailUserInput = document.getElementById('cfgGmailUser');
    const gmailPassInput = document.getElementById('cfgGmailPassword');
    const adminInput = document.getElementById('cfgAdminEmail');
    const senderNameInput = document.getElementById('cfgSenderName');
    const brevoKeyInput = document.getElementById('cfgBrevoKey');
    const brevoSenderInput = document.getElementById('cfgBrevoSender');

    if (gmailUserInput && cfg.gmailUser) gmailUserInput.value = cfg.gmailUser;
    if (gmailPassInput && cfg.gmailAppPassword) gmailPassInput.value = cfg.gmailAppPassword;
    if (adminInput) adminInput.value = cfg.adminEmail || cfg.adminNotificationEmail || bp.email || '';
    if (senderNameInput && cfg.senderName) senderNameInput.value = cfg.senderName;
    if (brevoKeyInput && (cfg.apiKey || cfg.brevoApiKey)) brevoKeyInput.value = cfg.apiKey || cfg.brevoApiKey;
    if (brevoSenderInput && (cfg.senderEmail || cfg.brevoSenderEmail)) brevoSenderInput.value = cfg.senderEmail || cfg.brevoSenderEmail;
  },

  // Backward compatibility alias
  loadBrevoConfigUI() {
    return this.loadEmailConfigUI();
  }
};

window.CloudServicesModule = CloudServicesModule;
