import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  defaultCategories, 
  defaultUsers, 
  defaultProducts, 
  defaultOrders, 
  defaultConversations, 
  defaultMessages 
} from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: defaultUsers,
      products: defaultProducts,
      categories: defaultCategories,
      orders: defaultOrders,
      conversations: defaultConversations,
      messages: defaultMessages
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

initDb();

function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.conversations) data.conversations = [];
    if (!data.messages) data.messages = [];
    if (!data.orders) data.orders = [];
    if (!data.products) data.products = [];
    if (!data.users) data.users = [];
    if (!data.categories) data.categories = defaultCategories;
    return data;
  } catch (err) {
    console.error('Error reading DB, re-initializing...', err);
    initDb();
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const db = {
  // -------------------------------------------------------------
  // USERS & AUTH
  // -------------------------------------------------------------
  getUsers: () => readDb().users,
  
  getUserById: (id) => {
    return readDb().users.find(u => u.id === id);
  },

  getUserByEmail: (email) => {
    if (!email) return null;
    return readDb().users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser: (userData) => {
    const data = readDb();
    const newUser = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: userData.password, // In a full prod app this would be hashed with bcrypt
      college: userData.college ? userData.college.trim() : 'College Campus',
      location: userData.location || userData.college || 'Campus',
      phone: userData.phone || '',
      bio: userData.bio || 'Student & book seller on BookHaven.',
      avatar: userData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}&backgroundColor=b46e1c`,
      rating: 5.0,
      joinedDate: new Date().toISOString().split('T')[0],
      paymentQrUrl: null, // Private QR code image uploaded by seller
      upiId: null,        // Optional UPI handle or instructions
      paymentInstructions: null,
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeDb(data);
    return newUser;
  },

  updateUser: (id, updates) => {
    const data = readDb();
    const index = data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    data.users[index] = { ...data.users[index], ...updates };
    writeDb(data);
    return data.users[index];
  },

  // Seller Payment QR Settings (Private)
  updatePaymentSettings: (userId, { paymentQrUrl, upiId, paymentInstructions }) => {
    const data = readDb();
    const user = data.users.find(u => u.id === userId);
    if (!user) return null;
    if (paymentQrUrl !== undefined) user.paymentQrUrl = paymentQrUrl;
    if (upiId !== undefined) user.upiId = upiId;
    if (paymentInstructions !== undefined) user.paymentInstructions = paymentInstructions;
    writeDb(data);
    return {
      paymentQrUrl: user.paymentQrUrl,
      upiId: user.upiId,
      paymentInstructions: user.paymentInstructions
    };
  },

  // Get Seller Private Payment info (Accessible ONLY by authorized buyer in an active conversation/order)
  getSellerPrivatePaymentInfo: (sellerId) => {
    const user = readDb().users.find(u => u.id === sellerId);
    if (!user) return null;
    return {
      sellerId: user.id,
      sellerName: user.name,
      college: user.college,
      paymentQrUrl: user.paymentQrUrl || null,
      upiId: user.upiId || null,
      paymentInstructions: user.paymentInstructions || null
    };
  },

  // Public Profile (STRIPPED OF PRIVATE QR AND CREDENTIALS)
  getPublicUserProfile: (userId) => {
    const user = readDb().users.find(u => u.id === userId);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      college: user.college,
      location: user.location,
      bio: user.bio,
      avatar: user.avatar,
      rating: user.rating,
      joinedDate: user.joinedDate
    };
  },

  // -------------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------------
  getCategories: () => {
    const data = readDb();
    return data.categories.map(cat => {
      const count = data.products.filter(p => !p.isSold && (
        p.category.toLowerCase() === cat.name.toLowerCase() || 
        p.category.toLowerCase() === cat.slug.toLowerCase()
      )).length;
      return { ...cat, count };
    });
  },

  // -------------------------------------------------------------
  // PRODUCTS (Real User Listings)
  // -------------------------------------------------------------
  getProducts: ({ search, category, condition, college, sort, sellerId, includeSold, minPrice, maxPrice } = {}) => {
    const data = readDb();
    let results = [...data.products];

    // Filter out sold items unless requested (e.g. in seller's own dashboard)
    if (!includeSold) {
      results = results.filter(p => !p.isSold);
    }

    if (sellerId) {
      results = results.filter(p => p.sellerId === sellerId);
    }

    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      results = results.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.author.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.college && p.college.toLowerCase().includes(term))
      );
    }

    if (category && category !== 'All' && category !== 'all') {
      const catLower = category.toLowerCase();
      results = results.filter(p =>
        p.category.toLowerCase() === catLower ||
        p.category.toLowerCase().includes(catLower)
      );
    }

    if (condition && condition !== 'All' && condition !== 'all') {
      results = results.filter(p => p.condition.toLowerCase() === condition.toLowerCase());
    }

    if (college && college.trim()) {
      const colLower = college.toLowerCase().trim();
      results = results.filter(p => p.college && p.college.toLowerCase().includes(colLower));
    }

    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        results = results.filter(p => p.price >= min);
      }
    }

    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        results = results.filter(p => p.price <= max);
      }
    }

    if (sort === 'price-asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      results.sort((a, b) => b.price - a.price);
    } else {
      // Default: newest
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // SANITIZE: ensure no private fields exist
    return results.map(p => {
      const { paymentQrUrl, ...safeProduct } = p;
      return safeProduct;
    });
  },

  getProductById: (id) => {
    const data = readDb();
    const product = data.products.find(p => p.id === id);
    if (!product) return null;

    const seller = data.users.find(u => u.id === product.sellerId);
    const safeSeller = seller ? {
      id: seller.id,
      name: seller.name,
      college: seller.college || product.college,
      location: seller.location || product.college,
      avatar: seller.avatar,
      rating: seller.rating || 5.0,
      joinedDate: seller.joinedDate
    } : {
      name: product.sellerName,
      college: product.college,
      rating: 5.0
    };

    const related = data.products
      .filter(p => !p.isSold && p.category === product.category && p.id !== product.id)
      .slice(0, 4);

    const { paymentQrUrl, ...safeProduct } = product;
    return { ...safeProduct, seller: safeSeller, related };
  },

  createProduct: (productData, sellerUser) => {
    const data = readDb();
    const newProduct = {
      id: `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: productData.title.trim(),
      author: productData.author.trim(),
      category: productData.category.trim(),
      condition: productData.condition || 'Good',
      price: Number(productData.price),
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
      quantity: Number(productData.quantity || 1),
      description: productData.description ? productData.description.trim() : '',
      imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
      additionalImages: Array.isArray(productData.additionalImages) ? productData.additionalImages : [],
      sellerId: sellerUser.id,
      sellerName: sellerUser.name,
      college: productData.college || sellerUser.college || 'Campus',
      isSold: false,
      soldAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.products.unshift(newProduct);
    writeDb(data);
    return newProduct;
  },

  updateProduct: (id, updates, sellerId) => {
    const data = readDb();
    const index = data.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    // Authorization check
    if (sellerId && data.products[index].sellerId !== sellerId) {
      throw new Error('Unauthorized: You can only edit your own listings.');
    }

    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.originalPrice !== undefined) updates.originalPrice = updates.originalPrice ? Number(updates.originalPrice) : null;
    if (updates.quantity !== undefined) updates.quantity = Number(updates.quantity);

    data.products[index] = {
      ...data.products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeDb(data);
    return data.products[index];
  },

  markProductSold: (id, sellerId) => {
    const data = readDb();
    const product = data.products.find(p => p.id === id);
    if (!product) return null;

    if (sellerId && product.sellerId !== sellerId) {
      throw new Error('Unauthorized: You can only update your own listings.');
    }

    product.isSold = true;
    product.soldAt = new Date().toISOString();
    product.updatedAt = new Date().toISOString();
    writeDb(data);
    return product;
  },

  deleteProduct: (id, sellerId) => {
    const data = readDb();
    const index = data.products.findIndex(p => p.id === id);
    if (index === -1) return false;

    if (sellerId && data.products[index].sellerId !== sellerId) {
      throw new Error('Unauthorized: You can only delete your own listings.');
    }

    data.products.splice(index, 1);
    writeDb(data);
    return true;
  },

  // -------------------------------------------------------------
  // PRIVATE BUYER ➔ SELLER CHAT
  // -------------------------------------------------------------
  getConversationsForUser: (userId) => {
    const data = readDb();
    return data.conversations
      .filter(c => c.buyerId === userId || c.sellerId === userId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  getConversationById: (conversationId, userId) => {
    const data = readDb();
    const conv = data.conversations.find(c => c.id === conversationId);
    if (!conv) return null;

    // Strict privacy authorization: only buyer or seller can read
    if (userId && conv.buyerId !== userId && conv.sellerId !== userId) {
      throw new Error('Access denied: You are not a participant in this conversation.');
    }

    // Attach messages
    const messages = data.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Attach latest order if any
    const order = data.orders.find(o => o.conversationId === conversationId || (o.bookId === conv.bookId && o.buyerId === conv.buyerId));

    return { ...conv, messages, order: order || null };
  },

  getOrCreateConversation: ({ bookId, buyerId }) => {
    const data = readDb();
    const book = data.products.find(p => p.id === bookId);
    if (!book) throw new Error('Book listing not found.');

    const buyer = data.users.find(u => u.id === buyerId);
    if (!buyer) throw new Error('Buyer account not found.');

    const seller = data.users.find(u => u.id === book.sellerId);
    if (!seller) throw new Error('Seller account not found.');

    if (book.sellerId === buyerId) {
      throw new Error('You cannot start a conversation with yourself for your own book listing.');
    }

    // Check if conversation already exists for this book and buyer
    let conv = data.conversations.find(c => c.bookId === bookId && c.buyerId === buyerId);
    
    if (!conv) {
      conv = {
        id: `chat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookPrice: book.price,
        bookImage: book.imageUrl,
        buyerId: buyer.id,
        buyerName: buyer.name,
        buyerCollege: buyer.college || 'Student',
        sellerId: seller.id,
        sellerName: seller.name,
        sellerCollege: seller.college || 'Student',
        lastMessage: 'Started inquiry about this book.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.conversations.unshift(conv);

      // Create initial order record in 'Interested' status
      const order = {
        id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        orderNumber: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        conversationId: conv.id,
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookPrice: book.price,
        bookImage: book.imageUrl,
        buyerId: buyer.id,
        buyerName: buyer.name,
        buyerCollege: buyer.college,
        sellerId: seller.id,
        sellerName: seller.name,
        sellerCollege: seller.college,
        status: 'Interested', // Interested -> Payment Pending -> Payment Submitted -> Payment Confirmed -> Ready for Delivery -> Delivered
        paymentStatus: 'Unpaid',
        paymentReferenceId: null,
        paymentProofUrl: null,
        paymentProofSubmittedAt: null,
        paymentConfirmedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.orders.unshift(order);

      // Add system welcome message
      data.messages.push({
        id: `msg-${Date.now()}-1`,
        conversationId: conv.id,
        senderId: 'system',
        senderName: 'BookHaven System',
        text: `Conversation started between ${buyer.name} and ${seller.name} for "${book.title}". You can discuss campus handoff, book condition, and complete manual online payment securely here.`,
        attachmentUrl: null,
        messageType: 'system',
        createdAt: new Date().toISOString()
      });

      writeDb(data);
    }

    return db.getConversationById(conv.id, buyerId);
  },

  createMessage: ({ conversationId, senderId, senderName, text, attachmentUrl, messageType = 'text' }) => {
    const data = readDb();
    const conv = data.conversations.find(c => c.id === conversationId);
    if (!conv) throw new Error('Conversation not found.');

    // Validate participant
    if (senderId !== 'system' && conv.buyerId !== senderId && conv.sellerId !== senderId) {
      throw new Error('Access denied: You are not a participant in this conversation.');
    }

    const newMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversationId,
      senderId,
      senderName,
      text: text ? text.trim() : '',
      attachmentUrl: attachmentUrl || null,
      messageType, // 'text' | 'payment_proof' | 'system'
      createdAt: new Date().toISOString()
    };

    data.messages.push(newMessage);
    conv.lastMessage = messageType === 'payment_proof' ? 'Uploaded payment proof' : (text || 'Sent an attachment');
    conv.updatedAt = new Date().toISOString();
    writeDb(data);
    return newMessage;
  },

  // -------------------------------------------------------------
  // ORDERS & MANUAL QR-CODE PAYMENT
  // -------------------------------------------------------------
  getOrdersByBuyer: (buyerId) => {
    const data = readDb();
    return data.orders
      .filter(o => o.buyerId === buyerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getOrdersBySeller: (sellerId) => {
    const data = readDb();
    return data.orders
      .filter(o => o.sellerId === sellerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getOrderById: (orderId, userId) => {
    const data = readDb();
    const order = data.orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) return null;

    if (userId && order.buyerId !== userId && order.sellerId !== userId) {
      throw new Error('Unauthorized: You are not involved in this order.');
    }
    return order;
  },

  // Buyer marks intent to pay (status: 'Payment Pending')
  startOrderPayment: (orderId, buyerId) => {
    const data = readDb();
    const order = data.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found.');
    if (order.buyerId !== buyerId) throw new Error('Unauthorized.');

    order.status = 'Payment Pending';
    order.updatedAt = new Date().toISOString();
    writeDb(data);
    return order;
  },

  // Buyer submits manual payment proof (reference ID and/or screenshot)
  submitPaymentProof: (orderId, buyerId, { paymentReferenceId, paymentProofUrl, note }) => {
    const data = readDb();
    const order = data.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found.');
    if (order.buyerId !== buyerId) throw new Error('Unauthorized.');

    order.paymentReferenceId = paymentReferenceId ? paymentReferenceId.trim() : 'Manual UPI Transfer';
    order.paymentProofUrl = paymentProofUrl || null;
    order.paymentProofSubmittedAt = new Date().toISOString();
    order.status = 'Payment Submitted';
    order.paymentStatus = 'Pending Verification';
    order.updatedAt = new Date().toISOString();

    // Post notification to conversation
    if (order.conversationId) {
      const conv = data.conversations.find(c => c.id === order.conversationId);
      if (conv) {
        data.messages.push({
          id: `msg-${Date.now()}-proof`,
          conversationId: order.conversationId,
          senderId: buyerId,
          senderName: order.buyerName,
          text: `Payment proof submitted! Ref/UTR ID: ${order.paymentReferenceId}.${note ? ` Note: "${note}"` : ''}`,
          attachmentUrl: paymentProofUrl || null,
          messageType: 'payment_proof',
          createdAt: new Date().toISOString()
        });
        conv.lastMessage = 'Payment proof submitted';
        conv.updatedAt = new Date().toISOString();
      }
    }

    writeDb(data);
    return order;
  },

  // Seller manually verifies and confirms payment
  confirmPayment: (orderId, sellerId) => {
    const data = readDb();
    const order = data.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found.');
    if (order.sellerId !== sellerId) throw new Error('Unauthorized: Only the seller can verify and confirm payment.');

    order.status = 'Payment Confirmed';
    order.paymentStatus = 'Confirmed';
    order.paymentConfirmedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    // Mark book as sold or decrement
    const book = data.products.find(p => p.id === order.bookId);
    if (book) {
      book.quantity = Math.max(0, (book.quantity || 1) - 1);
      if (book.quantity === 0) {
        book.isSold = true;
        book.soldAt = new Date().toISOString();
      }
    }

    // Post notification to conversation
    if (order.conversationId) {
      const conv = data.conversations.find(c => c.id === order.conversationId);
      if (conv) {
        data.messages.push({
          id: `msg-${Date.now()}-confirmed`,
          conversationId: order.conversationId,
          senderId: sellerId,
          senderName: order.sellerName,
          text: `Payment confirmed by seller! Funds verified in account. Ready to arrange campus handoff or delivery.`,
          attachmentUrl: null,
          messageType: 'system',
          createdAt: new Date().toISOString()
        });
        conv.lastMessage = 'Payment Confirmed by seller';
        conv.updatedAt = new Date().toISOString();
      }
    }

    writeDb(data);
    return order;
  },

  // Update delivery status ('Ready for Delivery', 'Delivered', 'Cancelled')
  updateOrderStatus: (orderId, status, userId) => {
    const data = readDb();
    const order = data.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found.');

    // Only buyer or seller can update status
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new Error('Unauthorized.');
    }

    const validStatuses = [
      'Interested', 
      'Payment Pending', 
      'Payment Submitted', 
      'Payment Confirmed', 
      'Ready for Delivery', 
      'Delivered', 
      'Cancelled'
    ];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();

    if (status === 'Delivered') {
      const book = data.products.find(p => p.id === order.bookId);
      if (book) {
        book.isSold = true;
        book.soldAt = new Date().toISOString();
      }
    }

    // Post update to conversation
    if (order.conversationId) {
      const conv = data.conversations.find(c => c.id === order.conversationId);
      if (conv) {
        data.messages.push({
          id: `msg-${Date.now()}-status`,
          conversationId: order.conversationId,
          senderId: 'system',
          senderName: 'BookHaven System',
          text: `Order #${order.orderNumber} status updated to "${status}".`,
          attachmentUrl: null,
          messageType: 'system',
          createdAt: new Date().toISOString()
        });
        conv.lastMessage = `Order status: ${status}`;
        conv.updatedAt = new Date().toISOString();
      }
    }

    writeDb(data);
    return order;
  },

  // Reset database helper (cleans out all data)
  resetDb: () => {
    const cleanData = {
      users: [],
      products: [],
      categories: defaultCategories,
      orders: [],
      conversations: [],
      messages: []
    };
    writeDb(cleanData);
    return cleanData;
  }
};
