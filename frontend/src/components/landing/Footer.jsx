import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#FAF8F5] dark:bg-[#0E121A] text-[#1C1917] dark:text-[#F5F2EB] pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-t border-[#EAE5DD] dark:border-[#262C36] font-sans transition-colors">
      <div className="max-w-7xl mx-auto">
        
        {/* Main 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12">
          
          {/* Column 1: Brand & Socials (Span 4) */}
          <div className="lg:col-span-4">
            {/* Logo */}
            <a href="#" className="inline-flex items-center gap-2.5 mb-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619] rounded-md">
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded bg-[#FEF0E6] dark:bg-[#2A1D16] text-[#D25619] border border-[#FAD8C3] dark:border-[#3E281C]">
                मंत्र
              </span>
              <span className="text-xl font-bold tracking-tight text-[#1C1917] dark:text-[#F5F2EB]">
                MANTRA<span className="text-[#D25619]">.AI</span>
              </span>
            </a>

            {/* Description */}
            <p className="text-[14.5px] leading-relaxed text-[#57534E] dark:text-[#A8A29E] font-normal mb-6 max-w-sm">
              An India-first men's health intelligence platform for a healthier, more informed tomorrow.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {/* LinkedIn */}
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-lg border border-[#EAE5DD] dark:border-[#2E3545] bg-white dark:bg-[#151921] text-[#57534E] dark:text-[#A8A29E] flex items-center justify-center hover:text-[#D25619] dark:hover:text-[#D25619] hover:border-[#D5CEBF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 0 0 0-3.34 1.67 1.67 0 0 0 0 3.34m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                </svg>
              </a>

              {/* X / Twitter */}
              <a
                href="#"
                aria-label="X (formerly Twitter)"
                className="w-8 h-8 rounded-lg border border-[#EAE5DD] dark:border-[#2E3545] bg-white dark:bg-[#151921] text-[#57534E] dark:text-[#A8A29E] flex items-center justify-center hover:text-[#D25619] dark:hover:text-[#D25619] hover:border-[#D5CEBF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619]"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="#"
                aria-label="Instagram"
                className="w-8 h-8 rounded-lg border border-[#EAE5DD] dark:border-[#2E3545] bg-white dark:bg-[#151921] text-[#57534E] dark:text-[#A8A29E] flex items-center justify-center hover:text-[#D25619] dark:hover:text-[#D25619] hover:border-[#D5CEBF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="#"
                aria-label="YouTube"
                className="w-8 h-8 rounded-lg border border-[#EAE5DD] dark:border-[#2E3545] bg-white dark:bg-[#151921] text-[#57534E] dark:text-[#A8A29E] flex items-center justify-center hover:text-[#D25619] dark:hover:text-[#D25619] hover:border-[#D5CEBF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: PRODUCT (Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-[13px] font-bold text-[#1C1917] dark:text-[#F5F2EB] uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-[14.5px] text-[#57534E] dark:text-[#A8A29E]">
              <li><a href="#how-it-works" className="hover:text-[#D25619] dark:hover:text-[#D25619] transition-colors">How it works</a></li>
              <li><a href="#features" className="hover:text-[#D25619] dark:hover:text-[#D25619] transition-colors">Features</a></li>
              <li><a href="#resources" className="hover:text-[#D25619] dark:hover:text-[#D25619] transition-colors">Resources</a></li>
              <li><a href="#institutions" className="hover:text-[#D25619] dark:hover:text-[#D25619] transition-colors">For Institutions</a></li>
            </ul>
          </div>

          {/* Column 3: COMPANY (Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-[13px] font-bold text-[#1C1917] dark:text-[#F5F2EB] uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-[14.5px] text-[#57534E] dark:text-[#A8A29E]">
              <li><a href="#why-it-matters" className="hover:text-[#D25619] dark:hover:text-[#D25619] transition-colors">About Us</a></li>
              <li><a href="#how-it-works" className="hover:text-[#D25619] dark:hover:text-[#D25619] transition-colors">Our Approach</a></li>
              <li><a href="#faq" className="hover:text-[#D25619] dark:hover:text-[#D25619] transition-colors">Privacy Policy</a></li>
              <li><a href="#faq" className="hover:text-[#D25619] dark:hover:text-[#D25619] transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Column 4: SUPPORT (Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-[13px] font-bold text-[#1C1917] dark:text-[#F5F2EB] uppercase tracking-wider mb-4">
              Support
            </h4>
            <ul className="space-y-2.5 text-[14.5px] text-[#57534E] dark:text-[#A8A29E]">
              <li><a href="#faq" className="hover:text-[#D25619] dark:hover:text-[#D25619] transition-colors">Help & FAQ</a></li>
              <li><a href="#faq" className="hover:text-[#D25619] dark:hover:text-[#D25619] transition-colors">Contact Us</a></li>
              <li><a href="#faq" className="hover:text-[#D25619] dark:hover:text-[#D25619] transition-colors">Report an Issue</a></li>
            </ul>
          </div>

          {/* Column 5: Tagline (Span 2) */}
          <div className="lg:col-span-2 flex flex-col justify-center items-start lg:items-end text-left lg:text-right">
            <div className="relative">
              <p className="font-serif italic text-2xl sm:text-[26px] text-[#1C1917] dark:text-[#F5F2EB] leading-tight">
                A healthier you <br />
                <span className="text-[#D25619] not-italic font-serif">for a brighter India.</span>
              </p>
              {/* Subtle decorative leaf stroke */}
              <div className="mt-3 flex lg:justify-end">
                <svg className="w-8 h-4 text-[#D25619]/40" viewBox="0 0 32 16" fill="none">
                  <path d="M2 14C10 14 20 8 30 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar Divider & Info */}
        <div className="border-t border-[#EAE5DD] dark:border-[#262C36] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[13px] text-[#78716C] dark:text-[#A8A29E]">
          <div>
            © 2026 MantraAI. All rights reserved.
          </div>
          <div className="font-medium text-[#57534E] dark:text-[#A8A29E]">
            Built in India <span className="mx-2 text-[#D5CEBF] dark:text-[#2E3545]">|</span> For a Healthier Tomorrow
          </div>
        </div>

      </div>
    </footer>
  );
}
