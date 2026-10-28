import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, RefreshCw } from 'lucide-react';
import { productApi } from '../../services/productApi';
import ProductCard from '../../components/product/ProductCard';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);

  // Filters State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [gender, setGender] = useState(searchParams.get('gender') || '');
  const [style, setStyle] = useState(searchParams.get('style') || '');
  const [size, setSize] = useState(searchParams.get('size') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState('createdAt,desc');
  const [page, setPage] = useState(0);

  useEffect(() => {
    productApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  const fetchProducts = () => {
    setLoading(true);
    const params = {
      page,
      sizeParam: 12,
      sort,
    };
    if (search) params.search = search;
    if (categoryId) params.categoryId = categoryId;
    if (gender) params.gender = gender;
    if (style) params.style = style;
    if (size) params.size = size;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    productApi.getProducts(params)
      .then((data) => {
        setProducts(data.content || []);
        setTotalPages(data.totalPages || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [page, sort, categoryId, gender, style, size]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setPage(0);
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryId('');
    setGender('');
    setStyle('');
    setSize('');
    setMinPrice('');
    setMaxPrice('');
    setPage(0);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title & Top Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-slate-500 text-sm">Explore our AI-recommended clothing collection</p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 shadow-sm"
          >
            <option value="createdAt,desc">Newest First</option>
            <option value="price,asc">Price: Low to High</option>
            <option value="price,desc">Price: High to Low</option>
            <option value="name,asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 glass-panel p-6 rounded-2xl h-fit space-y-6 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <SlidersHorizontal className="w-4 h-4 text-brand-600" />
              <span>Filter Products</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <form onSubmit={handleApplyFilter} className="space-y-5">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Search Keyword</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Shirt, Black..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-sm text-slate-800 rounded-xl py-2 pl-9 pr-3 focus:outline-none focus:border-brand-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white border border-slate-200 text-sm text-slate-800 rounded-xl p-2 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {['MALE', 'FEMALE', 'UNISEX'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(gender === g ? '' : g)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                      gender === g
                        ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-white border border-slate-200 text-sm text-slate-800 rounded-xl p-2 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Styles</option>
                <option value="CASUAL">Casual</option>
                <option value="FORMAL">Formal</option>
                <option value="SMART_CASUAL">Smart Casual</option>
                <option value="STREETWEAR">Streetwear</option>
                <option value="SPORT">Sport</option>
              </select>
            </div>

            {/* Size Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Size</label>
              <div className="flex gap-2">
                {['S', 'M', 'L', 'XL'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(size === s ? '' : s)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                      size === s
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Price Range (VND)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded-xl p-2"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded-xl p-2"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-purple text-white text-sm font-semibold shadow-glow-brand hover:opacity-90 transition"
            >
              Apply Filter
            </button>
          </form>
        </aside>

        {/* Product Grid */}
        <main className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 bg-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
              <Filter className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">No products found</h3>
              <p className="text-sm text-slate-500">Try adjusting your filter criteria or search keyword.</p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 rounded-full bg-brand-600 text-white text-xs font-semibold"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-100"
              >
                Previous
              </button>
              <span className="text-xs text-slate-600 font-medium px-2">
                Page {page + 1} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
