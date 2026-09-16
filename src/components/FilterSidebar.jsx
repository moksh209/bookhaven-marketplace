import React from 'react';
import { Filter, RotateCcw, DollarSign, Check, SlidersHorizontal } from 'lucide-react';

const CONDITIONS = [
  { id: 'All', label: 'All Conditions' },
  { id: 'New', label: 'Brand New' },
  { id: 'Like New', label: 'Like New' },
  { id: 'Good', label: 'Good Condition' },
  { id: 'Acceptable', label: 'Acceptable' },
];

export default function FilterSidebar({
  categories = [],
  selectedCategory,
  setSelectedCategory,
  selectedCondition,
  setSelectedCondition,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  onReset
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-base">
          <SlidersHorizontal className="w-4 h-4 text-amber-700" />
          <span>Filters &amp; Sort</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-semibold text-stone-500 hover:text-amber-800 flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
          Sort Results
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-600/30 font-medium"
        >
          <option value="newest">Newest Listings</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
          Category
        </label>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
              selectedCategory === 'All'
                ? 'bg-amber-100 text-amber-900 font-bold'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id || cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                selectedCategory === cat.name
                  ? 'bg-amber-100 text-amber-900 font-bold'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              {cat.count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200/60 text-stone-600 ml-2">
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Book Condition */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
          Condition
        </label>
        <div className="space-y-1.5">
          {CONDITIONS.map((cond) => {
            const isSelected = selectedCondition === cond.id;
            return (
              <label
                key={cond.id}
                onClick={() => setSelectedCondition(cond.id)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition select-none ${
                  isSelected ? 'bg-stone-100 text-stone-900 font-bold' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected
                      ? 'bg-amber-700 border-amber-700 text-white'
                      : 'border-stone-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>{cond.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
          Price Range ($)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-stone-400">Min</span>
            <div className="relative mt-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">$</span>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full pl-6 pr-2 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>
          <div>
            <span className="text-[11px] text-stone-400">Max</span>
            <div className="relative mt-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">$</span>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="100"
                className="w-full pl-6 pr-2 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
