import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, ShoppingCart } from 'lucide-react';
import { cartApi } from '../../services/cartApi';
import { useAuth } from '../../context/AuthContext';

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      cartApi.getCart()
        .then(setCart)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleUpdateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      const updatedCart = await cartApi.updateItem(itemId, newQty);
      setCart(updatedCart);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating item quantity');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const updatedCart = await cartApi.removeItem(itemId);
      setCart(updatedCart);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingCart className="w-16 h-16 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Please Log In to View Your Cart</h2>
        <p className="text-slate-500 text-sm">Your shopping cart items are saved to your account.</p>
        <Link to="/login" className="inline-block px-6 py-2.5 rounded-full bg-brand-600 text-white font-semibold shadow-glow-brand">
          Log In Now
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-64 bg-slate-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const formattedTotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(cart?.totalAmount || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-brand-600" />
          <span>Shopping Cart</span>
        </h1>
        <Link to="/products" className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
        </Link>
      </div>

      {!cart || cart.items.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
          <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900">Your cart is currently empty</h3>
          <p className="text-sm text-slate-500">Explore our products and find your style.</p>
          <Link to="/products" className="inline-block px-6 py-3 rounded-full bg-brand-600 text-white font-semibold text-sm">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => {
              const formattedPrice = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(item.itemSubtotal);

              return (
                <div key={item.id} className="glass-panel p-4 rounded-2xl flex items-center gap-4 border border-slate-200">
                  <img
                    src={item.productImageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600'}
                    alt={item.productName}
                    className="w-20 h-24 object-cover rounded-xl bg-slate-100"
                  />
                  
                  <div className="flex-1 space-y-1">
                    <Link to={`/products/${item.productId}`} className="font-bold text-slate-900 hover:text-brand-600 transition text-base">
                      {item.productName}
                    </Link>
                    <p className="text-xs text-slate-500">
                      Size: <span className="text-slate-800 font-semibold">{item.size}</span> | Color: <span className="text-slate-800 font-semibold">{item.color}</span>
                    </p>
                    <p className="text-sm font-extrabold text-slate-900 pt-1">{formattedPrice}</p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-sm">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <div className="glass-panel p-6 rounded-3xl space-y-6 h-fit border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Order Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items ({cart.totalItems}):</span>
                <span className="text-slate-900 font-semibold">{formattedTotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping:</span>
                <span className="text-emerald-600 font-semibold">Free</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="gradient-text">{formattedTotal}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-brand-600 to-accent-purple text-white font-semibold shadow-glow-brand hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
