const https = require('https');
const WAAFI_URL = process.env.WAAFI_API_URL || 'https://api.waafipay.net/asm';

async function makePostRequest(url, payload) {
  if (typeof fetch === 'function') {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, data };
  }

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            data,
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            data: {},
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

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

const WAAFI_MIN_USD = 0.01;

function formatWaafiAmount(amount) {
  const n = Number(amount);
  if (Number.isNaN(n) || n <= 0) return 0;
  // Waafi docs: amount in two decimal places — sub-cent values are rejected by EVC without PIN prompt
  return Number(Math.max(n, WAAFI_MIN_USD).toFixed(2));
}

function mapWaafiErrorMessage(data) {
  const msg = String(data?.responseMsg || data?.params?.responseMsg || data?.message || '').trim();
  const code = String(data?.responseCode || data?.errorCode || '');
  const upper = msg.toUpperCase();

  if (upper.includes('RCS_USER_REJECTED') || upper.includes('USER_REJECTED')) {
    return (
      'EVC Plus rejected the payment before PIN (Waafi: RCS_USER_REJECTED). ' +
      'Common causes: phone is not an active EVC Plus wallet (61/77), insufficient balance, ' +
      'or amount below $0.01. Confirm the checkout number matches your EVC SIM and try again.'
    );
  }
  if (upper.includes('INSUFFICIENT') || upper.includes('HADHAAG') || code === '50333') {
    return 'Insufficient EVC Plus balance for this payment. Top up your wallet and try again.';
  }
  if (upper.includes('TIMEOUT') || code === '5309') {
    return 'Payment timed out — no PIN was entered in time. Please try again and approve promptly on your phone.';
  }
  if (upper.includes('CANCEL') || code === '5306') {
    return 'Payment was cancelled on your phone. Tap Retry if you want to pay again.';
  }
  if (upper.includes('INVALID') && (upper.includes('KEY') || upper.includes('CREDENTIAL'))) {
    return 'Waafi merchant credentials are invalid. Check WAAFI_* values in backend/.env.';
  }

  return msg || 'Payment was declined or timed out.';
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
      paymentMethod: 'MWALLET_ACCOUNT',
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
    const { ok, data } = await makePostRequest(WAAFI_URL, payload);

    if (!ok) {
      return {
        success: false,
        message: data.responseMsg || data.message || 'Waafi payment request failed.',
        raw: data,
      };
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Waafi] response:', JSON.stringify(data).slice(0, 500));
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

    const declineMsg = mapWaafiErrorMessage(data);

    return {
      success: false,
      message: declineMsg,
      responseCode: data.responseCode,
      responseMsg: data.responseMsg,
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

function buildWaafiReversalPayload({ transactionId, description }) {
  const { merchantUid, apiUserId, apiKey } = waafiConfig();
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

  return {
    schemaVersion: '1.0',
    requestId: String(Date.now()),
    timestamp,
    channelName: 'WEB',
    serviceName: 'API_REVERSAL',
    serviceParams: {
      merchantUid,
      apiUserId,
      apiKey,
      transactionId: String(transactionId),
      description: description || 'Order cancelled — refund',
    },
  };
}

async function processWaafiReversal({ transactionId, description }) {
  const { merchantUid, apiUserId, apiKey } = waafiConfig();

  if (!merchantUid || !apiUserId || !apiKey) {
    return {
      success: false,
      message: 'Waafi payment is not configured. Refund must be processed manually.',
    };
  }

  if (!transactionId) {
    return {
      success: false,
      message: 'No payment transaction ID found for this order.',
    };
  }

  const payload = buildWaafiReversalPayload({ transactionId, description });

  try {
    const { ok, data } = await makePostRequest(WAAFI_URL, payload);

    if (!ok) {
      return {
        success: false,
        message: data.responseMsg || data.message || 'Waafi refund request failed.',
        raw: data,
      };
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Waafi reversal] response:', JSON.stringify(data).slice(0, 500));
    }

    const state = String(data.params?.state || '').toLowerCase();
    if (isWaafiSuccess(data) && state !== 'declined' && state !== 'failed') {
      return {
        success: true,
        message: 'Payment reversed. Funds return to your EVC Plus wallet.',
        transactionId: data.params?.transactionId || transactionId,
        raw: data,
      };
    }

    return {
      success: false,
      message:
        data.responseMsg ||
        data.params?.description ||
        'Refund could not be completed automatically. Contact support.',
      raw: data,
    };
  } catch (error) {
    console.error('Waafi reversal error:', error);
    return {
      success: false,
      message: 'Could not reach Waafi to process refund. Contact support.',
    };
  }
}

module.exports = {
  processWaafiPurchase,
  processWaafiReversal,
  normalizeAccountNo,
  WAAFI_MIN_USD,
  formatWaafiAmount,
};
