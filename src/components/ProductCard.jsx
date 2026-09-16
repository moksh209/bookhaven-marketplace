import React from 'react';
import { MessageSquare, Eye, MapPin, User, CheckCircle2 } from 'lucide-react';
import { formatCurrency, getConditionBadge } from '../utils/formatters';

export default function ProductCard({ product, onViewDetails, onContactSeller }) {
  const condition = getConditionBadge(product.condition);

  const handleContact = (e) => {
    e.stopPropagation();
    if (onContactSeller) {
      onContactSeller(product.id);
    }
  };

  return (
    <div 
      onClick={() => onViewDetails(product.id)}
      className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-400/50 transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* Book Cover Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 flex items-center justify-center">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Condition Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm backdrop-blur-sm ${condition.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${condition.dot}`}></span>
            {product.condition}
          </span>
        </div>

        {/* Sold Out Overlay */}
        {product.isSold && (
          <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center z-20">
            <span className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow">
              Sold
            </span>
          </div>
        )}

        {/* Quick View Hover Overlay */}
        <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
          <span className="px-3 py-1.5 bg-white/95 text-stone-900 rounded-full text-xs font-semibold shadow flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            View Details
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          <p className="text-[11px] font-semibold tracking-wider text-amber-700 uppercase mb-1">
            {product.category}
          </p>

          {/* Title */}
          <h3 className="font-serif text-base font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-amber-800 transition-colors">
            {product.title}
          </h3>

          {/* Author */}
          <p className="text-xs text-stone-600 mt-1 line-clamp-1">
            by <span className="font-medium text-stone-800">{product.author}</span>
          </p>
        </div>

        {/* Seller Info & Pricing */}
        <div className="mt-4 pt-3 border-t border-stone-100">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2.5">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
              <span className="truncate font-medium text-stone-700">{product.sellerName}</span>
            </div>
            {product.college && (
              <div className="flex items-center gap-1 text-stone-500 text-[11px] flex-shrink-0">
                <MapPin className="w-3 h-3 text-amber-700" />
                <span className="truncate max-w-[110px]">{product.college}</span>
              </div>
            )}
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-stone-900 font-serif">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-stone-400 line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
              </span>
            )}
          </div>

          {/* Action Button: Buy / Contact Seller */}
          <button
            onClick={handleContact}
            disabled={product.isSold}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            title="Buy / Contact Seller"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{product.isSold ? 'Sold' : 'Buy / Contact Seller'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
