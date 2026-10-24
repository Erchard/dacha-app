import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Grid3X3, 
  List, 
  Clock, 
  Search, 
  Filter, 
  X, 
  MapPin, 
  CalendarDays 
} from 'lucide-react';
import { PublicEvent, Room, EVENT_DIRECTIONS } from '../../types';
import { DirectionBadge } from '../common/DirectionBadge';
import { ScheduleTable } from './ScheduleTable';
import { EventDetailModal } from './EventDetailModal';
import { 
  formatKyivMonthYear, 
  formatKyivDateTime, 
  toKyivTimeString, 
  toKyivDateString 
} from '../../services/kyivTime';

interface CalendarViewProps {
  events: PublicEvent[];
  rooms: Room[];
  initialView?: 'month' | 'week' | 'day' | 'list';
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  rooms,
  initialView = 'month',
}) => {
  const [view, setView] = useState<'month' | 'week' | 'day' | 'list'>(initialView);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null);
  const [showDirectionsFilter, setShowDirectionsFilter] = useState(false);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Room filter
      if (selectedRoomId !== 'all' && ev.roomId !== selectedRoomId) {
        return false;
      }
      // Directions filter (match ANY of the selected directions)
      if (selectedDirections.length > 0) {
        const hasMatch = ev.directions.some((d) => selectedDirections.includes(d));
        if (!hasMatch) return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = ev.title.toLowerCase().includes(q);
        const inDesc = ev.description.toLowerCase().includes(q);
        const inOrganizer = ev.responsibleName.toLowerCase().includes(q);
        const inRoom = ev.roomNameSnapshot.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inOrganizer && !inRoom) return false;
      }
      return true;
    });
  }, [events, selectedRoomId, selectedDirections, searchQuery]);

  // Date navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (view === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (view === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (view === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (view === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const toggleDirection = (dir: string) => {
    setSelectedDirections((prev) =>
      prev.includes(dir) ? prev.filter((d) => d !== dir) : [...prev, dir]
    );
  };

  // Month Grid Calculation
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday as start of week: 0->6, 1->0, 2->1 ...
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; events: PublicEvent[] }[] = [];

    // Prev month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        events: filteredEvents.filter(
          (ev) => toKyivDateString(ev.interval.start) === toKyivDateString(d)
        ),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        events: filteredEvents.filter(
          (ev) => toKyivDateString(ev.interval.start) === toKyivDateString(d)
        ),
      });
    }

    // Next month padding to fill full 35 or 42 cells
    const remaining = 35 - (days.length % 35);
    if (remaining < 7 && remaining > 0) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({
          date: d,
          isCurrentMonth: false,
          events: filteredEvents.filter(
            (ev) => toKyivDateString(ev.interval.start) === toKyivDateString(d)
          ),
        });
      }
    }

    return days;
  }, [currentDate, filteredEvents]);

  const isTodayDate = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and View Switcher Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* View mode toggle */}
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setView('month')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'month'
                  ? 'bg-white text-[#36674D] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Місяць</span>
            </button>
            <button
              onClick={() => setView('week')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'week'
                  ? 'bg-white text-[#36674D] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Розклад (Тиждень)</span>
            </button>
            <button
              onClick={() => setView('day')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'day'
                  ? 'bg-white text-[#36674D] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>День</span>
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'list'
                  ? 'bg-white text-[#36674D] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Список</span>
            </button>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
              title="Попередній період"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-bold text-gray-900 px-2 min-w-[130px] text-center">
              {formatKyivMonthYear(currentDate)}
            </span>

            <button
              onClick={handleNext}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
              title="Наступний період"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Сьогодні
            </button>
          </div>
        </div>

        {/* Filters row: Rooms, Directions button, Search */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          {/* Room filter */}
          <div className="flex-1 min-w-[160px] sm:max-w-xs">
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full text-xs rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-gray-800 font-medium focus:ring-2 focus:ring-[#36674D] focus:outline-none"
            >
              <option value="all">Усі локації та зали ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.capacity ? `(до ${r.capacity} ос.)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="flex-1 min-w-[180px] relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Пошук за назвою чи організатором..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Directions toggle button */}
          <button
            onClick={() => setShowDirectionsFilter(!showDirectionsFilter)}
            className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              selectedDirections.length > 0 || showDirectionsFilter
                ? 'bg-emerald-50 text-[#36674D] border-emerald-200 shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Напрямки</span>
            {selectedDirections.length > 0 && (
              <span className="w-4 h-4 bg-[#36674D] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {selectedDirections.length}
              </span>
            )}
          </button>

          {/* Clear filters */}
          {(selectedDirections.length > 0 || selectedRoomId !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedDirections([]);
                setSelectedRoomId('all');
                setSearchQuery('');
              }}
              className="text-xs text-gray-500 hover:text-gray-800 underline px-1 py-1"
            >
              Скинути
            </button>
          )}
        </div>

        {/* Directions multi-select chips */}
        {showDirectionsFilter && (
          <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-1.5 animate-in fade-in duration-150">
            {EVENT_DIRECTIONS.map((dir) => {
              const isSelected = selectedDirections.includes(dir);
              return (
                <DirectionBadge
                  key={dir}
                  direction={dir}
                  selected={isSelected}
                  onClick={() => toggleDirection(dir)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Main View Area */}
      {view === 'month' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 bg-gray-50/80 border-b border-gray-200 text-center py-2.5">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day) => (
              <div key={day} className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {monthData.map((cell, idx) => {
              const today = isTodayDate(cell.date);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentDate(cell.date);
                    if (cell.events.length > 0) {
                      setView('day');
                    }
                  }}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 transition-all cursor-pointer ${
                    cell.isCurrentMonth ? 'bg-white hover:bg-gray-50/60' : 'bg-gray-50/40 text-gray-300'
                  } ${today ? 'bg-emerald-50/30' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        today
                          ? 'bg-[#36674D] text-white shadow-sm'
                          : cell.isCurrentMonth
                          ? 'text-gray-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {cell.events.length > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-full">
                        {cell.events.length}
                      </span>
                    )}
                  </div>

                  {/* Event Chips */}
                  <div className="space-y-1">
                    {cell.events.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className="w-full text-left px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100/90 text-[#1C3B2B] border border-emerald-200/60 text-[11px] font-medium truncate block transition-colors"
                      >
                        <span className="font-semibold text-emerald-800">
                          {toKyivTimeString(ev.interval.start)}
                        </span>{' '}
                        {ev.title}
                      </button>
                    ))}
                    {cell.events.length > 3 && (
                      <div className="text-[10px] text-gray-500 font-semibold px-1">
                        +ще {cell.events.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'week' && (
        <ScheduleTable
          currentDate={currentDate}
          events={filteredEvents}
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectEvent={(ev) => setSelectedEvent(ev)}
        />
      )}

      {view === 'day' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Події на {formatKyivDateTime(currentDate).split(',')[0]}
              </h3>
              <p className="text-xs text-gray-500">
                {filteredEvents.filter(
                  (e) => toKyivDateString(e.interval.start) === toKyivDateString(currentDate)
                ).length}{' '}
                подій заплановано
              </p>
            </div>
            <button
              onClick={() => setView('month')}
              className="text-xs text-[#36674D] font-semibold hover:underline"
            >
              ← До місячного календаря
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredEvents
              .filter(
                (e) => toKyivDateString(e.interval.start) === toKyivDateString(currentDate)
              )
              .map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="py-3.5 px-2 hover:bg-gray-50/70 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#36674D] bg-emerald-50 px-2 py-0.5 rounded">
                        {toKyivTimeString(ev.interval.start)} – {toKyivTimeString(ev.interval.end)}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        {ev.roomNameSnapshot}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">{ev.title}</h4>
                    {ev.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">{ev.description}</p>
                    )}
                    {ev.directions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {ev.directions.map((d) => (
                          <DirectionBadge key={d} direction={d} size="sm" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 sm:text-right shrink-0">
                    <span className="block font-medium">{ev.responsibleName}</span>
                    {ev.contactPhone && <span>{ev.contactPhone}</span>}
                  </div>
                </div>
              ))}

            {filteredEvents.filter(
              (e) => toKyivDateString(e.interval.start) === toKyivDateString(currentDate)
            ).length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="font-semibold text-sm">На цей день подій не заплановано</p>
                <p className="text-xs text-gray-400 mt-1">
                  Оберіть іншу дату або подайте заявку на бронювання
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900">
              Усі заплановані події ({filteredEvents.length})
            </h3>
            <span className="text-xs text-gray-500">Сортування за датою</span>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredEvents
              .slice()
              .sort((a, b) => a.interval.start.getTime() - b.interval.start.getTime())
              .map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="py-3 px-2 hover:bg-gray-50/70 rounded-xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#36674D] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                        {formatKyivDateTime(ev.interval.start)}
                      </span>
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {ev.roomNameSnapshot}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-sm">{ev.title}</h4>
                    {ev.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">{ev.description}</p>
                    )}

                    {ev.directions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ev.directions.map((d) => (
                          <DirectionBadge key={d} direction={d} size="sm" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 md:text-right shrink-0">
                    <p className="font-medium text-gray-800">{ev.responsibleName}</p>
                    {ev.contactPhone && <p className="text-[#36674D] font-bold">{ev.contactPhone}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">{ev.locationSnapshot}</p>
                  </div>
                </div>
              ))}

            {filteredEvents.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <p className="font-semibold text-sm">Не знайдено подій за обраними фільтрами</p>
                <p className="text-xs text-gray-400 mt-1">Спробуйте змінити фільтри або пошуковий запит</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};
