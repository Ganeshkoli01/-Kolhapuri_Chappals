import { useState, useEffect } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductGrid } from './components/ProductGrid';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { WishlistDrawer } from './components/WishlistDrawer';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { ProductDetails } from './pages/ProductDetails';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Profile } from './pages/Profile';
import { supabase } from './lib/supabase';

const Home = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const showHero = !category || category === 'All';

  return (
    <>
      {showHero && <Hero />}
      <ProductGrid />
    </>
  );
};

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (data?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} user={user} isAdmin={isAdmin} />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/profile" element={user ? <Profile userId={user.id} /> : <div className="p-20 text-center text-maroon font-bold">Please sign in to view your profile.</div>} />
          <Route path="/admin/*" element={isAdmin ? <AdminDashboard /> : <div className="p-20 text-center text-red-500 font-bold">Access Denied</div>} />
        </Routes>
      </main>
      
      <Footer />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      
      <CartDrawer 
        onCheckout={() => setIsCheckoutOpen(true)} 
      />

      <WishlistDrawer />
      
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        userId={user?.id}
      />
    </div>
  );
}

export default App;
