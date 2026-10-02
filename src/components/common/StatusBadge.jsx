import React from 'react';
import { getOrderStatusStyles } from '../../utils/formatters';

export const StatusBadge = ({ status, className = '' }) => {
  const styles = getOrderStatusStyles(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {status}
    </span>
  );
};
