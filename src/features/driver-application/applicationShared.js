import { AVAILABILITY_OPTIONS, VEHICLE_TYPES } from '../../utils/districts';

export const APPLICATION_STEPS = [
  { key: 'apply', label: 'Apply', icon: 'fa-file-pen' },
  { key: 'review', label: 'Admin review', icon: 'fa-user-shield' },
  { key: 'start', label: 'Start delivering', icon: 'fa-truck-fast' },
];

export const DRIVER_BENEFITS = [
  {
    icon: 'fa-clock',
    title: 'Flexible schedule',
    text: 'Choose full-time, part-time, or weekends only.',
  },
  {
    icon: 'fa-map-location-dot',
    title: 'Mogadishu districts',
    text: 'Deliver furniture across major city districts.',
  },
  {
    icon: 'fa-mobile-screen',
    title: 'Simple driver app',
    text: 'Accept orders, navigate, and update delivery status from your phone.',
  },
];

export function labelFor(value, options) {
  return options.find((item) => item.value === value)?.label || value || '—';
}

export function formatApplicationDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getApplicationSummary(application) {
  if (!application || application.status === 'none') return [];
  return [
    { label: 'District', value: application.district },
    { label: 'Vehicle', value: labelFor(application.vehicleType, VEHICLE_TYPES) },
    { label: 'Availability', value: labelFor(application.availability, AVAILABILITY_OPTIONS) },
    { label: 'Applied', value: formatApplicationDate(application.appliedAt) },
  ];
}

export function getActiveApplicationStep(status) {
  if (status === 'none') return 0;
  if (status === 'pending') return 1;
  if (status === 'approved') return 2;
  return 1;
}
