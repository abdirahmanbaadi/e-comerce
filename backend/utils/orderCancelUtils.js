/** Customer may cancel before Out for Delivery (step 4) */
function canCustomerCancelOrder(order) {
  if (!order) return false;
  const status = String(order.status || '').toLowerCase();
  if (status === 'cancelled' || status === 'delivered') return false;

  const step = typeof order.currentStep === 'number' ? order.currentStep : 1;
  if (step === 0 || step >= 4) return false;

  return true;
}

module.exports = { canCustomerCancelOrder };
