import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Ban,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminTeamService } from '../../services/adminTeamService';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/articlePermissions';
import { formatInIST } from '../../utils/timezoneUtils';

export default function AdminTeamManagementPage() {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Create Admin Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // 2. Created Admin Success Credentials Modal
  const [credentialsModal, setCredentialsModal] = useState(null); // { name, email, password }
  const [copied, setCopied] = useState(false);

  // 3. Action Confirmation Dialog (Suspend / Reactivate)
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Load team data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const membersData = await adminTeamService.getTeamMembers();
      setMembers(membersData);
    } catch (err) {
      console.error(err);
      toast.error('डेटा लोड करने में त्रुटि');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived stats
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === 'active').length;
    const suspended = members.filter((m) => m.status === 'suspended').length;
    return { total, active, suspended };
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    let list = members;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.nameEnglish && m.nameEnglish.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q))
      );
    }
    return list;
  }, [members, searchQuery]);

  // Submit Create Admin
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.name.trim()) {
      setCreateError('कृपया व्यवस्थापक का नाम दर्ज करें।');
      return;
    }
    if (!createForm.email.trim()) {
      setCreateError('कृपया मान्य ईमेल पता दर्ज करें।');
      return;
    }
    if (!createForm.password || createForm.password.length < 8) {
      setCreateError('पासवर्ड न्यूनतम 8 अक्षरों का होना चाहिए।');
      return;
    }

    setIsCreating(true);

    try {
      const res = await adminTeamService.createAdminAccount({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
      });

      if (res.success) {
        toast.success(`नया एडमिन "${createForm.name}" सफलतापूर्वक बनाया गया!`);
        setCredentialsModal({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          password: createForm.password,
        });
        setCreateModalOpen(false);
        setCreateForm({ name: '', email: '', password: '' });
        await loadData();
      } else {
        setCreateError(res.error || 'एडमिन बनाने में विफल');
        toast.error(res.error || 'त्रुटि');
      }
    } catch (err) {
      setCreateError(err.message || 'एडमिन खाता बनाने में त्रुटि हुई');
    } finally {
      setIsCreating(false);
    }
  };

  // Copy credentials
  const handleCopyCredentials = () => {
    if (!credentialsModal) return;
    const credText = `आज़ाद समाचार — एडमिन लॉगिन क्रेडेंशियल\n\nनाम: ${credentialsModal.name}\nईमेल: ${credentialsModal.email}\nपासवर्ड: ${credentialsModal.password}\nलॉगिन लिंक: ${window.location.origin}/admin/login`;
    navigator.clipboard.writeText(credText);
    setCopied(true);
    toast.success('क्रेडेंशियल कॉपी कर लिए गए!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Suspend Admin Action
  const handleSuspend = (user) => {
    setConfirmDialog({
      type: 'suspend',
      user,
      title: 'एडमिन खाता निलंबित करें',
      message: `क्या आप "${user.name}" (${user.email}) को निलंबित करना चाहते हैं? निलंबन के बाद CMS पहुंच बंद हो जाएगी।`,
      confirmLabel: 'निलंबित करें',
      confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
      onConfirm: async () => {
        setActionInProgress(true);
        try {
          const res = await adminTeamService.suspendAdmin(user.id);
          if (res.success) {
            toast.success(`"${user.name}" को निलंबित कर दिया गया`);
            await loadData();
          } else {
            toast.error(res.error || 'निलंबन विफल');
          }
        } finally {
          setActionInProgress(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  // Reactivate Admin Action
  const handleReactivate = (user) => {
    setConfirmDialog({
      type: 'reactivate',
      user,
      title: 'खाता पुनः सक्रिय करें',
      message: `क्या आप "${user.name}" (${user.email}) का निलंबन समाप्त कर खाता पुनः सक्रिय करना चाहते हैं?`,
      confirmLabel: 'पुनः सक्रिय करें',
      confirmClass: 'bg-primary-container text-on-primary-container',
      onConfirm: async () => {
        setActionInProgress(true);
        try {
          const res = await adminTeamService.reactivateAdmin(user.id);
          if (res.success) {
            toast.success(`"${user.name}" का खाता पुनः सक्रिय हुआ`);
            await loadData();
          } else {
            toast.error(res.error || 'सक्रियण विफल');
          }
        } finally {
          setActionInProgress(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  return (
    <div className="space-y-6 font-mukta">
      {/* 1. HEADER & ACTIONS */}
      <div className="bg-paper-canvas p-6 border border-border-rule shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-primary-container bg-primary-container/10 px-2 py-0.5 border border-primary-container/20">
              Super Admin Control
            </span>
          </div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight mt-1">
            टीम प्रबंधन (Team Management)
          </h1>
          <p className="font-inter text-xs text-secondary mt-0.5">
            संपादकीय व्यवस्थापक खाते बनाएं व नियंत्रित करें।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 bg-paper-subtle hover:bg-border-rule border border-border-rule text-secondary hover:text-on-surface transition-colors cursor-pointer"
            title="रिफ्रेश करें"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateForm({ name: '', email: '', password: '' });
              setShowPassword(false);
              setCreateError('');
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-container hover:opacity-90 text-on-primary-container font-mukta font-bold text-sm shadow-xs transition-opacity cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Admin / नया एडमिन बनाएं</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-3 gap-4 font-mukta">
        <div className="bg-paper-canvas p-4 border border-border-rule shadow-xs flex items-center justify-between">
          <div>
            <span className="font-inter text-xs text-secondary block">कुल व्यवस्थापक</span>
            <span className="text-2xl font-black text-on-surface">{stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-paper-subtle border border-border-rule flex items-center justify-center text-secondary">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-paper-canvas p-4 border border-border-rule shadow-xs flex items-center justify-between">
          <div>
            <span className="font-inter text-xs text-emerald-700 dark:text-emerald-400 block font-semibold">
              सक्रिय एडमिन
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.active}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-paper-canvas p-4 border border-border-rule shadow-xs flex items-center justify-between">
          <div>
            <span className="font-inter text-xs text-red-700 dark:text-red-400 block font-semibold">
              निलंबित खाते
            </span>
            <span className="text-2xl font-black text-red-600 dark:text-red-400">
              {stats.suspended}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600">
            <Ban className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH BAR */}
      <div className="bg-paper-canvas border border-border-rule p-3 flex items-center justify-between">
        <span className="text-xs font-bold text-secondary font-inter">
          व्यवस्थापक सूची ({filteredMembers.length})
        </span>
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-secondary absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="नाम या ईमेल खोजें..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-paper-subtle border border-border-rule text-xs font-inter text-on-surface focus:outline-hidden focus:border-primary-container"
          />
        </div>
      </div>

      {/* 4. TEAM MEMBERS TABLE */}
      <div className="bg-paper-canvas border border-border-rule shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-rule bg-paper-subtle font-mono text-[11px] text-secondary uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">नाम व ईमेल</th>
                <th className="py-3 px-4 font-bold">भूमिका (Role)</th>
                <th className="py-3 px-4 font-bold">स्थिति (Status)</th>
                <th className="py-3 px-4 font-bold">पंजीकरण तिथि</th>
                <th className="py-3 px-4 font-bold text-right">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-rule font-mukta text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-secondary">
                    <div className="inline-block w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin mb-2" />
                    <p>व्यवस्थापक सूची लोड हो रही है...</p>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-secondary font-inter">
                    कोई व्यवस्थापक खाता नहीं मिला।
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isSelf = member.id === currentUser?.id;
                  const isMemberSuperAdmin = member.role === ROLES.SUPER_ADMIN;

                  return (
                    <tr key={member.id} className="hover:bg-paper-subtle/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-paper-subtle border border-border-rule flex items-center justify-center font-bold text-on-surface text-xs shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface text-sm flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {isSelf && (
                                <span className="font-mono text-[9px] uppercase tracking-wider bg-primary-container/10 text-primary-container px-1 py-0.2 border border-primary-container/20">
                                  आप
                                </span>
                              )}
                            </div>
                            <span className="font-inter text-secondary text-xs block">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isMemberSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-primary-container bg-primary-container/10 px-2 py-0.5 border border-primary-container/30">
                            <ShieldCheck className="w-3 h-3" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 border border-slate-300 dark:border-slate-700">
                            Admin
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {member.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            सक्रिय (Active)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 border border-red-200 dark:border-red-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            निलंबित (Suspended)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-inter text-secondary text-xs">
                        {formatInIST(member.createdAt, 'DD MMM YYYY')}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isMemberSuperAdmin ? (
                          <span className="font-mono text-[10px] text-secondary italic">
                            संरक्षित (Super Admin)
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {member.status === 'active' ? (
                              <button
                                type="button"
                                onClick={() => handleSuspend(member)}
                                className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-mukta font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Ban className="w-3 h-3" />
                                <span>निलंबित करें</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleReactivate(member)}
                                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mukta font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>सक्रिय करें</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CREATE ADMIN MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mukta">
          <div className="bg-paper-canvas border border-border-rule w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-border-rule flex items-center justify-between bg-paper-subtle">
              <h3 className="text-lg font-black text-on-surface">
                नया एडमिन बनाएं (Create Admin)
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-secondary hover:text-on-surface cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-inter flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  1. पूरा नाम (Full Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. राहुल शर्मा"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-paper-subtle border border-border-rule text-xs font-inter text-on-surface focus:outline-hidden focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  2. ईमेल पता (Email Address) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@azaadsamachar.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-paper-subtle border border-border-rule text-xs font-inter text-on-surface focus:outline-hidden focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  3. पासवर्ड (Password) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="न्यूनतम 8 अक्षर"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 bg-paper-subtle border border-border-rule text-xs font-mono text-on-surface focus:outline-hidden focus:border-primary-container"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-border-rule flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={isCreating}
                  className="px-4 py-2 bg-paper-subtle hover:bg-border-rule border border-border-rule text-secondary font-mukta font-bold text-xs cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-primary-container hover:opacity-90 text-on-primary-container font-mukta font-bold text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin" />
                      <span>खाता बनाया जा रहा है...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. SUCCESS CONFIRMATION MODAL WITH COPY CREDENTIALS */}
      {credentialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-mukta">
          <div className="bg-paper-canvas border-2 border-primary-container w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-border-rule flex items-center justify-between bg-primary-container/10">
              <h3 className="text-lg font-black text-on-surface">
                एडमिन खाता क्रेडेंशियल
              </h3>
              <button
                type="button"
                onClick={() => setCredentialsModal(null)}
                className="p-1 text-secondary hover:text-on-surface cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="font-inter text-xs text-secondary leading-relaxed">
                नया एडमिन खाता सफलतापूर्वक बन गया है। आप इन क्रेडेंशियल को कॉपी करके संबंधित सदस्य के साथ साझा कर सकते हैं:
              </p>

              <div className="space-y-2 bg-paper-subtle p-4 border border-border-rule font-inter text-xs">
                <div>
                  <span className="text-secondary block">नाम:</span>
                  <strong className="text-on-surface font-mukta text-sm">{credentialsModal.name}</strong>
                </div>
                <div>
                  <span className="text-secondary block">ईमेल:</span>
                  <strong className="text-on-surface font-mono">{credentialsModal.email}</strong>
                </div>
                <div>
                  <span className="text-secondary block">पासवर्ड:</span>
                  <strong className="text-primary-container font-mono text-sm">{credentialsModal.password}</strong>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCredentialsModal(null)}
                  className="px-4 py-2 bg-paper-subtle hover:bg-border-rule border border-border-rule text-secondary font-mukta font-bold text-xs cursor-pointer"
                >
                  बंद करें
                </button>
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="px-5 py-2 bg-primary-container hover:opacity-90 text-on-primary-container font-mukta font-bold text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'कॉपी हो गया!' : 'क्रेडेंशियल कॉपी करें'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. CONFIRMATION DIALOG */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mukta">
          <div className="bg-paper-canvas border border-border-rule w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-paper-subtle border border-border-rule flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-on-surface">{confirmDialog.title}</h3>
                <p className="font-inter text-xs text-secondary mt-1 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border-rule flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                disabled={actionInProgress}
                className="px-4 py-2 bg-paper-subtle hover:bg-border-rule border border-border-rule text-secondary font-mukta font-bold text-xs cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                disabled={actionInProgress}
                className={`px-4 py-2 font-mukta font-bold text-xs shadow-xs cursor-pointer ${confirmDialog.confirmClass}`}
              >
                {actionInProgress ? 'प्रक्रियाधीन...' : confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
