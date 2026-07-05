const { normalizePhone } = require('../utils/phoneUtils');

function maskPhone(phone) {
  const raw = String(phone || '').trim();
  if (raw.length <= 4) return '****';
  return `${raw.slice(0, 3)}***${raw.slice(-2)}`;
}

function isSmsConfigured() {
  return Boolean(
    (process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER) ||
      (process.env.SMS_API_URL && process.env.SMS_API_KEY)
  );
}

function formatE164(phone) {
  let digits = normalizePhone(phone);
  if (!digits.startsWith('252')) digits = `252${digits}`;
  return `+${digits}`;
}

async function sendViaTwilio(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { success: false, message: data.message || 'Twilio SMS failed.' };
  }
  return { success: true, messageId: data.sid };
}

async function sendViaGenericApi(to, body) {
  const url = process.env.SMS_API_URL;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SMS_API_KEY}`,
    },
    body: JSON.stringify({
      to,
      message: body,
      phone: to,
      text: body,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { success: false, message: data.message || 'SMS gateway request failed.' };
  }
  return { success: true };
}

async function sendSms(phone, body) {
  const to = formatE164(phone);

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      return await sendViaTwilio(to, body);
    } catch (error) {
      console.error('Twilio error:', error.message);
      return { success: false, message: error.message };
    }
  }

  if (process.env.SMS_API_URL && process.env.SMS_API_KEY) {
    try {
      return await sendViaGenericApi(to, body);
    } catch (error) {
      console.error('SMS API error:', error.message);
      return { success: false, message: error.message };
    }
  }

  console.log('[SMS DEV - not configured]');
  console.log(`To: ${to}`);
  console.log(`Message: ${body}`);
  return { success: false, devMode: true, message: 'SMS provider not configured.' };
}

async function sendPasswordResetSms(phone, code) {
  const body = `Mogadishu Modern Furniture: Your password reset code is ${code}. Valid for 10 minutes.`;
  return sendSms(phone, body);
}

module.exports = {
  maskPhone,
  isSmsConfigured,
  sendSms,
  sendPasswordResetSms,
};
