import React from 'react';
import { XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const PaymentFailed: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] pt-24 pb-12 flex flex-col items-center justify-center px-4">
      <div className="bg-red-50 p-6 rounded-full mb-6">
        <XCircle className="h-16 w-16 text-red-500" />
      </div>
      
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4 text-center">Payment Failed</h1>
      
      <p className="text-gray-600 text-center max-w-md mb-8">
        We couldn't process your payment. Your account has not been charged, or if it was, the amount will be refunded automatically within 3-5 business days.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button 
          onClick={() => navigate('/cart')}
          className="flex items-center justify-center px-8 py-3 bg-maroon text-white rounded-xl hover:bg-maroon-dark transition-colors font-medium"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Try Again
        </button>
        
        <Link 
          to="/shop"
          className="flex items-center justify-center px-8 py-3 bg-white text-maroon border-2 border-maroon rounded-xl hover:bg-maroon/5 transition-colors font-medium"
        >
          Continue Shopping
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};
