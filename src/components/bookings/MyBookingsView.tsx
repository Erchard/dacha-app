import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  PlusCircle, 
  Ban,
  Phone
} from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatKyivDateTime, toKyivTimeString } from '../../services/kyivTime';
import { DirectionBadge } from '../common/DirectionBadge';

interface MyBookingsViewProps {
  onNewBooking: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({ onNewBooking }) => {
  const { user } = useAuth();
  const { myBookings, allBookings, cancelBooking, deleteBooking } = useData();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'other'>('all');
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Show all for admin or own for organizer
  const list = user?.role === 'admin' ? allBookings : myBookings;

  const filtered = list.filter((b) => {
    if (b.status === 'deleted') return false;
    if (filter === 'all') return true;
    if (filter === 'pending') return b.status === 'pending';
    if (filter === 'approved') return b.status === 'approved';
    if (filter === 'other') return b.status === 'rejected' || b.status === 'cancelled';
    return true;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Схвалено</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Очікує модерації</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3 h-3 text-red-600" />
            <span>Відхилено</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
            <Ban className="w-3 h-3 text-gray-500" />
            <span>Скасовано</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    await cancelBooking(cancelModalBooking.id, cancelReason);
    setCancelModalBooking(null);
    setCancelReason('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {user?.role === 'admin' ? 'Усі заявки на Дачі' : 'Мої заявки на бронювання'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Переглядайте статус власних подій, модерацію або скасовуйте заявки
          </p>
        </div>

        <button
          onClick={onNewBooking}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#36674D] hover:bg-[#2A523D] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Нова заявка</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-xl max-w-md">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Усі ({list.filter((b) => b.status !== 'deleted').length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            filter === 'pending' ? 'bg-white text-amber-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Очікують ({list.filter((b) => b.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            filter === 'approved' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Схвалені ({list.filter((b) => b.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('other')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            filter === 'other' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Архів
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filtered.map((booking) => (
          <div
            key={booking.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all"
          >
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(booking.status)}
                <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                  {booking.roomNameSnapshot}
                </span>
                <span className="text-xs text-gray-400">
                  {booking.locationSnapshot}
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900">
                {booking.draft.title}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                <span className="flex items-center text-[#36674D] font-semibold">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {formatKyivDateTime(booking.draft.interval.start)}
                </span>
                <span>
                  {toKyivTimeString(booking.draft.interval.start)} – {toKyivTimeString(booking.draft.interval.end)}
                </span>
                {booking.draft.responsibleName && (
                  <span>Відповідальний: {booking.draft.responsibleName}</span>
                )}
                {booking.draft.contactPhone && (
                  <span className="flex items-center text-[#36674D] font-medium">
                    <Phone className="w-3 h-3 mr-1" />
                    {booking.draft.contactPhone}
                  </span>
                )}
              </div>

              {booking.draft.description && (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {booking.draft.description}
                </p>
              )}

              {booking.draft.directions.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {booking.draft.directions.map((d) => (
                    <DirectionBadge key={d} direction={d} size="sm" />
                  ))}
                </div>
              )}

              {/* Rejection reason notice */}
              {booking.status === 'rejected' && booking.rejectionReason && (
                <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs border border-red-200 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Причина відхилення:</span> {booking.rejectionReason}
                  </div>
                </div>
              )}

              {/* Cancellation reason notice */}
              {booking.status === 'cancelled' && booking.cancellationReason && (
                <div className="p-2.5 bg-gray-50 text-gray-700 rounded-xl text-xs border border-gray-200">
                  <span className="font-semibold">Причина скасування:</span> {booking.cancellationReason}
                </div>
              )}
            </div>

            {/* Actions for this booking */}
            <div className="flex items-center space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0">
              {/* Cancel Button */}
              {booking.status !== 'cancelled' && booking.status !== 'rejected' && (
                <button
                  onClick={() => setCancelModalBooking(booking)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                >
                  Скасувати
                </button>
              )}

              {/* Delete button (for admin or publisher) */}
              {(user?.role === 'admin' || user?.canPublish) && (
                <button
                  onClick={() => {
                    if (confirm(`Видалити подію "${booking.draft.title}"?`)) {
                      deleteBooking(booking.id);
                    }
                  }}
                  title="Видалити помилкову подію"
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-bold text-sm text-gray-600">Заявок не знайдено</p>
            <p className="text-xs text-gray-400 mt-1">
              Подайте першу заявку на проведення заходу на Дачі
            </p>
          </div>
        )}
      </div>

      {/* Cancellation modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Скасувати подію?
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              "{cancelModalBooking.draft.title}" ({cancelModalBooking.roomNameSnapshot})
            </p>

            <div className="space-y-2 mb-4">
              <label className="block text-xs font-semibold text-gray-700">
                Причина скасування (необов'язково):
              </label>
              <textarea
                rows={2}
                placeholder="Вкажіть причину..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 p-2.5 text-gray-800 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Назад
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow"
              >
                Підтвердити скасування
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
