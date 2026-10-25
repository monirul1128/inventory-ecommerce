import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="bg-amber-900 text-amber-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-bold text-white text-lg mb-3">🪑 ফার্নিচার স্টোর</h3>
          <p className="text-sm">আপনার স্বপ্নের ঘর সাজানোর জন্য সেরা ফার্নিচার</p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">যোগাযোগ</h4>
          <p className="text-sm">📍 ঢাকা, বাংলাদেশ</p>
          <p className="text-sm">📞 +880 1700-000000</p>
          <p className="text-sm">✉️ info@furniturestore.com</p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">দ্রুত লিংক</h4>
          <ul className="text-sm space-y-1">
            <li><Link href="/shop" className="hover:text-white transition-colors">সকল পণ্য</Link></li>
            <li><Link href="/cart" className="hover:text-white transition-colors">কার্ট</Link></li>
            <li><Link href="/orders" className="hover:text-white transition-colors">অর্ডার ট্র্যাক</Link></li>
            <li><Link href="/admin/login" className="hover:text-white transition-colors">অ্যাডমিন</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-amber-800 text-center py-4 text-sm">
        © 2024 ফার্নিচার স্টোর। সর্বস্বত্ব সংরক্ষিত।
      </div>
    </footer>
  )
}
