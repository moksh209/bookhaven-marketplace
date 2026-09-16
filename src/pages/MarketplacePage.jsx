import React, { useState } from 'react';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import { Search, SlidersHorizontal, X, BookDashed, PlusCircle } from 'lucide-react';

export default function MarketplacePage({
  products = [],
  categories = [],
  searchQuery,
  setSearchQuery,
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
  onResetFilters,
  onViewDetails,
  onContactSeller,
  onNavigate
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeProducts = products.filter(p => !p.isSold);

  const hasActiveFilters = 
    Boolean(searchQuery) ||
    (selectedCategory && selectedCategory !== 'All') ||
    (selectedCondition && selectedCondition !== 'All') ||
    Boolean(minPrice) ||
    Boolean(maxPrice);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-3xl font-bold font-serif text-stone-900">
            Student Marketplace Catalog
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Showing <strong className="text-stone-800">{activeProducts.length}</strong> verified student book listings
            {selectedCategory && selectedCategory !== 'All' && <span> in <span className="text-amber-800 font-semibold">{selectedCategory}</span></span>}
            {searchQuery && <span> matching "<span className="text-amber-800 font-semibold">{searchQuery}</span>"</span>}
          </p>
        </div>

        {/* Mobile Filter Button */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-700" />
            <span>Filters &amp; Sort</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            )}
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-stone-500 font-medium">Active filters:</span>
          
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-200/70 text-stone-800 text-xs">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-stone-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCategory && selectedCategory !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
              Category: {selectedCategory}
              <button onClick={() => setSelectedCategory('All')} className="hover:text-amber-950">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCondition && selectedCondition !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold">
              Condition: {selectedCondition}
              <button onClick={() => setSelectedCondition('All')} className="hover:text-blue-950">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={onResetFilters}
            className="text-xs text-amber-800 hover:underline font-bold ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block md:col-span-1 sticky top-28">
          <FilterSidebar
            categories={categories}
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
            onReset={onResetFilters}
          />
        </div>

        {/* Product Cards Grid */}
        <div className="md:col-span-3">
          {activeProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
                <BookDashed className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                {hasActiveFilters ? 'No matching books found' : 'No books listed on the marketplace yet'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                {hasActiveFilters
                  ? 'Try broadening your search terms or resetting filters.'
                  : 'Every listing on BookHaven is posted by real students. Be the first to upload a textbook or book!'}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                {hasActiveFilters && (
                  <button
                    onClick={onResetFilters}
                    className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition"
                  >
                    Reset All Filters
                  </button>
                )}
                <button
                  onClick={() => onNavigate('sell')}
                  className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>List a Book for Sale</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={onViewDetails}
                  onContactSeller={onContactSeller}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Filters Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs p-4 flex items-center justify-center md:hidden">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-4">
              <h3 className="text-lg font-bold font-serif text-stone-900">Filter Books</h3>
            </div>
            <FilterSidebar
              categories={categories}
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
              onReset={() => {
                onResetFilters();
                setMobileFiltersOpen(false);
              }}
            />
            <div className="mt-4 pt-3 border-t border-stone-100">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 rounded-xl bg-amber-700 text-white font-bold text-xs"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
