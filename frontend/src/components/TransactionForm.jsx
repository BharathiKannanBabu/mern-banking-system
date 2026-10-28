import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Sparkles, Send, IndianRupee, FileText, Hash } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const TransactionForm = ({ currentBalance = 0, onSubmit, isSubmitting = false }) => {
  const [type, setType] = useState('credit');
  const [amount, setAmount] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const generateRefId = () => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const dateStr = Date.now().toString().slice(-4);
    const prefix = type === 'credit' ? 'CR' : 'DR';
    setReferenceId(`REF-${prefix}-${dateStr}-${randomHex}`);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid amount greater than ₹0.00');
      return;
    }

    if (type === 'debit' && numAmount > currentBalance) {
      setFormError(
        `Insufficient balance. You cannot withdraw more than your current balance (${formatCurrency(
          currentBalance
        )}).`
      );
      return;
    }

    if (!referenceId.trim()) {
      setFormError('Reference ID is required. Click "Generate" to create one automatically.');
      return;
    }

    try {
      await onSubmit({
        type,
        amount: numAmount,
        reference_id: referenceId.trim(),
        description: description.trim(),
      });

      // Reset form on success
      setAmount('');
      setReferenceId('');
      setDescription('');
    } catch (err) {
      setFormError(err.message || 'Failed to submit transaction');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base">New Transaction</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Execute a credit (deposit) or debit (withdrawal)
          </p>
        </div>

        {/* Credit / Debit Pill Toggle */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setType('credit');
              setFormError('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              type === 'credit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Credit (+)
          </button>
          <button
            type="button"
            onClick={() => {
              setType('debit');
              setFormError('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              type === 'debit'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Debit (-)
          </button>
        </div>
      </div>

      {formError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Amount (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <IndianRupee className="w-4 h-4" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
          {type === 'debit' && (
            <p className="text-[11px] text-slate-400 mt-1">
              Available balance: {formatCurrency(currentBalance)}
            </p>
          )}
        </div>

        {/* Reference ID Input with Generator */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Reference ID <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={generateRefId}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto Generate</span>
            </button>
          </div>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Hash className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. REF-2026-0012"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Unique key per account. Duplicates will return 409 Conflict.
          </p>
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Description <span className="text-slate-400 text-[10px] normal-case">(optional)</span>
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 pt-3 pointer-events-none text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Consulting invoice, payroll, dividend"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm text-white shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
            type === 'credit'
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
          }`}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Confirm {type === 'credit' ? 'Credit Deposit' : 'Debit Withdrawal'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;

