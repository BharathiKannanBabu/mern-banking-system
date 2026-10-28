const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    if (err.keyPattern && (err.keyPattern.reference_id || err.keyPattern.account_id)) {
      message = 'Transaction with this reference_id already exists for this account.';
    } else {
      const keys = Object.keys(err.keyValue || {}).join(', ');
      message = `Duplicate value error for field(s): ${keys}`;
    }
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id: ${err.value}`;
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const validationErrors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = validationErrors[0]?.message || 'Validation Error';
    errors = validationErrors;
  }

  // Handle JSON parsing errors in express
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
  });
};

module.exports = errorHandler;

