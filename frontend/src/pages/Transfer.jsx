import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  ArrowLeftRight,
  ArrowRight,
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  Wallet,
  ArrowLeft,
  IndianRupee,
  Hash,
  FileText,
} from 'lucide-react';

const Transfer = ({ showToast }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Form state
  const [fromAccountId, setFromAccountId] = useState(searchParams.get('from') || '');
  const [toAccountId, setToAccountId] = useState(searchParams.get('to') || '');
  const [amount, setAmount] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [description, setDescription] = useState('');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.getAccounts();
        const accs = res.data || [];
        setAccounts(accs);

        if (!fromAccountId && accs.length > 0) {
          setFromAccountId(accs[0]._id);
        }
        if (!toAccountId && accs.length > 1) {
          setToAccountId(accs[1]._id);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load accounts for transfer', 'error');
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [showToast]);

  const generateRefId = () => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const dateStr = Date.now().toString().slice(-4);
    setReferenceId(`TRF-${dateStr}-${randomHex}`);
    setFormError('');
  };

  const fromAccount = accounts.find((a) => a._id === fromAccountId);
  const toAccount = accounts.find((a) => a._id === toAccountId);

  const numAmount = parseFloat(amount) || 0;
  const sourceBalance = fromAccount ? fromAccount.balance : 0;
  const remainingBalance = sourceBalance - numAmount;

  const handleSwapAccounts = () => {
    setFromAccountId(toAccountId);
    setToAccountId(fromAccountId);
    setFormError('');
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setTransferSuccess(null);

    if (!fromAccountId || !toAccountId) {
      setFormError('Please select both source and destination accounts');
      return;
    }

    if (fromAccountId === toAccountId) {
      setFormError('Source and destination accounts must be different');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid transfer amount greater than ₹0.00');
      return;
    }

    if (numAmount > sourceBalance) {
      setFormError(
        `Insufficient balance in source account. Available: ${formatCurrency(sourceBalance)}`
      );
      return;
    }

    if (!referenceId.trim()) {
      setFormError('Reference ID is required. Click "Auto Generate" for a unique ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.transferFunds({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: numAmount,
        reference_id: referenceId.trim(),
        description: description.trim(),
      });

      setTransferSuccess(res.data);
      showToast('Transfer completed successfully!', 'success');

      // Refresh accounts in local list
      const updatedAccounts = await api.getAccounts();
      setAccounts(updatedAccounts.data || []);

      // Reset amount and reference ID
      setAmount('');
      setReferenceId('');
      setDescription('');
    } catch (err) {
      setFormError(err.message || 'Transfer transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Accounts</span>
        </Link>
      </div>

      {/* Page Title */}
      <div className="text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <ArrowLeftRight className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Inter-Account Transfer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Execute atomic, dual-entry transfers guaranteed by MongoDB database transactions
        </p>
      </div>

      {/* Success Banner */}
      {transferSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 animate-fade-in shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm">Transfer Successfully Recorded</h4>
              <p className="text-xs text-emerald-700 mt-1">
                Transferred {formatCurrency(transferSuccess.amount)} from{' '}
                <span className="font-semibold">{transferSuccess.from_account.name}</span> to{' '}
                <span className="font-semibold">{transferSuccess.to_account.name}</span>.
              </p>
              <div className="mt-3 pt-3 border-t border-emerald-200/60 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-emerald-700/80 block text-[11px]">
                    {transferSuccess.from_account.name} New Balance:
                  </span>
                  <span className="font-mono font-bold">
                    {formatCurrency(transferSuccess.from_account.balance)}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-700/80 block text-[11px]">
                    {transferSuccess.to_account.name} New Balance:
                  </span>
                  <span className="font-mono font-bold">
                    {formatCurrency(transferSuccess.to_account.balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Transfer Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        {formError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>{formError}</div>
          </div>
        )}

        <form onSubmit={handleTransferSubmit} className="space-y-6">
          {/* Account Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
            {/* Source Account */}
            <div className="md:col-span-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                From Account <span className="text-rose-500">*</span>
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => {
                  setFromAccountId(e.target.value);
                  setFormError('');
                }}
                className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              >
                <option value="">Select source account</option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>

              {fromAccount && (
                <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Available Balance:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(fromAccount.balance)}
                  </span>
                </div>
              )}
            </div>

            {/* Swap Button (1 col) */}
            <div className="md:col-span-1 flex justify-center">
              <button
                type="button"
                onClick={handleSwapAccounts}
                className="p-2.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 border border-slate-200 transition shadow-xs"
                title="Swap Accounts"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Account */}
            <div className="md:col-span-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                To Account <span className="text-rose-500">*</span>
              </label>
              <select
                value={toAccountId}
                onChange={(e) => {
                  setToAccountId(e.target.value);
                  setFormError('');
                }}
                className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              >
                <option value="">Select destination account</option>
                {accounts
                  .filter((a) => a._id !== fromAccountId)
                  .map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
              </select>

              {toAccount && (
                <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Current Balance:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(toAccount.balance)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Transfer Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Transfer Amount (₹) <span className="text-rose-500">*</span>
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

            {fromAccount && numAmount > 0 && (
              <div className="mt-2 text-xs flex items-center justify-between px-1">
                <span className="text-slate-500">Source Balance After Transfer:</span>
                <span
                  className={`font-semibold ${
                    remainingBalance < 0 ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
            )}
          </div>

          {/* Reference ID */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Transfer Reference ID <span className="text-rose-500">*</span>
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
                placeholder="e.g. TRF-2026-X89B"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Guarantees idempotent submission; duplicate reference will be rejected with 409 Conflict.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Transfer Note / Description{' '}
              <span className="text-slate-400 text-[10px] normal-case">(optional)</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 pt-3 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Monthly division allocation or vendor reimbursement"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || accounts.length < 2}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Execute Atomic Transfer</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Transfer;

