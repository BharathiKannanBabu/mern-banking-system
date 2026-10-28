const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Account = require('../src/models/Account');
const Transaction = require('../src/models/Transaction');

async function runUnitTests() {
  console.log('🧪 Running Comprehensive API & Schema Unit Tests...\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(message);
    }
    passed++;
    console.log(`✅ PASS: ${message}`);
  }

  try {
    // 1. Model Schema Tests
    console.log('--- Model Schema Definitions ---');
    const accPaths = Account.schema.paths;
    assert(accPaths.name !== undefined, 'Account schema has "name" path');
    assert(accPaths.name.isRequired === true, 'Account "name" is required');
    assert(accPaths.balance !== undefined, 'Account schema has "balance" path');
    assert(accPaths.balance.defaultValue === 0, 'Account default balance is 0');

    const txPaths = Transaction.schema.paths;
    assert(txPaths.account_id !== undefined, 'Transaction schema has "account_id"');
    assert(txPaths.account_name !== undefined, 'Transaction schema has "account_name"');
    assert(txPaths.account_name.isRequired === true, 'Transaction "account_name" is required');
    assert(txPaths.type !== undefined, 'Transaction schema has "type"');
    assert(
      JSON.stringify(txPaths.type.enumValues) === JSON.stringify(['credit', 'debit']),
      'Transaction type enum is ["credit", "debit"]'
    );
    assert(txPaths.amount !== undefined, 'Transaction schema has "amount"');
    assert(txPaths.balance_after !== undefined, 'Transaction schema has "balance_after"');
    assert(txPaths.reference_id !== undefined, 'Transaction schema has "reference_id"');

    // Verify compound unique index
    const indexes = Transaction.schema.indexes();
    const compoundUniqueIndex = indexes.find(
      ([idx, opts]) => idx.account_id === 1 && idx.reference_id === 1 && opts.unique === true
    );
    assert(
      compoundUniqueIndex !== undefined,
      'Transaction schema enforces compound unique index { account_id: 1, reference_id: 1 }'
    );

    // 2. Request Validation Middleware Tests (without requiring DB connection)
    console.log('\n--- Input Validation & HTTP Status 400 Tests ---');

    // Test: Create account with missing name
    const resAccEmpty = await request(app).post('/api/accounts').send({});
    assert(resAccEmpty.status === 400, 'POST /api/accounts with empty body returns 400');
    assert(resAccEmpty.body.success === false, 'Error response has success: false');

    // Test: Create account with negative initial balance
    const resAccNeg = await request(app)
      .post('/api/accounts')
      .send({ name: 'Test User', initial_balance: -100 });
    assert(resAccNeg.status === 400, 'POST /api/accounts with negative initial_balance returns 400');

    // Test: Transaction creation with invalid type
    const resTxBadType = await request(app)
      .post('/api/accounts/609c1234567890abcdef1234/transactions')
      .send({
        type: 'invalid_type',
        amount: 50,
        reference_id: 'REF-001',
      });
    assert(resTxBadType.status === 400, 'POST transactions with invalid type returns 400');

    // Test: Transaction creation with zero/negative amount
    const resTxBadAmount = await request(app)
      .post('/api/accounts/609c1234567890abcdef1234/transactions')
      .send({
        type: 'credit',
        amount: 0,
        reference_id: 'REF-001',
      });
    assert(resTxBadAmount.status === 400, 'POST transactions with 0 amount returns 400');

    // Test: Transaction creation with missing reference_id
    const resTxNoRef = await request(app)
      .post('/api/accounts/609c1234567890abcdef1234/transactions')
      .send({
        type: 'credit',
        amount: 50,
      });
    assert(resTxNoRef.status === 400, 'POST transactions with missing reference_id returns 400');

    // Test: Transfer with missing parameters
    const resTrfEmpty = await request(app).post('/api/transfers').send({});
    assert(resTrfEmpty.status === 400, 'POST /api/transfers with empty body returns 400');

    // Test: Transfer with invalid amount
    const resTrfBadAmount = await request(app)
      .post('/api/transfers')
      .send({
        from_account_id: '609c1234567890abcdef1234',
        to_account_id: '609c1234567890abcdef5678',
        amount: -5,
        reference_id: 'TRF-001',
      });
    assert(resTrfBadAmount.status === 400, 'POST /api/transfers with negative amount returns 400');

    // Test: Transfer to same account
    const resTrfSame = await request(app)
      .post('/api/transfers')
      .send({
        from_account_id: '609c1234567890abcdef1234',
        to_account_id: '609c1234567890abcdef1234',
        amount: 10,
        reference_id: 'TRF-001',
      });
    assert(resTrfSame.status === 400, 'POST /api/transfers to same account returns 400');
    assert(
      resTrfSame.body.message === 'Cannot transfer to the same account',
      'Cannot transfer to same account message verified'
    );

    // 3. HTTP 404 Handling for Invalid/Non-existent Account IDs
    console.log('\n--- HTTP 404 Status Code Tests ---');
    const resInvIdBal = await request(app).get('/api/accounts/invalid-id/balance');
    assert(resInvIdBal.status === 404, 'GET /api/accounts/invalid-id/balance returns 404');

    const resInvIdTx = await request(app).get('/api/accounts/invalid-id/transactions');
    assert(resInvIdTx.status === 404, 'GET /api/accounts/invalid-id/transactions returns 404');

    const resTrfInvalidSource = await request(app)
      .post('/api/transfers')
      .send({
        from_account_id: 'invalid-id',
        to_account_id: '609c1234567890abcdef5678',
        amount: 10,
        reference_id: 'TRF-001',
      });
    assert(
      resTrfInvalidSource.status === 404,
      'POST /api/transfers with invalid source ID format returns 404'
    );

    // 4. Undefined Routes 404 Test
    console.log('\n--- Undefined Routes Tests ---');
    const resUnknown = await request(app).get('/api/unknown-endpoint');
    assert(resUnknown.status === 404, 'Unknown endpoint returns 404');
    assert(resUnknown.body.success === false, 'Unknown route error body has success: false');

    // 5. Health Check Endpoint
    const resHealth = await request(app).get('/api/health');
    assert(resHealth.status === 200, 'GET /api/health returns 200 OK');

    console.log(`\n🎉 ALL ${passed}/${total} UNIT TESTS PASSED SUCCESSFULLY!\n`);
  } catch (err) {
    console.error('Unit tests failed:', err);
    process.exit(1);
  }
}

runUnitTests();

