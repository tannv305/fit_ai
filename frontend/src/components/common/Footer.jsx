import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <span className="text-lg font-bold text-slate-900 tracking-tight">AI Fashion Shop</span>
          </div>
          <p className="text-sm text-slate-500">
            Next-generation smart e-commerce platform with real-time AI styling assistance and virtual outfit try-on.
          </p>
        </div>

        <div>
          <h4 className="text-slate-900 font-bold mb-3">Shop Categories</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/products?categoryId=1" className="hover:text-brand-600 transition">Shirts / Áo</a></li>
            <li><a href="/products?categoryId=2" className="hover:text-brand-600 transition">Pants / Quần</a></li>
            <li><a href="/products?categoryId=3" className="hover:text-brand-600 transition">Dresses / Váy</a></li>
            <li><a href="/products?categoryId=4" className="hover:text-brand-600 transition">Jackets / Áo khoác</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-slate-900 font-bold mb-3">AI Features</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/chat" className="hover:text-accent-purple transition font-medium">AI Fashion Stylist Chat</a></li>
            <li><a href="/try-on" className="hover:text-accent-pink transition font-medium">Camera Pose & Virtual Try-On</a></li>
            <li><a href="/products" className="hover:text-brand-600 transition">Personalized Recommendations</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-slate-900 font-bold mb-3">Customer Support</h4>
          <p className="text-sm">Hotline: 1900-AI-FASHION</p>
          <p className="text-sm">Email: support@aifashion.com</p>
          <p className="text-sm mt-3 text-slate-400">&copy; 2026 AI Fashion Inc. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}
