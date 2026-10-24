import React from 'react';
import { Users, MapPin, Calendar, PlusCircle, Sparkles } from 'lucide-react';
import { Room, PublicEvent } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface RoomsCatalogProps {
  rooms: Room[];
  events: PublicEvent[];
  onBookRoom: (roomId: string) => void;
  onOpenAdminRooms?: () => void;
}

export const RoomsCatalog: React.FC<RoomsCatalogProps> = ({
  rooms,
  events,
  onBookRoom,
  onOpenAdminRooms,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Простори та зали Дачі
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Оберіть кімнату для проведення своєї події, майстер-класу або зустрічі
          </p>
        </div>

        {isAdmin && onOpenAdminRooms && (
          <button
            onClick={onOpenAdminRooms}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors self-start sm:self-auto"
          >
            <span>Керування залами</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.map((room) => {
          const roomEvents = events.filter((e) => e.roomId === room.id);

          return (
            <div
              key={room.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200/90 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
            >
              {/* Room Card Header with accent band */}
              <div className="p-5 border-b border-gray-100 relative bg-gradient-to-br from-emerald-50/40 to-white">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#36674D] transition-colors">
                    {room.name}
                  </h3>
                  {room.capacity ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-[#1C3B2B] shrink-0">
                      <Users className="w-3 h-3 text-[#36674D]" />
                      <span>до {room.capacity} осіб</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 shrink-0">
                      <Sparkles className="w-3 h-3 text-gray-500" />
                      <span>Простір</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#36674D]" />
                  <span>{room.locationLabel || 'Дача'}</span>
                </div>
              </div>

              {/* Room Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {room.description || 'Затишний простір для різноманітних заходів та спільноти.'}
                </p>

                {/* Upcoming events preview */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span className="font-semibold text-gray-700">Найближчі події:</span>
                    <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {roomEvents.length} подій
                    </span>
                  </div>

                  {roomEvents.length > 0 ? (
                    <div className="space-y-1">
                      {roomEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="text-[11px] text-gray-700 truncate bg-gray-50 p-1.5 rounded-lg border border-gray-100"
                        >
                          <span className="font-semibold text-[#36674D]">
                            {ev.interval.start.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}:
                          </span>{' '}
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">Наразі немає запланованих подій</p>
                  )}
                </div>
              </div>

              {/* Card Action */}
              <div className="p-4 bg-gray-50/70 border-t border-gray-100">
                <button
                  onClick={() => onBookRoom(room.id)}
                  className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#36674D] hover:bg-[#2A523D] text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Забронювати {room.name}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
