const express = require('express');
const { body, query } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const validate = require('../middleware/validate');

const router = express.Router({ mergeParams: true });

// POST /api/accounts/:id/transactions
router.post(
  '/',
  validate([
    body('type')
      .notEmpty()
      .withMessage('Transaction type is required')
      .isIn(['credit', 'debit'])
      .withMessage('Transaction type must be "credit" or "debit"'),
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('reference_id')
      .trim()
      .notEmpty()
      .withMessage('reference_id is required'),
    body('description')
      .optional()
      .isString()
      .withMessage('Description must be a string'),
  ]),
  transactionController.createTransaction
);

// GET /api/accounts/:id/transactions
router.get(
  '/',
  validate([
    query('type')
      .optional()
      .isIn(['credit', 'debit'])
      .withMessage('Query type must be "credit" or "debit"'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be an integer between 1 and 100'),
  ]),
  transactionController.getTransactions
);

module.exports = router;

