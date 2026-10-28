import React from 'react';
import Badge from './Badge';
import Pagination from './Pagination';
import { ArrowDownLeft, ArrowUpRight, Search, Inbox, Hash } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const TransactionTable = ({
  transactions = [],
  filterType = '',
  onFilterChange,
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 10,
  onPageChange,
  isLoading = false,
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header & Filter Tabs */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Transaction History</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all account debits, credits, and transfers
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => onFilterChange('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === ''
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Types
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('credit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'credit'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Credits
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('debit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'debit'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Debits
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-6">Date & Time</th>
              <th className="py-3 px-6">Type</th>
              <th className="py-3 px-6 text-right">Amount</th>
              <th className="py-3 px-6 text-right">Balance After</th>
              <th className="py-3 px-6">Reference ID</th>
              <th className="py-3 px-6">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-medium text-slate-500">Loading transactions...</span>
                  </div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">No transactions found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {filterType
                        ? `No ${filterType} transactions recorded yet.`
                        : 'Submit a new credit or debit transaction to see it recorded here.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <tr
                    key={tx._id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-6 whitespace-nowrap text-xs text-slate-600 font-medium">
                      {formatDate(tx.created_at)}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <Badge variant={isCredit ? 'credit' : 'debit'}>
                        <span className="flex items-center gap-1">
                          {isCredit ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          {tx.type}
                        </span>
                      </Badge>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-6 whitespace-nowrap text-right font-bold text-sm">
                      <span className={isCredit ? 'text-emerald-600' : 'text-rose-600'}>
                        {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>

                    {/* Balance After */}
                    <td className="py-3.5 px-6 whitespace-nowrap text-right font-semibold text-slate-700 text-xs">
                      {formatCurrency(tx.balance_after)}
                    </td>

                    {/* Reference ID */}
                    <td className="py-3.5 px-6 whitespace-nowrap text-xs font-mono text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                        {tx.reference_id}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-6 text-xs text-slate-500 max-w-xs truncate">
                      {tx.description || <span className="italic text-slate-400">None</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination component */}
      {!isLoading && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default TransactionTable;

