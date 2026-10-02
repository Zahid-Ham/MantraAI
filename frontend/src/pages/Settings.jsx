import React, { useState, useEffect } from 'react';
import AppShell from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../config/api';

// Canonical Settings Tabs
const TABS = [
  {
    id: 'profile',
    label: 'Profile & Account',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    id: 'privacy',
    label: 'Data & Privacy',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: 'security',
    label: 'Security',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

export default function Settings({ onNavigateHome: _onNavigateHome }) {
  const { user, updateUserProfile, resetPassword, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [dob, setDob] = useState(() => {
    try {
      return localStorage.getItem('mantra_user_dob') || '';
    } catch {
      return '';
    }
  });
  const [gender, setGender] = useState(() => {
    try {
      return localStorage.getItem('mantra_user_gender') || 'Prefer not to say';
    } catch {
      return 'Prefer not to say';
    }
  });
  const [location, setLocation] = useState(() => {
    try {
      return localStorage.getItem('mantra_user_location') || '';
    } catch {
      return '';
    }
  });
  const [phone, setPhone] = useState(() => {
    try {
      return localStorage.getItem('mantra_user_phone') || '';
    } catch {
      return '';
    }
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Preferences State
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('mantra_theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('mantra_language') || 'en_IN';
    } catch {
      return 'en_IN';
    }
  });
  const [units, setUnits] = useState(() => {
    try {
      return localStorage.getItem('mantra_preferred_units') || 'metric';
    } catch {
      return 'metric';
    }
  });
  const [accessibility, setAccessibility] = useState(() => {
    try {
      const saved = localStorage.getItem('mantra_accessibility');
      return saved ? JSON.parse(saved) : { largerText: false, higherContrast: false, reduceMotion: false };
    } catch {
      return { largerText: false, higherContrast: false, reduceMotion: false };
    }
  });

  // Notifications State
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('mantra_notifications');
      return saved
        ? JSON.parse(saved)
        : {
            assessmentReminders: true,
            productUpdates: true,
            tipsEducation: true,
            marketingCommunications: false,
          };
    } catch {
      return {
        assessmentReminders: true,
        productUpdates: true,
        tipsEducation: true,
        marketingCommunications: false,
      };
    }
  });

  // Modals & Feedback
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');

  // Sync user display name if changed externally
  useEffect(() => {
    if (user?.displayName && !fullName) {
      setFullName(user.displayName);
    }
  }, [user]);

  // Derived user initials
  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'User');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ZH';

  // Profile Save Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      if (updateUserProfile && fullName.trim()) {
        await updateUserProfile({ displayName: fullName.trim() });
      }

      // Save optional client-scoped profile metadata
      try {
        localStorage.setItem('mantra_user_dob', dob);
        localStorage.setItem('mantra_user_gender', gender);
        localStorage.setItem('mantra_user_location', location);
        localStorage.setItem('mantra_user_phone', phone);
      } catch (err) {
        console.warn('Unable to persist optional metadata to local storage:', err);
      }

      setProfileSuccessMsg('Profile information updated successfully.');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setProfileErrorMsg('Unable to save changes. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Theme change
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('mantra_theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (_e) {
      // ignore
    }
  };

  // Accessibility toggle
  const handleAccessibilityToggle = (key) => {
    setAccessibility((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('mantra_accessibility', JSON.stringify(next));
      } catch (_e) {
        // ignore
      }
      return next;
    });
  };

  // Notification toggle
  const handleNotificationToggle = (key) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('mantra_notifications', JSON.stringify(next));
      } catch (_e) {
        // ignore
      }
      return next;
    });
  };

  // Send Password Reset
  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 5000);
    } catch (err) {
      console.error('Failed to send reset email:', err);
      alert('Unable to send password reset email. Please try again.');
    }
  };

  // Download User Health Data
  const handleDownloadData = async () => {
    setExportingData(true);
    setExportSuccessMsg('');
    try {
      const sessions = await apiRequest('/api/v1/assessments');
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: {
          email: user?.email || 'authenticated_user',
          displayName: user?.displayName || 'User',
        },
        profileMetadata: {
          gender,
          location: location || 'Not provided',
        },
        preferences: {
          theme,
          language,
          units,
        },
        assessments: Array.isArray(sessions) ? sessions : [],
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `mantra_health_data_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExportSuccessMsg('Data archive downloaded successfully.');
      setTimeout(() => setExportSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to export data:', err);
      alert('Unable to export data at this time. Please try again.');
    } finally {
      setExportingData(false);
    }
  };

  return (
    <AppShell currentTab="settings">
      <div className="space-y-8 pb-16">

        {/* ── 1. PAGE HEADER WITH NATURE BANNER & QUOTE ───────────────────── */}
        <div className="relative bg-[#F9F7F2] border border-[#E8E5DF] rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xs">
          {/* Nature decorative illustration */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none hidden md:block overflow-hidden opacity-90">
            <svg
              className="absolute right-0 top-0 h-full w-full object-cover"
              viewBox="0 0 400 200"
              fill="none"
              preserveAspectRatio="xMidYMid slice"
            >
              <circle cx="280" cy="55" r="32" fill="#FCE794" opacity="0.6" />
              <path d="M100 200 C 180 120, 240 160, 400 110 L 400 200 Z" fill="#C8E2CB" opacity="0.5" />
              <path d="M180 200 C 260 130, 320 150, 400 135 L 400 200 Z" fill="#5A9A74" opacity="0.65" />
              <path d="M260 200 C 310 155, 360 165, 400 160 L 400 200 Z" fill="#1E3A2B" opacity="0.85" />
              <circle cx="345" cy="120" r="14" fill="#2E5A3C" opacity="0.9" />
              <line x1="345" y1="120" x2="345" y2="148" stroke="#1E3A2B" strokeWidth="2.5" />
              <circle cx="370" cy="130" r="11" fill="#3D7550" opacity="0.9" />
              <line x1="370" y1="130" x2="370" y2="152" stroke="#1E3A2B" strokeWidth="2" />
            </svg>
          </div>

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1917] tracking-tight">
                Settings
              </h1>
              <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            <p className="text-sm sm:text-[15px] text-[#57534E] leading-relaxed">
              Manage your account, preferences, and privacy settings.
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#E8E5DF] text-xs text-[#1E3A2B] font-medium shadow-2xs">
              <span className="text-[#5A9A74] font-serif text-sm">“</span>
              <span>Your health journey, your data, your control.</span>
              <span className="text-[#5A9A74] font-serif text-sm">”</span>
            </div>
          </div>
        </div>

        {/* ── 2. HORIZONTAL SETTINGS TABS ─────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none" role="tablist">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border inline-flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#EBF5EE] text-[#1E3A2B] border-[#1E3A2B] shadow-2xs'
                    : 'bg-white text-[#57534E] border-[#E8E5DF] hover:border-[#D0CBC0] hover:text-[#1C1917]'
                }`}
              >
                <span className={isActive ? 'text-[#1E3A2B]' : 'text-[#78716C]'}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 3. TWO-COLUMN GRID: MAIN CONTENT + RIGHT SIDEBAR ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT MAIN CONTENT COLUMN (8 cols) ── */}
          <div className="lg:col-span-8 space-y-6 min-w-0">

            {/* ── TAB 1: PROFILE & ACCOUNT ── */}
            {activeTab === 'profile' && (
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 sm:p-7 shadow-2xs space-y-6">
                
                {/* Section Header */}
                <div className="flex items-start gap-3 pb-4 border-b border-[#F5F2EB]">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1C1917] tracking-tight">
                      Profile Information
                    </h2>
                    <p className="text-xs text-[#78716C]">
                      Manage your personal information and profile details.
                    </p>
                  </div>
                </div>

                {/* Avatar & Display Name Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-[#1E3A2B] text-[#FAF9F6] font-serif font-bold text-lg flex items-center justify-center shadow-xs">
                        {initials}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-[#E8E5DF] text-[#1E3A2B] flex items-center justify-center shadow-2xs">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-[#1C1917]">
                        {displayName}
                      </div>
                      <div className="text-xs text-[#78716C] font-mono">
                        {user?.email || 'authenticated_user'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#1E3A2B] bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl transition-colors cursor-pointer"
                  >
                    Change Photo
                  </button>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {profileSuccessMsg && (
                    <div className="p-3 bg-[#EBF5EE] border border-[#C8E2CB] rounded-xl text-xs text-[#1E3A2B] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#1E3A2B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{profileSuccessMsg}</span>
                    </div>
                  )}

                  {profileErrorMsg && (
                    <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl text-xs text-[#991B1B] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#DC2626] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{profileErrorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1C1917] block">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]"
                      />
                    </div>

                    {/* Email Address (Read-only managed by auth) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#1C1917]">
                          Email Address
                        </label>
                        <span className="text-[10px] text-[#A8A29E] flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Provider Locked</span>
                        </span>
                      </div>
                      <input
                        type="email"
                        disabled
                        value={user?.email || 'authenticated_user@provider.com'}
                        className="w-full px-3.5 py-2.5 text-xs bg-[#F5F2EB] border border-[#E8E5DF] rounded-xl text-[#78716C] cursor-not-allowed select-none"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1C1917] block">
                        Date of Birth
                      </label>
                      <input
                        type="text"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        placeholder="DD / MM / YYYY"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]"
                      />
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1C1917] block">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1C1917] block">
                        Location (Optional)
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Mumbai, Maharashtra"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1C1917] block">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]"
                      />
                    </div>

                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-2.5 bg-[#1E3A2B] hover:bg-[#162C20] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>

              </div>
            )}

            {/* ── TAB 2: PREFERENCES ── */}
            {activeTab === 'preferences' && (
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 sm:p-7 shadow-2xs space-y-6">
                
                <div className="flex items-start gap-3 pb-4 border-b border-[#F5F2EB]">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1C1917] tracking-tight">
                      Preferences
                    </h2>
                    <p className="text-xs text-[#78716C]">
                      Customize your experience with MantraAI.
                    </p>
                  </div>
                </div>

                <div className="space-y-6 divide-y divide-[#F5F2EB]">
                  
                  {/* Theme */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1C1917] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        <span>Theme</span>
                      </div>
                      <p className="text-[11px] text-[#78716C]">
                        Choose your preferred appearance.
                      </p>
                    </div>

                    <div className="inline-flex p-1 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl gap-1 select-none">
                      <button
                        type="button"
                        onClick={() => handleThemeChange('light')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                          theme === 'light'
                            ? 'bg-white text-[#1E3A2B] shadow-2xs border border-[#E8E5DF]'
                            : 'text-[#78716C] hover:text-[#1C1917]'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Light</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleThemeChange('dark')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-white text-[#1E3A2B] shadow-2xs border border-[#E8E5DF]'
                            : 'text-[#78716C] hover:text-[#1C1917]'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        <span>Dark</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleThemeChange('system')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                          theme === 'system'
                            ? 'bg-white text-[#1E3A2B] shadow-2xs border border-[#E8E5DF]'
                            : 'text-[#78716C] hover:text-[#1C1917]'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>System</span>
                      </button>
                    </div>
                  </div>

                  {/* Language */}
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1C1917] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <span>Language</span>
                      </div>
                      <p className="text-[11px] text-[#78716C]">
                        Choose your preferred language.
                      </p>
                    </div>

                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        try {
                          localStorage.setItem('mantra_language', e.target.value);
                        } catch (_err) {
                          // ignore
                        }
                      }}
                      className="px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]"
                    >
                      <option value="en_IN">English (India)</option>
                      <option value="hi_IN">हिन्दी (Hindi - Preview)</option>
                    </select>
                  </div>

                  {/* Units */}
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1C1917] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 18h12l3-18H3z" />
                        </svg>
                        <span>Units</span>
                      </div>
                      <p className="text-[11px] text-[#78716C]">
                        Choose preferred units for measurements.
                      </p>
                    </div>

                    <div className="inline-flex p-1 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl gap-1 select-none">
                      <button
                        type="button"
                        onClick={() => {
                          setUnits('metric');
                          try {
                            localStorage.setItem('mantra_preferred_units', 'metric');
                          } catch (_e) {
                            // ignore
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          units === 'metric'
                            ? 'bg-[#EBF5EE] text-[#1E3A2B] border border-[#1E3A2B] shadow-2xs'
                            : 'text-[#78716C] hover:text-[#1C1917]'
                        }`}
                      >
                        Metric (kg, cm)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUnits('imperial');
                          try {
                            localStorage.setItem('mantra_preferred_units', 'imperial');
                          } catch (_e) {
                            // ignore
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          units === 'imperial'
                            ? 'bg-[#EBF5EE] text-[#1E3A2B] border border-[#1E3A2B] shadow-2xs'
                            : 'text-[#78716C] hover:text-[#1C1917]'
                        }`}
                      >
                        Imperial (lb, ft)
                      </button>
                    </div>
                  </div>

                  {/* Accessibility */}
                  <div className="pt-4 space-y-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1C1917] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Accessibility</span>
                      </div>
                      <p className="text-[11px] text-[#78716C]">
                        Adjust settings for better accessibility.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-1">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-[#1C1917]">
                        <input
                          type="checkbox"
                          checked={accessibility.largerText}
                          onChange={() => handleAccessibilityToggle('largerText')}
                          className="w-4 h-4 rounded text-[#1E3A2B] focus:ring-[#1E3A2B]"
                        />
                        <span>Larger text</span>
                      </label>

                      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-[#1C1917]">
                        <input
                          type="checkbox"
                          checked={accessibility.higherContrast}
                          onChange={() => handleAccessibilityToggle('higherContrast')}
                          className="w-4 h-4 rounded text-[#1E3A2B] focus:ring-[#1E3A2B]"
                        />
                        <span>Higher contrast</span>
                      </label>

                      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-[#1C1917]">
                        <input
                          type="checkbox"
                          checked={accessibility.reduceMotion}
                          onChange={() => handleAccessibilityToggle('reduceMotion')}
                          className="w-4 h-4 rounded text-[#1E3A2B] focus:ring-[#1E3A2B]"
                        />
                        <span>Reduce motion</span>
                      </label>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ── TAB 3: NOTIFICATIONS ── */}
            {activeTab === 'notifications' && (
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 sm:p-7 shadow-2xs space-y-6">
                
                <div className="flex items-start gap-3 pb-4 border-b border-[#F5F2EB]">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1C1917] tracking-tight">
                      Notifications
                    </h2>
                    <p className="text-xs text-[#78716C]">
                      Manage how you receive notifications and updates.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* 1. Assessment Reminders */}
                  <div className="p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Assessment Reminders</span>
                      </div>
                      <p className="text-[11px] text-[#78716C] leading-snug">
                        Get reminders to take follow-up assessments.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications.assessmentReminders}
                      onClick={() => handleNotificationToggle('assessmentReminders')}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        notifications.assessmentReminders ? 'bg-[#1E3A2B]' : 'bg-[#D0CBC0]'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${
                          notifications.assessmentReminders ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 2. Product Updates */}
                  <div className="p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                        <span>Product Updates</span>
                      </div>
                      <p className="text-[11px] text-[#78716C] leading-snug">
                        Receive updates about new features and improvements.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications.productUpdates}
                      onClick={() => handleNotificationToggle('productUpdates')}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        notifications.productUpdates ? 'bg-[#1E3A2B]' : 'bg-[#D0CBC0]'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${
                          notifications.productUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 3. Tips & Educational Content */}
                  <div className="p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#D97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span>Tips & Educational Content</span>
                      </div>
                      <p className="text-[11px] text-[#78716C] leading-snug">
                        Get helpful tips and health information.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications.tipsEducation}
                      onClick={() => handleNotificationToggle('tipsEducation')}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        notifications.tipsEducation ? 'bg-[#1E3A2B]' : 'bg-[#D0CBC0]'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${
                          notifications.tipsEducation ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 4. Marketing Communications */}
                  <div className="p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Marketing Communications</span>
                      </div>
                      <p className="text-[11px] text-[#78716C] leading-snug">
                        Receive promotional content and announcements.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications.marketingCommunications}
                      onClick={() => handleNotificationToggle('marketingCommunications')}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        notifications.marketingCommunications ? 'bg-[#1E3A2B]' : 'bg-[#D0CBC0]'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${
                          notifications.marketingCommunications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                </div>

                <div className="p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-[11px] text-[#78716C] leading-relaxed">
                  Preferences are stored for this device. Email notifications and automated reminders will be activated in an upcoming milestone.
                </div>

              </div>
            )}

            {/* ── TAB 4: DATA & PRIVACY ── */}
            {activeTab === 'privacy' && (
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 sm:p-7 shadow-2xs space-y-6">
                
                <div className="flex items-start gap-3 pb-4 border-b border-[#F5F2EB]">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1C1917] tracking-tight">
                      Data & Privacy Control
                    </h2>
                    <p className="text-xs text-[#78716C]">
                      Manage data ownership, security parameters, and privacy policies.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-[#57534E] leading-relaxed">
                  <div className="p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-2">
                    <h3 className="font-bold text-[#1C1917] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1E3A2B]" />
                      <span>Authenticated User Scoping</span>
                    </h3>
                    <p className="text-[11px] text-[#78716C]">
                      Your self-reported assessment answers, synthesized report insights, and progress actions are tied strictly to your authenticated session ID. Endpoints reject unauthenticated or cross-user requests.
                    </p>
                  </div>

                  <div className="p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-2">
                    <h3 className="font-bold text-[#1C1917] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#059669]" />
                      <span>Zero Third-Party Data Monetization</span>
                    </h3>
                    <p className="text-[11px] text-[#78716C]">
                      We do not sell, rent, or trade your survey responses or health context to advertisers, third-party brokers, or commercial marketing platforms.
                    </p>
                  </div>

                  <div className="p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-2">
                    <h3 className="font-bold text-[#1C1917] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      <span>Evidence-Based Non-Diagnostic Standard</span>
                    </h3>
                    <p className="text-[11px] text-[#78716C]">
                      Collected inputs are used exclusively to provide personalized wellness education and reference verified global medical guidelines (WHO, AUA/ASRM, EAU).
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadData}
                    disabled={exportingData}
                    className="px-4 py-2.5 bg-[#1E3A2B] hover:bg-[#162C20] text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>{exportingData ? 'Preparing Export...' : 'Download My Data (JSON)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="px-4 py-2.5 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] text-[#1C1917] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    View Privacy Policy
                  </button>
                </div>

              </div>
            )}

            {/* ── TAB 5: SECURITY ── */}
            {activeTab === 'security' && (
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 sm:p-7 shadow-2xs space-y-6">
                
                <div className="flex items-start gap-3 pb-4 border-b border-[#F5F2EB]">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1C1917] tracking-tight">
                      Security & Authentication
                    </h2>
                    <p className="text-xs text-[#78716C]">
                      Manage your credentials, password reset triggers, and session security.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {resetEmailSent && (
                    <div className="p-3 bg-[#EBF5EE] border border-[#C8E2CB] rounded-xl text-xs text-[#1E3A2B] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#1E3A2B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Password reset email dispatched to {user?.email}. Please check your inbox.</span>
                    </div>
                  )}

                  <div className="p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-[#1C1917]">Password Management</h3>
                      <p className="text-[11px] text-[#78716C]">
                        Send a secure password reset link to your registered email address.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendPasswordReset}
                      className="px-4 py-2 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] text-[#1E3A2B] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Reset Password
                    </button>
                  </div>

                  <div className="p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-[#1C1917]">Identity Provider</h3>
                      <p className="text-[11px] text-[#78716C]">
                        {user?.providerData?.[0]?.providerId === 'google.com'
                          ? 'Signed in with Google OAuth Authentication'
                          : 'Signed in with Email & Secure Password'}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 bg-[#EBF5EE] text-[#1E3A2B] text-[11px] font-semibold rounded-lg border border-[#C8E2CB]">
                      Active
                    </span>
                  </div>

                  <div className="p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-[#1C1917]">Session State</h3>
                      <p className="text-[11px] text-[#78716C]">
                        Token verified with backend gateway.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        window.location.hash = '';
                      }}
                      className="px-3.5 py-1.5 border border-[#FEE2E2] bg-white hover:bg-[#FEF2F2] text-[#DC2626] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* ── RIGHT SIDEBAR (4 cols) ── */}
          <div className="lg:col-span-4 space-y-6">

            {exportSuccessMsg && (
              <div className="p-3 bg-[#EBF5EE] border border-[#C8E2CB] rounded-2xl text-xs text-[#1E3A2B] flex items-center gap-2">
                <svg className="w-4 h-4 text-[#1E3A2B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{exportSuccessMsg}</span>
              </div>
            )}

            {/* 1. Account Actions Card */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#1E3A2B]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917] tracking-tight">
                    Account Actions
                  </h3>
                  <p className="text-[11px] text-[#78716C]">
                    Manage your account and session.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={handleSendPasswordReset}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="group-hover:font-semibold">Change Password</span>
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="group-hover:font-semibold">Update Email</span>
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="group-hover:font-semibold">Manage Connected Accounts</span>
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadData}
                  disabled={exportingData}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="group-hover:font-semibold">Download My Data</span>
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#DC2626] hover:bg-[#FEF2F2] transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#DC2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="font-semibold">Delete Account</span>
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#DC2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 2. Help & Support Card */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#1E3A2B]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917] tracking-tight">
                    Help & Support
                  </h3>
                  <p className="text-[11px] text-[#78716C]">
                    Need help with your settings?
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <a
                  href="#support"
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="group-hover:font-semibold">Account & Login Help</span>
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>

                <button
                  type="button"
                  onClick={() => setActiveTab('privacy')}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="group-hover:font-semibold">Data & Privacy Information</span>
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <a
                  href="#support"
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="group-hover:font-semibold">Contact Support</span>
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            {/* 3. Data & Privacy Sidebar Card */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#059669]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917] tracking-tight">
                    Data & Privacy
                  </h3>
                  <p className="text-[11px] text-[#78716C]">
                    Control your data and privacy settings.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('privacy')}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7z" />
                    </svg>
                    <span className="group-hover:font-semibold">How Your Data Is Used</span>
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="group-hover:font-semibold">Privacy Policy</span>
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadData}
                  disabled={exportingData}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="group-hover:font-semibold">Manage Data & Export</span>
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 4. Privacy Reassurance Panel */}
            <div className="bg-[#EBF5EE] border border-[#C8E2CB] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#1E3A2B]">
                <div className="w-5 h-5">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Your Privacy Matters
                </h3>
              </div>

              <p className="text-xs text-[#1E3A2B] leading-relaxed">
                We are committed to keeping your personal information secure and private. You have control over your data and can manage your information at any time.
              </p>

              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Learn More About Our Privacy Practices</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ── PHOTO UPLOAD MODAL ───────────────────────────────────────────── */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="bg-white border border-[#E8E5DF] rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-3">
              <h3 className="text-sm font-bold text-[#1C1917]">Profile Photo</h3>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="w-7 h-7 rounded-full bg-[#FAF9F6] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-xs text-[#57534E] leading-relaxed space-y-2">
              <p>
                Your avatar is currently generated dynamically from your display initials.
              </p>
              <p className="text-[11px] text-[#78716C]">
                If you sign in via Google OAuth, your profile photo is synchronized directly from your Google Account. Direct custom avatar uploads will be supported in an upcoming update.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="px-4 py-2 bg-[#1E3A2B] text-white text-xs font-semibold rounded-xl hover:bg-[#162C20] cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── UPDATE EMAIL MODAL ───────────────────────────────────────────── */}
      {showEmailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto"
          onClick={() => setShowEmailModal(false)}
        >
          <div
            className="bg-white border border-[#E8E5DF] rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-3">
              <h3 className="text-sm font-bold text-[#1C1917]">Update Email Address</h3>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="w-7 h-7 rounded-full bg-[#FAF9F6] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-xs text-[#57534E] leading-relaxed space-y-2">
              <p>
                Your account is currently registered under:
              </p>
              <div className="p-2.5 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl font-mono text-xs text-[#1C1917]">
                {user?.email || 'authenticated_user'}
              </div>
              <p className="text-[11px] text-[#78716C]">
                For security reasons, changing your primary email address requires re-authentication via your identity provider. Please reach out through Support if you need assistance migrating your account.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 bg-[#1E3A2B] text-white text-xs font-semibold rounded-xl hover:bg-[#162C20] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE ACCOUNT CONFIRMATION MODAL ────────────────────────────── */}
      {showDeleteModal && (
        <DeleteAccountDialog
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            await logout();
            window.location.hash = '';
          }}
        />
      )}

      {/* ── PRIVACY POLICY MODAL ─────────────────────────────────────────── */}
      {showPrivacyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto"
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            className="bg-white border border-[#E8E5DF] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#059669] flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[#1C1917]">
                  MantraAI Privacy Principles
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#F3EFEA] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#57534E] leading-relaxed">
              <p>
                MantraAI is engineered with strict boundary controls and transparent user isolation:
              </p>

              <div className="space-y-2.5">
                <div className="p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-1">
                  <div className="font-bold text-[#1C1917]">1. Scoped User Ownership</div>
                  <p className="text-[11px] text-[#78716C]">
                    All assessment responses, longitudinal scores, and generated reports belong exclusively to your authenticated profile ID.
                  </p>
                </div>

                <div className="p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-1">
                  <div className="font-bold text-[#1C1917]">2. No Commercial Data Resale</div>
                  <p className="text-[11px] text-[#78716C]">
                    We do not sell, rent, or trade your survey responses or health context to advertisers or commercial brokers.
                  </p>
                </div>

                <div className="p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-1">
                  <div className="font-bold text-[#1C1917]">3. Educational Non-Diagnostic Standard</div>
                  <p className="text-[11px] text-[#78716C]">
                    MantraAI reports provide educational screening guidance referenced against WHO, AUA, and EAU clinical guidelines. They do not constitute formal medical diagnoses.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 bg-[#1E3A2B] text-white text-xs font-semibold rounded-xl hover:bg-[#162C20] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}

// Confirmation Dialog for Account Deletion
function DeleteAccountDialog({ onClose, onConfirm }) {
  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (confirmInput.trim().toUpperCase() !== 'DELETE') return;

    setDeleting(true);
    try {
      // Clear client session and execute callback
      localStorage.clear();
      sessionStorage.clear();
      await onConfirm();
    } catch (err) {
      console.error('Account deletion error:', err);
      alert('Unable to complete request. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#FEE2E2] rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-8 space-y-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-[#DC2626]">
          <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#991B1B]">
              Delete your account?
            </h3>
            <p className="text-xs text-[#DC2626]">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-[#57534E] leading-relaxed">
          <p>
            Deleting your account will permanently remove your active session, stored local preferences, and disconnect your profile access.
          </p>
          
          <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl text-[11px] text-[#991B1B]">
            To confirm deletion, please type <span className="font-bold font-mono">DELETE</span> in the box below:
          </div>

          <form onSubmit={handleDelete} className="space-y-4">
            <input
              type="text"
              required
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-[#1C1917] font-mono focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            />

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#E8E5DF] text-xs font-semibold text-[#57534E] hover:text-[#1C1917] rounded-xl hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={confirmInput.trim().toUpperCase() !== 'DELETE' || deleting}
                className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
