import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Globe, Lock, Sliders, Bell, Search, Loader2, User, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { settingsService, DEFAULT_SETTINGS } from '../../services/settingsService';
import authService from '../../services/authService';

export default function SettingsPage() {
  const { currentUser, isSuperAdmin, isOrdinaryAdmin, refreshSession } = useAuth();
  const canManageSettings = Boolean(isSuperAdmin);

  // Synchronously initialize settings from cache so tabs and fields render in 0ms
  const initialSettings = settingsService.getCachedSettings();

  // Ordinary admin defaults to and only has access to 'profile'
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'publication' : 'profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    displayName: currentUser?.name || '',
    displayNameHindi: currentUser?.profile?.display_name_hindi || currentUser?.name || '',
    desk: currentUser?.profile?.desk || 'राष्ट्रीय डेस्क',
    bio: currentUser?.profile?.bio || '',
    avatarUrl: currentUser?.avatar || '',
  });

  // Global Settings states (Super Admin only)
  const [pubSettings, setPubSettings] = useState(initialSettings.publication || DEFAULT_SETTINGS.publication);
  const [editorialSettings, setEditorialSettings] = useState(initialSettings.editorial || DEFAULT_SETTINGS.editorial);
  const [notifSettings, setNotifSettings] = useState(initialSettings.notifications || DEFAULT_SETTINGS.notifications);
  const [seoSettings, setSeoSettings] = useState(initialSettings.seo || DEFAULT_SETTINGS.seo);

  useEffect(() => {
    let isMounted = true;
    if (isSuperAdmin) {
      settingsService.getAllSettings().then((all) => {
        if (isMounted && all) {
          if (all.publication) setPubSettings(all.publication);
          if (all.editorial) setEditorialSettings(all.editorial);
          if (all.notifications) setNotifSettings(all.notifications);
          if (all.seo) setSeoSettings(all.seo);
        }
      }).catch((err) => {
        console.warn('[SettingsPage] Error loading settings:', err);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        displayName: currentUser.name || '',
        displayNameHindi: currentUser.profile?.display_name_hindi || currentUser.name || '',
        desk: currentUser.profile?.desk || 'राष्ट्रीय डेस्क',
        bio: currentUser.profile?.bio || '',
        avatarUrl: currentUser.avatar || '',
      });
    }
  }, [currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (activeTab === 'profile') {
      setIsSaving(true);
      try {
        const res = await authService.updateProfile(currentUser?.id, {
          display_name: profileForm.displayName.trim(),
          display_name_hindi: profileForm.displayNameHindi.trim(),
          desk: profileForm.desk.trim(),
          bio: profileForm.bio.trim(),
          avatar_url: profileForm.avatarUrl.trim() || null,
        });

        if (!res.success) throw new Error(res.error);
        if (refreshSession) await refreshSession();
        toast.success('प्रोफाइल विवरण सफलतापूर्वक अद्यतन किया गया (Profile updated)');
      } catch (err) {
        toast.error('प्रोफाइल अद्यतन में विफल: ' + (err.message || 'त्रुटि'));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!isSuperAdmin) {
      toast.error('अनुमति अस्वीकृत: वैश्विक साइट सेटिंग्स केवल मुख्य व्यवस्थापक (Super Admin) बदल सकते हैं।');
      return;
    }

    setIsSaving(true);
    try {
      if (activeTab === 'publication') {
        await settingsService.saveSettings('publication', pubSettings);
      } else if (activeTab === 'editorial') {
        await settingsService.saveSettings('editorial', editorialSettings);
      } else if (activeTab === 'notifications') {
        await settingsService.saveSettings('notifications', notifSettings);
      } else if (activeTab === 'seo') {
        await settingsService.saveSettings('seo', seoSettings);
      }
      toast.success('सेटिंग्स सफलतापूर्वक सहेजी गईं (Settings saved & persisted)');
    } catch (err) {
      toast.error('सेटिंग्स सहेजने में विफल: ' + (err.message || 'त्रुटि'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="bg-paper-canvas p-4 sm:p-5 border border-border-rule flex items-start justify-between gap-4">
        <div>
          <h1 className="font-mukta text-xl sm:text-2xl font-extrabold text-on-surface">
            {isSuperAdmin ? 'सिस्टम व साइट सेटिंग्स (System Settings)' : 'मेरी प्रोफाइल सेटिंग्स (Profile Settings)'}
          </h1>
          <p className="font-inter text-xs text-secondary mt-0.5">
            {isSuperAdmin
              ? 'संपादकीय पोर्टल, वैश्विक प्रकाशन नीतियां और विन्यास — सभी परिवर्तन सीधे डेटाबेस में सुरक्षित रहते हैं।'
              : 'आपका व्यक्तिगत लेखक प्रोफाइल, ब्यूरो डेस्क विवरण और संपादकीय परिचय।'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-inter shrink-0 border bg-paper-tint">
          <Shield className="w-3.5 h-3.5 text-primary-container" />
          <span className="font-bold uppercase">{isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border-rule bg-paper-tint overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs font-inter font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'border-primary-container text-primary-container bg-paper-canvas'
              : 'border-transparent text-secondary hover:text-on-surface'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>मेरी प्रोफाइल (Profile)</span>
        </button>

        {isSuperAdmin && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('publication')}
              className={`px-4 py-2.5 text-xs font-inter font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'publication'
                  ? 'border-primary-container text-primary-container bg-paper-canvas'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>प्रकाशन विवरण (Identity)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('editorial')}
              className={`px-4 py-2.5 text-xs font-inter font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'editorial'
                  ? 'border-primary-container text-primary-container bg-paper-canvas'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>संपादकीय नीतियां (Editorial)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2.5 text-xs font-inter font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'notifications'
                  ? 'border-primary-container text-primary-container bg-paper-canvas'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>सूचनाएं (Notifications)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className={`px-4 py-2.5 text-xs font-inter font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'seo'
                  ? 'border-primary-container text-primary-container bg-paper-canvas'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>एसईओ डिफ़ॉल्ट्स (SEO)</span>
            </button>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="bg-paper-canvas p-12 border border-border-rule flex items-center justify-center gap-2 text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-mukta text-sm">सेटिंग्स लोड हो रही हैं...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-paper-canvas p-4 sm:p-6 border border-border-rule space-y-6">
          {/* TAB 0: User Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h3 className="font-mukta text-base font-bold text-on-surface border-b border-border-rule pb-2 mb-4">
                व्यक्तिगत लेखक एवं संपादकीय प्रोफाइल (Personal Profile)
              </h3>

              <div className="flex items-center gap-4 p-3 bg-paper-tint border border-border-rule">
                <div className="w-12 h-12 rounded bg-primary-container text-white flex items-center justify-center font-bold text-lg">
                  {currentUser?.initials || 'AS'}
                </div>
                <div>
                  <h4 className="font-mukta font-bold text-sm text-on-surface">{currentUser?.name || 'संपादक'}</h4>
                  <p className="font-inter text-xs text-secondary">{currentUser?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded">
                      {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-inter font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>सत्यापित (Approved)</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-inter">
                <div>
                  <label className="block font-bold text-secondary mb-1">
                    पूरा नाम / डिस्प्ले नाम (Display Name)
                  </label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas"
                  />
                </div>

                <div>
                  <label className="block font-bold text-secondary mb-1">
                    हिंदी डिस्प्ले नाम (Hindi Display Name)
                  </label>
                  <input
                    type="text"
                    value={profileForm.displayNameHindi}
                    onChange={(e) => setProfileForm({ ...profileForm, displayNameHindi: e.target.value })}
                    placeholder="उदा. राजेश कुमार"
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas"
                  />
                </div>

                <div>
                  <label className="block font-bold text-secondary mb-1">
                    डेस्क / ब्यूरो (Desk / Bureau)
                  </label>
                  <input
                    type="text"
                    value={profileForm.desk}
                    onChange={(e) => setProfileForm({ ...profileForm, desk: e.target.value })}
                    placeholder="उदा. राष्ट्रीय ब्यूरो, उत्तर प्रदेश डेस्क"
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas"
                  />
                </div>

                <div>
                  <label className="block font-bold text-secondary mb-1">
                    अवतार चित्र यूआरएल (Avatar Image URL)
                  </label>
                  <input
                    type="url"
                    value={profileForm.avatarUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-secondary mb-1">
                    संपादकीय परिचय / बायो (Bio / Author Profile)
                  </label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="अपने पत्रकारिता अनुभव एवं विशेष क्षेत्रों का संक्षिप्त परिचय..."
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas"
                  />
                </div>

                <div>
                  <label className="block font-bold text-secondary mb-1">
                    ईमेल पता (Email - अपरिवर्तनीय)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email || ''}
                    className="w-full px-3 py-2 bg-paper-subtle border border-border-rule text-secondary opacity-75 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-secondary mb-1">
                    सिस्टम भूमिका (Role - केवल सुपर एडमिन द्वारा परिवर्तनीय)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={isSuperAdmin ? 'सुपर एडमिन (Super Admin)' : 'एडमिन (Admin)'}
                    className="w-full px-3 py-2 bg-paper-subtle border border-border-rule text-secondary opacity-75 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: Publication Identity (Super Admin Only) */}
          {activeTab === 'publication' && isSuperAdmin && (
            <div>
              <h3 className="font-mukta text-base font-bold text-on-surface border-b border-border-rule pb-2 mb-4">
                प्रकाशन विवरण (Publication Identity)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-inter">
                <div>
                  <label className="block font-bold text-secondary mb-1">
                    प्रकाशन का नाम (हिंदी)
                  </label>
                  <input
                    type="text"
                    disabled={!canManageSettings}
                    value={pubSettings.nameHindi || ''}
                    onChange={(e) => setPubSettings({ ...pubSettings, nameHindi: e.target.value })}
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-secondary mb-1">
                    Publication Name (English)
                  </label>
                  <input
                    type="text"
                    disabled={!canManageSettings}
                    value={pubSettings.nameEnglish || ''}
                    onChange={(e) => setPubSettings({ ...pubSettings, nameEnglish: e.target.value })}
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-secondary mb-1">
                    मुख्य ध्येयवाक्य / टैगलाइन (Tagline)
                  </label>
                  <input
                    type="text"
                    disabled={!canManageSettings}
                    value={pubSettings.tagline || ''}
                    onChange={(e) => setPubSettings({ ...pubSettings, tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-secondary mb-1">
                    RNI / पंजीयन संख्या
                  </label>
                  <input
                    type="text"
                    disabled={!canManageSettings}
                    value={pubSettings.rniNumber || ''}
                    onChange={(e) => setPubSettings({ ...pubSettings, rniNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-secondary mb-1">
                    मुख्य संपादक / बोर्ड (Editor-in-Chief)
                  </label>
                  <input
                    type="text"
                    disabled={!canManageSettings}
                    value={pubSettings.editorInChief || ''}
                    onChange={(e) => setPubSettings({ ...pubSettings, editorInChief: e.target.value })}
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-secondary mb-1">
                    संपादकीय ईमेल (Editorial Email)
                  </label>
                  <input
                    type="email"
                    disabled={!canManageSettings}
                    value={pubSettings.contactEmail || ''}
                    onChange={(e) => setPubSettings({ ...pubSettings, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Editorial Policies */}
          {activeTab === 'editorial' && (
            <div>
              <h3 className="font-mukta text-base font-bold text-on-surface border-b border-border-rule pb-2 mb-4">
                संपादकीय नीतियां (Editorial Preferences)
              </h3>
              <div className="space-y-3 text-xs font-inter">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManageSettings}
                    checked={editorialSettings.aiCheckOnSubmit || false}
                    onChange={(e) => setEditorialSettings({ ...editorialSettings, aiCheckOnSubmit: e.target.checked })}
                    className="accent-primary-container"
                  />
                  <span className="font-semibold text-on-surface">प्रकाशन पूर्व स्वचालित AI सामग्री जांच (Auto AI Check on Pre-Publish)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManageSettings}
                    checked={editorialSettings.autoSlugEnabled || false}
                    onChange={(e) => setEditorialSettings({ ...editorialSettings, autoSlugEnabled: e.target.checked })}
                    className="accent-primary-container"
                  />
                  <span className="font-semibold text-on-surface">शीर्षक से स्वचालित स्लग निर्माण (Automatic Slug Generation)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManageSettings}
                    checked={editorialSettings.requireExcerpt || false}
                    onChange={(e) => setEditorialSettings({ ...editorialSettings, requireExcerpt: e.target.checked })}
                    className="accent-primary-container"
                  />
                  <span className="font-semibold text-on-surface">प्रकाशन के लिए सारांश (Excerpt) अनिवार्य रखें</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: Notifications */}
          {activeTab === 'notifications' && (
            <div>
              <h3 className="font-mukta text-base font-bold text-on-surface border-b border-border-rule pb-2 mb-4">
                सूचना सेटिंग्स (Notification Preferences)
              </h3>
              <div className="space-y-3 text-xs font-inter">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManageSettings}
                    checked={notifSettings.inAppOnSchedule || false}
                    onChange={(e) => setNotifSettings({ ...notifSettings, inAppOnSchedule: e.target.checked })}
                    className="accent-primary-container"
                  />
                  <span className="font-semibold text-on-surface">समाचार शेड्यूलिंग एवं ऑटो-पब्लिश पर इन-ऐप अलर्ट दर्ज करें</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManageSettings}
                    checked={notifSettings.inAppOnReview || false}
                    onChange={(e) => setNotifSettings({ ...notifSettings, inAppOnReview: e.target.checked })}
                    className="accent-primary-container"
                  />
                  <span className="font-semibold text-on-surface">संपादकीय समीक्षा हेतु भेजे गए आलेखों पर अधिसूचना प्राप्त करें</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManageSettings}
                    checked={notifSettings.notifyOnAiFlag || false}
                    onChange={(e) => setNotifSettings({ ...notifSettings, notifyOnAiFlag: e.target.checked })}
                    className="accent-primary-container"
                  />
                  <span className="font-semibold text-on-surface">गंभीर तथ्यात्मक या वर्तनी विसंगतियों पर चेतावनी सूचना दिखाएं</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: SEO Defaults */}
          {activeTab === 'seo' && (
            <div>
              <h3 className="font-mukta text-base font-bold text-on-surface border-b border-border-rule pb-2 mb-4">
                एसईओ एवं मेटा डेटा विन्यास (SEO Defaults)
              </h3>
              <div className="space-y-4 text-xs font-inter">
                <div>
                  <label className="block font-bold text-secondary mb-1">
                    डिफ़ॉल्ट मेटा शीर्षक (Default Meta Title)
                  </label>
                  <input
                    type="text"
                    disabled={!canManageSettings}
                    value={seoSettings.defaultMetaTitle || ''}
                    onChange={(e) => setSeoSettings({ ...seoSettings, defaultMetaTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-secondary mb-1">
                    डिफ़ॉल्ट मेटा विवरण (Default Meta Description)
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canManageSettings}
                    value={seoSettings.defaultMetaDescription || ''}
                    onChange={(e) => setSeoSettings({ ...seoSettings, defaultMetaDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-secondary mb-1">
                    कैनोनिकल बेस यूआरएल (Canonical Base URL)
                  </label>
                  <input
                    type="url"
                    disabled={!canManageSettings}
                    value={seoSettings.canonicalBaseUrl || ''}
                    onChange={(e) => setSeoSettings({ ...seoSettings, canonicalBaseUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border-rule flex items-center justify-between">
            {activeTab === 'profile' ? (
              <span className="text-[11px] font-inter text-secondary">
                * आपका प्रोफाइल विवरण लेखों एवं संपादकीय डेस्क पर प्रदर्शित होगा।
              </span>
            ) : !isSuperAdmin ? (
              <span className="text-[11px] font-inter text-secondary">
                * वैश्विक सेटिंग्स केवल मुख्य व्यवस्थापक (Super Admin) द्वारा परिवर्तनीय हैं।
              </span>
            ) : (
              <span className="text-[11px] font-inter text-secondary">
                * सभी परिवर्तन सीधे डेटाबेस एवं ब्राउज़र में सहेजे जाते हैं।
              </span>
            )}

            <button
              type="submit"
              disabled={(activeTab !== 'profile' && !isSuperAdmin) || isSaving}
              className="w-full sm:w-auto px-5 py-2 bg-primary-container text-white font-mukta font-bold text-sm hover:bg-primary transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'सहेजा जा रहा है...' : (activeTab === 'profile' ? 'प्रोफाइल सहेजें' : 'सेटिंग्स सहेजें')}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
