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
      return { label: 'Cancelled', className: 'pending' };
    default:
      return { label: 'Processing', className: 'processing' };
  }
}

export function getPaymentBadge(paymentType) {
  const isPaid = paymentType === 'paid';
  return {
    label: isPaid ? 'Paid' : 'Pending',
    className: isPaid ? 'paid' : 'pending',
  };
}
