import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    error: {
      bg: 'bg-rose-50 border-rose-300 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    },
    info: {
      bg: 'bg-indigo-50 border-indigo-300 text-indigo-900',
      icon: <Info className="w-5 h-5 text-indigo-600 shrink-0" />,
    },
  };

  const current = styles[type] || styles.info;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce-in shadow-xl rounded-xl">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border shadow-sm ${current.bg}`}
      >
        {current.icon}
        <div className="flex-1 text-sm font-medium leading-relaxed">{message}</div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg focus:outline-none"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;

