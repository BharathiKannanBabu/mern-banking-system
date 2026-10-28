const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Account ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['credit', 'debit'],
        message: 'Transaction type must be either credit or debit',
      },
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    balance_after: {
      type: Number,
      required: [true, 'Balance after transaction is required'],
    },
    reference_id: {
      type: String,
      required: [true, 'Reference ID is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

// Compound unique index: { account_id: 1, reference_id: 1 }
transactionSchema.index({ account_id: 1, reference_id: 1 }, { unique: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;

