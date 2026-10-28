const express = require('express');
const { body } = require('express-validator');
const accountController = require('../controllers/accountController');
const transactionRoutes = require('./transactionRoutes');
const validate = require('../middleware/validate');

const router = express.Router();

// Mount nested transaction routes: /api/accounts/:id/transactions
router.use('/:id/transactions', transactionRoutes);

// POST /api/accounts
router.post(
  '/',
  validate([
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Account name is required'),
    body('initial_balance')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Initial balance must be a non-negative number'),
  ]),
  accountController.createAccount
);

// GET /api/accounts
router.get('/', accountController.listAccounts);

// GET /api/accounts/:id/balance
router.get('/:id/balance', accountController.getAccountBalance);

// GET /api/accounts/:id
router.get('/:id', accountController.getAccountById);

module.exports = router;

