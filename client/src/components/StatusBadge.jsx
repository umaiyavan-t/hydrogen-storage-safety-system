import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase().replace(/_/g, '-');
  let badgeClass = 'badge-info';
  
  if (['nominal', 'passed', 'completed', 'active'].includes(normalized)) {
    badgeClass = 'badge-nominal';
  } else if (['advisory', 'attention-required', 'attention'].includes(normalized)) {
    badgeClass = 'badge-advisory';
  } else if (['warning', 'in-progress'].includes(normalized)) {
    badgeClass = 'badge-warning';
  } else if (['critical', 'non-compliant', 'urgent', 'critical-hazard'].includes(normalized)) {
    badgeClass = 'badge-critical';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
};
