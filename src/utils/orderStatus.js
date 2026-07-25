export function resolveOrderStatus(order) {
  if (order?.status) return order.status;
  const step = typeof order?.currentStep === 'number' ? order.currentStep : 1;
  if (step === 0) return 'cancelled';
  if (step >= 5) return 'delivered';
  if (step >= 4) return 'shipped';
  return 'processing';
}

export function getDeliveryBadge(status) {
  switch (status) {
    case 'delivered':
      return { label: 'Delivered', className: 'delivered' };
    case 'shipped':
      return { label: 'Out for Delivery', className: 'out-for-delivery' };
    case 'cancelled':
      return { label: 'Cancelled', className: 'cancelled' };
    default:
      return { label: 'Processing', className: 'processing' };
  }
}

export function getPaymentBadge(paymentType, paymentLabel) {
  const normalized = String(paymentType || '').toLowerCase();
  const labelText = String(paymentLabel || '').toLowerCase();

  if (normalized === 'paid' || labelText === 'paid') {
    return { label: 'Paid', className: 'paid' };
  }
  if (normalized === 'failed' || labelText === 'failed') {
    return { label: 'Failed', className: 'failed' };
  }
  if (normalized === 'refunded' || labelText === 'refunded') {
    return { label: 'Refunded', className: 'refunded' };
  }
  return { label: 'Pending', className: 'pending' };
}
