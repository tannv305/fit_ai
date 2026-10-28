import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { orderApi } from '../../services/orderApi';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getUserOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const updatedOrder = await orderApi.cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-64 bg-slate-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>;
      case 'CONFIRMED':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Confirmed</span>;
      case 'SHIPPED':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Shipped</span>;
      case 'DELIVERED':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Delivered</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Cancelled</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
        <Package className="w-8 h-8 text-brand-600" />
        <span>Order History</span>
      </h1>

      {orders.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900">No order history found</h3>
          <p className="text-sm text-slate-500">Place an order to see your purchase records here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const formattedTotal = new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(order.totalAmount);

            return (
              <div key={order.id} className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs text-slate-500">Order ID: #{order.id}</span>
                    <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-3 py-1 rounded-full text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <img
                        src={item.productImageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600'}
                        alt={item.productName}
                        className="w-16 h-20 object-cover rounded-xl bg-slate-100"
                      />
                      <div className="flex-1 space-y-0.5">
                        <p className="font-bold text-slate-900 text-sm">{item.productName}</p>
                        <p className="text-xs text-slate-500">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.itemSubtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Shipping & Total */}
                <div className="flex flex-wrap items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
                  <div>
                    <span>Shipping to: </span>
                    <strong className="text-slate-900">{order.shippingName}</strong> ({order.shippingPhone}), {order.shippingAddress}
                  </div>
                  <div className="text-base font-extrabold text-slate-900 mt-2 sm:mt-0">
                    Total: <span className="gradient-text">{formattedTotal}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
