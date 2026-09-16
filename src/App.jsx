import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ChatModal from './components/ChatModal';

import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import SellBookPage from './pages/SellBookPage';
import DashboardPage from './pages/DashboardPage';
import HowItWorksPage from './pages/HowItWorksPage';

import { api } from './utils/api';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [activeProductId, setActiveProductId] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('overview');

  // Products and Categories data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Chat / private conversation state
  const [activeChatConversationId, setActiveChatConversationId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { user, openAuthModal } = useAuth();
  const toast = useToast();

  const loadData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        api.getProducts({
          search: searchQuery,
          category: selectedCategory,
          condition: selectedCondition,
          minPrice,
          maxPrice,
          sort: sortBy
        }),
        api.getCategories()
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, selectedCondition, minPrice, maxPrice, sortBy]);

  const handleNavigate = (tab, options = {}) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab === 'dashboard' && options.tab) {
      setDashboardTab(options.tab);
    }
    setCurrentTab(tab);
  };

  const handleViewDetails = (productId) => {
    setActiveProductId(productId);
    handleNavigate('product-details');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCondition('All');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  const handleSelectCategoryFromHome = (categoryName) => {
    setSelectedCategory(categoryName);
    handleNavigate('marketplace');
  };

  const handleListingCreated = (newBook) => {
    setProducts((prev) => [newBook, ...prev]);
    setActiveProductId(newBook.id);
    handleNavigate('product-details');
  };

  // Opens a private chat/order screen for a given book.
  // If the user is not logged in, opens the auth modal first.
  const handleContactSeller = async (bookId) => {
    if (!user) {
      openAuthModal('login');
      toast.info('Please sign in to contact the seller.');
      return;
    }
    try {
      const conv = await api.startConversation(bookId);
      setActiveChatConversationId(conv.id);
      setIsChatOpen(true);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      toast.error(err.message || 'Could not open chat. Please try again.');
    }
  };

  // Opens an existing conversation by ID (e.g. from the Dashboard chats tab).
  const handleOpenChat = (conversationId) => {
    setActiveChatConversationId(conversationId);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    // Refresh products in case a book was marked sold during the session
    loadData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main View Container */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            products={products}
            categories={categories}
            onViewDetails={handleViewDetails}
            onNavigate={handleNavigate}
            onSelectCategory={handleSelectCategoryFromHome}
            onContactSeller={handleContactSeller}
          />
        )}

        {currentTab === 'marketplace' && (
          <MarketplacePage
            products={products}
            categories={categories}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedCondition={selectedCondition}
            setSelectedCondition={setSelectedCondition}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onResetFilters={handleResetFilters}
            onViewDetails={handleViewDetails}
            onContactSeller={handleContactSeller}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'product-details' && (
          <ProductDetailsPage
            productId={activeProductId}
            onBack={() => handleNavigate('marketplace')}
            onViewDetails={handleViewDetails}
            onContactSeller={handleContactSeller}
          />
        )}

        {currentTab === 'sell' && (
          <SellBookPage
            categories={categories}
            onListingCreated={handleListingCreated}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            initialTab={dashboardTab}
            onNavigate={handleNavigate}
            onViewDetails={handleViewDetails}
            onOpenChat={handleOpenChat}
          />
        )}

        {currentTab === 'how-it-works' && (
          <HowItWorksPage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Global Private Chat + Order Modal */}
      <ChatModal
        conversationId={activeChatConversationId}
        isOpen={isChatOpen}
        onClose={handleCloseChat}
      />

      {/* Global Auth Modal (Sign In / Sign Up / Forgot Password) */}
      <AuthModal />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
