import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Check, 
  DollarSign, 
  MapPin, 
  User, 
  BookOpen, 
  Plus, 
  Trash2,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import ProductCard from '../components/ProductCard';

const CONDITIONS = [
  { id: 'New', label: 'New', desc: 'Brand new, unread copy with no marks or highlighting.' },
  { id: 'Like New', label: 'Like New', desc: 'Read once, sharp spine and corners, looks freshly bought.' },
  { id: 'Good', label: 'Good', desc: 'Solid binding, minor cover wear, all pages intact.' },
  { id: 'Acceptable', label: 'Acceptable', desc: 'Readable study copy, may have highlighting, notes, or creasing.' },
];

export default function SellBookPage({ categories = [], onListingCreated, onNavigate }) {
  const { user, openAuthModal } = useAuth();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Computer Science & Tech');
  const [condition, setCondition] = useState('Good');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState([]);
  const [college, setCollege] = useState(user?.college || '');

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.college && !college) {
      setCollege(user.college);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900">Sign in to list a book</h2>
        <p className="text-stone-500 text-sm max-w-md mx-auto">
          To maintain a trusted student community and prevent spam, only verified registered users can publish book listings.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-full bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition"
        >
          Sign In or Register
        </button>
      </div>
    );
  }

  const handlePrimaryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.uploadImage(formData);
      setImageUrl(res.imageUrl);
      toast.success('Book cover photo uploaded!');
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdditionalUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.uploadImage(formData);
      setAdditionalImages((prev) => [...prev, res.imageUrl]);
      toast.success('Additional photo added!');
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  const removeAdditionalImage = (index) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !author.trim() || !price) {
      toast.error('Please enter title, author, and price.');
      return;
    }

    if (Number(price) < 0) {
      toast.error('Price cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      const newBook = await api.createProduct({
        title,
        author,
        category,
        condition,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        quantity: parseInt(quantity || 1, 10),
        description: description.trim(),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
        additionalImages,
        college: college.trim() || user.college || 'Campus'
      });

      toast.success(`🎉 Listing published! "${newBook.title}" is now live in the marketplace.`);
      if (onListingCreated) {
        onListingCreated(newBook);
      } else {
        onNavigate('marketplace');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to post listing');
    } finally {
      setSubmitting(false);
    }
  };

  const previewProduct = {
    id: 'preview',
    title: title || 'Book Title Goes Here',
    author: author || 'Author Name',
    category,
    condition,
    price: price ? parseFloat(price) : 20.00,
    originalPrice: originalPrice ? parseFloat(originalPrice) : null,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    sellerName: user.name,
    college: college || user.college || 'Your Campus',
    isSold: false
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="max-w-3xl">
        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
          Student Seller
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 mt-1">
          List a Book for Sale
        </h1>
        <p className="text-sm text-stone-500 mt-2">
          Upload genuine photos and details. Your listing appears immediately in the marketplace for fellow students to browse and contact you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Col: Upload Form (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Book Info */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-700" />
              Book Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Book Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Introduction to Algorithms (4th Edition)"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Author <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Thomas H. Cormen"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Subject / Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30 font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Description / Condition Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mention if there is highlighting, what course this was used for, or where you can meet on campus..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Condition */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">
                Book Condition <span className="text-rose-500">*</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Accurate condition descriptions ensure smooth peer transactions:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONDITIONS.map((cond) => {
                const isSelected = condition === cond.id;
                return (
                  <div
                    key={cond.id}
                    onClick={() => setCondition(cond.id)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-700 bg-amber-50/50 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-stone-900">{cond.label}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-amber-700 border-amber-700 text-white' : 'border-stone-300'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 leading-snug">{cond.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Price & Location */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-700" />
              Pricing &amp; Campus Location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Selling Price ($) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="25.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-base font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Original Retail Price ($) <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="85.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Your College / Campus Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. University of Washington, Seattle Campus"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Photos Upload */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-700" />
              Upload Book Photos
            </h2>
            <p className="text-xs text-stone-500">
              Clear photos of the front cover and book condition help buyers decide faster.
            </p>

            {/* Primary Cover */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Primary Book Cover Photo
              </label>
              <div className="flex gap-3 items-center">
                <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-300 hover:border-amber-600 rounded-2xl cursor-pointer bg-stone-50 transition">
                  <Upload className="w-5 h-5 text-stone-400 mb-1" />
                  <span className="text-xs font-semibold text-stone-700">
                    {uploadingImage ? 'Uploading...' : 'Click to Upload Primary Photo'}
                  </span>
                  <span className="text-[10px] text-stone-400">JPG, PNG, WEBP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePrimaryUpload}
                    className="hidden"
                  />
                </label>

                {imageUrl && (
                  <div className="w-20 h-24 rounded-xl border border-stone-300 overflow-hidden flex-shrink-0">
                    <img src={imageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Additional Photos */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Additional Photos (Back cover, page condition, spine)
              </label>

              <div className="flex flex-wrap gap-2 items-center">
                {additionalImages.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-20 rounded-lg overflow-hidden border border-stone-300 group">
                    <img src={img} alt={`Extra ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(idx)}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <label className="w-16 h-20 flex flex-col items-center justify-center border-2 border-dashed border-stone-300 hover:border-amber-600 rounded-lg cursor-pointer bg-stone-50 transition">
                  <Plus className="w-5 h-5 text-stone-400" />
                  <span className="text-[9px] text-stone-500 font-bold mt-0.5">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAdditionalUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-base shadow-lg transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              <span>{submitting ? 'Publishing...' : 'Publish Book Listing'}</span>
            </button>
          </div>

        </form>

        {/* Right Col: Live Card Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-28 space-y-3">
          <div className="p-3.5 rounded-2xl bg-amber-100/60 border border-amber-200 text-xs text-amber-900 font-semibold text-center">
            Live Preview on Marketplace
          </div>

          <div className="max-w-xs mx-auto">
            <ProductCard
              product={previewProduct}
              onViewDetails={() => {}}
              onContactSeller={() => {}}
            />
          </div>

          <p className="text-[11px] text-stone-400 text-center">
            Listed under your student profile: <strong>{user.name}</strong>
          </p>
        </div>

      </div>

    </div>
  );
}
