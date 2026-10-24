import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Home, 
  Users, 
  FileText, 
  Plus, 
  Edit2, 
  Archive, 
  Trash2, 
  Check, 
  Ban, 
  AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Room, Booking, AdminAuditEntry } from '../../types';
import { formatKyivDateTime, toKyivTimeString } from '../../services/kyivTime';

interface AdminViewProps {
  onDirectEventCreate: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onDirectEventCreate }) => {
  const { user } = useAuth();
  const { 
    rooms, 
    allBookings, 
    auditLogs, 
    approveBooking, 
    rejectBooking, 
    createRoom, 
    updateRoom, 
    archiveRoom, 
    deleteRoom,
    updateUserPermission
  } = useData();

  const [activeTab, setActiveTab] = useState<'pending' | 'rooms' | 'users' | 'audit'>('pending');

  // Reject modal state
  const [rejectModalBooking, setRejectModalBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Room modal state
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    locationLabel: 'Дача',
    capacity: 20,
    sortOrder: 1,
  });
  const [roomError, setRoomError] = useState<string | null>(null);

  // Users sample state
  const [demoUsers, setDemoUsers] = useState([
    { uid: 'user-organizer-1', email: 'organizer@example.test', displayName: 'Марія Кириленко', role: 'organizer', canPublish: true, isDisabled: false },
    { uid: 'user-organizer-2', email: 'taras@example.test', displayName: 'Тарас Мельник', role: 'organizer', canPublish: false, isDisabled: false },
    { uid: 'user-organizer-3', email: 'blocked@example.test', displayName: 'Олексій Спамер', role: 'organizer', canPublish: false, isDisabled: true },
  ]);

  const pendingBookings = allBookings.filter((b) => b.status === 'pending');

  const handleApprove = async (booking: Booking) => {
    try {
      await approveBooking(booking.id);
    } catch (e: any) {
      alert(`Помилка схвалення: ${e.message}`);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalBooking) return;
    if (rejectionReason.trim().length < 3) {
      setRejectError('Вкажіть причину відхилення (мінімум 3 символи).');
      return;
    }
    await rejectBooking(rejectModalBooking.id, rejectionReason.trim());
    setRejectModalBooking(null);
    setRejectionReason('');
    setRejectError('');
  };

  const handleOpenRoomModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setRoomForm({
        name: room.name,
        description: room.description,
        locationLabel: room.locationLabel,
        capacity: room.capacity || 20,
        sortOrder: room.sortOrder,
      });
    } else {
      setEditingRoom(null);
      setRoomForm({
        name: '',
        description: '',
        locationLabel: 'Дача',
        capacity: 20,
        sortOrder: rooms.length + 1,
      });
    }
    setRoomError(null);
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoomError(null);

    if (roomForm.name.trim().length < 2) {
      setRoomError('Назва кімнати має бути не менше 2 символів.');
      return;
    }

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, {
          name: roomForm.name.trim(),
          description: roomForm.description.trim(),
          locationLabel: roomForm.locationLabel.trim(),
          capacity: Number(roomForm.capacity),
          sortOrder: Number(roomForm.sortOrder),
        });
      } else {
        await createRoom({
          name: roomForm.name.trim(),
          description: roomForm.description.trim(),
          locationLabel: roomForm.locationLabel.trim(),
          capacity: Number(roomForm.capacity),
          sortOrder: Number(roomForm.sortOrder),
        });
      }
      setRoomModalOpen(false);
    } catch (err: any) {
      setRoomError(err.message || 'Помилка збереження кімнати');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    const target = rooms.find((r) => r.id === roomId);
    if (!target) return;

    if (!confirm(`Ви дійсно бажаєте видалити кімнату "${target.name}"?`)) return;

    try {
      await deleteRoom(roomId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-[#1C3B2B]">
              <ShieldCheck className="w-5 h-5 text-[#36674D]" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Панель Адміністрування
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Керування заявками, модерація розкладу, зали та права користувачів
          </p>
        </div>

        <button
          onClick={onDirectEventCreate}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#36674D] hover:bg-[#2A523D] text-white text-xs font-bold shadow transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Створити подію одразу (approved)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-2xl max-w-xl">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'pending'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Модерація</span>
          {pendingBookings.length > 0 && (
            <span className="w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {pendingBookings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'rooms'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Home className="w-4 h-4 text-emerald-600" />
          <span>Зали ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'users'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>Користувачі</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'audit'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-600" />
          <span>Аудит</span>
        </button>
      </div>

      {/* Tab 1: Pending Moderation Queue */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              Черга на розгляд ({pendingBookings.length})
            </h3>
            <span className="text-xs text-gray-500">
              Схвалення бронює час у кімнаті та публікує подію
            </span>
          </div>

          <div className="space-y-3">
            {pendingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Очікує рішення
                    </span>
                    <span className="text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                      {booking.roomNameSnapshot}
                    </span>
                    <span className="text-xs text-gray-500">{booking.locationSnapshot}</span>
                  </div>

                  <h4 className="text-lg font-bold text-gray-900">{booking.draft.title}</h4>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <span className="font-semibold text-[#36674D]">
                      {formatKyivDateTime(booking.draft.interval.start)}
                    </span>
                    <span>
                      {toKyivTimeString(booking.draft.interval.start)} – {toKyivTimeString(booking.draft.interval.end)}
                    </span>
                    {booking.draft.responsibleName && (
                      <span>Організатор: {booking.draft.responsibleName}</span>
                    )}
                    {booking.draft.contactPhone && (
                      <span className="text-[#36674D] font-bold">
                        {booking.draft.contactPhone}
                      </span>
                    )}
                  </div>

                  {booking.draft.description && (
                    <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      {booking.draft.description}
                    </p>
                  )}

                  {booking.draft.notes && (
                    <p className="text-xs text-amber-800 bg-amber-50/60 p-2 rounded-lg">
                      <span className="font-semibold">Примітки:</span> {booking.draft.notes}
                    </p>
                  )}
                </div>

                {/* Moderation action buttons */}
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(booking)}
                    className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Схвалити</span>
                  </button>

                  <button
                    onClick={() => setRejectModalBooking(booking)}
                    className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Відхилити</span>
                  </button>
                </div>
              </div>
            ))}

            {pendingBookings.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 text-gray-400">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                <p className="font-bold text-sm text-gray-800">Усі заявки опрацьовано!</p>
                <p className="text-xs text-gray-400 mt-1">Нових очікуючих заявок наразі немає</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Room Manager */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              Список локацій та залів ({rooms.length})
            </h3>
            <button
              onClick={() => handleOpenRoomModal()}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#36674D] text-white text-xs font-semibold shadow hover:bg-[#2A523D]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Додати зал</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((r) => (
              <div
                key={r.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between ${
                  r.isActive ? 'border-gray-200' : 'border-gray-300 opacity-60 bg-gray-50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-base">{r.name}</h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        r.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {r.isActive ? 'Активна' : 'Архівна'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">{r.locationLabel}</p>
                  <p className="text-xs text-gray-700 line-clamp-3">{r.description}</p>
                  <p className="text-xs font-medium text-gray-600">
                    Місткість: {r.capacity ? `${r.capacity} осіб` : 'Не обмежено'} • Ревізія: {r.revision}
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-4 mt-3 border-t border-gray-100 text-xs">
                  <button
                    onClick={() => handleOpenRoomModal(r)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                    title="Редагувати"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => archiveRoom(r.id, !r.isActive)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                    title={r.isActive ? 'Архівувати зал' : 'Відновити зал'}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>

                  {!r.isActive && (
                    <button
                      onClick={() => handleDeleteRoom(r.id)}
                      className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                      title="Фізично видалити архівну кімнату"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Users & Permissions */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Користувачі та права</h3>
              <p className="text-xs text-gray-500">
                Надання прав самостійної публікації (canPublish) та блокування
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {demoUsers.map((u) => (
              <div
                key={u.uid}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-gray-900 text-sm">{u.displayName}</p>
                  <p className="text-gray-500">{u.email} • Роль: {u.role}</p>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Can publish toggle */}
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={u.canPublish}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setDemoUsers((prev) =>
                          prev.map((item) => (item.uid === u.uid ? { ...item, canPublish: val } : item))
                        );
                        updateUserPermission(u.uid, val, u.isDisabled);
                      }}
                      className="w-4 h-4 text-[#36674D] rounded"
                    />
                    <span className="font-semibold text-gray-700">Дозвіл публікації</span>
                  </label>

                  {/* Block / Unblock */}
                  <button
                    onClick={() => {
                      const nextDisabled = !u.isDisabled;
                      setDemoUsers((prev) =>
                        prev.map((item) => (item.uid === u.uid ? { ...item, isDisabled: nextDisabled } : item))
                      );
                      updateUserPermission(u.uid, u.canPublish, nextDisabled);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                      u.isDisabled
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {u.isDisabled ? 'Заблокований' : 'Активний'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">
              Незмінний журнал дій адміністрації (adminAudit)
            </h3>
            <span className="text-xs text-gray-500">Записів: {auditLogs.length}</span>
          </div>

          <div className="divide-y divide-gray-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px] bg-gray-100 px-2 py-0.5 rounded">
                    {log.action}
                  </span>
                  <span className="text-gray-400 font-mono text-[10px]">
                    {log.at.toLocaleString('uk-UA')}
                  </span>
                </div>
                <p className="text-gray-700">
                  <span className="font-semibold">Сутність:</span> {log.entityType} ({log.entityId}) •{' '}
                  <span className="font-semibold">Автор:</span> {log.actorId} • Ревізія: {log.revision}
                </p>
                {log.changedFields && log.changedFields.length > 0 && (
                  <p className="text-gray-500">
                    Змінені поля: {log.changedFields.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Відхилити заявку на бронювання?
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              "{rejectModalBooking.draft.title}" ({rejectModalBooking.roomNameSnapshot})
            </p>

            {rejectError && (
              <p className="text-xs text-red-600 mb-2">{rejectError}</p>
            )}

            <div className="space-y-2 mb-4">
              <label className="block text-xs font-semibold text-gray-700">
                Причина відхилення (обов'язково): <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Поясніть організатору причину (від 3 символів)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 p-2.5 text-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setRejectModalBooking(null);
                  setRejectError('');
                }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow"
              >
                Відхилити заявку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Add/Edit Modal */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingRoom ? `Редагувати: ${editingRoom.name}` : 'Додати новий зал / локацію'}
            </h3>

            {roomError && (
              <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{roomError}</p>
            )}

            <form onSubmit={handleSaveRoom} className="space-y-3.5 text-xs text-gray-700">
              <div>
                <label className="block font-bold mb-1">Назва зали *</label>
                <input
                  type="text"
                  required
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 font-medium text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Локація / поверх</label>
                <input
                  type="text"
                  value={roomForm.locationLabel}
                  onChange={(e) => setRoomForm({ ...roomForm, locationLabel: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Місткість (осіб)</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Опис простору</label>
                <textarea
                  rows={3}
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-semibold"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#36674D] text-white font-bold hover:bg-[#2A523D]"
                >
                  Зберегти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
