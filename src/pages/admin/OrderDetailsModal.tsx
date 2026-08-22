import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Printer, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderDetailsModalProps {
  order: any;
  onClose: () => void;
  isCustomerView?: boolean;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose, isCustomerView }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderItems();
  }, [order.id]);

  const fetchOrderItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products(name, images)
        `)
        .eq('order_id', order.id);

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      toast.error('Failed to fetch order items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 overflow-y-auto no-print">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative my-8 print-modal">
        {/* Header - Hidden in Print */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 no-print">
          <h2 className="text-xl font-serif font-bold text-gray-900">Order Details</h2>
          <div className="flex gap-4">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-cream text-maroon hover:bg-maroon hover:text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Printer className="h-4 w-4" /> Print Receipt
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-8 printable-content">
          {/* Print Header (Logo/Brand) */}
          <div className="hidden print-header mb-8 pb-8 border-b-2 border-gray-900 text-center">
            <h1 className="text-4xl font-serif font-bold text-black tracking-wider uppercase">Panchganga Traders</h1>
            <p className="text-gray-600 mt-2 text-sm">Premium Hand-stitched Leather Chappals</p>
            <p className="text-gray-500 text-sm">123 Artisan Street, Kolhapur, MH 416001</p>
            <p className="text-gray-500 text-sm">support@panchgangatraders.com | +91 98765 43210</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 print-box">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-maroon print-icon" /> Shipping Details
              </h3>
              <p className="font-bold text-gray-900 text-lg">{order.shipping_address?.fullName}</p>
              <p className="text-gray-600">{order.shipping_address?.street}</p>
              <p className="text-gray-600">{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postalCode}</p>
              <p className="text-gray-600 mt-2 font-medium">Ph: {order.shipping_address?.phone}</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 print-box">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-maroon print-icon" /> Order Info
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-mono font-medium">{order.id.split('-')[0].toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium">{new Date(order.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="font-medium">{order.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className={`font-bold uppercase ${
                    order.payment_status === 'paid' ? 'text-green-600' : 
                    order.payment_status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                  }`}>{order.payment_status}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Delivery Status:</span>
                  <span className={`font-bold uppercase ${
                    order.delivery_status === 'delivered' ? 'text-green-600' : 
                    order.delivery_status === 'shipped' ? 'text-blue-600' : 'text-gray-600'
                  }`}>{order.delivery_status || 'Processing'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden print-box">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm font-bold text-gray-900 uppercase tracking-wider">
                  <th className="p-4 w-16 text-center">#</th>
                  <th className="p-4">Item Description</th>
                  <th className="p-4 text-center">Size</th>
                  <th className="p-4 text-center">Qty</th>
                  <th className="p-4 text-right">Unit Price</th>
                  <th className="p-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 animate-pulse">Loading items...</td>
                  </tr>
                ) : items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="p-4 text-center text-gray-500 font-medium">{index + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.products?.images?.[0] || '/placeholder.png'} 
                          alt="Product" 
                          className="h-12 w-12 rounded object-cover border border-gray-200 no-print" 
                        />
                        <div>
                          <span className="font-medium text-gray-900 block">{item.products?.name || 'Unknown Product'}</span>
                          {isCustomerView && order.delivery_status === 'delivered' && (
                            <a 
                              href={`/product/${item.product_id}#reviews`}
                              className="text-xs text-maroon hover:text-maroon-dark font-medium inline-flex items-center mt-1 no-print"
                            >
                              Leave a Review
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center font-medium">{item.size}</td>
                    <td className="p-4 text-center">{item.quantity}</td>
                    <td className="p-4 text-right">₹{item.unit_price}</td>
                    <td className="p-4 text-right font-bold text-gray-900">
                      ₹{item.quantity * item.unit_price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {!loading && (
              <div className="bg-gray-50 p-6 flex flex-col items-end gap-2 border-t border-gray-200">
                <div className="flex justify-between w-64 text-gray-600">
                  <span>Subtotal:</span>
                  <span>₹{order.total_amount}</span>
                </div>
                <div className="flex justify-between w-64 text-gray-600">
                  <span>Shipping:</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between w-64 text-xl font-bold text-gray-900 mt-2 pt-2 border-t border-gray-200">
                  <span>Grand Total:</span>
                  <span>₹{order.total_amount}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Print Footer */}
          <div className="hidden print-footer mt-12 text-center text-gray-500 text-sm">
            <p>Thank you for shopping with Panchganga Traders!</p>
            <p className="mt-1">All returns must be initiated within 7 days of delivery.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
