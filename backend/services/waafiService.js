const WAAFI_URL = process.env.WAAFI_API_URL || 'https://api.waafipay.net/asm';

function waafiConfig() {
  return {
    merchantUid: process.env.WAAFI_MERCHANT_UID,
    apiUserId: process.env.WAAFI_API_USER_ID,
    apiKey: process.env.WAAFI_API_KEY,
  };
}

function normalizeAccountNo(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('252')) return digits;
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 9) return `252${digits}`;
  return digits;
}

function formatWaafiAmount(amount) {
  const n = Number(amount);
  if (Number.isNaN(n) || n <= 0) return 0;
  // Keep 3 decimals for demo/test prices (e.g. $0.001) — toFixed(2) would send $0.00
  if (n < 0.01) return Number(n.toFixed(3));
  return Number(n.toFixed(2));
}

function buildWaafiPayload({ accountNo, amount, referenceId, invoiceId, description }) {
  const { merchantUid, apiUserId, apiKey } = waafiConfig();
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

  return {
    schemaVersion: '1.0',
    requestId: String(Date.now()),
    timestamp,
    channelName: 'WEB',
    serviceName: 'API_PURCHASE',
    serviceParams: {
      merchantUid,
      apiUserId,
      apiKey,
      paymentMethod: 'mwallet_account',
      payerInfo: {
        accountNo: normalizeAccountNo(accountNo),
      },
      transactionInfo: {
        referenceId: String(referenceId),
        invoiceId: String(invoiceId),
        amount: formatWaafiAmount(amount),
        currency: 'USD',
        description: description || 'Mogadishu Modern Furniture Order',
      },
    },
  };
}

function isWaafiSuccess(data) {
  if (!data) return false;
  const code = String(
    data.responseCode ?? data.params?.responseCode ?? data.serviceParams?.responseCode ?? ''
  );
  if (code === '2001' || code === '0') return true;
  const msg = String(data.responseMsg ?? data.params?.responseMsg ?? '').toLowerCase();
  return msg.includes('success') || msg.includes('approved');
}

async function processWaafiPurchase({ accountNo, amount, referenceId, invoiceId, description }) {
  const { merchantUid, apiUserId, apiKey } = waafiConfig();

  if (!merchantUid || !apiUserId || !apiKey) {
    return {
      success: false,
      message: 'Waafi payment is not configured on the server. Add credentials to backend/.env',
    };
  }

  const payload = buildWaafiPayload({ accountNo, amount, referenceId, invoiceId, description });

  try {
    const response = await fetch(WAAFI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: data.responseMsg || data.message || 'Waafi payment request failed.',
        raw: data,
      };
    }

    if (isWaafiSuccess(data)) {
      return {
        success: true,
        message: 'Payment approved on your phone. EVC Plus transaction completed.',
        transactionId:
          data.params?.transactionId ||
          data.params?.issuerTransactionId ||
          data.transactionId ||
          referenceId,
        chargedPhone: normalizeAccountNo(accountNo),
        raw: data,
      };
    }

    const declineMsg =
      data.responseMsg ||
      data.params?.responseMsg ||
      data.message ||
      'Payment was declined or timed out.';

    return {
      success: false,
      message: `${declineMsg} If no prompt appeared, confirm the checkout phone has EVC Plus and try again.`,
      chargedPhone: normalizeAccountNo(accountNo),
      raw: data,
    };
  } catch (error) {
    console.error('Waafi API error:', error);
    return {
      success: false,
      message: 'Could not reach Waafi payment service. Check your internet connection.',
    };
  }
}

module.exports = {
  processWaafiPurchase,
  normalizeAccountNo,
};
