import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  MapPin, 
  ShieldCheck, 
  User, 
  Share2, 
  CheckCircle2,
  GraduationCap
} from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency, getConditionBadge } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetailsPage({ 
  productId, 
  onBack, 
  onViewDetails, 
  onContactSeller 
}) {
  const { user, openAuthModal } = useAuth();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    api.getProductById(productId)
      .then((data) => {
        setProduct(data);
        setSelectedImage(data.imageUrl);
      })
      .catch((err) => {
        toast.error('Could not load book listing');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-stone-500">Loading book details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-serif font-bold text-stone-900">Book listing not found</h2>
        <p className="text-stone-500 text-sm">This book may have been removed or already sold.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-amber-700 text-white text-xs font-bold"
        >
          &larr; Back to Marketplace
        </button>
      </div>
    );
  }

  const condition = getConditionBadge(product.condition);
  const allImages = [product.imageUrl, ...(product.additionalImages || [])].filter(Boolean);

  const handleContactClick = () => {
    if (!user) {
      toast.info('Please sign in or register to contact this seller.');
      openAuthModal('login');
      return;
    }

    if (user.id === product.sellerId) {
      toast.info('This is your own book listing.');
      return;
    }

    onContactSeller(product.id);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Listing link copied to clipboard!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-amber-800 transition py-1.5 px-3 rounded-lg hover:bg-stone-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 py-1.5 px-3 rounded-lg hover:bg-stone-100"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Listing</span>
        </button>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Col: Photo Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-3xl overflow-hidden border border-stone-200 bg-stone-100 shadow-md aspect-[3/4] flex items-center justify-center">
            <img
              src={selectedImage || product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover"
            />

            {/* Condition Tag */}
            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-md backdrop-blur-md ${condition.bg}`}>
                <span className={`w-2 h-2 rounded-full ${condition.dot}`}></span>
                {product.condition}
              </span>
            </div>

            {product.isSold && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                <span className="px-5 py-2 rounded-2xl bg-rose-600 text-white font-bold text-base tracking-wider uppercase shadow-lg">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Additional Photos Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                    selectedImage === img ? 'border-amber-700 ring-2 ring-amber-300' : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Safety Card */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-stone-700 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block mb-0.5">Direct Student Safety</strong>
              <span>Always verify book condition when meeting on campus or inspect photos in private chat before making your online payment.</span>
            </div>
          </div>
        </div>

        {/* Right Col: Metadata, Seller Details & Buy/Contact (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
              {product.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 leading-tight">
              {product.title}
            </h1>
            <p className="text-base text-stone-600 mt-2">
              by <span className="font-semibold text-stone-900">{product.author}</span>
            </p>
          </div>

          {/* Price & Action Box */}
          <div className="p-6 rounded-3xl bg-stone-50 border border-stone-200 space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-serif">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-stone-400 line-through ml-3">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>

              <div>
                {!product.isSold ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Available Now
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
                    Sold
                  </span>
                )}
              </div>
            </div>

            {/* Buy / Contact Seller CTA */}
            <div className="pt-2">
              <button
                onClick={handleContactClick}
                disabled={product.isSold}
                className="w-full py-4 px-6 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-base shadow-md transition flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageSquare className="w-5 h-5" />
                <span>{product.isSold ? 'This Book Has Been Sold' : 'Buy / Contact Seller (Private Chat & QR)'}</span>
              </button>
              <p className="text-[11px] text-stone-500 text-center mt-2">
                Clicking opens a private 1-on-1 chat with the seller to discuss handoff and complete payment using their secure QR code.
              </p>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-lg text-stone-900">About this Copy</h3>
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Seller Card */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold border border-stone-200 overflow-hidden">
                {product.seller?.avatar ? (
                  <img src={product.seller.avatar} alt={product.sellerName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">Listed by Student</p>
                <h4 className="text-sm font-bold text-stone-900">{product.sellerName}</h4>
                <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                  <span>{product.college || product.seller?.college || 'Campus'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleContactClick}
              disabled={product.isSold}
              className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
              <span>Message Seller</span>
            </button>
          </div>

        </div>

      </div>

      {/* Related Books */}
      {product.related && product.related.length > 0 && (
        <div className="pt-10 border-t border-stone-200">
          <h3 className="text-2xl font-serif font-bold text-stone-900 mb-6">
            More in {product.category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {product.related.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onViewDetails={onViewDetails}
                onContactSeller={onContactSeller}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
