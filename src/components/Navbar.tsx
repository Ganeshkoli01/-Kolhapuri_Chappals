import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User as UserIcon, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import logoIcon from '../assets/logo-icon.png';
import logoFull from '../assets/logo-full.png';

interface NavbarProps {
  onOpenAuth: () => void;
  user: any;
  isAdmin?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, user, isAdmin }) => {
  const { setIsCartOpen, totalItems } = useCart();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentCategory = searchParams.get('category') || 'All';
  
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/?q=${encodeURIComponent(searchValue.trim())}#products`);
    } else {
      navigate(`/#products`);
    }
  };

  const getLinkClass = (category: string) => {
    return currentCategory === category 
      ? "text-maroon font-bold transition-colors"
      : "text-gray-600 hover:text-maroon font-medium transition-colors";
  };
  
  return (
    <nav className="sticky top-0 z-50 bg-cream-dark border-b border-cream shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Left: Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <img src={logoIcon} alt="PT Icon" className="w-10 h-10 sm:hidden object-contain rounded-full" />
            <img src={logoFull} alt="Panchganga Traders" className="h-16 hidden sm:block object-contain" />
          </Link>

          {/* Middle: Navigation */}
          <div className="hidden md:flex space-x-8">
            <Link to="/?category=All#products" className={getLinkClass('All')}>All Chappals</Link>
            <Link to="/?category=Men#products" className={getLinkClass('Men')}>Men</Link>
            <Link to="/?category=Women#products" className={getLinkClass('Women')}>Women</Link>
            <Link to="/?category=Kids#products" className={getLinkClass('Kids')}>Kids</Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-6">
            <form onSubmit={handleSearch} className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search chappals..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-9 pr-4 py-2 bg-cream border border-gray-200 rounded-full text-sm focus:outline-none focus:border-maroon focus:ring-1 focus:ring-maroon w-48 transition-all"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </form>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative text-gray-900 hover:text-maroon transition-colors group"
            >
              <ShoppingBag className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-maroon text-cream text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                {totalItems}
              </span>
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <Link 
                  to="/profile"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white px-3 py-1.5 rounded-full border border-gray-200 hover:border-maroon hover:text-maroon transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-maroon" />
                  <span className="hidden sm:inline-block max-w-[100px] truncate">
                    {user.email?.split('@')[0]}
                  </span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-sm font-bold text-maroon hover:text-maroon-dark bg-maroon/10 px-3 py-1.5 rounded-full">
                    Admin Panel
                  </Link>
                )}
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="text-gray-500 hover:text-maroon transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="bg-maroon hover:bg-maroon-dark text-white px-5 py-2 rounded-full font-medium transition-colors shadow-sm"
              >
                Sign in
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};
