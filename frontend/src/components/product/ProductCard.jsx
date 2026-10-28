import React from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

export default function ProductCard({ product }) {
  const fallbackImage = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600';
  const imageUrl = product.primaryImageUrl || (product.images && product.images[0]?.imageUrl) || fallbackImage;

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(product.price);

  return (
    <div className="group relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-brand-500/60 hover:shadow-glow-brand transition-all duration-300 flex flex-col shadow-sm">
      {/* Image Container */}
      <div className="aspect-[3/4] w-full bg-slate-100 relative overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.categoryName && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 text-brand-700 backdrop-blur-md border border-brand-200 shadow-sm">
              {product.categoryName}
            </span>
          )}
          {product.style && (
            <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-purple-50 text-accent-purple backdrop-blur-md border border-purple-200">
              {product.style}
            </span>
          )}
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <Link
            to={`/products/${product.id}`}
            className="p-3 bg-white text-slate-800 rounded-full hover:bg-brand-600 hover:text-white transition shadow-lg"
            title="View Details"
          >
            <Eye className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <Link to={`/products/${product.id}`} className="block">
            <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-brand-600 transition">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 line-clamp-1 mt-1">
            {product.description || `${product.gender || 'Unisex'} • ${product.material || 'Cotton'}`}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-lg font-extrabold text-slate-900 tracking-tight">
            {formattedPrice}
          </span>
          <Link
            to={`/products/${product.id}`}
            className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
          >
            Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
