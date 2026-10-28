import React from 'react';

const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    credit: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/10',
    debit: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-600/10',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-600/10',
    success: 'bg-teal-50 text-teal-700 border-teal-200 ring-1 ring-teal-600/10',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/10',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${currentVariant} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;

