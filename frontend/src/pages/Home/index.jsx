import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Bot, Camera, Zap } from 'lucide-react';
import { productApi } from '../../services/productApi';
import ProductCard from '../../components/product/ProductCard';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productApi.getProducts({ sizeParam: 4 }),
      productApi.getCategories(),
    ])
      .then(([productsRes, categoriesRes]) => {
        setFeaturedProducts(productsRes.content || []);
        setCategories(categoriesRes || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-accent-pink/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-brand-700 text-sm font-semibold border border-brand-200 shadow-sm">
            <Sparkles className="w-4 h-4 text-accent-pink animate-pulse" />
            <span>AI-Driven Fashion & Neural Virtual Fitting</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
            Discover Your Perfect Fit with <br />
            <span className="gradient-text">Personalized AI Stylist</span>
          </h1>

          <p className="text-slate-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Shop real trending apparel, get intelligent outfit recommendations based on your preferences, and preview clothes live using Computer Vision camera try-on.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/products"
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-brand-600 to-accent-purple text-white font-semibold shadow-glow-brand hover:opacity-95 transition flex items-center gap-2"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/chat"
              className="px-8 py-3.5 rounded-full glass-panel text-slate-700 hover:text-brand-600 font-semibold hover:border-accent-purple/50 transition flex items-center gap-2"
            >
              <Bot className="w-5 h-5 text-accent-purple" />
              <span>Chat with AI Stylist</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Shop by Category</h2>
            <p className="text-sm text-slate-500">Curated clothing collections for every style</p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-brand-600 hover:underline">
            View All &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat.id}
              to={`/products?categoryId=${cat.id}`}
              className="glass-panel p-4 rounded-2xl text-center hover:border-brand-500/50 hover:shadow-glow-brand transition group"
            >
              <div className="text-lg font-bold text-slate-800 group-hover:text-brand-600 transition">
                {cat.name}
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">{cat.description || 'Collection'}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Featured Products</h2>
            <p className="text-sm text-slate-500">Handpicked items in stock now</p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-brand-600 hover:underline">
            Browse All &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* AI Features Highlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-brand-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-700 border border-pink-200">
                Next-Gen Computer Vision
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900">
                Virtual Try-On & Body Pose Estimation
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Use your webcam or upload a full-body photo to preview clothes before buying. Powered by MediaPipe pose detection and PyTorch neural virtual try-on models.
              </p>
              <Link
                to="/try-on"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-accent-pink to-brand-600 text-white font-semibold shadow-glow-accent hover:opacity-90 transition"
              >
                <Camera className="w-5 h-5" />
                <span>Try On Now</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-5 rounded-2xl space-y-2">
                <Bot className="w-8 h-8 text-accent-purple" />
                <h4 className="font-bold text-slate-900">No Hallucinations</h4>
                <p className="text-xs text-slate-500">AI chat recommendations use real database stock only.</p>
              </div>
              <div className="glass-card p-5 rounded-2xl space-y-2">
                <Zap className="w-8 h-8 text-brand-600" />
                <h4 className="font-bold text-slate-900">Real-Time Search</h4>
                <p className="text-xs text-slate-500">Filter instantly by gender, size, price, and occasion.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
