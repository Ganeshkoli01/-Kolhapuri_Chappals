import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { Loader2 } from 'lucide-react';

export const VerifyPayment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState('Verifying your payment...');
  const verifyAttempted = useRef(false);

  useEffect(() => {
    const verify = async () => {
      if (verifyAttempted.current) return;
      verifyAttempted.current = true;

      try {
        const pendingCheckout = sessionStorage.getItem('pending_checkout');
        
        if (!pendingCheckout) {
          navigate('/');
          return;
        }

        const checkoutData = JSON.parse(pendingCheckout);
        
        // Use transaction ID from URL if present, otherwise fallback to session
        const urlTransactionId = searchParams.get('transactionId');
        const merchantTransactionId = urlTransactionId || checkoutData.merchantTransactionId;

        const { data, error } = await supabase.functions.invoke('phonepe-verify-payment', {
          body: {
            merchantTransactionId,
            userId: checkoutData.userId,
            cartItems: checkoutData.items,
            totalAmount: checkoutData.totalAmount,
            shippingAddress: checkoutData.address
          }
        });

        // Always clear the session storage once we have tried to verify
        sessionStorage.removeItem('pending_checkout');

        if (error || !data?.success) {
          console.error("Payment verification failed:", error || data);
          navigate('/payment/failed');
          return;
        }

        clearCart();
        navigate('/order-confirmation', { state: { orderId: data.orderId } });

      } catch (err) {
        console.error('Verification error:', err);
        navigate('/payment/failed');
      }
    };

    verify();
  }, [navigate, searchParams, clearCart]);

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="h-12 w-12 text-maroon animate-spin mb-4" />
      <h2 className="text-xl font-medium text-gray-900">{status}</h2>
      <p className="text-gray-500 mt-2">Please do not close this window or click back.</p>
    </div>
  );
};
