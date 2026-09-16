import React from 'react';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  Home, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  FileText,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

const STATUS_STEPS = [
  { key: 'Order Placed', label: 'Order Placed', icon: Clock },
  { key: 'Confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'Shipped', label: 'Shipped', icon: Truck },
  { key: 'Delivered', label: 'Delivered', icon: Home },
];

export default function OrderConfirmationPage({ order, onNavigate }) {
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-stone-500">No recent order details available.</p>
        <button
          onClick={() => onNavigate('marketplace')}
          className="mt-4 px-4 py-2 rounded-xl bg-amber-700 text-white font-bold text-xs"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  // Determine active step index
  const statusIndex = STATUS_STEPS.findIndex(s => s.key.toLowerCase() === (order.status || '').toLowerCase());
  const currentStep = statusIndex >= 0 ? statusIndex : 0;

  // Estimated delivery 4 days in future
  const estDelivery = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Order Confirmed</span>
          <h1 className="text-3xl font-bold font-serif text-stone-900">
            Thank you, {order.buyerName}!
          </h1>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Your book order has been received and the seller has been notified for packaging.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-700 font-mono font-bold">
          <span>Order ID:</span>
          <span className="text-amber-800">{order.orderNumber}</span>
        </div>
      </div>

      {/* Live Order Status Lifecycle Timeline */}
      <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-700" />
            Live Shipment Tracker
          </h2>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
            Current Status: <strong>{order.status}</strong>
          </span>
        </div>

        {/* Horizontal Tracker Steps */}
        <div className="grid grid-cols-4 gap-2 relative">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;
            const IconComponent = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center text-center space-y-2 relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-amber-700 text-white shadow-md shadow-amber-900/20 ring-4 ring-amber-100'
                      : 'bg-stone-100 text-stone-400 border border-stone-200'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className={`text-xs font-semibold ${isCompleted ? 'text-stone-900' : 'text-stone-400'}`}>
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="text-[10px] font-bold text-amber-700 animate-pulse">
                    Current Stage
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs text-stone-700 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>Estimated arrival on or before: <strong>{estDelivery}</strong></span>
        </div>
      </div>

      {/* Order Details & Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Shipping details */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-3 text-xs">
          <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-700" />
            Shipping Address
          </h3>
          <div className="text-stone-600 leading-relaxed space-y-1">
            <p className="font-bold text-stone-900">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
            <p>{order.shippingAddress.country || 'United States'}</p>
            {order.shippingAddress.phone && <p className="text-stone-400 pt-1">Phone: {order.shippingAddress.phone}</p>}
          </div>
          <div className="pt-2 border-t border-stone-100 text-stone-500">
            <span>Payment: <strong>{order.paymentMethod}</strong></span>
          </div>
        </div>

        {/* Ordered items */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-3 text-xs">
          <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-700" />
            Ordered Books
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1 divide-y divide-stone-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 truncate">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-8 h-12 object-cover rounded border border-stone-200 flex-shrink-0"
                  />
                  <div className="truncate">
                    <p className="font-bold text-stone-900 truncate">{item.title}</p>
                    <p className="text-[11px] text-stone-500">Qty: {item.quantity} &bull; Seller: {item.sellerName}</p>
                  </div>
                </div>
                <span className="font-bold font-serif text-stone-900">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-200 space-y-1 text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-stone-900 text-sm pt-1 border-t border-stone-100">
              <span>Total Paid:</span>
              <span className="text-amber-900 font-serif">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom CTA Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button
          onClick={() => onNavigate('dashboard', { tab: 'purchases' })}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" />
          <span>View in "My Purchases"</span>
        </button>

        <button
          onClick={() => onNavigate('marketplace')}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-stone-300 hover:bg-stone-100 text-stone-800 font-bold text-xs transition flex items-center justify-center gap-2"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
