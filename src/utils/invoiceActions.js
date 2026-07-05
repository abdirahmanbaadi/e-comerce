import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMoney } from './format';

export function buildInvoiceHtml(order) {
  const itemsRows = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.title)}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatMoney(item.price)}</td>
        <td style="text-align:right">${formatMoney(item.price * item.quantity)}</td>
      </tr>`
    )
    .join('');

  const discountRow =
    order.discount > 0
      ? `<div class="totals-row"><span>Discount</span><span>-${formatMoney(order.discount)}</span></div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${escapeHtml(order.trackingCode)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Cormorant+Garamond:wght@600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Manrope', sans-serif; color: #111; background: #F4EFE6; padding: 32px 20px; }
    .invoice-page { max-width: 760px; margin: 0 auto; background: #fff; border-radius: 4px; box-shadow: 0 8px 40px rgba(7,61,53,0.12); overflow: hidden; }
    .top-bar { height: 6px; background: linear-gradient(90deg, #073D35, #D8A128, #073D35); }
    .paper { padding: 36px 40px 32px; }
    .invoice-logo { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 24px; }
    .invoice-logo-row { display: flex; align-items: center; justify-content: center; gap: 13px; }
    .logo-mark { position: relative; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; }
    .logo-frame { position: absolute; inset: 0; border: 2px solid #D8A128; border-radius: 11px; transform: rotate(45deg); }
    .logo-inner { position: relative; z-index: 2; font-family: 'Cormorant Garamond', serif; font-size: 1.55rem; font-weight: 700; color: #D8A128; }
    .logo-divider { width: 1px; height: 44px; background: #D8A128; }
    .brand-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 700; color: #073D35; line-height: 1.05; }
    .brand-subtitle { font-size: 0.72rem; font-weight: 800; color: #073D35; letter-spacing: 2px; text-transform: uppercase; margin-top: 3px; }
    .invoice-heading { margin-top: 14px; font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 700; color: #073D35; letter-spacing: 2px; text-transform: uppercase; }
    .invoice-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
    .meta-block { padding: 12px 14px; background: #FAF8F2; border-radius: 10px; border: 1px solid rgba(7,61,53,0.08); }
    .meta-block h4 { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 1.2px; color: #7A8585; margin-bottom: 6px; }
    .meta-block p { font-size: 0.82rem; font-weight: 700; color: #073D35; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #073D35; color: #fff; padding: 11px 12px; font-size: 0.78rem; text-align: left; font-weight: 800; }
    td { padding: 11px 12px; font-size: 0.84rem; border-bottom: 1px solid rgba(0,0,0,0.08); vertical-align: top; }
    .bottom { display: flex; justify-content: flex-end; margin-top: 8px; }
    .totals { min-width: 240px; }
    .totals-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 0.88rem; font-weight: 700; color: #555; }
    .totals-row.grand { border-top: 2px solid #073D35; margin-top: 8px; padding-top: 12px; font-size: 1.05rem; color: #073D35; font-weight: 900; }
    .invoice-footer { margin-top: 32px; text-align: center; padding-top: 20px; border-top: 1px dashed rgba(216,161,40,0.5); color: #666; font-size: 0.82rem; line-height: 1.7; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="invoice-page">
    <div class="top-bar"></div>
    <div class="paper">
    <header class="invoice-logo">
      <div class="invoice-logo-row">
        <div class="logo-mark"><span class="logo-frame"></span><span class="logo-inner">MF</span></div>
        <div class="logo-divider"></div>
        <div>
          <div class="brand-title">Mogadishu</div>
          <div class="brand-subtitle">Modern Furniture</div>
        </div>
      </div>
      <h1 class="invoice-heading">Invoice</h1>
    </header>

    <div class="invoice-meta">
      <div class="meta-block">
        <h4>Bill To</h4>
        <p>${escapeHtml(order.customer)}<br/>${escapeHtml(order.phone || '')}<br/>${escapeHtml(order.address || '')}</p>
      </div>
      <div class="meta-block">
        <h4>Invoice Details</h4>
        <p>${escapeHtml(order.trackingCode)}<br/>${escapeHtml(order.date)}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Price</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <div class="bottom">
      <div class="totals">
      <div class="totals-row"><span>Subtotal</span><span>${formatMoney(order.subtotal)}</span></div>
      ${discountRow}
      <div class="totals-row"><span>Delivery</span><span>${formatMoney(order.deliveryFee)}</span></div>
      <div class="totals-row grand"><span>Total</span><span>${order.total}</span></div>
      </div>
    </div>

    <footer class="invoice-footer">
      Thank you for shopping with Mogadishu Modern Furniture
    </footer>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function openInvoicePreview(order) {
  const html = buildInvoiceHtml(order);
  const previewWindow = window.open('', '_blank', 'width=920,height=800');
  if (!previewWindow) return;
  previewWindow.document.write(html);
  previewWindow.document.close();
}

export function printInvoice(order) {
  const html = buildInvoiceHtml(order);
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

export function downloadInvoice(order) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(7, 61, 53);
  doc.text('Mogadishu Modern Furniture', margin, 50);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Invoice', margin, 68);
  doc.text(`Order: ${order.trackingCode || ''}`, margin, 84);
  doc.text(`Date: ${order.date || new Date().toLocaleDateString()}`, margin, 98);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(7, 61, 53);
  doc.text('Bill To', margin, 130);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(`${order.customer || ''}`, margin, 146);
  doc.text(`${order.phone || ''}`, margin, 160);
  doc.text(`${order.address || ''}`, margin, 174, { maxWidth: 250 });

  const rows = (order.items || []).map((item) => [
    item.title,
    String(item.quantity),
    formatMoney(item.price),
    formatMoney(item.price * item.quantity),
  ]);

  autoTable(doc, {
    startY: 200,
    head: [['Product', 'Qty', 'Price', 'Subtotal']],
    body: rows.length ? rows : [['Order items', '1', order.total || '', order.total || '']],
    styles: { fontSize: 10, cellPadding: 8 },
    headStyles: { fillColor: [7, 61, 53], textColor: 255 },
  });

  const finalY = doc.lastAutoTable.finalY + 24;
  doc.setFont('helvetica', 'bold');
  doc.text(`Subtotal: ${formatMoney(order.subtotal ?? 0)}`, margin, finalY);
  doc.text(`Delivery: ${formatMoney(order.deliveryFee ?? 0)}`, margin, finalY + 16);
  if (order.discount > 0) {
    doc.text(`Discount: -${formatMoney(order.discount)}`, margin, finalY + 32);
  }
  doc.setFontSize(13);
  doc.text(`Total: ${order.total}`, margin, finalY + 52);

  doc.save(`Invoice-${String(order.trackingCode || 'order').replace(/[^a-zA-Z0-9-#]/g, '')}.pdf`);
}
