import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { productApi } from '../../services/productApi';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedMessage, setAddedMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    productApi.getProductById(id)
      .then((data) => {
        setProduct(data);
        if (data.images && data.images.length > 0) {
          setSelectedImage(data.primaryImageUrl || data.images[0].imageUrl);
        }
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-96 bg-slate-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Product not found</h2>
        <Link to="/products" className="text-brand-600 hover:underline font-semibold">Back to Products</Link>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(product.price);

  const handleAddToCart = () => {
    setAddedMessage(`Added ${quantity} item(s) to cart!`);
    setTimeout(() => setAddedMessage(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back Button */}
      <Link to="/products" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[3/4] w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg relative">
            <img
              src={selectedImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600'}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition ${
                    selectedImage === img.imageUrl ? 'border-brand-600 scale-95 shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Variant Selector */}
        <div className="space-y-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              {product.categoryName}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              {product.name}
            </h1>
            <p className="text-3xl font-extrabold text-slate-900 mt-4 tracking-tight">
              {formattedPrice}
            </p>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed border-t border-b border-slate-200 py-4">
            {product.description || 'Premium clothing designed for high comfort and modern fit.'}
          </p>

          {/* Variants (Size & Color) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Select Variant (Size & Color)</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                        selectedVariant?.id === v.id
                          ? 'bg-brand-600 border-brand-500 text-white shadow-glow-brand'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      Size: {v.size} | Color: {v.color} ({v.stock} in stock)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quantity Selector & Add to Cart */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-sm">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-900 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-900 font-bold"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-brand-600 to-accent-purple text-white font-semibold shadow-glow-brand hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
            </div>

            {addedMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                <Check className="w-4 h-4" />
                <span>{addedMessage}</span>
              </div>
            )}
          </div>

          {/* Virtual Try-On CTA Banner */}
          <div className="glass-panel p-5 rounded-2xl border border-pink-200 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-accent-pink text-xs font-bold">
                <Sparkles className="w-4 h-4" /> Virtual Try-On Available
              </div>
              <p className="text-xs text-slate-500">See how this item looks on you with AI pose detection.</p>
            </div>
            <Link
              to={`/try-on?clothingUrl=${encodeURIComponent(selectedImage || '')}`}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-accent-pink to-brand-600 text-white text-xs font-semibold hover:opacity-90 transition shrink-0"
            >
              Try On Now
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
