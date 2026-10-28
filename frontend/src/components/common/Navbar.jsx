import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingBag, Bot, Camera, User, LogOut, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-accent-purple to-accent-pink p-[2px] shadow-glow-brand group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-600" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              AI <span className="gradient-text">Fashion</span>
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search shirts, dresses, jackets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <Link to="/products" className="hover:text-brand-600 transition">Products</Link>
            <Link to="/chat" className="flex items-center gap-1.5 hover:text-accent-purple transition">
              <Bot className="w-4 h-4 text-accent-purple" />
              <span>AI Stylist</span>
            </Link>
            <Link to="/try-on" className="flex items-center gap-1.5 hover:text-accent-pink transition">
              <Camera className="w-4 h-4 text-accent-pink" />
              <span>Virtual Try-On</span>
            </Link>
          </nav>

          {/* User & Cart Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/cart"
              className="relative p-2 rounded-full hover:bg-slate-100 text-slate-700 hover:text-brand-600 transition"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-brand-500/50 shadow-sm transition text-sm font-medium text-slate-700"
                >
                  <User className="w-4 h-4 text-brand-600" />
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 rounded-full hover:bg-slate-100 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-brand-600 to-accent-purple text-white shadow-glow-brand hover:opacity-90 transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-panel border-b border-slate-200 px-4 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 py-2 pl-10 pr-4 text-sm rounded-full"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>
          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-slate-100 font-medium text-slate-700"
          >
            Products
          </Link>
          <Link
            to="/chat"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 font-medium text-accent-purple"
          >
            <Bot className="w-4 h-4" /> AI Stylist Chat
          </Link>
          <Link
            to="/try-on"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 font-medium text-accent-pink"
          >
            <Camera className="w-4 h-4" /> Virtual Try-On
          </Link>
        </div>
      )}
    </header>
  );
}
