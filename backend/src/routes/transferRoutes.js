const express = require('express');
const { body } = require('express-validator');
const transferController = require('../controllers/transferController');
const validate = require('../middleware/validate');

const router = express.Router();

// POST /api/transfers
router.post(
  '/',
  validate([
    body('from_account_id')
      .notEmpty()
      .withMessage('Source account ID (from_account_id) is required'),
    body('to_account_id')
      .notEmpty()
      .withMessage('Destination account ID (to_account_id) is required'),
    body('amount')
      .notEmpty()
      .withMessage('Transfer amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Transfer amount must be greater than 0'),
    body('reference_id')
      .trim()
      .notEmpty()
      .withMessage('reference_id is required'),
    body('description')
      .optional()
      .isString()
      .withMessage('Description must be a string'),
  ]),
  transferController.transferFunds
);

module.exports = router;
