import React from 'react';
import logoIcon from '../assets/logo-icon.png';
import logoFull from '../assets/logo-full.png';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-cream-dark border-t border-gray-200 py-12 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <img src={logoIcon} alt="PT Icon" className="w-10 h-10 sm:hidden object-contain rounded-full" />
              <img src={logoFull} alt="Panchganga Traders" className="h-14 hidden sm:block object-contain -ml-2" />
            </div>
            <p className="text-gray-600 max-w-sm">
              Hand-stitched leather chappals from the artisans of Kolhapur, Maharashtra. 
              Carrying forward generations of craftsmanship and heritage in every step.
            </p>
          </div>
          
          <div>
            <h4 className="font-serif font-bold text-gray-900 mb-4">Shop</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><a href="#" className="hover:text-maroon transition-colors">All Collections</a></li>
              <li><a href="#" className="hover:text-maroon transition-colors">Men's Chappals</a></li>
              <li><a href="#" className="hover:text-maroon transition-colors">Women's Chappals</a></li>
              <li><a href="#" className="hover:text-maroon transition-colors">Kids' Collection</a></li>
              <li><a href="#" className="hover:text-maroon transition-colors">New Arrivals</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif font-bold text-gray-900 mb-4">Account</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><a href="#" className="hover:text-maroon transition-colors">Sign In</a></li>
              <li><a href="#" className="hover:text-maroon transition-colors">Track Order</a></li>
              <li><a href="#" className="hover:text-maroon transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-maroon transition-colors">Size Guide</a></li>
              <li><a href="#" className="hover:text-maroon transition-colors">Contact Us</a></li>
            </ul>
          </div>
          
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-500 text-sm text-center md:text-left mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Panchganga Traders. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <span className="text-sm font-medium text-gray-400">Made with ❤️ in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
