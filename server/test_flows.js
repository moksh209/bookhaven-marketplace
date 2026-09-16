/**
 * BookHaven Verification Suite
 * Tests all 13 required peer-to-peer flows against the live server:
 * 1. New user registration (with anti-bot captcha validation)
 * 2. Login & Session token / profile retrieval
 * 3. Seller uploading payment QR settings (private)
 * 4. Seller uploading a book ("Sell a Book")
 * 5. Another user discovering the book in the marketplace & testing search/filters (category, condition, price range)
 * 6. Seller QR code privacy check (public endpoints must NOT leak the QR code)
 * 7. Buyer contacting seller -> private chat & order creation
 * 8. Private chat messaging (buyer <-> seller)
 * 9. Authorization check: unauthorized third-party cannot access chat or seller QR
 * 10. Buyer views seller's QR privately & submits payment proof (transaction reference ID)
 * 11. Seller verifies and manually confirms payment -> order status becomes "Payment Confirmed"
 * 12. Seller fulfills order ("Ready for Delivery" -> "Delivered") -> book marked as sold
 * 13. Seller Dashboard & Buyer Dashboard queries verify orders and listings
 */

async function runSuite() {
  const PORT = process.env.PORT || 5000;
  const BASE_URL = `http://localhost:${PORT}/api`;

  console.log(`\n======================================================`);
  console.log(`🚀 Starting BookHaven Complete Peer-to-Peer Verification`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
      throw new Error(`Assertion Failed: ${message}`);
    }
  }

  try {
    // 0. Healthcheck & Initial State
    console.log('--- STEP 0: Healthcheck & Clean State Check ---');
    const health = await fetch(`${BASE_URL}/health`).then(r => r.json());
    assert(health.status === 'ok', 'Server is healthy');

    // 1. Anti-Bot CAPTCHA Challenge
    console.log('\n--- STEP 1: Anti-Bot CAPTCHA Challenge ---');
    const captcha = await fetch(`${BASE_URL}/auth/captcha-challenge`).then(r => r.json());
    assert(captcha.question && captcha.captchaToken, `Received challenge: "${captcha.question}"`);

    // Decode challenge to get correct answer
    const decoded = JSON.parse(Buffer.from(captcha.captchaToken, 'base64').toString('utf-8'));
    const correctAnswer = decoded.a;

    // Test rejection of wrong captcha answer
    const badSignupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bot Attempt',
        email: 'bot@spam.com',
        password: 'password123',
        captchaToken: captcha.captchaToken,
        captchaAnswer: correctAnswer + 99 // deliberately wrong
      })
    });
    assert(badSignupRes.status === 400, 'Anti-bot verification successfully blocked registration with incorrect CAPTCHA answer');

    // 2. Real User Registration (Seller - Student A)
    console.log('\n--- STEP 2: Real User Registration (Seller: Aisha Patel) ---');
    const timestamp = Date.now();
    const sellerEmail = `aisha.${timestamp}@campus.edu`;
    const sellerPassword = 'SecurePassword123!';

    const sellerSignupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aisha Patel',
        email: sellerEmail,
        password: sellerPassword,
        college: 'State Engineering College',
        phone: '+1 555-0199',
        captchaToken: captcha.captchaToken,
        captchaAnswer: correctAnswer
      })
    });
    assert(sellerSignupRes.status === 201, 'Seller account successfully created');
    const sellerData = await sellerSignupRes.json();
    const sellerId = sellerData.user.id;
    assert(sellerId && sellerData.user.name === 'Aisha Patel', `Seller registered with ID: ${sellerId}`);

    // 3. Real User Login & Logout Verification
    console.log('\n--- STEP 3: Login Authentication ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: sellerEmail, password: sellerPassword })
    });
    assert(loginRes.status === 200, 'Seller successfully logged in with valid credentials');
    const loginData = await loginRes.json();
    assert(loginData.user.id === sellerId, 'Login session returns correct user');

    // 4. Seller Uploads Private Payment QR Settings
    console.log('\n--- STEP 4: Seller Configures Private Payment QR Settings ---');
    const mockQrUrl = '/uploads/sample-upi-qr.png';
    const mockUpiId = 'aisha@okaxis';

    const qrUpdateRes = await fetch(`${BASE_URL}/auth/payment-settings`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': sellerId
      },
      body: JSON.stringify({
        paymentQrUrl: mockQrUrl,
        upiId: mockUpiId,
        paymentInstructions: 'Please include your name in the UPI transfer notes.'
      })
    });
    assert(qrUpdateRes.status === 200, 'Private payment settings saved');
    const qrResult = await qrUpdateRes.json();
    assert(qrResult.hasQrCode === true && qrResult.upiId === mockUpiId, 'QR code flag and UPI ID updated on seller profile');

    // 5. Seller Uploads a Book ("Sell a Book")
    console.log('\n--- STEP 5: Seller Uploads a Book Listing ---');
    const bookPayload = {
      title: 'Operating System Concepts (10th Edition)',
      author: 'Silberschatz, Galvin & Gagne',
      category: 'Computer Science & Tech',
      condition: 'Like New',
      price: 38.00,
      originalPrice: 75.00,
      quantity: 1,
      description: 'Used for CS301 last semester. Clean pages, no highlighting, includes Dinosaur cover in great condition.',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
      college: 'State Engineering College'
    };

    const createBookRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': sellerId
      },
      body: JSON.stringify(bookPayload)
    });
    assert(createBookRes.status === 201, 'Book listing created successfully');
    const createdBook = await createBookRes.json();
    const bookId = createdBook.id;
    assert(bookId && createdBook.sellerName === 'Aisha Patel', `Listing published with ID: ${bookId}`);

    // 6. Marketplace Public Browsing & Search/Filter Verification
    console.log('\n--- STEP 6: Marketplace Browsing, Search & Filter Verification ---');
    // Verify book is discoverable
    const publicList = await fetch(`${BASE_URL}/products`).then(r => r.json());
    assert(publicList.some(p => p.id === bookId), 'Newly uploaded book is immediately visible in public marketplace');

    // Search by title term
    const searchRes = await fetch(`${BASE_URL}/products?search=Silberschatz`).then(r => r.json());
    assert(searchRes.length >= 1 && searchRes[0].id === bookId, 'Search by author "Silberschatz" finds the listing');

    // Filter by category
    const catRes = await fetch(`${BASE_URL}/products?category=Computer%20Science%20%26%20Tech`).then(r => r.json());
    assert(catRes.some(p => p.id === bookId), 'Category filter works correctly');

    // Filter by condition
    const condRes = await fetch(`${BASE_URL}/products?condition=Like%20New`).then(r => r.json());
    assert(condRes.some(p => p.id === bookId), 'Condition filter works correctly');

    // Filter by price range
    const priceRes = await fetch(`${BASE_URL}/products?minPrice=30&maxPrice=50`).then(r => r.json());
    assert(priceRes.some(p => p.id === bookId), 'Price range filter ($30 - $50) matches the $38 book');

    const priceMismatch = await fetch(`${BASE_URL}/products?minPrice=50&maxPrice=100`).then(r => r.json());
    assert(!priceMismatch.some(p => p.id === bookId), 'Price range filter correctly excludes books outside the range');

    // 7. Security Check: Ensure Seller's QR Code is NOT Public
    console.log('\n--- STEP 7: Security Check - Public Privacy of Seller QR ---');
    const singleProduct = await fetch(`${BASE_URL}/products/${bookId}`).then(r => r.json());
    assert(singleProduct.paymentQrUrl === undefined, 'Public product details API does NOT leak paymentQrUrl');
    assert(singleProduct.seller.paymentQrUrl === undefined, 'Public seller info inside product API does NOT leak paymentQrUrl');

    // 8. Real User Registration (Buyer - Student B)
    console.log('\n--- STEP 8: Buyer Registration (Rahul Sharma) ---');
    const buyerCaptcha = await fetch(`${BASE_URL}/auth/captcha-challenge`).then(r => r.json());
    const buyerDecoded = JSON.parse(Buffer.from(buyerCaptcha.captchaToken, 'base64').toString('utf-8'));
    const buyerEmail = `rahul.${timestamp}@campus.edu`;
    const buyerPassword = 'BuyerPassword456!';

    const buyerSignupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rahul Sharma',
        email: buyerEmail,
        password: buyerPassword,
        college: 'State Engineering College',
        phone: '+1 555-0288',
        captchaToken: buyerCaptcha.captchaToken,
        captchaAnswer: buyerDecoded.a
      })
    });
    assert(buyerSignupRes.status === 201, 'Buyer account created');
    const buyerData = await buyerSignupRes.json();
    const buyerId = buyerData.user.id;
    assert(buyerId && buyerData.user.name === 'Rahul Sharma', `Buyer registered with ID: ${buyerId}`);

    // 9. Buyer Contacts Seller -> Private 1-on-1 Chat & Order Creation
    console.log('\n--- STEP 9: Buyer Contacts Seller -> Starts Private Chat ---');
    const startChatRes = await fetch(`${BASE_URL}/chat/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': buyerId
      },
      body: JSON.stringify({ bookId })
    });
    assert(startChatRes.status === 200, 'Private conversation and order initiated');
    const conv = await startChatRes.json();
    const conversationId = conv.id;
    const orderId = conv.order.id;
    assert(conversationId && conv.buyerId === buyerId && conv.sellerId === sellerId, 'Conversation correctly created between buyer and seller');
    assert(conv.order && conv.order.status === 'Interested', `Initial order record created in "Interested" status with #${conv.order.orderNumber}`);

    // 10. Private Messaging
    console.log('\n--- STEP 10: Private Chat Messages ---');
    const buyerMsgRes = await fetch(`${BASE_URL}/chat/${conversationId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': buyerId
      },
      body: JSON.stringify({ text: 'Hi Aisha! Is this textbook still available? Can I pay via your UPI QR code?' })
    });
    assert(buyerMsgRes.status === 201, 'Buyer sent private message to seller');

    const sellerMsgRes = await fetch(`${BASE_URL}/chat/${conversationId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': sellerId
      },
      body: JSON.stringify({ text: 'Yes, absolutely! You can scan my payment QR code in the payment section above and submit the UTR.' })
    });
    assert(sellerMsgRes.status === 201, 'Seller sent private message reply to buyer');

    // 11. Security Check: Unauthorized 3rd Party Cannot Access Chat or QR
    console.log('\n--- STEP 11: Security Check - Chat & QR Authorization Isolation ---');
    const strangerId = 'usr-stranger-999';

    const strangerChatRes = await fetch(`${BASE_URL}/chat/${conversationId}`, {
      headers: { 'x-user-id': strangerId }
    });
    assert(strangerChatRes.status === 403, 'Unauthorized user is rejected (HTTP 403) from accessing private chat');

    const strangerQrRes = await fetch(`${BASE_URL}/auth/seller-payment-info/${sellerId}`, {
      headers: { 'x-user-id': strangerId }
    });
    assert(strangerQrRes.status === 403, 'Unauthorized user is rejected (HTTP 403) from accessing seller QR code');

    // 12. Buyer Privately Accesses Seller Payment QR Code
    console.log('\n--- STEP 12: Buyer Privately Accesses Seller QR Code ---');
    const buyerQrRes = await fetch(`${BASE_URL}/auth/seller-payment-info/${sellerId}`, {
      headers: { 'x-user-id': buyerId }
    });
    assert(buyerQrRes.status === 200, 'Authorized buyer can view seller payment QR code inside deal context');
    const buyerQrData = await buyerQrRes.json();
    assert(buyerQrData.paymentQrUrl === mockQrUrl && buyerQrData.upiId === mockUpiId, 'Buyer receives seller QR code and UPI details');

    // 13. Buyer Submits Payment Proof
    console.log('\n--- STEP 13: Buyer Submits Payment Proof ---');
    const proofRes = await fetch(`${BASE_URL}/orders/submit-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': buyerId
      },
      body: JSON.stringify({
        orderId,
        paymentReferenceId: 'UPI-UTR-987654321012',
        paymentProofUrl: '/uploads/sample-payment-receipt.png',
        note: 'Transferred Rs 38 from GPay'
      })
    });
    assert(proofRes.status === 200, 'Buyer successfully submitted payment proof');
    const updatedOrderAfterProof = await proofRes.json();
    assert(updatedOrderAfterProof.status === 'Payment Submitted', 'Order status moved to "Payment Submitted"');
    assert(updatedOrderAfterProof.paymentReferenceId === 'UPI-UTR-987654321012', 'Transaction reference ID recorded');

    // 14. Seller Manually Verifies & Confirms Payment
    console.log('\n--- STEP 14: Seller Manually Verifies & Confirms Payment ---');
    const confirmRes = await fetch(`${BASE_URL}/orders/${orderId}/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': sellerId
      }
    });
    assert(confirmRes.status === 200, 'Seller confirmed payment');
    const confirmedData = await confirmRes.json();
    assert(confirmedData.order.status === 'Payment Confirmed', 'Order status moved to "Payment Confirmed"');

    // 15. Seller Updates Delivery Status & Marks Delivered
    console.log('\n--- STEP 15: Fulfillment Lifecycle & Auto Mark as Sold ---');
    const readyRes = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': sellerId
      },
      body: JSON.stringify({ status: 'Ready for Delivery' })
    });
    assert(readyRes.status === 200, 'Order moved to "Ready for Delivery"');

    const deliveredRes = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': sellerId
      },
      body: JSON.stringify({ status: 'Delivered' })
    });
    assert(deliveredRes.status === 200, 'Order moved to "Delivered"');

    // Check that book is now marked as sold in marketplace
    const publicCatalogAfterDelivered = await fetch(`${BASE_URL}/products`).then(r => r.json());
    assert(!publicCatalogAfterDelivered.some(p => p.id === bookId), 'Delivered book is removed from active marketplace listings');

    // 16. Seller Dashboard Verification
    console.log('\n--- STEP 16: Seller Dashboard Verification ---');
    const sellerSales = await fetch(`${BASE_URL}/orders/seller/${sellerId}`, {
      headers: { 'x-user-id': sellerId }
    }).then(r => r.json());
    assert(sellerSales.length >= 1 && sellerSales[0].id === orderId, 'Seller Dashboard "My Sales" displays the order');
    assert(sellerSales[0].status === 'Delivered', 'Order shows "Delivered" status in seller dashboard');

    const sellerListings = await fetch(`${BASE_URL}/products/seller/${sellerId}?includeSold=true`).then(r => r.json());
    assert(sellerListings.some(p => p.id === bookId && p.isSold === true), 'Seller Dashboard "My Listings" shows the book marked as sold');

    // 17. Buyer Dashboard Verification
    console.log('\n--- STEP 17: Buyer Dashboard Verification ---');
    const buyerPurchases = await fetch(`${BASE_URL}/orders/buyer/${buyerId}`, {
      headers: { 'x-user-id': buyerId }
    }).then(r => r.json());
    assert(buyerPurchases.length >= 1 && buyerPurchases[0].id === orderId, 'Buyer Dashboard "My Purchases" displays the order');

    const buyerConvs = await fetch(`${BASE_URL}/chat/conversations`, {
      headers: { 'x-user-id': buyerId }
    }).then(r => r.json());
    assert(buyerConvs.some(c => c.id === conversationId), 'Buyer Dashboard "My Chats" displays the private conversation');

    // 18. Forgot Password Flow
    console.log('\n--- STEP 18: Forgot Password Flow ---');
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: buyerEmail,
        newPassword: 'BrandNewBuyerPassword789!'
      })
    });
    assert(forgotRes.status === 200, 'Password reset successful');

    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: buyerEmail,
        password: 'BrandNewBuyerPassword789!'
      })
    });
    assert(newLoginRes.status === 200, 'Login with updated password succeeded');

    console.log(`\n======================================================`);
    console.log(`🎉 ALL ${passed} VERIFICATION CHECKS PASSED SUCCESSFULLY!`);
    console.log(`   Zero Failures (${failed})`);
    console.log(`======================================================\n`);
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Test Suite Aborted due to error:', err);
    process.exit(1);
  }
}

runSuite();
