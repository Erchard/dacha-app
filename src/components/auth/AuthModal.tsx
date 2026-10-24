import React, { useState } from 'react';
import { X, LogIn, UserPlus, KeyRound, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, resetPassword, switchDemoRole } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'reset'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        await signIn(email.trim(), password);
        setSuccess('Успішний вхід!');
        setTimeout(onClose, 1000);
      } else if (tab === 'register') {
        if (displayName.trim().length < 2) {
          setError("Введіть ваше ім'я (від 2 символів).");
          setLoading(false);
          return;
        }
        await signUp(email.trim(), password, displayName.trim());
        setSuccess('Акаунт створено! Лист для підтвердження надіслано на вашу пошту.');
        setTimeout(onClose, 1800);
      } else if (tab === 'reset') {
        await resetPassword(email.trim());
        setSuccess('Інструкції для відновлення паролю надіслано на вашу електронну адресу.');
      }
    } catch (err: any) {
      let msg = err.message || 'Сталася помилка.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        msg = 'Невірний email або пароль.';
      } else if (msg.includes('auth/user-not-found')) {
        msg = 'Користувача з такою поштою не знайдено.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'Ця адреса вже використовується.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Пароль має містити щонайменше 6 символів.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    switchDemoRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#36674D] text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
              Д
            </span>
            <h3 className="text-lg font-bold">Акаунт у Дачі</h3>
          </div>
          <p className="text-xs text-emerald-100 mt-1">
            Увійдіть для подання заявок, модерації або керування простором
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-semibold">
          <button
            onClick={() => { setTab('login'); setError(null); setSuccess(null); }}
            className={`flex-1 py-3 text-center transition-colors ${
              tab === 'login' ? 'bg-white text-[#36674D] border-b-2 border-[#36674D] font-bold' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Вхід
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); setSuccess(null); }}
            className={`flex-1 py-3 text-center transition-colors ${
              tab === 'register' ? 'bg-white text-[#36674D] border-b-2 border-[#36674D] font-bold' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Реєстрація
          </button>
          <button
            onClick={() => { setTab('reset'); setError(null); setSuccess(null); }}
            className={`flex-1 py-3 text-center transition-colors ${
              tab === 'reset' ? 'bg-white text-[#36674D] border-b-2 border-[#36674D] font-bold' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Скинути пароль
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-gray-700">
            {tab === 'register' && (
              <div>
                <label className="block font-bold mb-1 text-gray-800">Ваше ім'я та прізвище *</label>
                <input
                  type="text"
                  required
                  placeholder="Олена Коваленко"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 font-medium text-gray-900 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block font-bold mb-1 text-gray-800">Електронна пошта *</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 font-medium text-gray-900 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
              />
            </div>

            {tab !== 'reset' && (
              <div>
                <label className="block font-bold mb-1 text-gray-800">Пароль *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 font-medium text-gray-900 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#36674D] hover:bg-[#2A523D] text-white font-bold transition-all shadow disabled:opacity-50 text-xs mt-2"
            >
              {loading
                ? 'Зачекайте...'
                : tab === 'login'
                ? 'Увійти'
                : tab === 'register'
                ? 'Зареєструватися'
                : 'Надіслати посилання'}
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center space-x-1.5 text-gray-500 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Швидкий тестовий вхід (без пароля):</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 hover:border-[#36674D] hover:bg-emerald-50/50 text-gray-800 font-medium text-left transition-colors"
              >
                Адмін (admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('organizer')}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 hover:border-[#36674D] hover:bg-emerald-50/50 text-gray-800 font-medium text-left transition-colors"
              >
                Організатор
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('developer')}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 hover:border-[#36674D] hover:bg-emerald-50/50 text-gray-800 font-medium text-left transition-colors"
              >
                Розробник
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('guest')}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 hover:border-[#36674D] hover:bg-emerald-50/50 text-gray-800 font-medium text-left transition-colors"
              >
                Гість (відвідувач)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
