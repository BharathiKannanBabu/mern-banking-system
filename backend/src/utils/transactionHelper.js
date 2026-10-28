const mongoose = require('mongoose');

/**
 * Executes a callback within a MongoDB session transaction if supported (replica set / Atlas / mongos).
 * Automatically falls back to session-less execution on standalone MongoDB instances.
 *
 * @param {Function} workFn - async (session) => result
 * @returns {Promise<any>}
 */
const runInTransaction = async (workFn) => {
  const topologyType = mongoose.connection.client?.topology?.description?.type;
  const isStandalone = topologyType === 'Single';

  // If connected to standalone MongoDB without replica set, run directly
  if (isStandalone) {
    return await workFn(null);
  }

  let session = null;
  try {
    session = await mongoose.startSession();
  } catch (sessionErr) {
    // If sessions cannot be created, execute directly
    return await workFn(null);
  }

  try {
    session.startTransaction();
    const result = await workFn(session);
    if (session.inTransaction()) {
      await session.commitTransaction();
    }
    return result;
  } catch (error) {
    if (session && session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (_) {}
    }

    // Check if error is due to MongoDB running in standalone mode (no replica set)
    if (
      error.message &&
      (error.message.includes('replica set member or mongos') ||
        error.message.includes('Transaction numbers are only allowed'))
    ) {
      console.warn(
        '⚠️ MongoDB standalone instance detected (transactions require a replica set). Falling back to direct atomic execution.'
      );
      return await workFn(null);
    }

    throw error;
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (_) {}
    }
  }
};

module.exports = {
  runInTransaction,
};

