import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import TransactionForm from '../components/TransactionForm';
import TransactionTable from '../components/TransactionTable';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  ArrowLeft,
  Wallet,
  ArrowLeftRight,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const AccountDetail = ({ showToast }) => {
  const { id } = useParams();

  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [accountError, setAccountError] = useState(null);

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch account data
  const fetchAccount = useCallback(async () => {
    try {
      setAccountError(null);
      const res = await api.getAccountById(id);
      setAccount(res.data);
      setBalance(res.data.balance || 0);
    } catch (err) {
      setAccountError(err.message || 'Failed to fetch account details');
    } finally {
      setIsLoadingAccount(false);
    }
  }, [id]);

  // Fetch latest balance separately (tests the GET /api/accounts/:id/balance endpoint)
  const refreshBalance = async () => {
    try {
      const res = await api.getAccountBalance(id);
      if (res.data) {
        setBalance(res.data.balance);
      }
      showToast('Account balance refreshed', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to refresh balance', 'error');
    }
  };

  // Fetch transactions with pagination and type filter
  const fetchTransactions = useCallback(async () => {
    setIsLoadingTx(true);
    try {
      const params = {
        page,
        limit,
      };
      if (filterType) {
        params.type = filterType;
      }
      const res = await api.getTransactions(id, params);
      setTransactions(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.totalRecords || 0);
    } catch (err) {
      showToast(err.message || 'Failed to fetch transactions', 'error');
    } finally {
      setIsLoadingTx(false);
    }
  }, [id, page, limit, filterType, showToast]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  useEffect(() => {
    if (!accountError) {
      fetchTransactions();
    }
  }, [fetchTransactions, accountError]);

  // Handle transaction submission
  const handleCreateTransaction = async (formData) => {
    setIsSubmittingTx(true);
    try {
      const res = await api.createTransaction(id, formData);
      showToast(
        `${formData.type === 'credit' ? 'Credit' : 'Debit'} of ${formatCurrency(
          formData.amount
        )} completed successfully!`,
        'success'
      );

      // Update local balance from response or refresh
      if (res.data && res.data.balance_after !== undefined) {
        setBalance(res.data.balance_after);
      } else {
        await refreshBalance();
      }

      // Reset to page 1 to see latest transaction
      setPage(1);
      await fetchTransactions();
    } catch (err) {
      throw err;
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleCopyId = () => {
    if (!account) return;
    navigator.clipboard.writeText(account._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoadingAccount) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-medium text-slate-500">Loading account...</p>
      </div>
    );
  }

  if (accountError || !account) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Account Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          {accountError || 'The account you requested could not be located in the database.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Accounts</span>
        </Link>

        <Link
          to={`/transfer?from=${account._id}`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold transition"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Transfer From This Account</span>
        </Link>
      </div>

      {/* Account Info Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-indigo-300 shrink-0">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{account.name}</h1>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  Active
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300">
                <div className="flex items-center gap-1 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                  <span>ID: {account._id}</span>
                  <button
                    onClick={handleCopyId}
                    className="p-1 hover:text-white transition rounded"
                    title="Copy full ID"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Created:{' '}
                    {new Date(account.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance card inside banner */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 min-w-[220px] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-indigo-200 uppercase font-semibold tracking-wider">
              <span>Verified Balance</span>
              <button
                onClick={refreshBalance}
                className="p-1 text-slate-300 hover:text-white transition rounded"
                title="Sync Balance"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-3xl font-extrabold tracking-tight mt-2 text-white">
              {formatCurrency(balance)}
            </div>
            <span className="text-[11px] text-indigo-200/70 mt-1">
              Atomic snapshot updated
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, History Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Transaction Execution Form (4 cols) */}
        <div className="lg:col-span-4 sticky top-24">
          <TransactionForm
            currentBalance={balance}
            onSubmit={handleCreateTransaction}
            isSubmitting={isSubmittingTx}
          />
        </div>

        {/* Right Column: Transaction History Table (8 cols) */}
        <div className="lg:col-span-8">
          <TransactionTable
            transactions={transactions}
            filterType={filterType}
            onFilterChange={(newType) => {
              setFilterType(newType);
              setPage(1);
            }}
            currentPage={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={limit}
            onPageChange={(newPage) => setPage(newPage)}
            isLoading={isLoadingTx}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountDetail;

