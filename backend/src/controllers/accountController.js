const mongoose = require('mongoose');
const Account = require('../models/Account');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// POST /api/accounts
const createAccount = async (req, res, next) => {
  try {
    const { name, initial_balance } = req.body;

    const parsedBalance = initial_balance !== undefined ? Number(initial_balance) : 0;
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      throw new ApiError(400, 'Initial balance must be a non-negative number');
    }

    const account = await Account.create({
      name: name.trim(),
      balance: parsedBalance,
    });

    return new ApiResponse(201, 'Account created successfully', account).send(res);
  } catch (error) {
    next(error);
  }
};

// GET /api/accounts/:id/balance
const getAccountBalance = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw new ApiError(404, 'Account not found');
    }

    const account = await Account.findById(id);
    if (!account) {
      throw new ApiError(404, 'Account not found');
    }

    return new ApiResponse(200, 'Account balance retrieved successfully', {
      account_id: account._id,
      name: account.name,
      balance: account.balance,
    }).send(res);
  } catch (error) {
    next(error);
  }
};

// GET /api/accounts
const listAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find().sort({ created_at: -1 });

    return new ApiResponse(200, 'Accounts retrieved successfully', accounts).send(res);
  } catch (error) {
    next(error);
  }
};

// GET /api/accounts/:id (convenience endpoint for account details)
const getAccountById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw new ApiError(404, 'Account not found');
    }

    const account = await Account.findById(id);
    if (!account) {
      throw new ApiError(404, 'Account not found');
    }

    return new ApiResponse(200, 'Account retrieved successfully', account).send(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAccount,
  getAccountBalance,
  listAccounts,
  getAccountById,
};
