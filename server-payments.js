/**
 * Payment & Funding Module
 * Stripe integration for deposits & Apple Pay
 */

const STRIPE_API_KEY = process.env.STRIPE_API_KEY || 'pk_test_...';
const STRIPE_SECRET = process.env.STRIPE_SECRET || 'sk_test_...';

// ==================== PAYMENT HELPERS ====================

/**
 * Create payment intent for deposits
 */
async function createPaymentIntent(userId, amount, currency = 'usd') {
  try {
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: { userId }
      })
    });

    if (!response.ok) throw new Error(`Payment intent error: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error('Payment intent error:', error.message);
    return null;
  }
}

/**
 * Create bank transfer setup
 */
async function setupBankTransfer(userId, bankAccount) {
  try {
    // Create Stripe bank account token
    const response = await fetch('https://api.stripe.com/v1/tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'bank_account[country]': 'US',
        'bank_account[currency]': 'usd',
        'bank_account[account_holder_name]': bankAccount.name,
        'bank_account[account_holder_type]': 'individual',
        'bank_account[account_number]': bankAccount.accountNumber,
        'bank_account[routing_number]': bankAccount.routingNumber
      })
    });

    if (!response.ok) throw new Error(`Bank setup error: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error('Bank setup error:', error.message);
    return null;
  }
}

/**
 * Process Apple Pay payment
 */
async function processApplePayment(token, amount, userId) {
  try {
    // Create charge from Apple Pay token
    const response = await fetch('https://api.stripe.com/v1/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        amount: Math.round(amount * 100),
        currency: 'usd',
        source: token,
        description: `RDCM Deposit for ${userId}`,
        metadata: { userId }
      })
    });

    if (!response.ok) throw new Error(`Charge error: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error('Payment error:', error.message);
    return null;
  }
}

/**
 * Get payment methods
 */
async function getPaymentMethods(userId, customerId) {
  try {
    const response = await fetch(
      `https://api.stripe.com/v1/customers/${customerId}/payment_methods`,
      {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET}`
        }
      }
    );

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error('Payment methods error:', error.message);
    return null;
  }
}

module.exports = {
  createPaymentIntent,
  setupBankTransfer,
  processApplePayment,
  getPaymentMethods
};
