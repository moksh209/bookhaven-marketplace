import React from 'react';
import { BookOpen, ShieldCheck, MessageCircle, Heart } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-14 pb-8 border-t border-stone-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-stone-800">

          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-amber-700 flex items-center justify-center text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold font-serif">BookHaven</span>
            </div>
            <p className="text-stone-400 leading-relaxed">
              A real student-to-student marketplace for used textbooks and academic books. No bots. No fake listings. Just students helping students.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-800/80 text-emerald-400 text-[11px] font-medium border border-stone-700">
              <ShieldCheck className="w-4 h-4" />
              <span>Real Students · Real Books · Real Transactions</span>
            </div>
          </div>

          {/* Col 2: Marketplace */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-serif">
              Marketplace
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => onNavigate('marketplace')} className="hover:text-amber-400 transition">
                  Browse All Books
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('sell')} className="hover:text-amber-400 transition text-amber-300 font-medium">
                  + Sell Your Book
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard', { tab: 'chats' })} className="hover:text-amber-400 transition">
                  My Private Chats
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard', { tab: 'overview' })} className="hover:text-amber-400 transition">
                  My Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-amber-400 transition">
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Subject Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-serif">
              Subject Categories
            </h4>
            <ul className="space-y-2.5 text-stone-400">
              <li>Engineering &amp; Technology</li>
              <li>Medical &amp; Life Sciences</li>
              <li>Business &amp; Commerce</li>
              <li>Computer Science &amp; IT</li>
              <li>Arts, Humanities &amp; Law</li>
            </ul>
          </div>

          {/* Col 4: How It Works summary */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-serif">
              How It Works
            </h4>
            <ol className="space-y-2.5 text-stone-400 list-none">
              <li><span className="text-amber-400 font-bold mr-1">1.</span> Sign up and list your book</li>
              <li><span className="text-amber-400 font-bold mr-1">2.</span> Buyer contacts you privately</li>
              <li><span className="text-amber-400 font-bold mr-1">3.</span> Buyer scans your payment QR</li>
              <li><span className="text-amber-400 font-bold mr-1">4.</span> You confirm payment manually</li>
              <li><span className="text-amber-400 font-bold mr-1">5.</span> Arrange handover &amp; mark delivered</li>
            </ol>
            <button
              onClick={() => onNavigate('how-it-works')}
              className="mt-4 text-amber-400 hover:text-amber-300 transition font-medium text-[11px]"
            >
              Learn more →
            </button>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500">
          <p>© 2026 BookHaven Student Book Exchange. Made with <Heart className="inline w-3 h-3 text-red-400" /> for students.</p>
          <div className="flex items-center gap-4">
            <span>Built with React &amp; Node.js</span>
            <span>&bull;</span>
            <span>Person-to-Person Marketplace</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
