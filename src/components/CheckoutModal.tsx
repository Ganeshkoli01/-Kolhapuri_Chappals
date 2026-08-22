import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { X, CreditCard, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, userId }) => {
  const { items, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'COD'>('Razorpay');
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: ''
  });
  const [savedAddress, setSavedAddress] = useState<any>(null);
  const [useSavedAddress, setUseSavedAddress] = useState(true);

  const isCodAvailable = items.every(item => item.product.cod_available !== false);
  const baseSubtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalTax = items.reduce((sum, item) => sum + ((item.product.tax_amount || 0) * item.quantity), 0);
  const totalShipping = items.reduce((sum, item) => sum + ((item.product.shipping_charge || 0) * item.quantity), 0);
  const totalOther = items.reduce((sum, item) => sum + ((item.product.other_charges || 0) * item.quantity), 0);

  useEffect(() => {
    if (!isCodAvailable && paymentMethod === 'COD') {
      setPaymentMethod('Razorpay');
    }
  }, [isCodAvailable, paymentMethod]);

  useEffect(() => {
    if (userId && isOpen) {
      const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data && data.address) {
          const fetchedAddress = {
            fullName: data.full_name || '',
            phone: data.phone || '',
            street: data.address || '',
            city: data.city || '',
            state: data.state || '',
            postalCode: data.postal_code || ''
          };
          setSavedAddress(fetchedAddress);
          setAddress(fetchedAddress);
          setUseSavedAddress(true);
        } else {
          setUseSavedAddress(false);
        }
      };
      fetchProfile();
    }
  }, [userId, isOpen]);

  if (!isOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('Please sign in to checkout');
      return;
    }
    
    setLoading(true);

    if (paymentMethod === 'COD') {
      try {
        // 1. Insert into orders table
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{
            user_id: userId,
            total_amount: totalAmount,
            payment_status: 'pending',
            payment_method: 'COD',
            shipping_address: address
          }])
          .select()
          .single();

        if (orderError) throw orderError;

        // 2. Insert into order_items table
        const orderItemsData = items.map(item => ({
          order_id: orderData.id,
          product_id: item.product.id,
          size: item.size,
          quantity: item.quantity,
          unit_price: item.product.price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData);

        if (itemsError) throw itemsError;

        // 3. Decrement stock for each item using RPC (if available) or just let it be for now
        // Assuming we have decrement_stock RPC, we could call it here.
        for (const item of items) {
          await supabase.rpc('decrement_stock', { p_id: item.product.id, p_qty: item.quantity });
        }

        toast.success('Order placed successfully (COD)');
        clearCart();
        onClose();
        navigate('/order-confirmation', { state: { orderId: orderData.id } });
      } catch (err: any) {
        toast.error(err.message || 'Failed to place order');
      } finally {
        setLoading(false);
      }
      return;
    }

    const res = await loadRazorpay();
    if (!res) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      setLoading(false);
      return;
    }

    try {
      // 1. Create Order via Edge Function
      const { data, error } = await supabase.functions.invoke('razorpay-create-order', {
        body: { amount: totalAmount, currency: 'INR' }
      });

      if (error || !data) throw error || new Error('Failed to create order');

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock', 
        amount: data.amount,
        currency: data.currency,
        name: 'Panchganga Traders',
        description: 'Premium Leather Chappals',
        order_id: data.id,
        handler: async function (response: any) {
          toast.loading('Verifying payment...', { id: 'verify' });
          
          try {
            // 2. Verify Payment via Edge Function
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId,
                cartItems: items,
                totalAmount,
                shippingAddress: address
              }
            });

            if (verifyError || !verifyData?.success) {
              throw verifyError || new Error('Verification failed');
            }

            toast.success('Payment successful!', { id: 'verify' });
            clearCart();
            onClose();
            navigate('/order-confirmation', { state: { orderId: verifyData.orderId } });

          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed', { id: 'verify' });
          }
        },
        prefill: {
          name: address.fullName,
          contact: address.phone,
        },
        theme: {
          color: '#671D22'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (err: any) {
      toast.error(err.message || 'Failed to initialize checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 z-10">
          <X className="h-6 w-6" />
        </button>
        
        <div className="p-8">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Checkout</h2>
          
          <form onSubmit={handleCheckout}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Address */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-medium text-gray-900">Shipping Details</h3>
                  {savedAddress && (
                    <button 
                      type="button"
                      onClick={() => {
                        if (useSavedAddress) {
                          setUseSavedAddress(false);
                          setAddress({ fullName: '', phone: '', street: '', city: '', state: '', postalCode: '' });
                        } else {
                          setUseSavedAddress(true);
                          setAddress(savedAddress);
                        }
                      }}
                      className="text-xs text-maroon hover:underline font-medium"
                    >
                      {useSavedAddress ? '+ Add New Address' : 'Use Saved Address'}
                    </button>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <input required type="text" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon"
                    value={address.fullName} onChange={e => setAddress({...address, fullName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input required type="text" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon"
                    value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
                  <input required type="text" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon"
                    value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <input required type="text" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon"
                      value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
                    <input required type="text" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon"
                      value={address.postalCode} onChange={e => setAddress({...address, postalCode: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Right: Payment & Summary */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 border-b pb-2 mb-4">Payment Method</h3>
                  <div className="space-y-3">
                    <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'Razorpay' ? 'border-maroon bg-maroon/5 ring-1 ring-maroon' : 'hover:bg-gray-50'}`}>
                      <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'Razorpay'} onChange={() => setPaymentMethod('Razorpay')} />
                      <CreditCard className={`h-5 w-5 mr-3 ${paymentMethod === 'Razorpay' ? 'text-maroon' : 'text-gray-400'}`} />
                      <span className="font-medium text-sm">Online (Razorpay / Cards / UPI)</span>
                    </label>
                    <label className={`flex items-center p-4 border rounded-xl transition-all ${paymentMethod === 'COD' ? 'border-maroon bg-maroon/5 ring-1 ring-maroon' : 'hover:bg-gray-50'} ${!isCodAvailable ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}>
                      <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'COD'} disabled={!isCodAvailable} onChange={() => setPaymentMethod('COD')} />
                      <Banknote className={`h-5 w-5 mr-3 flex-shrink-0 ${paymentMethod === 'COD' ? 'text-maroon' : 'text-gray-400'}`} />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">Cash on Delivery</span>
                        {!isCodAvailable && <span className="text-xs text-red-500 mt-0.5">Not available for some items in cart</span>}
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-cream p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{baseSubtotal.toLocaleString()}</span>
                  </div>
                  {totalTax > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tax</span>
                      <span>₹{totalTax.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    {totalShipping > 0 ? (
                      <span>₹{totalShipping.toLocaleString()}</span>
                    ) : (
                      <span className="text-green-600 font-medium">Free</span>
                    )}
                  </div>
                  {totalOther > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Other Charges</span>
                      <span>₹{totalOther.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-200 mt-2 pt-2">
                    <span>Total</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-maroon hover:bg-maroon-dark text-white py-4 rounded-xl font-medium transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString()}`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
