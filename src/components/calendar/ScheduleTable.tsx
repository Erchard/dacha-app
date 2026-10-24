import React from 'react';
import { PublicEvent, Room } from '../../types';
import { toKyivTimeString, formatKyivWeekday } from '../../services/kyivTime';

interface ScheduleTableProps {
  currentDate: Date;
  events: PublicEvent[];
  rooms: Room[];
  selectedRoomId: string;
  onSelectEvent: (event: PublicEvent) => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  currentDate,
  events,
  rooms,
  selectedRoomId,
  onSelectEvent,
}) => {
  // Compute Monday of the focus week
  const dayOfWeek = currentDate.getDay(); // 0 is Sunday
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // Generate 7 days of this week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  // Time slots from 08:00 to 21:30 (every 30 mins)
  const timeSlots: string[] = [];
  for (let h = 8; h <= 21; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  // Check if today matches a day
  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // Find events for each day
  const getEventsForDayAndSlot = (day: Date, timeStr: string) => {
    const [slotHour, slotMin] = timeStr.split(':').map(Number);
    const slotStart = new Date(day);
    slotStart.setHours(slotHour, slotMin, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

    return events.filter((ev) => {
      if (selectedRoomId && selectedRoomId !== 'all' && ev.roomId !== selectedRoomId) {
        return false;
      }
      return ev.interval.start < slotEnd && ev.interval.end > slotStart;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[760px] text-left">
          {/* Table Header: Week Days */}
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              <th className="p-3 text-xs font-semibold uppercase text-gray-500 w-20 border-r border-gray-200 text-center sticky left-0 bg-gray-50 z-10">
                Час
              </th>
              {weekDays.map((day, idx) => {
                const today = isToday(day);
                return (
                  <th
                    key={idx}
                    className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${
                      today ? 'bg-emerald-50/60' : ''
                    }`}
                  >
                    <div className="text-xs uppercase font-semibold text-gray-500">
                      {formatKyivWeekday(day)}
                    </div>
                    <div
                      className={`text-sm font-bold mt-0.5 inline-block px-2 py-0.5 rounded-full ${
                        today ? 'bg-[#36674D] text-white' : 'text-gray-900'
                      }`}
                    >
                      {day.getDate()}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body: Time Slots */}
          <tbody className="divide-y divide-gray-100">
            {timeSlots.map((slotTime) => {
              const isHour = slotTime.endsWith(':00');

              return (
                <tr
                  key={slotTime}
                  className={`hover:bg-gray-50/40 transition-colors ${
                    isHour ? 'bg-white' : 'bg-gray-50/20'
                  }`}
                >
                  {/* Time column */}
                  <td className="p-2 text-xs font-medium text-gray-500 text-center border-r border-gray-200 sticky left-0 bg-white z-10 whitespace-nowrap">
                    {slotTime}
                  </td>

                  {/* 7 Days Columns */}
                  {weekDays.map((day, dayIdx) => {
                    const slotEvents = getEventsForDayAndSlot(day, slotTime);

                    return (
                      <td
                        key={dayIdx}
                        className="p-1 border-r border-gray-100 last:border-r-0 align-top h-10 min-w-[95px] relative"
                      >
                        {slotEvents.map((ev) => {
                          // Only render event chip at its starting slot
                          const evStartStr = toKyivTimeString(ev.interval.start);
                          const isStartSlot = evStartStr === slotTime;

                          if (!isStartSlot) return null;

                          const durationMins = Math.round(
                            (ev.interval.end.getTime() - ev.interval.start.getTime()) / 60000
                          );
                          const slotsSpanned = Math.max(1, Math.round(durationMins / 30));

                          return (
                            <button
                              key={ev.id}
                              onClick={() => onSelectEvent(ev)}
                              style={{ height: `${slotsSpanned * 40 - 4}px` }}
                              className="w-full absolute top-1 left-1 right-1 z-20 text-left p-1.5 rounded-lg bg-[#36674D] text-white hover:bg-[#2A523D] transition-all shadow-sm overflow-hidden flex flex-col justify-between"
                            >
                              <div>
                                <span className="block text-[10px] font-semibold text-emerald-200 uppercase tracking-wider truncate">
                                  {ev.roomNameSnapshot}
                                </span>
                                <span className="block text-xs font-bold leading-tight line-clamp-2">
                                  {ev.title}
                                </span>
                              </div>
                              <span className="text-[10px] text-white/80 font-medium">
                                {toKyivTimeString(ev.interval.start)} – {toKyivTimeString(ev.interval.end)}
                              </span>
                            </button>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
