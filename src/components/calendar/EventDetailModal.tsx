import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  FileText, 
  Share2, 
  CalendarPlus, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { PublicEvent } from '../../types';
import { DirectionBadge } from '../common/DirectionBadge';
import { formatKyivDateTime, toKyivTimeString, toKyivDateString } from '../../services/kyivTime';

interface EventDetailModalProps {
  event: PublicEvent | null;
  onClose: () => void;
  onBookingAction?: (action: 'cancel' | 'edit', event: PublicEvent) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const handleShare = () => {
    const url = `${window.location.origin}/?date=${toKyivDateString(event.interval.start)}&event=${event.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadICS = () => {
    const startStr = event.interval.start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endStr = event.interval.end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dacha Space//Event Calendar//UK',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${event.id}@dacha-annonce.web.app`,
      `DTSTAMP:${startStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\\n\\nВідповідальна особа: ${event.responsibleName || 'Дача'}${event.contactPhone ? `\\nТелефон: ${event.contactPhone}` : ''}`,
      `LOCATION:${event.roomNameSnapshot || 'Дача'}, ${event.locationSnapshot || 'Дача'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.title.slice(0, 30)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title
  )}&dates=${event.interval.start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${
    event.interval.end.toISOString().replace(/[-:]/g, '').split('.')[0]
  }Z&details=${encodeURIComponent(
    `${event.description}\n\nВідповідальний: ${event.responsibleName || 'Дача'}`
  )}&location=${encodeURIComponent(`${event.roomNameSnapshot}, ${event.locationSnapshot}`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#36674D] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="bg-white/20 px-2 py-0.5 rounded">
              {event.roomNameSnapshot || 'Локація Дача'}
            </span>
            <span>•</span>
            <span>{event.locationSnapshot || 'Дача'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
            {event.title}
          </h2>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-gray-700">
          {/* Time & Location summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-sm">
            <div className="flex items-start space-x-2.5">
              <Calendar className="w-4 h-4 text-[#36674D] mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">
                  {formatKyivDateTime(event.interval.start)}
                </p>
                <p className="text-xs text-gray-500">
                  Тривалість: {toKyivTimeString(event.interval.start)} – {toKyivTimeString(event.interval.end)} (Europe/Kyiv)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <MapPin className="w-4 h-4 text-[#36674D] mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">{event.roomNameSnapshot}</p>
                <p className="text-xs text-gray-500">{event.locationSnapshot || 'Простір Дача'}</p>
              </div>
            </div>
          </div>

          {/* Directions / Categories */}
          {event.directions && event.directions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Напрямки:</p>
              <div className="flex flex-wrap gap-1.5">
                {event.directions.map((dir) => (
                  <DirectionBadge key={dir} direction={dir} />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400 mb-1.5">Про захід:</p>
            <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
              {event.description || 'Опис заходу наразі відсутній.'}
            </p>
          </div>

          {/* Notes (if any) */}
          {event.notes && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900">
              <span className="font-semibold block mb-0.5">Примітки організатора:</span>
              <span>{event.notes}</span>
            </div>
          )}

          {/* Responsible person and Contact Phone */}
          <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            {event.responsibleName && (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Відповідальна особа:</span>
                <span className="font-semibold text-gray-900">{event.responsibleName}</span>
              </div>
            )}

            {event.contactPhone && (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-[#36674D]" />
                <span className="text-gray-600">Контакт:</span>
                <a
                  href={`tel:${event.contactPhone}`}
                  className="font-bold text-[#36674D] hover:underline"
                >
                  {event.contactPhone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Посилання скопійовано' : 'Поділитися'}</span>
            </button>

            <button
              onClick={handleDownloadICS}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-medium transition-colors"
              title="Завантажити файл .ics для Apple / Outlook / мобільних календарів"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#36674D]" />
              <span>.ICS</span>
            </button>

            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-medium transition-colors"
              title="Додати у Google Calendar"
            >
              <span>+ Google</span>
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#36674D] text-white hover:bg-[#2A523D] text-xs font-semibold transition-colors shadow"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
