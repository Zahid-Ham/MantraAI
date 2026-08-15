import React from 'react';
import { useAuth } from '../context/AuthContext';
import MicroscopicField from '../components/landing/MicroscopicField';

export default function Profile({ onNavigateHome }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.hash = ''; // Return home after signout
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  };

  return (
    <div className="bg-cream dark:bg-night-dark min-h-screen text-night-blue dark:text-cream font-grotesk flex flex-col justify-between transition-colors duration-500 relative">
      
      {/* Header bar */}
      <header className="relative z-20 w-full flex justify-between items-center border-b border-border-light dark:border-border-dark px-6 py-4 md:px-16 bg-cream/90 dark:bg-night-dark/90 backdrop-blur-xs select-none">
        <div onClick={onNavigateHome} className="flex items-center gap-2.5 cursor-pointer">
          <span className="font-sans text-[10px] text-marigold bg-marigold/10 border border-marigold/20 px-1.5 py-0.5 font-medium tracking-widest rounded-sm">मंत्र</span>
          <span className="font-grotesk font-bold text-xl tracking-wider text-night-blue dark:text-cream">MANTRA<span className="text-marigold">.AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.hash = '#history'} 
            className="px-4 py-2 border border-border-light dark:border-border-dark text-xs uppercase tracking-wider font-semibold rounded-sm hover:border-marigold transition-colors"
          >
            History
          </button>
          <button 
            onClick={onNavigateHome} 
            className="px-4 py-2 border border-border-light dark:border-border-dark text-xs uppercase tracking-wider font-semibold rounded-sm hover:border-marigold transition-colors"
          >
            Back
          </button>
        </div>
      </header>

      {/* Background biological animation */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <MicroscopicField mouseReactive={false} density="low" mode="drift" bioForms={true} />
      </div>

      <main className="flex-grow w-full py-16 px-6 md:px-16 relative z-10 max-w-xl mx-auto flex items-center justify-center">
        
        <div className="w-full border border-border-light dark:border-border-dark bg-cream dark:bg-night-blue p-8 rounded-sm shadow-sm space-y-6">
          
          <div className="text-center space-y-2 select-none">
            <span className="font-sans text-[9px] text-marigold bg-marigold/10 border border-marigold/20 px-2 py-0.5 font-bold tracking-[0.2em] rounded-sm uppercase inline-block">
              User Profile
            </span>
            <h2 className="font-serif text-3xl font-normal text-night-blue dark:text-cream">
              Account Parameters
            </h2>
          </div>

          <div className="space-y-4 border-t border-b border-border-light dark:border-border-dark py-6 text-xs leading-relaxed">
            <div className="flex justify-between items-center">
              <span className="text-night-blue/50 dark:text-cream/50 uppercase tracking-wider font-bold">Email Address</span>
              <span className="font-semibold">{user?.email || 'Unavailable'}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-night-blue/50 dark:text-cream/50 uppercase tracking-wider font-bold">Display Name</span>
              <span className="font-semibold">{user?.displayName || 'User'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-night-blue/50 dark:text-cream/50 uppercase tracking-wider font-bold">Identity Provider</span>
              <span className="font-semibold uppercase text-marigold">{user?.providerData[0]?.providerId === 'google.com' ? 'Google Account' : 'Email/Password'}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3.5 bg-transparent border-2 border-red-500/40 text-red-500 hover:border-red-500 transition-colors font-bold text-xs uppercase tracking-wider rounded-sm cursor-pointer"
          >
            Sign Out Account
          </button>

        </div>

      </main>

      <footer className="py-6 border-t border-border-light dark:border-border-dark text-[10px] text-center text-night-blue/40 dark:text-cream/30 px-6">
        Disclaimer: MantraAI is a digital pre-clinical health platform. Account deletion deletes all database sessions.
      </footer>

    </div>
  );
}
