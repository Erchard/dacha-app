import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  Repeat, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { Room, PublicEvent, BookingDraft, EVENT_DIRECTIONS } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { DirectionBadge } from '../common/DirectionBadge';
import { 
  generateTimeOptions, 
  createKyivDateTime, 
  toKyivDateString 
} from '../../services/kyivTime';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomId?: string;
  defaultDate?: string;
}

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  initialRoomId,
  defaultDate,
}) => {
  const { user } = useAuth();
  const { rooms, publicEvents, createBooking } = useData();

  // Tomorrow as default date
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toKyivDateString(d);
  }, []);

  const [roomId, setRoomId] = useState<string>(initialRoomId || rooms[0]?.id || '');
  const [dateStr, setDateStr] = useState<string>(defaultDate || tomorrow);
  const [startTime, setStartTime] = useState<string>('12:00');
  const [endTime, setEndTime] = useState<string>('14:00');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [responsibleName, setResponsibleName] = useState<string>(user?.displayName || '');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [directions, setDirections] = useState<string[]>([]);
  const [isSeries, setIsSeries] = useState<boolean>(false);
  const [seriesCount, setSeriesCount] = useState<number>(4);
  const [approveDirectly, setApproveDirectly] = useState<boolean>(
    user?.role === 'admin' || !!user?.canPublish
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Time options for select
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  // Compute calculated start and end Dates
  const requestedInterval = useMemo(() => {
    if (!dateStr || !startTime || !endTime) return null;
    const start = createKyivDateTime(dateStr, startTime);
    const end = createKyivDateTime(dateStr, endTime);
    return { start, end };
  }, [dateStr, startTime, endTime]);

  // Duration in hours
  const durationHours = useMemo(() => {
    if (!requestedInterval) return 0;
    const ms = requestedInterval.end.getTime() - requestedInterval.start.getTime();
    return ms / (1000 * 60 * 60);
  }, [requestedInterval]);

  // Conflict detection
  const conflict = useMemo(() => {
    if (!requestedInterval || !roomId) return null;
    if (requestedInterval.end <= requestedInterval.start) return null;

    return publicEvents.find((ev) => {
      if (ev.roomId !== roomId) return false;
      return (
        requestedInterval.start < ev.interval.end &&
        requestedInterval.end > ev.interval.start
      );
    });
  }, [requestedInterval, roomId, publicEvents]);

  if (!isOpen) return null;

  const toggleDirection = (dir: string) => {
    setDirections((prev) =>
      prev.includes(dir) ? prev.filter((d) => d !== dir) : [...prev, dir]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Form validations
    if (!roomId) {
      setErrorMsg('Оберіть локацію / зал.');
      return;
    }
    if (!requestedInterval || requestedInterval.end <= requestedInterval.start) {
      setErrorMsg('Час завершення має бути пізніше за час початку.');
      return;
    }
    if (durationHours > 6) {
      setErrorMsg('Максимальна тривалість однієї події — 6 годин.');
      return;
    }
    if (durationHours < 0.5) {
      setErrorMsg('Мінімальна тривалість події — 30 хвилин.');
      return;
    }
    if (requestedInterval.start <= new Date()) {
      setErrorMsg('Час початку має бути у майбутньому.');
      return;
    }
    if (title.trim().length < 3 || title.trim().length > 120) {
      setErrorMsg('Назва події має бути від 3 до 120 символів.');
      return;
    }
    if (contactPhone.trim()) {
      const phoneClean = contactPhone.trim();
      if (!/^[+0-9() .-]{5,32}$/.test(phoneClean)) {
        setErrorMsg('Некоректний формат контактного номера телефону.');
        return;
      }
    }
    if (notes.length > 500) {
      setErrorMsg('Примітки мають містити не більше 500 символів.');
      return;
    }

    if (conflict && approveDirectly) {
      setErrorMsg(`Конфлікт: у цей час у вибраному залі вже заплановано: "${conflict.title}".`);
      return;
    }

    setSubmitting(true);
    try {
      const draft: BookingDraft = {
        roomId,
        title: title.trim(),
        description: description.trim(),
        responsibleName: responsibleName.trim(),
        contactPhone: contactPhone.trim(),
        notes: notes.trim(),
        directions,
        interval: requestedInterval,
      };

      await createBooking(draft, approveDirectly, isSeries ? seriesCount : 1);
      setSuccessMsg(
        approveDirectly
          ? 'Подію успішно створено та опубліковано у загальному календарі!'
          : 'Заявку надіслано на модерацію. Очікуйте підтвердження адміністратора.'
      );

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Помилка при створенні заявки. Спробуйте ще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRoom = rooms.find((r) => r.id === roomId) || rooms[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#36674D] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold tracking-tight">Подати заявку на бронювання</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Оберіть локацію на Дачі, бажану дату та час проведення заходу
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-gray-700">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Room Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Локація / Зал Дачі <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {rooms.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setRoomId(r.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    roomId === r.id
                      ? 'border-[#36674D] bg-emerald-50/70 ring-2 ring-[#36674D]/20 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <p className="font-bold text-xs text-gray-900">{r.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {r.capacity ? `до ${r.capacity} ос.` : 'Простір'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Дата (Europe/Kyiv) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 bg-white p-2.5 font-medium text-gray-800 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
              />
            </div>

            {/* Start time */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Початок <span className="text-red-500">*</span>
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 bg-white p-2.5 font-medium text-gray-800 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
              >
                {timeOptions.map((t) => (
                  <option key={`start-${t}`} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* End time */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Завершення <span className="text-red-500">*</span>
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 bg-white p-2.5 font-medium text-gray-800 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
              >
                {timeOptions.map((t) => (
                  <option key={`end-${t}`} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 sm:col-span-3 text-[11px] text-gray-500 flex items-center justify-between pt-1">
              <span>Крок: 30 хв • Тривалість: {durationHours.toFixed(1)} год (макс 6 год)</span>
              {durationHours > 6 && (
                <span className="text-red-600 font-semibold">Перевищено ліміт 6 год</span>
              )}
            </div>
          </div>

          {/* Conflict warning if detected */}
          {conflict && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Увага! У цей час зал вже заброньовано:</p>
                <p className="mt-0.5">
                  "{conflict.title}" ({conflict.roomNameSnapshot})
                </p>
                <p className="text-[11px] text-amber-700 mt-1">
                  Ви можете подати заявку як очікуючу (pending), але для публікації потрібен вільний час.
                </p>
              </div>
            </div>
          )}

          {/* Title & Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Назва події <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="Наприклад: Розмовний клуб, Майстер-клас із живопису"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
            />
            <span className="text-[10px] text-gray-400 block text-right mt-0.5">
              {title.length} / 120 символів
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Опис заходу
            </label>
            <textarea
              rows={3}
              maxLength={5000}
              placeholder="Деталі події, для кого проводиться, що потрібно брати із собою..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
            />
          </div>

          {/* Responsible person and Contact Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Відповідальна особа
              </label>
              <input
                type="text"
                maxLength={80}
                placeholder="Ім'я та прізвище"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-gray-900 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Контактний телефон (публічний)
              </label>
              <input
                type="tel"
                placeholder="+380... або 099-123-45-67"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-gray-900 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
              />
              <span className="text-[10px] text-amber-700 block mt-0.5">
                Номер відображатиметься в розкладі для відвідувачів
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Примітки (обладнання, побажання, до 500 символів)
            </label>
            <input
              type="text"
              maxLength={500}
              placeholder="Наприклад: потрібен проєктор або розсадка колом"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-gray-900 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
            />
          </div>

          {/* Directions selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Напрямки заходу ({directions.length} обрано):
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 border border-gray-100 rounded-xl bg-gray-50/50">
              {EVENT_DIRECTIONS.map((dir) => (
                <DirectionBadge
                  key={dir}
                  direction={dir}
                  selected={directions.includes(dir)}
                  onClick={() => toggleDirection(dir)}
                />
              ))}
            </div>
          </div>

          {/* Optional Weekly Recurrence */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSeries}
                onChange={(e) => setIsSeries(e.target.checked)}
                className="w-4 h-4 text-[#36674D] rounded focus:ring-[#36674D]"
              />
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-[#36674D]" />
                Щотижневе повторення (серія подій)
              </span>
            </label>

            {isSeries && (
              <div className="pl-6 pt-1 flex items-center space-x-2 text-xs">
                <span className="text-gray-600">Кількість тижнів:</span>
                <select
                  value={seriesCount}
                  onChange={(e) => setSeriesCount(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 p-1 text-xs font-bold"
                >
                  {Array.from({ length: 26 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'тиждень' : n < 5 ? 'тижні' : 'тижнів'}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-gray-500">(створить до 26 заявок)</span>
              </div>
            )}
          </div>

          {/* Admin / Publisher Instant Approval toggle */}
          {(user?.role === 'admin' || user?.canPublish) && (
            <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approveDirectly}
                  onChange={(e) => setApproveDirectly(e.target.checked)}
                  className="w-4 h-4 text-[#36674D] rounded focus:ring-[#36674D]"
                />
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#36674D]" />
                  Схвалити та опублікувати одразу (дозвіл публікатора / адміністратора)
                </span>
              </label>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#36674D] hover:bg-[#2A523D] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              {submitting
                ? 'Збереження...'
                : approveDirectly
                ? 'Опублікувати подію'
                : 'Подати заявку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
