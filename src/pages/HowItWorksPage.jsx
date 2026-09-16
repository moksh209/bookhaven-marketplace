import React from 'react';
import {
  BookOpen, MessageCircle, QrCode, CheckCircle2,
  Package, ArrowRight, ShieldCheck, Users, Star
} from 'lucide-react';

const Step = ({ number, color, title, description }) => (
  <div className="space-y-2">
    <span className={`w-7 h-7 rounded-full ${color} font-bold text-xs flex items-center justify-center`}>
      {number}
    </span>
    <h3 className="font-bold text-stone-900 text-sm">{title}</h3>
    <p className="text-stone-600 text-xs leading-relaxed">{description}</p>
  </div>
);

export default function HowItWorksPage({ onNavigate }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Student Book Exchange</span>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-stone-900">
          How BookHaven Works
        </h1>
        <p className="text-base text-stone-600 leading-relaxed font-light">
          A real, person-to-person marketplace for students. Buy and sell used textbooks
          directly with other students — no middlemen, no bots, no fake listings.
        </p>
      </div>

      {/* Core principles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            icon: <Users className="w-5 h-5 text-amber-700" />,
            title: 'Real Students Only',
            desc: 'Every listing is created by a verified registered student. No auto-generated products, no bots.'
          },
          {
            icon: <ShieldCheck className="w-5 h-5 text-emerald-700" />,
            title: 'Private & Secure',
            desc: "The seller's payment QR code is never publicly visible. It's only shared inside your private chat after you express interest."
          },
          {
            icon: <Star className="w-5 h-5 text-blue-700" />,
            title: 'Seller-Confirmed Payments',
            desc: 'Sellers manually verify every payment. No automatic confirmations — your money is never assumed received.'
          }
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center">
              {item.icon}
            </div>
            <h3 className="font-bold text-stone-900 text-sm">{item.title}</h3>
            <p className="text-xs text-stone-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Selling Flow */}
      <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 shadow-sm space-y-8">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-amber-700 text-white flex items-center justify-center font-serif font-bold text-lg">
            S
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">For Sellers</h2>
            <p className="text-xs text-stone-500">List your used textbooks and earn from your campus</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Step number="1" color="bg-amber-100 text-amber-900"
            title="Create Your Account"
            description="Sign up with your name, email, and college. Solve a quick CAPTCHA to confirm you're a real student." />
          <Step number="2" color="bg-amber-100 text-amber-900"
            title="Upload Your Book"
            description="Add title, author, condition, price, photos, and your campus location. Takes under 60 seconds." />
          <Step number="3" color="bg-amber-100 text-amber-900"
            title="Set Your Payment QR"
            description="Go to Dashboard → Payment QR Settings and upload your UPI/payment QR code. It stays private until a buyer contacts you." />
          <Step number="4" color="bg-amber-100 text-amber-900"
            title="Confirm Payments Manually"
            description="When a buyer submits payment proof, review it in your private chat and click 'Confirm Payment' yourself — no automatic confirmation." />
        </div>

        <div className="pt-2">
          <button
            onClick={() => onNavigate('sell')}
            className="px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition flex items-center gap-2"
          >
            <span>List Your First Book</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Buying Flow */}
      <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 shadow-sm space-y-8">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-serif font-bold text-lg">
            B
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">For Buyers</h2>
            <p className="text-xs text-stone-500">Discover affordable textbooks sold by students on your campus</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Step number="1" color="bg-emerald-100 text-emerald-900"
            title="Browse & Filter"
            description="Search by title or author, filter by subject, condition, campus, and price range to find exactly what you need." />
          <Step number="2" color="bg-emerald-100 text-emerald-900"
            title="Contact Seller Privately"
            description='Click "Buy / Contact Seller" on any listing to open a private 1-on-1 chat. The seller is notified instantly.' />
          <Step number="3" color="bg-emerald-100 text-emerald-900"
            title="Pay via QR Code"
            description="Once you're in the private chat, the seller's QR code appears. Scan it with any UPI app and upload your payment screenshot as proof." />
          <Step number="4" color="bg-emerald-100 text-emerald-900"
            title="Track Your Order"
            description="After the seller confirms your payment, watch your order progress through: Payment Confirmed → Ready for Delivery → Delivered." />
        </div>

        <div className="pt-2">
          <button
            onClick={() => onNavigate('marketplace')}
            className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition flex items-center gap-2"
          >
            <span>Browse Available Books</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Order status legend */}
      <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 shadow-sm space-y-6">
        <h2 className="text-xl font-serif font-bold text-stone-900">Order Status Flow</h2>
        <p className="text-xs text-stone-500">Every order moves through these stages, visible to both buyer and seller in real time:</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Interested', color: 'bg-stone-100 text-stone-700' },
            { label: 'Payment Pending', color: 'bg-yellow-100 text-yellow-800' },
            { label: 'Payment Submitted', color: 'bg-blue-100 text-blue-800' },
            { label: 'Payment Confirmed', color: 'bg-emerald-100 text-emerald-800' },
            { label: 'Ready for Delivery', color: 'bg-purple-100 text-purple-800' },
            { label: 'Delivered', color: 'bg-green-100 text-green-800' },
            { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
          ].map((s) => (
            <span key={s.label} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${s.color}`}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
