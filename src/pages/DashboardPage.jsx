import React, { useState, useEffect } from 'react';
import { 
  BookMarked, 
  Store, 
  Package, 
  User, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  DollarSign, 
  CheckCircle2, 
  ExternalLink,
  MapPin,
  Save,
  X,
  RefreshCw,
  QrCode,
  Upload,
  MessageSquare,
  ShieldCheck,
  Check,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import { formatCurrency, formatDate, getConditionBadge } from '../utils/formatters';

export default function DashboardPage({ 
  initialTab = 'listings', 
  onNavigate, 
  onViewDetails,
  onOpenChat
}) {
  const { user, updateProfile, updatePaymentSettings, openAuthModal } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [myProducts, setMyProducts] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Listing state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    price: '',
    condition: 'Good',
    description: '',
    college: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Profile Form state
  const [profileName, setProfileName] = useState('');
  const [profileCollege, setProfileCollege] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Payment QR Settings state
  const [qrCodeUrl, setQrCodeUrl] = useState(user?.paymentQrUrl || '');
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [paymentInstructions, setPaymentInstructions] = useState(user?.paymentInstructions || '');
  const [uploadingQr, setUploadingQr] = useState(false);
  const [savingQr, setSavingQr] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (!user) return;

    setProfileName(user.name || '');
    setProfileCollege(user.college || '');
    setProfilePhone(user.phone || '');
    setProfileBio(user.bio || '');

    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [prods, sOrders, bOrders, convs, me] = await Promise.all([
        api.getSellerProducts(user.id, true),
        api.getSellerOrders(user.id),
        api.getBuyerOrders(user.id),
        api.getConversations(),
        api.getMe()
      ]);
      setMyProducts(prods || []);
      setSellerOrders(sOrders || []);
      setBuyerOrders(bOrders || []);
      setConversations(convs || []);
      if (me) {
        setQrCodeUrl(me.paymentQrUrl || '');
        setUpiId(me.upiId || '');
        setPaymentInstructions(me.paymentInstructions || '');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title,
      author: product.author,
      price: product.price,
      condition: product.condition,
      description: product.description || '',
      college: product.college || user?.college || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSavingEdit(true);
    try {
      const updated = await api.updateProduct(editingProduct.id, {
        title: editForm.title,
        author: editForm.author,
        price: parseFloat(editForm.price),
        condition: editForm.condition,
        description: editForm.description,
        college: editForm.college
      });
      toast.success('Listing updated successfully!');
      setEditingProduct(null);
      setMyProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) {
      toast.error('Failed to update listing: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleMarkSold = async (productId) => {
    try {
      const res = await api.markBookAsSold(productId);
      toast.success('Book marked as sold!');
      setMyProducts(prev => prev.map(p => p.id === productId ? res.product : p));
    } catch (err) {
      toast.error('Failed to mark as sold');
    }
  };

  const handleDeleteListing = async (productId, title) => {
    if (window.confirm(`Delete listing for "${title}" permanently?`)) {
      try {
        await api.deleteProduct(productId);
        toast.info('Listing deleted.');
        setMyProducts(prev => prev.filter(p => p.id !== productId));
      } catch (err) {
        toast.error('Failed to delete listing');
      }
    }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.uploadImage(formData);
      setQrCodeUrl(res.imageUrl);
      toast.success('Payment QR image uploaded! Remember to click "Save Settings".');
    } catch (err) {
      toast.error('Failed to upload QR code image');
    } finally {
      setUploadingQr(false);
    }
  };

  const handleSaveQrSettings = async (e) => {
    e.preventDefault();
    setSavingQr(true);
    try {
      await updatePaymentSettings({
        paymentQrUrl: qrCodeUrl || null,
        upiId: upiId.trim() || null,
        paymentInstructions: paymentInstructions.trim() || null
      });
    } catch (err) {
      // Toast handled by context
    } finally {
      setSavingQr(false);
    }
  };

  const handleRemoveQr = async () => {
    if (window.confirm('Remove your payment QR code?')) {
      setQrCodeUrl('');
      await updatePaymentSettings({
        paymentQrUrl: null,
        upiId: upiId || null,
        paymentInstructions: paymentInstructions || null
      });
      toast.info('Payment QR removed.');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        name: profileName,
        college: profileCollege,
        phone: profilePhone,
        bio: profileBio
      });
    } catch (err) {
      // Toast handled by context
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-serif font-bold text-stone-900">Sign in to view your dashboard</h2>
        <p className="text-sm text-stone-500">
          Manage your uploaded books, incoming buyer chats, sales, and personal book purchases.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-full bg-amber-700 text-white font-bold text-sm shadow-md"
        >
          Sign In or Register
        </button>
      </div>
    );
  }

  const activeBooks = myProducts.filter(p => !p.isSold);
  const soldBooks = myProducts.filter(p => p.isSold);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Profile Summary Bar */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-amber-600 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-stone-900">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                Student Account
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
              <span>{user.email}</span>
              {user.college && (
                <>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 font-medium text-stone-700">
                    <MapPin className="w-3 h-3 text-amber-700" />
                    {user.college}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('sell')}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List a Book</span>
          </button>
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-2xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
            title="Refresh Dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'listings'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>My Listings</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
            {myProducts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'sales'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>My Sales</span>
          <span className="px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
            {sellerOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payment-settings')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'payment-settings'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <QrCode className="w-4 h-4 text-amber-600" />
          <span>Payment QR Settings</span>
          {qrCodeUrl && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'purchases'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Purchases</span>
          <span className="px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
            {buyerOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('chats')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'chats'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Private Chats</span>
          <span className="px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
            {conversations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'profile'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>

      {/* Tab 1: My Listings */}
      {activeTab === 'listings' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Your Uploaded Books ({myProducts.length})
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {activeBooks.length} active in marketplace, {soldBooks.length} sold.
              </p>
            </div>

            <button
              onClick={() => onNavigate('sell')}
              className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Listing</span>
            </button>
          </div>

          {myProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4 shadow-xs">
              <BookMarked className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-stone-900">You haven't listed any books yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Clean out your dorm bookshelf or pass along textbooks from past semesters.
              </p>
              <button
                onClick={() => onNavigate('sell')}
                className="px-5 py-2.5 rounded-xl bg-amber-700 text-white font-bold text-xs shadow-xs"
              >
                List Your First Book
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-800 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">Book Details</th>
                      <th className="p-4">Condition</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {myProducts.map((product) => {
                      const condition = getConditionBadge(product.condition);
                      return (
                        <tr key={product.id} className="hover:bg-stone-50/70 transition">
                          <td className="p-4 flex items-center gap-3">
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="w-12 h-16 object-cover rounded border border-stone-200 flex-shrink-0"
                            />
                            <div>
                              <p className="font-bold text-stone-900 text-sm line-clamp-1">{product.title}</p>
                              <p className="text-stone-500">by {product.author}</p>
                              <span className="text-[10px] text-stone-400">{product.category}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${condition.bg}`}>
                              {product.condition}
                            </span>
                          </td>
                          <td className="p-4 font-bold font-serif text-stone-900 text-sm">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="p-4">
                            {product.isSold ? (
                              <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 font-bold text-[11px]">
                                Sold
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                                Active Listing
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!product.isSold && (
                                <button
                                  onClick={() => handleMarkSold(product.id)}
                                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px]"
                                  title="Mark as Sold"
                                >
                                  Mark as Sold
                                </button>
                              )}
                              <button
                                onClick={() => onViewDetails(product.id)}
                                className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600"
                                title="View in Catalog"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(product)}
                                className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-800"
                                title="Edit Listing"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteListing(product.id, product.title)}
                                className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                                title="Delete Listing"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Seller Sales */}
      {activeTab === 'sales' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              My Sales &amp; Pending Inquiries ({sellerOrders.length})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Review interested student buyers, payment verification, and delivery progression.
            </p>
          </div>

          {sellerOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
              <Store className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-stone-900">No buyer orders yet</h3>
              <p className="text-xs text-stone-500">
                When a student clicks "Buy / Contact Seller" for your book, the order and private chat will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sellerOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-stone-100 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg">
                        {order.orderNumber}
                      </span>
                      <span className="text-stone-500">
                        Date: {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {order.status}
                      </span>
                      {order.conversationId && (
                        <button
                          onClick={() => onOpenChat(order.conversationId)}
                          className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Open Chat &amp; Payment</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs items-center">
                    <div className="sm:col-span-2 flex items-center gap-3">
                      <img
                        src={order.bookImage}
                        alt={order.bookTitle}
                        className="w-12 h-16 object-cover rounded border border-stone-200 flex-shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm">{order.bookTitle}</h4>
                        <p className="text-stone-500">by {order.bookAuthor}</p>
                        <p className="text-stone-700 font-semibold mt-1">
                          Buyer: {order.buyerName} ({order.buyerCollege || 'Campus'})
                        </p>
                      </div>
                    </div>

                    <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-right space-y-1">
                      <span className="text-base font-bold font-serif text-stone-900 block">
                        {formatCurrency(order.bookPrice)}
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        Payment Status: <strong>{order.paymentStatus || 'Pending'}</strong>
                      </span>
                      {order.paymentReferenceId && (
                        <span className="text-[10px] font-mono text-emerald-800 block">
                          Ref: {order.paymentReferenceId}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Seller Payment QR Settings (STRICTLY PRIVATE) */}
      {activeTab === 'payment-settings' && (
        <div className="max-w-2xl bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <QrCode className="w-5 h-5 text-amber-700" />
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Seller Payment QR Settings
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Upload your UPI or payment app QR code to receive direct online payments from student buyers.
            </p>
          </div>

          {/* Privacy Notice Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Strict Privacy Guarantee</span>
            </div>
            <p className="text-stone-600 leading-relaxed">
              Your payment QR code is <strong>NEVER publicly visible</strong> on the marketplace or book details pages. It is only shared privately with a buyer inside your secure 1-on-1 chat after they initiate a purchase.
            </p>
          </div>

          <form onSubmit={handleSaveQrSettings} className="space-y-4 text-xs">
            {/* QR Upload */}
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-2">
                Your Payment QR Code Image
              </label>

              {qrCodeUrl ? (
                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <img
                    src={qrCodeUrl}
                    alt="Seller QR"
                    className="w-28 h-28 object-contain rounded-xl border border-stone-300 bg-white p-1"
                  />
                  <div className="space-y-2">
                    <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Active Payment QR Ready
                    </span>
                    <p className="text-stone-500 text-[11px]">Buyers will scan this QR to pay you directly.</p>
                    <div className="flex gap-2">
                      <label className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-bold cursor-pointer transition">
                        Replace QR
                        <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveQr}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-300 hover:border-amber-600 rounded-2xl cursor-pointer bg-stone-50 transition">
                  <Upload className="w-6 h-6 text-stone-400 mb-1.5" />
                  <span className="font-bold text-stone-800">
                    {uploadingQr ? 'Uploading QR...' : 'Click to Upload Your Payment QR Code'}
                  </span>
                  <span className="text-[11px] text-stone-400 mt-0.5">
                    UPI QR screenshot, Google Pay, PhonePe, or payment app QR code
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* UPI ID */}
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                UPI ID / Payment Handle (Optional)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourname@okaxis or yourname@upi"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Instructions to Buyer (Optional)
              </label>
              <textarea
                rows={2}
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="e.g. Please put your name or book title in the payment note so I can verify quickly."
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
            </div>

            <button
              type="submit"
              disabled={savingQr}
              className="px-6 py-3 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>{savingQr ? 'Saving Settings...' : 'Save Private Payment Settings'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Buyer Purchases */}
      {activeTab === 'purchases' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              My Purchases ({buyerOrders.length})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Books you have expressed interest in or purchased from fellow students.
            </p>
          </div>

          {buyerOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4 shadow-xs">
              <Package className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-stone-900">No purchases yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Explore books posted by other students and click "Buy / Contact Seller" to get started.
              </p>
              <button
                onClick={() => onNavigate('marketplace')}
                className="px-5 py-2.5 rounded-xl bg-amber-700 text-white font-bold text-xs"
              >
                Browse Books
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {buyerOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-stone-100 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg">
                        {order.orderNumber}
                      </span>
                      <span className="text-stone-500">
                        Date: {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {order.status}
                      </span>
                      {order.conversationId && (
                        <button
                          onClick={() => onOpenChat(order.conversationId)}
                          className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Open Chat / Pay QR</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs items-center">
                    <div className="sm:col-span-2 flex items-center gap-3">
                      <img
                        src={order.bookImage}
                        alt={order.bookTitle}
                        className="w-12 h-16 object-cover rounded border border-stone-200 flex-shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm">{order.bookTitle}</h4>
                        <p className="text-stone-500">by {order.bookAuthor}</p>
                        <p className="text-stone-700 font-semibold mt-1">
                          Seller: {order.sellerName} ({order.sellerCollege || 'Campus'})
                        </p>
                      </div>
                    </div>

                    <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-right space-y-1">
                      <span className="text-base font-bold font-serif text-stone-900 block">
                        {formatCurrency(order.bookPrice)}
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        Payment: <strong>{order.paymentStatus}</strong>
                      </span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Private Chats */}
      {activeTab === 'chats' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              Private Conversations ({conversations.length})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              1-on-1 chats with sellers and buyers linked directly to specific books.
            </p>
          </div>

          {conversations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-stone-900">No conversations yet</h3>
              <p className="text-xs text-stone-500">
                Click "Buy / Contact Seller" on any book in the marketplace to start a private conversation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => {
                const isBuyerInConv = user.id === conv.buyerId;
                const otherParty = isBuyerInConv ? conv.sellerName : conv.buyerName;
                const otherRole = isBuyerInConv ? 'Seller' : 'Buyer';

                return (
                  <div
                    key={conv.id}
                    onClick={() => onOpenChat(conv.id)}
                    className="p-4 bg-white hover:bg-stone-50 border border-stone-200 hover:border-amber-400/80 rounded-2xl shadow-xs transition cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 truncate">
                      {conv.bookImage && (
                        <img
                          src={conv.bookImage}
                          alt={conv.bookTitle}
                          className="w-10 h-14 object-cover rounded-lg border border-stone-200 flex-shrink-0"
                        />
                      )}
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-stone-900 text-sm truncate">{conv.bookTitle}</h4>
                          <span className="font-serif font-bold text-amber-800 text-xs">
                            {formatCurrency(conv.bookPrice)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 truncate mt-0.5">
                          {otherRole}: <strong className="text-stone-800">{otherParty}</strong> &bull; "{conv.lastMessage}"
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 flex-shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open Chat</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">Student Profile</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Your college campus is visible on your listings so nearby students can meet you for handoffs.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Registered Email
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm text-stone-500 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                College / University Campus
              </label>
              <input
                type="text"
                value={profileCollege}
                onChange={(e) => setProfileCollege(e.target.value)}
                placeholder="e.g. University of California, Berkeley"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Phone (Optional)
              </label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Student Bio
              </label>
              <textarea
                rows={3}
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                placeholder="Junior computer science major. Selling last term textbooks..."
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-3 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Edit Listing Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs p-4 flex items-center justify-center">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif font-bold text-xl text-stone-900 mb-4">
              Edit Book Listing
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Book Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Author</label>
                <input
                  type="text"
                  required
                  value={editForm.author}
                  onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Selling Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Condition</label>
                <select
                  value={editForm.condition}
                  onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Acceptable">Acceptable</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Campus Location</label>
                <input
                  type="text"
                  value={editForm.college}
                  onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
