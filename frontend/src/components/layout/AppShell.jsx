import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AppShell({ children, currentTab = 'assess', onNavigateHome }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('mantra_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const { user, logout } = useAuth();

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mantra_sidebar_collapsed', String(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Rahul Agarwal');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'RA';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '#dashboard',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'assess',
      label: 'Take Assessment',
      href: '#assess',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'reports',
      label: 'My Reports',
      href: '#history',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'progress',
      label: 'My Progress',
      href: '#progress',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'resources',
      label: 'Resources',
      href: '#resources',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: 'support',
      label: 'Support',
      href: '#support',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '#settings',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1917] font-sans flex flex-col md:flex-row antialiased transition-colors duration-300">
      
      {/* Mobile Top App Header */}
      <header className="md:hidden flex items-center justify-between h-16 px-4 bg-[#FAF9F6] border-b border-[#E8E5DF] sticky top-0 z-30">
        <a href="#assess" className="flex items-center gap-2 select-none">
          <div className="w-7 h-7 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#1C1917]">
            Mantra<span className="text-[#1E3A2B]">AI</span>
          </span>
        </a>

        <div className="flex items-center gap-2">
          {/* Notification icon */}
          <button
            type="button"
            className="p-2 text-[#78716C] hover:text-[#1C1917] relative rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A2B]"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white" />
          </button>

          {/* User Initials Avatar */}
          <a
            href="#settings"
            className="w-8 h-8 rounded-full bg-[#5A9A74] text-white flex items-center justify-center text-xs font-bold shadow-xs hover:opacity-90"
            title={displayName}
          >
            {initials}
          </a>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#57534E] hover:text-[#1C1917] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A2B] rounded-lg cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Persistent Left Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen bg-[#FAF9F6] border-r border-[#E8E5DF] flex flex-col justify-between py-6 z-50 transition-all duration-300 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 w-[260px] px-4' : '-translate-x-full md:translate-x-0'
        } ${
          isCollapsed
            ? 'md:w-[76px] md:px-3'
            : 'md:w-[250px] lg:w-[260px] md:px-4'
        }`}
      >
        <div className="space-y-6">
          
          {/* Logo & Collapse Header */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'} pt-1`}>
            <a
              href="#dashboard"
              className="flex items-center gap-2.5 group select-none overflow-hidden"
              title={isCollapsed ? 'MantraAI' : undefined}
            >
              <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                </svg>
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold tracking-tight text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors whitespace-nowrap">
                  Mantra<span className="text-[#1E3A2B]">AI</span>
                </span>
              )}
            </a>

            {/* Desktop Collapse / Expand Toggle */}
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`hidden md:flex items-center justify-center w-7 h-7 rounded-lg border border-[#E8E5DF] hover:border-[#D0CBC0] bg-white text-[#78716C] hover:text-[#1C1917] hover:bg-[#F3EFEA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A2B] cursor-pointer ${
                isCollapsed ? 'mt-3 w-8 h-8' : ''
              }`}
            >
              {isCollapsed ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1" aria-label="Application navigation">
            {navItems.map((item) => {
              const isActive = currentTab === item.id || (item.id === 'reports' && currentTab === 'history');
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center rounded-xl text-[14px] transition-all group ${
                    isCollapsed
                      ? 'justify-center p-3'
                      : 'gap-3.5 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? isCollapsed
                        ? 'bg-[#EBF5EE] text-[#1E3A2B] font-semibold'
                        : 'bg-[#EBF5EE] text-[#1E3A2B] font-semibold border-l-[3.5px] border-[#1E3A2B] shadow-2xs'
                      : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3EFEA] font-medium'
                  }`}
                >
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-[#1E3A2B]' : 'text-[#78716C] group-hover:text-[#1C1917]'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Promo Card */}
        {!isCollapsed && (
          <div className="mt-auto pt-4">
            <div className="bg-[#F2EFE9] border border-[#E6E0D6] rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/80 border border-[#E0D9CD] flex items-center justify-center shrink-0 text-[#2D5A3C]">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-[#1C1917] leading-tight truncate">
                  Building Healthier Tomorrows
                </div>
                <div className="text-[10px] text-[#78716C] mt-0.5 leading-snug">
                  Evidence. Insights. Action for You.
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Viewport Content with Top-Right User Header */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        
        {/* Desktop Top Header Bar with Notifications & User Profile */}
        <header className="hidden md:flex items-center justify-end h-16 px-8 border-b border-[#E8E5DF] bg-[#FAF9F6]/80 backdrop-blur-xs sticky top-0 z-20">
          <div className="flex items-center gap-4">
            
            {/* Notification Bell */}
            <button
              type="button"
              className="p-2 text-[#78716C] hover:text-[#1C1917] relative rounded-full hover:bg-[#F3EFEA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A2B] cursor-pointer"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white" />
            </button>

            {/* User Profile Badge */}
            <a
              href="#settings"
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-full hover:bg-[#F3EFEA] transition-colors group cursor-pointer"
              title="View Profile"
            >
              <div className="w-8 h-8 rounded-full bg-[#5A9A74] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {initials}
              </div>
              <span className="text-xs font-semibold text-[#1C1917] group-hover:text-[#1E3A2B]">
                {displayName}
              </span>
              <svg className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#1C1917]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </a>

          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
