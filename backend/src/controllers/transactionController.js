const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const { runInTransaction } = require('../utils/transactionHelper');

// POST /api/accounts/:id/transactions
const createTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, amount, reference_id, description } = req.body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new ApiError(400, 'Amount must be greater than 0');
    }

    if (!type || !['credit', 'debit'].includes(type)) {
      throw new ApiError(400, 'Transaction type must be either credit or debit');
    }

    if (!reference_id || typeof reference_id !== 'string' || !reference_id.trim()) {
      throw new ApiError(400, 'Reference ID is required');
    }

    if (!mongoose.isValidObjectId(id)) {
      throw new ApiError(404, 'Account not found');
    }

    const trimmedRef = reference_id.trim();

    const createdTx = await runInTransaction(async (session) => {
      const sessionOpts = session ? { session } : {};

      // Check if account exists
      const account = await Account.findById(id, null, sessionOpts);
      if (!account) {
        throw new ApiError(404, 'Account not found');
      }

      // Pre-check for duplicate reference_id for this account to fail fast
      const existingTx = await Transaction.findOne(
        { account_id: id, reference_id: trimmedRef },
        null,
        sessionOpts
      );
      if (existingTx) {
        throw new ApiError(
          409,
          'Transaction with this reference_id already exists for this account.'
        );
      }

      let newBalance = account.balance;
      if (type === 'credit') {
        newBalance = Number((account.balance + numAmount).toFixed(2));
      } else if (type === 'debit') {
        if (account.balance < numAmount) {
          throw new ApiError(422, 'Insufficient balance.');
        }
        newBalance = Number((account.balance - numAmount).toFixed(2));
      }

      // Update account balance
      account.balance = newBalance;
      await account.save(sessionOpts);

      // Create transaction record
      const transactionDocs = await Transaction.create(
        [
          {
            account_id: account._id,
            account_name: account.name,
            type,
            amount: numAmount,
            balance_after: newBalance,
            reference_id: trimmedRef,
            description: description ? description.trim() : '',
          },
        ],
        sessionOpts
      );

      return transactionDocs[0];
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction completed successfully',
      data: createdTx,
    });
  } catch (error) {
    // MongoDB duplicate key error code
    if (error.code === 11000) {
      return next(
        new ApiError(409, 'Transaction with this reference_id already exists for this account.')
      );
    }

    next(error);
  }
};

// GET /api/accounts/:id/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, page = 1, limit = 10 } = req.query;

    if (!mongoose.isValidObjectId(id)) {
      throw new ApiError(404, 'Account not found');
    }

    const account = await Account.findById(id);
    if (!account) {
      throw new ApiError(404, 'Account not found');
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    const query = { account_id: id };
    if (type && ['credit', 'debit'].includes(type.toLowerCase())) {
      query.type = type.toLowerCase();
    }

    const totalRecords = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limitNum) || 1;

    const data = await Transaction.find(query)
      .sort({ created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: 'Transactions retrieved successfully',
      currentPage: pageNum,
      pageSize: limitNum,
      totalRecords,
      totalPages,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
};
