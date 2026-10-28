import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowUpRight, Copy, Check, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const AccountCard = ({ account }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(account._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedBalance = formatCurrency(account.balance);

  const formattedDate = account.created_at
    ? new Date(account.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      {/* Card Header & Gradient Accent */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                {account.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-0.5">
                <span>ID: {account._id.slice(-6)}</span>
                <button
                  onClick={handleCopyId}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
                  title="Copy Full Account ID"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
        </div>

        {/* Balance Display */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            Current Balance
          </span>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            {formattedBalance}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <Link
          to={`/accounts/${account._id}`}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group/btn"
        >
          <span>View Account & Transactions</span>
          <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </Link>
        <Link
          to={`/transfer?from=${account._id}`}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 transition"
        >
          Transfer From
        </Link>
      </div>
    </div>
  );
};

export default AccountCard;

