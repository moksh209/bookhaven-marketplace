# 📚 BookHaven — Student-to-Student Used Book Marketplace

A modern, responsive online marketplace for students to buy and sell textbooks and literature directly with each other.

---

## ✨ Features & Architecture

### 1. 🎓 Genuine Peer-to-Peer Student Marketplace
- *"Buy and sell used books directly with students."*
- **Zero Bot Accounts & No Automated Products**: The marketplace is populated exclusively by real registered students.
- Unauthenticated visitors start logged out and browse authentic listings.

### 2. 🛡️ Real Human Authentication & Anti-Bot Protection
- Anti-bot CAPTCHA / math challenge on Sign Up prevents automated bots and spam accounts.
- Complete authentication flow: Sign Up, Log In, Log Out, Forgot Password, and Profile settings.
- Only authenticated registered students can list books or initiate private contact.

### 3. ✍️ "Sell a Book" Listing Portal
- Rich book creation form: Title, Author, Academic Subject/Category, Condition (New, Like New, Good, Acceptable), Original & Selling Price, Quantity, Description, Book Photos, and College/Campus.
- Live card preview updating in real time.
- Immediate publication to the marketplace upon submission.

### 4. 💬 Private 1-on-1 Buyer–Seller Chat
- When a buyer is interested in a book, clicking **Buy / Contact Seller** opens a secure private conversation linked to that specific book.
- Strictly isolated: Only the participating buyer and seller can access the conversation (HTTP 403 authorization protection against third parties).

### 5. 📱 Confidential QR Code Payment System
- No integrated fake credit card or automatic gateway.
- Sellers upload their personal UPI / payment QR code in **Payment Settings** in their Seller Dashboard.
- **Strict Privacy**: The seller's QR code is **never** shown publicly on the marketplace or product pages.
- The QR code is revealed **only privately** to the buyer inside the deal conversation.
- Buyer makes manual payment via their UPI / banking app and submits transaction reference ID / proof screenshot.
- Seller receives notification and **manually verifies & confirms** payment receipt in their bank app ("Payment Confirmed").

### 6. 📦 Real-Time Order Lifecycle & Dual Dashboards
- Order Status Lifecycle:
  `Interested` ➔ `Payment Pending` ➔ `Payment Submitted` ➔ `Payment Confirmed` ➔ `Ready for Delivery` ➔ `Delivered`
- **Seller Dashboard**:
  - *My Listings*: Active books, Sold books, Edit listing, Delete listing, Mark as sold.
  - *My Sales*: Buyer, book, price, payment verification, and fulfillment controls.
  - *Payment Settings*: Upload, replace, and remove private QR code, UPI ID, and payment notes.
- **Buyer Dashboard**:
  - *My Purchases*: Track orders and receipts, contact seller.
  - *My Chats*: Active private conversations with sellers.
  - *Profile*: Personal info and campus location.

---

## 🚀 How to Run Locally

1. **Install dependencies** (already installed in workspace):
   ```bash
   npm install
   ```

2. **Start Full-Stack Server**:
   ```bash
   node server/server.js
   ```
   Open your browser at:
   👉 **http://localhost:5000**

3. **Or Run Frontend Dev Server with HMR**:
   ```bash
   npm run dev
   ```
   Vite frontend will be at:
   👉 **http://localhost:5173** (proxied to API on port 5000)

4. **Run Verification Test Suite**:
   ```bash
   node server/test_flows.js
   ```
