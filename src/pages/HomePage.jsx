import React from 'react';
import { 
  BookOpen, 
  ArrowRight, 
  ShieldCheck, 
  GraduationCap, 
  QrCode, 
  MessageSquare,
  PlusCircle,
  TrendingUp,
  Clock,
  Sparkles,
  Search
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

export default function HomePage({ 
  products = [], 
  categories = [], 
  onViewDetails, 
  onNavigate, 
  onSelectCategory,
  onContactSeller
}) {
  const activeProducts = products.filter(p => !p.isSold);
  const recentProducts = activeProducts.slice(0, 6);

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-[#1e1b18] text-white mx-4 sm:mx-6 lg:mx-8 mt-6 shadow-xl border border-stone-800">
        <div className="relative max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>Peer-to-Peer Student Book Exchange</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-serif tracking-tight leading-tight max-w-3xl mx-auto text-stone-100">
            Buy and sell used books directly with students.
          </h1>

          <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed font-light">
            Skip expensive bookstore markups. Connect directly with students on your campus or across the country to buy, sell, and hand off pre-loved textbooks and literature.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('marketplace')}
              className="px-7 py-3.5 rounded-full bg-amber-700 hover:bg-amber-600 text-white font-bold text-sm sm:text-base shadow-lg transition flex items-center gap-2 group active:scale-95"
            >
              <span>Browse Books</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('sell')}
              className="px-7 py-3.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-600 font-bold text-sm sm:text-base transition flex items-center gap-2 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Sell a Book</span>
            </button>
          </div>

          {/* How It Works 3-Step Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-stone-800/80 max-w-4xl mx-auto text-left text-xs">
            <div className="flex items-start gap-3 text-stone-300">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <strong className="text-white block mb-0.5">Post Your Books</strong>
                <span>Upload photos, condition, and price in under 60 seconds. Real students only.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-stone-300">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                2
              </div>
              <div>
                <strong className="text-white block mb-0.5">Chat Privately</strong>
                <span>Direct 1-on-1 private messaging to ask questions or arrange campus meeting.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-stone-300">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                3
              </div>
              <div>
                <strong className="text-white block mb-0.5">Pay via Private QR</strong>
                <span>Pay securely using seller's private QR code. Seller manually confirms receipt.</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Categories / Academic Disciplines */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Campus Subjects</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mt-1">
              Explore by Academic Subject
            </h2>
          </div>
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-xs sm:text-sm font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id || cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-amber-500/80 hover:bg-amber-50/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:bg-amber-700 group-hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                {cat.count > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                    {cat.count} {cat.count === 1 ? 'book' : 'books'}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm group-hover:text-amber-900 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Available Student Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Direct From Student Bookshelves</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
              Recent Listings
            </h2>
          </div>
          {activeProducts.length > 0 && (
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-xs sm:text-sm font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 group"
            >
              <span>Browse All ({activeProducts.length})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {activeProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900">No books listed yet</h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              Every book on BookHaven is posted by real students. Be the first to list your course textbook, novel, or study guide!
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('sell')}
                className="px-6 py-3 rounded-full bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 mx-auto"
              >
                <PlusCircle className="w-4 h-4" />
                <span>List a Book for Sale</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={onViewDetails}
                onContactSeller={onContactSeller}
              />
            ))}
          </div>
        )}
      </section>

      {/* Community Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-stone-900 text-white p-8 sm:p-12 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8 border border-stone-800">
          <div className="space-y-3 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
              Student-to-Student Security
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Private chat &amp; confidential payment QR codes.
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Sellers’ personal payment QR codes are never exposed to the public. They are shared strictly 1-on-1 with buyers inside private order chats. All payments are verified manually by sellers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <button
              onClick={() => onNavigate('sell')}
              className="px-6 py-3 rounded-full bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition"
            >
              Sell Your Textbook
            </button>
            <button
              onClick={() => onNavigate('how-it-works')}
              className="px-6 py-3 rounded-full border border-stone-600 hover:bg-stone-800 text-stone-200 font-bold text-xs transition"
            >
              Read Community Rules
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
