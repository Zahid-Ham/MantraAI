import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { handleGetStartedNavigation } from '../../utils/navigation';

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const navLinks = [
    { name: 'Home', href: '#home', id: 'home' },
    { name: 'How it works', href: '#how-it-works', id: 'how-it-works' },
    { name: 'Features', href: '#features', id: 'features' },
    { name: 'Why it matters', href: '#why-it-matters', id: 'why-it-matters' },
    { name: 'For Institutions', href: '#institutions', id: 'institutions' },
    { name: 'Resources', href: '#resources', id: 'resources' },
  ];

  useEffect(() => {
    const sectionIds = ['home', 'how-it-works', 'features', 'why-it-matters', 'institutions', 'resources'];

    const handleScroll = () => {
      // If near the top, highlight home
      if (window.scrollY < 120) {
        setActiveSection('home');
        return;
      }

      // Check each section's position relative to the viewport
      let currentSection = 'home';
      for (let i = 0; i < sectionIds.length; i++) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // When the section top enters the upper portion of the viewport (below header)
          if (rect.top <= 260) {
            currentSection = id;
          }
        }
      }
      setActiveSection(currentSection);
    };

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (sectionIds.includes(hash)) {
        setActiveSection(hash);
      } else if (!hash) {
        setActiveSection('home');
      }
    };

    handleHashChange();
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleNavClick = (e, link) => {
    if (link.href.startsWith('#') && link.id !== 'awareness') {
      e.preventDefault();
      const targetId = link.id;
      setActiveSection(targetId);
      window.history.pushState(null, '', `#${targetId}`);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const navHeight = 74;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetId === 'home' ? 0 : offsetPosition,
          behavior: 'smooth'
        });
      }
      setMobileMenuOpen(false);
    }
  };

  const handleCtaClick = (e) => {
    handleGetStartedNavigation(e, isAuthenticated);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE5DD] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[74px]">
          
          {/* LEFT: Brand Identity */}
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, { href: '#home', id: 'home' })}
            className="flex items-center gap-2.5 group select-none"
          >
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[13px] font-semibold rounded-md bg-[#FEF0E6] text-[#D25619] border border-[#FAD8C3]">
              मंत्र
            </span>
            <span className="text-[20px] font-bold tracking-tight text-[#1C1917] group-hover:text-[#D25619] transition-colors">
              MANTRA<span className="text-[#D25619]">.AI</span>
            </span>
          </a>

          {/* CENTER: Desktop Navigation with Dynamic Section Highlight */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-9">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className={`relative py-1 text-[15px] font-medium transition-colors ${
                    isActive
                      ? 'text-[#1C1917] font-semibold'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#D25619] rounded-full transition-all duration-300" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* RIGHT: Clean Login & Get Started CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <a
                href="#dashboard"
                onClick={handleCtaClick}
                className="px-4 py-2 text-[15px] font-semibold text-[#1C1917] bg-white border border-[#EAE5DD] hover:border-[#D25619] rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Dashboard
              </a>
            ) : (
              <a
                href="#login"
                className="px-4 py-2 text-[15px] font-semibold text-[#1C1917] bg-white border border-[#EAE5DD] hover:border-[#D25619] rounded-lg shadow-sm transition-colors"
              >
                Login
              </a>
            )}
            <button
              onClick={handleCtaClick}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-[15px] font-semibold text-white bg-[#D25619] hover:bg-[#B94711] rounded-lg shadow-sm transition-all hover:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <span>{isAuthenticated ? 'My Dashboard' : 'Get Started'}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#1C1917] hover:text-[#D25619] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#EAE5DD] space-y-3 animate-fade-in">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link)}
                    className={`px-3 py-2 text-[15px] rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'text-[#D25619] font-semibold bg-[#FEF6EE]'
                        : 'text-[#4A453E] hover:text-[#1C1917] hover:bg-[#F5F1EA]'
                    }`}
                  >
                    {link.name}
                  </a>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#EAE5DD] grid grid-cols-2 gap-3">
              {isAuthenticated ? (
                <a
                  href="#dashboard"
                  onClick={handleCtaClick}
                  className="text-center px-4 py-2.5 text-[15px] font-semibold text-[#1C1917] bg-white border border-[#EAE5DD] rounded-lg cursor-pointer"
                >
                  Dashboard
                </a>
              ) : (
                <a
                  href="#login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2.5 text-[15px] font-semibold text-[#1C1917] bg-white border border-[#EAE5DD] rounded-lg"
                >
                  Login
                </a>
              )}
              <button
                onClick={handleCtaClick}
                className="inline-flex items-center justify-center gap-1.5 text-center px-4 py-2.5 text-[15px] font-semibold text-white bg-[#D25619] rounded-lg cursor-pointer"
              >
                <span>{isAuthenticated ? 'Dashboard' : 'Get Started'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
