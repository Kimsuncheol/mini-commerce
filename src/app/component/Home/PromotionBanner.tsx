import Link from 'next/link';

export default function PromotionBanner() {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
      
      {/* Decorative elements */}
      <div className="absolute left-0 top-0 w-64 h-64 rounded-full bg-white opacity-10 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute right-0 bottom-0 w-96 h-96 rounded-full bg-white opacity-10 translate-x-1/3 translate-y-1/3"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Summer Sale</h2>
        <p className="text-xl md:text-2xl font-light mb-6">Get up to 50% off on select items</p>
        <p className="text-lg mb-8">Limited time offer. While supplies last.</p>
        
        <div className="flex justify-center space-x-8 mb-8">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold">15</div>
            <div className="text-sm uppercase tracking-wider">Days</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold">08</div>
            <div className="text-sm uppercase tracking-wider">Hours</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold">23</div>
            <div className="text-sm uppercase tracking-wider">Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold">41</div>
            <div className="text-sm uppercase tracking-wider">Seconds</div>
          </div>
        </div>
        
        <Link href="/sale" 
          className="inline-block px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
          Shop Now
        </Link>
      </div>
    </section>
  );
}
