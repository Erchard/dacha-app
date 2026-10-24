import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Header } from './components/common/Header';
import { BottomNav, AppTab } from './components/common/BottomNav';
import { InstallBanner } from './components/common/InstallBanner';
import { CalendarView } from './components/calendar/CalendarView';
import { RoomsCatalog } from './components/rooms/RoomsCatalog';
import { MyBookingsView } from './components/bookings/MyBookingsView';
import { AdminView } from './components/admin/AdminView';
import { SupportView } from './components/support/SupportView';
import { BookingFormModal } from './components/bookings/BookingFormModal';
import { AuthModal } from './components/auth/AuthModal';
import { 
  Calendar as CalendarIcon, 
  Grid3X3, 
  Home, 
  BookmarkCheck, 
  ShieldCheck, 
  Headphones, 
  Plus, 
  ExternalLink 
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { rooms, publicEvents, allBookings, tickets } = useData();

  const [currentTab, setCurrentTab] = useState<AppTab>('calendar');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingInitialRoomId, setBookingInitialRoomId] = useState<string | undefined>(undefined);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const pendingCount = allBookings.filter((b) => b.status === 'pending').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'new' || t.status === 'in_progress').length;

  const isAdmin = user?.role === 'admin';
  const isDev = user?.role === 'developer';
  const isOrganizer = user?.role === 'organizer' || isAdmin;

  const handleOpenBookingForRoom = (roomId: string) => {
    setBookingInitialRoomId(roomId);
    setBookingModalOpen(true);
  };

  const handleOpenNewBooking = () => {
    setBookingInitialRoomId(undefined);
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#1C3B2B] flex flex-col font-sans">
      {/* PWA Install Banner */}
      <InstallBanner />

      {/* Top Application Header */}
      <Header
        onOpenBooking={handleOpenNewBooking}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Desktop / Tablet Sub-navigation Tabs */}
      <nav className="hidden sm:block bg-white border-b border-gray-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-3 py-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setCurrentTab('calendar')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'calendar'
                  ? 'bg-[#36674D] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Календар</span>
            </button>

            <button
              onClick={() => setCurrentTab('schedule')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'schedule'
                  ? 'bg-[#36674D] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span>Розклад (Тиждень)</span>
            </button>

            <button
              onClick={() => setCurrentTab('rooms')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'rooms'
                  ? 'bg-[#36674D] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Кімнати та простори</span>
            </button>

            {isOrganizer && (
              <button
                onClick={() => setCurrentTab('my-bookings')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  currentTab === 'my-bookings'
                    ? 'bg-[#36674D] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>Мої заявки</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
                  currentTab === 'admin'
                    ? 'bg-[#36674D] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Адміністрування</span>
                {pendingCount > 0 && (
                  <span className="w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {(isAdmin || isDev) && (
              <button
                onClick={() => setCurrentTab('support')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
                  currentTab === 'support'
                    ? 'bg-[#36674D] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                <Headphones className="w-4 h-4" />
                <span>Підтримка</span>
                {openTicketsCount > 0 && (
                  <span className="w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {openTicketsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 sm:pb-12">
        {currentTab === 'calendar' && (
          <CalendarView events={publicEvents} rooms={rooms} initialView="month" />
        )}

        {currentTab === 'schedule' && (
          <CalendarView events={publicEvents} rooms={rooms} initialView="week" />
        )}

        {currentTab === 'rooms' && (
          <RoomsCatalog
            rooms={rooms}
            events={publicEvents}
            onBookRoom={handleOpenBookingForRoom}
            onOpenAdminRooms={() => setCurrentTab('admin')}
          />
        )}

        {currentTab === 'my-bookings' && (
          <MyBookingsView onNewBooking={handleOpenNewBooking} />
        )}

        {currentTab === 'admin' && (
          <AdminView onDirectEventCreate={handleOpenNewBooking} />
        )}

        {currentTab === 'support' && <SupportView />}
      </main>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="fixed right-4 bottom-20 z-30 sm:hidden">
        <button
          onClick={handleOpenNewBooking}
          className="w-14 h-14 rounded-full bg-[#36674D] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
          title="Подати заявку на подію"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-xs text-gray-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#1C3B2B]">«Дача»</span>
            <span>—</span>
            <span>Календар подій і бронювання простору</span>
            <span className="hidden md:inline text-gray-400">|</span>
            <span className="hidden md:inline text-gray-500">Час: Europe/Kyiv</span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://dacha-annonce.web.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-[#36674D] hover:underline font-semibold"
            >
              <span>Оригінальний веб: dacha-annonce</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BookingFormModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialRoomId={bookingInitialRoomId}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
