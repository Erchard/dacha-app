import React from 'react';
import { 
  Calendar as CalendarIcon, 
  RotateCw, 
  PlusCircle, 
  User as UserIcon, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenBooking: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBooking, onOpenAuth }) => {
  const { user, isDemoUser, switchDemoRole, signOut } = useAuth();
  const { loading, isLiveFirebase, refreshData } = useData();
  const [showRoleDropdown, setShowRoleDropdown] = React.useState(false);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Адміністратор';
      case 'organizer':
        return 'Організатор';
      case 'developer':
        return 'Розробник (Dev)';
      default:
        return 'Гість';
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'organizer':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'developer':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#36674D] text-white shadow-md border-b border-[#2A523D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <span className="text-xl font-bold tracking-tight text-[#E8F5E9]">Д</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">Дача</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-white/20 text-white/90">
                  Календар
                </span>
              </div>
              <p className="text-xs text-white/80 hidden sm:block">
                Календар заходів та бронювання простору
              </p>
            </div>
          </div>

          {/* Center info: Live Sync indicator */}
          <div className="hidden md:flex items-center space-x-2 text-xs bg-[#2A523D]/80 px-3 py-1.5 rounded-full border border-white/10">
            {isLiveFirebase ? (
              <span className="flex items-center text-emerald-300 font-medium">
                <Wifi className="w-3.5 h-3.5 mr-1" />
                Firebase: dacha-annonce
              </span>
            ) : (
              <span className="flex items-center text-emerald-200/90 font-medium">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Офлайн / Автономний режим
              </span>
            )}
            <span className="text-white/40">|</span>
            <span className="text-white/70">Europe/Kyiv</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Refresh button */}
            <button
              onClick={() => refreshData()}
              disabled={loading}
              title="Оновити дані"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Submit Booking Button */}
            <button
              onClick={onOpenBooking}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white text-[#1C3B2B] hover:bg-[#F0F7F1] text-xs sm:text-sm font-semibold shadow transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-[#36674D]" />
              <span>Подати заявку</span>
            </button>

            {/* User Profile / Role selector */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/20 text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#1C3B2B] flex items-center justify-center font-bold text-xs">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'Г'}
                </div>
                <div className="text-left hidden lg:block max-w-[120px] truncate">
                  <div className="font-medium text-white truncate text-xs">
                    {user?.displayName || 'Гість'}
                  </div>
                  <div className="text-[10px] text-white/70">
                    {getRoleLabel(user?.role || 'guest')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-white/70" />
              </button>

              {/* Role Dropdown */}
              {showRoleDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 text-gray-800 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setShowRoleDropdown(false)}
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Поточний профіль</p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {user?.displayName || 'Гість'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRoleBadgeColor(user?.role || 'guest')}`}>
                        {getRoleLabel(user?.role || 'guest')}
                      </span>
                      {user?.canPublish && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                          Публікація
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fast Demo Role Switcher */}
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/70">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5 px-1">
                      Швидке перемикання ролі:
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => switchDemoRole('admin')}
                        className={`text-xs px-2.5 py-1.5 rounded-lg text-left font-medium transition-all ${
                          user?.role === 'admin' && isDemoUser
                            ? 'bg-[#36674D] text-white shadow'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        Адмін
                      </button>
                      <button
                        onClick={() => switchDemoRole('organizer')}
                        className={`text-xs px-2.5 py-1.5 rounded-lg text-left font-medium transition-all ${
                          user?.role === 'organizer' && isDemoUser
                            ? 'bg-[#36674D] text-white shadow'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        Організатор
                      </button>
                      <button
                        onClick={() => switchDemoRole('developer')}
                        className={`text-xs px-2.5 py-1.5 rounded-lg text-left font-medium transition-all ${
                          user?.role === 'developer' && isDemoUser
                            ? 'bg-[#36674D] text-white shadow'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        Розробник
                      </button>
                      <button
                        onClick={() => switchDemoRole('guest')}
                        className={`text-xs px-2.5 py-1.5 rounded-lg text-left font-medium transition-all ${
                          user?.role === 'guest'
                            ? 'bg-[#36674D] text-white shadow'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        Гість
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-1">
                    <button
                      onClick={onOpenAuth}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-2"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-gray-500" />
                      <span>Увійти / Зареєструватися через Firebase</span>
                    </button>
                    {user?.role !== 'guest' && (
                      <button
                        onClick={signOut}
                        className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Вийти з акаунта
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
