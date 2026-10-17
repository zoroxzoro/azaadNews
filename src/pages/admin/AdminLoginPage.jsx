import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import BrandLogo from '../../components/common/BrandLogo';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useDemoAuth } from '../../context/DemoAuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';

  const { login, loginAsDemo, isAuthenticated } = useDemoAuth();

  const [email, setEmail] = useState('editor@azaadsamachar.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect straight to admin
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (!email.trim()) {
      setErrorMessage('कृपया अपना ईमेल पता दर्ज करें।');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('कृपया एक मान्य ईमेल प्रारूप दर्ज करें (उदा. editor@azaadsamachar.com)।');
      return;
    }
    if (!password) {
      setErrorMessage('कृपया पासवर्ड दर्ज करें।');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
      return;
    }

    setIsLoading(true);

    // Simulate authenticating delay
    setTimeout(() => {
      const result = login(email.trim(), password);
      setIsLoading(false);

      if (result.success) {
        toast.success('संपादकीय नियंत्रण कक्ष में स्वागत है!');
        navigate(redirectPath, { replace: true });
      } else {
        setErrorMessage(result.error || 'लॉगिन विफल रहा। कृपया विवरण पुनः जांचें।');
        toast.error('लॉगिन विफल रहा');
      }
    }, 500);
  };

  const handleDemoAccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      loginAsDemo();
      setIsLoading(false);
      toast.success('डेमो मोड सक्रिय: न्यूज़रूम डैशबोर्ड में स्वागत है');
      navigate(redirectPath, { replace: true });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#10264B] dark:bg-[#060b13] flex flex-col justify-between items-center px-4 py-8 sm:py-12 transition-colors relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Top Bar for Login */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10">
        <Link
          to="/"
          className="text-slate-300 hover:text-white font-inter text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <span>← मुख्य पोर्टल (Azaad Samachar Portal)</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-slate-400">CMS v2.4</span>
          <ThemeToggle size="sm" />
        </div>
      </header>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-paper-canvas border-t-4 border-primary-container shadow-2xl p-6 sm:p-8 z-10 transition-colors my-auto border-x border-b border-border-rule">
        {/* Brand Lockup */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandLogo variant="full" theme="auto" showPlaceholderBadge={false} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-paper-tint text-secondary text-xs font-inter font-bold uppercase tracking-wider border border-border-rule">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-container" />
            <span>Newsroom Login • संपादकीय नियंत्रण कक्ष</span>
          </div>
          <p className="text-xs font-inter text-secondary mt-2">
            आंतरिक संपादकीय प्रणाली: केवल अधिकृत पत्रकारों एवं संपादकों के लिए
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-inter flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-inter text-xs" noValidate>
          {/* Email Field */}
          <div>
            <label htmlFor="admin-email" className="block font-bold text-on-surface mb-1.5">
              संपादकीय ईमेल (Editor Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="editor@azaadsamachar.com"
                className="w-full pl-9 pr-3 py-2.5 bg-paper-tint border border-border-rule text-on-surface text-xs sm:text-sm focus:outline-none focus:border-primary-container focus:bg-paper-canvas transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="admin-password" className="font-bold text-on-surface">
                पासवर्ड (Password)
              </label>
              <span className="text-[11px] text-secondary">न्यूनतम 6 अक्षर</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-paper-tint border border-border-rule text-on-surface text-xs sm:text-sm focus:outline-none focus:border-primary-container focus:bg-paper-canvas transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface p-0.5 cursor-pointer"
                aria-label={showPassword ? 'पासवर्ड छुपाएं' : 'पासवर्ड दिखाएं'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-secondary">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-primary-container w-3.5 h-3.5 cursor-pointer"
              />
              <span>सत्र याद रखें (Remember Me)</span>
            </label>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 sm:py-3 bg-primary-container hover:bg-primary text-white font-mukta text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>प्रमाणीकरण हो रहा है...</span>
                </>
              ) : (
                <>
                  <span>साइन इन करें (Enter Newsroom)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Development Demo Mode Action */}
        <div className="mt-5 pt-4 border-t border-border-rule space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-inter text-secondary">
            <Info className="w-3.5 h-3.5 text-primary-container shrink-0" />
            <span className="font-semibold">डेवलपमेंट डेमो पूर्वावलोकन (Development Preview):</span>
          </div>

          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={isLoading}
            className="w-full py-2 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-on-surface font-mukta font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-container" />
            <span>Enter Demo Dashboard (बिना पासवर्ड सीधा प्रवेश)</span>
          </button>
          <p className="text-[10px] font-inter text-secondary text-center leading-normal">
            नोट: यह फ्रंटएंड डेमो सत्र है। वास्तविक उत्पादन प्रमाणीकरण बैकएंड एकीकरण के समय जोड़ा जाएगा।
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 text-center text-xs text-slate-400 font-inter z-10 space-y-1">
        <p>आज़ाद समाचार डिजिटल संस्करण • आंतरिक संपादकीय सुरक्षा प्रणाली</p>
        <p className="text-[11px] text-slate-500">© 2025 Azaad Samachar Media Network. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
