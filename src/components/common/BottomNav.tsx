import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Grid3X3, 
  Home, 
  BookmarkCheck, 
  ShieldCheck, 
  Headphones 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export type AppTab = 'calendar' | 'schedule' | 'rooms' | 'my-bookings' | 'admin' | 'support';

interface BottomNavProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const { user } = useAuth();
  const { allBookings, tickets } = useData();

  const pendingCount = allBookings.filter((b) => b.status === 'pending').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'new' || t.status === 'in_progress').length;

  const isAdmin = user?.role === 'admin';
  const isDev = user?.role === 'developer';
  const isOrganizer = user?.role === 'organizer' || isAdmin;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-2 py-1 shadow-lg sm:hidden pb-safe">
      <div className="flex items-center justify-around">
        {/* Calendar */}
        <button
          onClick={() => onTabChange('calendar')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
            currentTab === 'calendar'
              ? 'text-[#36674D] font-bold scale-105'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <CalendarIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Календар</span>
        </button>

        {/* Week Schedule */}
        <button
          onClick={() => onTabChange('schedule')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
            currentTab === 'schedule'
              ? 'text-[#36674D] font-bold scale-105'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Grid3X3 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Розклад</span>
        </button>

        {/* Rooms */}
        <button
          onClick={() => onTabChange('rooms')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
            currentTab === 'rooms'
              ? 'text-[#36674D] font-bold scale-105'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Кімнати</span>
        </button>

        {/* My Bookings */}
        {isOrganizer && (
          <button
            onClick={() => onTabChange('my-bookings')}
            className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all relative ${
              currentTab === 'my-bookings'
                ? 'text-[#36674D] font-bold scale-105'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <BookmarkCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Заявки</span>
          </button>
        )}

        {/* Admin or Support */}
        {isAdmin && (
          <button
            onClick={() => onTabChange('admin')}
            className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all relative ${
              currentTab === 'admin'
                ? 'text-[#36674D] font-bold scale-105'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Адмін</span>
            {pendingCount > 0 && (
              <span className="absolute top-0 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        )}

        {(isAdmin || isDev) && (
          <button
            onClick={() => onTabChange('support')}
            className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all relative ${
              currentTab === 'support'
                ? 'text-[#36674D] font-bold scale-105'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Headphones className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Підтримка</span>
            {openTicketsCount > 0 && (
              <span className="absolute top-0 right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {openTicketsCount}
              </span>
            )}
          </button>
        )}
      </div>
    </nav>
  );
};
