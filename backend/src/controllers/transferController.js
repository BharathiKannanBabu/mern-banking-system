const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const { runInTransaction } = require('../utils/transactionHelper');

// POST /api/transfers
const transferFunds = async (req, res, next) => {
  try {
    const { from_account_id, to_account_id, amount, reference_id, description } = req.body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new ApiError(400, 'Transfer amount must be greater than 0');
    }

    if (!from_account_id || !to_account_id) {
      throw new ApiError(400, 'Both source and destination account IDs are required');
    }

    if (from_account_id.toString() === to_account_id.toString()) {
      throw new ApiError(400, 'Cannot transfer to the same account');
    }

    if (!reference_id || typeof reference_id !== 'string' || !reference_id.trim()) {
      throw new ApiError(400, 'Reference ID is required');
    }

    // Validate account ID formats
    if (!mongoose.isValidObjectId(from_account_id)) {
      throw new ApiError(404, 'Source account not found');
    }

    if (!mongoose.isValidObjectId(to_account_id)) {
      throw new ApiError(404, 'Destination account not found');
    }

    const trimmedRef = reference_id.trim();

    const transferResult = await runInTransaction(async (session) => {
      const sessionOpts = session ? { session } : {};

      // Retrieve both accounts
      const fromAccount = await Account.findById(from_account_id, null, sessionOpts);
      if (!fromAccount) {
        throw new ApiError(404, 'Source account not found');
      }

      const toAccount = await Account.findById(to_account_id, null, sessionOpts);
      if (!toAccount) {
        throw new ApiError(404, 'Destination account not found');
      }

      // Pre-check duplicate reference_id for both accounts
      const existingFromTx = await Transaction.findOne(
        { account_id: fromAccount._id, reference_id: trimmedRef },
        null,
        sessionOpts
      );
      if (existingFromTx) {
        throw new ApiError(
          409,
          'Transaction with this reference_id already exists for this account.'
        );
      }

      const existingToTx = await Transaction.findOne(
        { account_id: toAccount._id, reference_id: trimmedRef },
        null,
        sessionOpts
      );
      if (existingToTx) {
        throw new ApiError(
          409,
          'Transaction with this reference_id already exists for destination account.'
        );
      }

      // Check balance
      if (fromAccount.balance < numAmount) {
        throw new ApiError(422, 'Insufficient balance.');
      }

      // Calculate new balances
      const newFromBalance = Number((fromAccount.balance - numAmount).toFixed(2));
      const newToBalance = Number((toAccount.balance + numAmount).toFixed(2));

      // Update both accounts
      fromAccount.balance = newFromBalance;
      await fromAccount.save(sessionOpts);

      toAccount.balance = newToBalance;
      await toAccount.save(sessionOpts);

      const descNote = description ? description.trim() : '';
      const fromDesc = descNote
        ? `Transfer to ${toAccount.name}: ${descNote}`
        : `Transfer to ${toAccount.name}`;
      const toDesc = descNote
        ? `Transfer from ${fromAccount.name}: ${descNote}`
        : `Transfer from ${fromAccount.name}`;

      // Create transaction records
      const createdTransactions = await Transaction.create(
        [
          {
            account_id: fromAccount._id,
            account_name: fromAccount.name,
            type: 'debit',
            amount: numAmount,
            balance_after: newFromBalance,
            reference_id: trimmedRef,
            description: fromDesc,
          },
          {
            account_id: toAccount._id,
            account_name: toAccount.name,
            type: 'credit',
            amount: numAmount,
            balance_after: newToBalance,
            reference_id: trimmedRef,
            description: toDesc,
          },
        ],
        sessionOpts
      );

      return {
        transfer_reference: trimmedRef,
        amount: numAmount,
        from_account: {
          id: fromAccount._id,
          name: fromAccount.name,
          balance: newFromBalance,
          transaction_id: createdTransactions[0]._id,
        },
        to_account: {
          id: toAccount._id,
          name: toAccount.name,
          balance: newToBalance,
          transaction_id: createdTransactions[1]._id,
        },
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Transfer completed successfully',
      data: transferResult,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new ApiError(409, 'Transaction with this reference_id already exists for this account.')
      );
    }
    next(error);
  }
};

module.exports = {
  transferFunds,
};
