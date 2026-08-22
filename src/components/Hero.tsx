import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  const handleScroll = (category: string) => {
    navigate(`/?category=${category}`);
    setTimeout(() => {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="relative">
      {/* Hero Content with Full Background Image */}
      <div className="relative min-h-[600px] flex items-center bg-gray-900">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/img/hero-bg.jpg')" }}
        ></div>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 z-10 bg-black/50 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
        
        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-32">
          {/* Text Section */}
          <div className="w-full lg:w-3/5 text-left">
            <div className="inline-flex items-center text-[#d2a35b] text-xs font-bold tracking-widest mb-6 uppercase">
              SINCE GENERATIONS &bull; KOLHAPUR, MAHARASHTRA
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight text-white font-serif">
              Chappals stitched by hand, <br className="hidden lg:block"/> made to last for years
            </h1>
            <p className="text-lg text-gray-200 mb-10 max-w-xl">
              Vegetable-tanned leather, braided toe loops, and soles that mould to your feet. 
              Delivered anywhere in India with cash on delivery.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
              <button 
                onClick={() => handleScroll('All')}
                className="w-full sm:w-auto px-8 py-3 bg-[#7d2c33] hover:bg-[#5a1c22] text-white rounded-md font-medium transition-all shadow-lg flex items-center justify-center gap-2 group"
              >
                Shop the collection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Quick Links */}
      <div className="bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Men', 'Women', 'Kids'].map((cat) => (
              <button 
                key={cat} 
                onClick={() => handleScroll(cat)}
                className="group cursor-pointer bg-white rounded-xl p-6 shadow-sm hover:shadow-md border border-gray-100 transition-all flex items-center justify-between text-left"
              >
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#5a1c22]">{cat}</h3>
                  <p className="text-sm text-gray-500 mt-1 group-hover:text-[#a05a2c] transition-colors">Explore collection</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#FAF9F6] flex items-center justify-center group-hover:bg-[#a05a2c] group-hover:text-white text-[#a05a2c] transition-colors">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
