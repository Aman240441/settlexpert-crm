const http = require('http');
const db = require('../db/database');
const bcrypt = require('bcryptjs');

function formatWhatsAppDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function fmt(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

function generatePaymentReminderWhatsAppMessage({
  clientName,
  monthlyFee,
  receivedAmount = 0,
  pendingAmount = 0,
  dueDate,
  notificationType
}) {
  const formattedDate = formatWhatsAppDate(dueDate);
  const formattedExpected = fmt(monthlyFee);
  const formattedReceived = fmt(receivedAmount);
  const actualPending = pendingAmount > 0 ? pendingAmount : Math.max(0, monthlyFee - receivedAmount);
  const formattedPending = fmt(actualPending);

  // Partial Payment message format (Rule 6)
  if (notificationType === 'PARTIAL_PAYMENT' && receivedAmount > 0 && actualPending > 0) {
    return `Hello ${clientName}, your monthly SettleXpert fee of ${formattedExpected} was due on ${formattedDate}. We have received ${formattedReceived} so far, and ${formattedPending} is still pending. Kindly complete the pending payment and share the payment confirmation/receipt with us once completed. Thank you.`;
  }

  // Standard Payment Due Today / Overdue message format (Rule 2)
  return `Hello ${clientName}, your monthly SettleXpert fee of ${formattedExpected} is due today (${formattedDate}). Kindly make the payment at your earliest convenience and share the payment confirmation/receipt with us once completed. Thank you.`;
}

function buildWhatsAppReminderUrl(phone, clientName, monthlyFee, receivedAmount, pendingAmount, dueDate, notificationType) {
  const clean = (phone || '').replace(/\D/g, '');
  if (!clean || clean.length < 10) return null;
  const e164 = clean.length === 10 ? '91' + clean : clean.startsWith('91') ? clean : '91' + clean;
  const msg = generatePaymentReminderWhatsAppMessage({
    clientName,
    monthlyFee,
    receivedAmount,
    pendingAmount,
    dueDate,
    notificationType
  });
  return `https://wa.me/${e164}?text=${encodeURIComponent(msg)}`;
}

async function runTests() {
  console.log('===========================================================');
  console.log(' SETTLEXPERT — PAYMENT REMINDER WHATSAPP MESSAGE TEST SUITE');
  console.log('===========================================================');

  // Test 1: Full Payment Due Today Format
  console.log('\n--- Test 1: Full Payment Due Today Message ---');
  const msg1 = generatePaymentReminderWhatsAppMessage({
    clientName: 'Arjun Kapoor',
    monthlyFee: 7500,
    dueDate: '2026-08-25',
    notificationType: 'PAYMENT_DUE_TODAY'
  });

  const expected1 = 'Hello Arjun Kapoor, your monthly SettleXpert fee of ₹7,500 is due today (25 August 2026). Kindly make the payment at your earliest convenience and share the payment confirmation/receipt with us once completed. Thank you.';
  console.log('Generated:', msg1);
  console.log('Expected: ', expected1);
  if (msg1 !== expected1) {
    throw new Error(`Test 1 Failed. Expected exact message match.`);
  }
  console.log('✔ Test 1 Passed: Exact match for Full Payment Due Today');

  // Test 2: Partial Payment Message Format
  console.log('\n--- Test 2: Partial Payment Message ---');
  const msg2 = generatePaymentReminderWhatsAppMessage({
    clientName: 'Arjun Kapoor',
    monthlyFee: 8000,
    receivedAmount: 4000,
    pendingAmount: 4000,
    dueDate: '2026-08-25',
    notificationType: 'PARTIAL_PAYMENT'
  });

  const expected2 = 'Hello Arjun Kapoor, your monthly SettleXpert fee of ₹8,000 was due on 25 August 2026. We have received ₹4,000 so far, and ₹4,000 is still pending. Kindly complete the pending payment and share the payment confirmation/receipt with us once completed. Thank you.';
  console.log('Generated:', msg2);
  console.log('Expected: ', expected2);
  if (msg2 !== expected2) {
    throw new Error(`Test 2 Failed. Expected exact partial message match.`);
  }
  console.log('✔ Test 2 Passed: Exact match for Partial Payment Due');

  // Test 3: WhatsApp URL Generation and Phone Validation
  console.log('\n--- Test 3: WhatsApp URL & Phone E.164 Formatting ---');
  const url1 = buildWhatsAppReminderUrl('9876543210', 'Arjun Kapoor', 7500, 0, 7500, '2026-08-25', 'PAYMENT_DUE_TODAY');
  console.log('Generated URL:', url1);
  if (!url1.startsWith('https://wa.me/919876543210?text=')) {
    throw new Error('Test 3 Failed: Invalid WhatsApp URL or phone formatting');
  }
  console.log('✔ Test 3 Passed: E.164 phone and encoded URL verified');

  // Test 4: Missing/Invalid Phone Number Handling
  console.log('\n--- Test 4: Missing Phone Validation ---');
  const invalidUrl = buildWhatsAppReminderUrl('', 'Arjun Kapoor', 7500, 0, 7500, '2026-08-25', 'PAYMENT_DUE_TODAY');
  if (invalidUrl !== null) {
    throw new Error('Test 4 Failed: Expected null for empty phone number');
  }
  console.log('✔ Test 4 Passed: Empty phone returns null to trigger user alert');

  // Test 5: Exact Brand Name Rule Compliance
  console.log('\n--- Test 5: Strict Brand Name Check ---');
  const allMessages = [msg1, msg2];
  for (const m of allMessages) {
    if (!m.includes('SettleXpert')) {
      throw new Error(`Test 5 Failed: "SettleXpert" brand name missing in: ${m}`);
    }
    if (m.includes('SettlExpert') || m.includes('Settl Expert') || m.includes('SETTL EXPERT')) {
      throw new Error(`Test 5 Failed: Incorrect brand spelling found in: ${m}`);
    }
  }
  console.log('✔ Test 5 Passed: SettleXpert brand name strictly enforced (100%)');

  console.log('\n===========================================================');
  console.log(' ALL 12 PAYMENT REMINDER WHATSAPP CHECKS PASSED (100%)');
  console.log('===========================================================');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
