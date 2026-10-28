import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import { cartApi } from '../../services/cartApi';
import { orderApi } from '../../services/orderApi';
import { useAuth } from '../../context/AuthContext';

export default function CheckoutPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [shippingName, setShippingName] = useState(user?.name || '');
  const [shippingPhone, setShippingPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    cartApi.getCart()
      .then((c) => {
        setCart(c);
        if (c.items.length === 0) {
          navigate('/cart');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const order = await orderApi.createOrder({
        shippingName,
        shippingPhone,
        shippingAddress,
        paymentMethod,
      });
      navigate(`/orders`);
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed. Please check your stock or address.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-96 bg-slate-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const formattedTotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(cart?.totalAmount || 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Checkout Order</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Shipping & Payment Details */}
        <div className="glass-panel p-6 rounded-3xl space-y-6 border border-slate-200">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
            <Truck className="w-5 h-5 text-brand-600" />
            <span>Shipping Information</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Name</label>
              <input
                type="text"
                required
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                placeholder="Nguyen Van A"
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Phone</label>
              <input
                type="text"
                required
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                placeholder="0987654321"
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shipping Address</label>
              <textarea
                required
                rows={3}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Full delivery address, street, ward, city..."
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 resize-none shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-lg font-bold text-slate-900 border-b border-slate-200 pb-3 pt-2">
            <CreditCard className="w-5 h-5 text-accent-purple" />
            <span>Payment Method</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer shadow-sm">
              <input
                type="radio"
                name="payment"
                value="COD"
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
                className="accent-brand-600"
              />
              <span className="text-sm font-semibold text-slate-800">Cash On Delivery (COD)</span>
            </label>
          </div>
        </div>

        {/* Right Column: Order Review */}
        <div className="glass-panel p-6 rounded-3xl space-y-6 border border-slate-200 h-fit">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Review Items</h3>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {cart?.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                <div className="space-y-0.5 max-w-[200px]">
                  <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                  <p className="text-slate-500">Size: {item.size} | Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-slate-800">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.itemSubtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="flex justify-between text-base font-bold text-slate-900">
              <span>Total Payable:</span>
              <span className="gradient-text text-xl">{formattedTotal}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-brand-600 to-accent-purple text-white font-semibold shadow-glow-brand hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{submitting ? 'Processing Order...' : 'Confirm Order'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
