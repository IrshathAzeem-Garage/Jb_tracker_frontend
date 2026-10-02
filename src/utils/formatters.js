export const formatCurrency = (amount) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || 0);
  if (isNaN(num)) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const formatPercentage = (num) => {
  const val = typeof num === 'number' ? num : parseFloat(num || 0);
  if (isNaN(val)) return '0.00%';
  return `${val.toFixed(2)}%`;
};

export const getOrderStatusStyles = (status) => {
  switch (status) {
    case 'DELIVERED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'READY':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'CUSTOMIZATION':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'PROCUREMENT':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'CONFIRMED':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'DRAFT':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const getMarginBadge = (marginPercentage, profit) => {
  if (profit < 0) {
    return {
      text: 'Loss Making',
      className: 'bg-red-50 text-red-700 border-red-200',
    };
  }
  if (marginPercentage < 10) {
    return {
      text: 'Low Margin',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  if (marginPercentage >= 25) {
    return {
      text: 'High Margin',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  return {
    text: 'Healthy',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };
};
