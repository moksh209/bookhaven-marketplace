import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  PlusCircle, 
  User as UserIcon, 
  LogOut, 
  Package, 
  Store, 
  MessageSquare,
  QrCode,
  Menu, 
  X,
  ChevronDown,
  BookMarked
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onNavigate, currentTab, searchQuery, setSearchQuery, onOpenChats }) {
  const { user, logout, openAuthModal } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onNavigate('marketplace');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-700 text-amber-50 flex items-center justify-center shadow-md shadow-amber-900/10 group-hover:bg-amber-800 transition">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-bold font-serif tracking-tight text-stone-900 flex items-center gap-1">
                BookHaven
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block"></span>
              </span>
              <p className="text-[11px] text-stone-500 font-medium tracking-wide uppercase">Student Book Exchange</p>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md mx-4 relative"
          >
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search textbooks, authors, subjects, or campus..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-full text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 transition shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 p-1"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-600">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-amber-800 transition ${currentTab === 'home' ? 'text-amber-800 font-semibold' : ''}`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('marketplace')}
              className={`hover:text-amber-800 transition ${currentTab === 'marketplace' ? 'text-amber-800 font-semibold' : ''}`}
            >
              Browse Books
            </button>
            <button
              onClick={() => onNavigate('how-it-works')}
              className={`hover:text-amber-800 transition ${currentTab === 'how-it-works' ? 'text-amber-800 font-semibold' : ''}`}
            >
              How It Works
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            
            {/* Sell Your Book CTA Button */}
            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                } else {
                  onNavigate('sell');
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm shadow-sm transition hover:shadow-md active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Sell a Book</span>
            </button>

            {/* My Chats Button (When Logged in) */}
            {user && (
              <button
                onClick={() => onNavigate('dashboard', { tab: 'chats' })}
                className="p-2.5 rounded-full text-stone-700 hover:bg-stone-200/60 transition relative"
                title="My Chats"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}

            {/* User Account / Profile Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full hover:bg-stone-200/60 transition border border-stone-200 bg-white shadow-xs"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-stone-300"
                  />
                  <span className="text-xs font-semibold text-stone-800 max-w-[100px] truncate hidden sm:inline">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 text-stone-700 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-stone-900 truncate">{user.name}</p>
                      <p className="text-xs text-stone-500 truncate">{user.college || user.email}</p>
                    </div>

                    <div className="py-1 text-sm">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('dashboard', { tab: 'listings' });
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center gap-2.5 text-stone-700 text-xs font-medium"
                      >
                        <BookMarked className="w-4 h-4 text-stone-500" />
                        Seller: My Listings
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('dashboard', { tab: 'sales' });
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center gap-2.5 text-stone-700 text-xs font-medium"
                      >
                        <Store className="w-4 h-4 text-stone-500" />
                        Seller: My Sales
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('dashboard', { tab: 'payment-settings' });
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center gap-2.5 text-stone-700 text-xs font-medium"
                      >
                        <QrCode className="w-4 h-4 text-amber-700" />
                        Seller: Payment QR Settings
                      </button>

                      <div className="border-t border-stone-100 my-1"></div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('dashboard', { tab: 'purchases' });
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center gap-2.5 text-stone-700 text-xs font-medium"
                      >
                        <Package className="w-4 h-4 text-stone-500" />
                        Buyer: My Purchases
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('dashboard', { tab: 'chats' });
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center gap-2.5 text-stone-700 text-xs font-medium"
                      >
                        <MessageSquare className="w-4 h-4 text-stone-500" />
                        Buyer: My Private Chats
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('dashboard', { tab: 'profile' });
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center gap-2.5 text-stone-700 text-xs font-medium"
                      >
                        <UserIcon className="w-4 h-4 text-stone-500" />
                        Profile Settings
                      </button>
                    </div>

                    <div className="border-t border-stone-100 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-rose-50 flex items-center gap-2.5 text-rose-700 text-xs font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 rounded-full border border-stone-300 hover:border-stone-400 bg-white text-stone-700 font-medium text-xs transition hover:bg-stone-50"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="hidden sm:inline-block px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search textbooks, authors, subjects..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-300 rounded-full text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600/30"
            />
          </form>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200 py-3 space-y-2 text-sm font-medium text-stone-700">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('marketplace');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100"
            >
              Browse All Books
            </button>
            <button
              onClick={() => {
                if (!user) openAuthModal('login');
                else onNavigate('sell');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 text-amber-800 font-semibold"
            >
              + Sell a Book
            </button>
            {user ? (
              <>
                <button
                  onClick={() => {
                    onNavigate('dashboard', { tab: 'listings' });
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100"
                >
                  My Listings &amp; Sales
                </button>
                <button
                  onClick={() => {
                    onNavigate('dashboard', { tab: 'chats' });
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100"
                >
                  My Private Chats
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  openAuthModal('login');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-lg text-amber-800 font-bold"
              >
                Sign In / Register
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
}
