import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle, Package } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;

  if (!orderId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-cream">
      <Navbar onOpenAuth={() => {}} user={null} />
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-500 mb-8">
            Thank you for shopping with Panchganga Traders. Your artisanal chappals are being prepared.
          </p>

          <div className="bg-cream-dark rounded-xl p-6 mb-8 text-left">
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-5 w-5 text-maroon" />
              <span className="font-medium text-gray-900">Order Reference</span>
            </div>
            <p className="text-sm font-mono text-gray-600 break-all bg-white p-3 rounded-lg border border-gray-200 mt-2">
              {orderId}
            </p>
          </div>

          <Link 
            to="/" 
            className="inline-block w-full bg-maroon hover:bg-maroon-dark text-white py-4 rounded-xl font-medium transition-colors shadow-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};
