const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });

  return transporter;
}

function isEmailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendEmail({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@mogadishufurniture.com';
  const transport = getTransporter();

  if (!transport) {
    console.log('[Email DEV - SMTP not configured]');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html);
    return { success: false, devMode: true, message: 'SMTP not configured. Check server console for email content.' };
  }

  try {
    await transport.sendMail({ from: `Mogadishu Modern Furniture <${from}>`, to, subject, html, text });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, message: error.message };
  }
}

async function sendWelcomeEmail(user) {
  const name = `${user.firstName} ${user.lastName || ''}`.trim();
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Mogadishu Modern Furniture',
    text: `Hello ${name},\n\nThank you for registering at Mogadishu Modern Furniture.\n\nYou can now browse our catalog, save wishlist items, and place orders with EVC Plus.\n\nBest regards,\nMogadishu Modern Furniture Team`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#073D35;">Welcome, ${name}!</h2>
        <p>Thank you for registering at <strong>Mogadishu Modern Furniture</strong>.</p>
        <p>You can now browse our catalog, save wishlist items, and place orders with EVC Plus.</p>
        <p style="color:#666;">Best regards,<br/>Mogadishu Modern Furniture Team</p>
      </div>
    `,
  });
}

async function sendPasswordResetCode(user, code) {
  const name = `${user.firstName} ${user.lastName || ''}`.trim();
  return sendEmail({
    to: user.email,
    subject: 'Your Password Reset Code - Mogadishu Modern Furniture',
    text: `Hello ${name},\n\nYour password reset code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#073D35;">Password Reset</h2>
        <p>Hello ${name},</p>
        <p>Your verification code is:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#073D35;">${code}</p>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p style="color:#888;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
}

async function sendOrderConfirmationEmail(user, order) {
  const email = user?.email || order?.email;
  if (!email) return { success: false };

  const items = Array.isArray(order.items) ? order.items : [];
  const itemsHtml = items.length
    ? items
        .map(
          (item) =>
            `<li>${item.title} × ${item.quantity} — $${Number(item.price * item.quantity).toFixed(3)}</li>`
        )
        .join('')
    : `<li>${order.product}</li>`;

  const deliverySlot =
    order.deliveryDate || order.deliveryTime
      ? `<p>Preferred delivery: <strong>${order.deliveryDate || '—'}</strong> at <strong>${order.deliveryTime || '—'}</strong></p>`
      : '';

  return sendEmail({
    to: email,
    subject: `Order Confirmed ${order.id} - Mogadishu Modern Furniture`,
    text: `Your order ${order.id} has been confirmed. Total: ${order.amount}. Track on our website.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#073D35;">Order Confirmed</h2>
        <p>Your order <strong>${order.id}</strong> has been received.</p>
        <p>Total: <strong>${order.amount}</strong></p>
        ${deliverySlot}
        <ul>${itemsHtml}</ul>
        <p>Track your order on our website using your order ID.</p>
      </div>
    `,
  });
}

module.exports = {
  isEmailConfigured,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetCode,
  sendOrderConfirmationEmail,
};
