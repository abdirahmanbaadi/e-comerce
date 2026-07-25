export const DRIVER_MAX_ACTIVE = 3;

export const DRIVER_TABS = [
  { id: 'all', label: 'All', icon: 'fa-layer-group' },
  { id: 'pending', label: 'New', icon: 'fa-bell' },
  { id: 'active', label: 'Active', icon: 'fa-truck-fast' },
  { id: 'done', label: 'Done', icon: 'fa-circle-check' },
];

const PHASE_META = {
  pending: {
    label: 'Awaiting response',
    shortLabel: 'New request',
    cls: 'bg-amber-100 text-amber-800',
    border: 'border-l-amber-400',
    icon: 'fa-bell',
  },
  accepted: {
    label: 'Accepted — ready',
    shortLabel: 'Ready',
    cls: 'bg-cyan-100 text-cyan-800',
    border: 'border-l-cyan-500',
    icon: 'fa-box-open',
  },
  transit: {
    label: 'On the way',
    shortLabel: 'On the way',
    cls: 'bg-blue-100 text-blue-800',
    border: 'border-l-blue-500',
    icon: 'fa-truck-fast',
  },
  at_customer: {
    label: 'At customer location',
    shortLabel: 'At location',
    cls: 'bg-violet-100 text-violet-800',
    border: 'border-l-violet-500',
    icon: 'fa-house-circle-check',
  },
  delivered: {
    label: 'Delivered',
    shortLabel: 'Done',
    cls: 'bg-emerald-100 text-emerald-800',
    border: 'border-l-emerald-500',
    icon: 'fa-circle-check',
  },
};

export function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

export function buildTelHref(phone) {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  const normalized = digits.startsWith('252') ? digits : digits.replace(/^0/, '252');
  return `tel:+${normalized}`;
}

export function extractDistrict(address = '') {
  const first = String(address).split(',')[0]?.trim();
  return first || 'Mogadishu';
}

export function isDriverAssignedOrder(order) {
  return Boolean(order?.assignedDriverId && String(order.assignedDriverId).trim());
}

export function filterDriverOrders(orders = []) {
  return orders.filter(isDriverAssignedOrder);
}

export function pickNextDriverTab(counts) {
  if (counts.pending > 0) return 'pending';
  if (counts.active > 0) return 'active';
  return 'done';
}

export function getDriverOrderPhase(order) {
  if (!isDriverAssignedOrder(order)) return 'unassigned';
  const step = Number(order?.currentStep) || 1;
  if (step >= 5 || String(order?.status || '').toLowerCase() === 'delivered') return 'delivered';
  if (order?.assignmentStatus === 'pending') return 'pending';
  if (step >= 4) {
    if (order?.driverArrivedAt) return 'at_customer';
    return 'transit';
  }
  if (order?.assignmentStatus === 'accepted') return 'accepted';
  return 'accepted';
}

export function getDriverOrderMeta(order) {
  return PHASE_META[getDriverOrderPhase(order)] || PHASE_META.accepted;
}

export function matchesDriverTab(order, tabId) {
  const phase = getDriverOrderPhase(order);
  if (phase === 'unassigned') return false;
  if (tabId === 'all') return true;
  if (tabId === 'pending') return phase === 'pending';
  if (tabId === 'active') return phase === 'accepted' || phase === 'transit' || phase === 'at_customer';
  if (tabId === 'done') return phase === 'delivered';
  return true;
}

const PHASE_SORT = { pending: 0, transit: 1, at_customer: 2, accepted: 3, delivered: 4 };

export function sortDriverOrders(orders = []) {
  return filterDriverOrders(orders).sort((a, b) => {
    const pa = PHASE_SORT[getDriverOrderPhase(a)] ?? 9;
    const pb = PHASE_SORT[getDriverOrderPhase(b)] ?? 9;
    if (pa !== pb) return pa - pb;
    const da = new Date(a.updatedAt || a.createdAt || a.date || 0).getTime();
    const db = new Date(b.updatedAt || b.createdAt || b.date || 0).getTime();
    return db - da;
  });
}

export function countDriverOrdersByPhase(orders = []) {
  const assigned = filterDriverOrders(orders);
  const counts = { all: assigned.length, pending: 0, active: 0, done: 0 };
  assigned.forEach((order) => {
    const phase = getDriverOrderPhase(order);
    if (phase === 'pending') counts.pending += 1;
    if (phase === 'accepted' || phase === 'transit' || phase === 'at_customer') counts.active += 1;
    if (phase === 'delivered') counts.done += 1;
  });
  return counts;
}

export function driverStatusMeta(status, activeDeliveries = 0) {
  if (status === 'offline') {
    return {
      label: 'Offline',
      hint: 'You will not receive new assignments.',
      cls: 'bg-gray-100 text-gray-600',
      dot: 'bg-gray-400',
    };
  }
  if (status === 'busy') {
    return {
      label: `Busy · ${activeDeliveries}/${DRIVER_MAX_ACTIVE}`,
      hint: 'Active deliveries in progress.',
      cls: 'bg-amber-100 text-amber-800',
      dot: 'bg-amber-500',
    };
  }
  return {
    label: 'Available',
    hint: 'Ready for new delivery requests.',
    cls: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
  };
}

export function getDriverTimelineSteps(phase) {
  const steps = [
    { key: 'accepted', label: 'Accepted', icon: 'fa-handshake' },
    { key: 'transit', label: 'On the way', icon: 'fa-truck-fast' },
    { key: 'at_customer', label: 'At location', icon: 'fa-house-circle-check' },
    { key: 'delivered', label: 'Delivered', icon: 'fa-circle-check' },
  ];
  const order = ['accepted', 'transit', 'at_customer', 'delivered'];
  const phaseKey = phase === 'pending' ? 'accepted' : phase;
  const idx = order.indexOf(phaseKey);
  return steps.map((step, i) => ({
    ...step,
    state:
      i < idx
        ? 'done'
        : i === idx && phase !== 'delivered'
          ? 'current'
          : phase === 'delivered'
            ? 'done'
            : 'idle',
  }));
}
