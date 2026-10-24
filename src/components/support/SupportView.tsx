import React, { useState } from 'react';
import { 
  Headphones, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Tag, 
  Filter, 
  CornerDownRight 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { SupportTicket, TicketStatus, TicketPriority, TicketType } from '../../types';

export const SupportView: React.FC = () => {
  const { user } = useAuth();
  const { tickets, ticketComments, createTicket, updateTicketStatus, addTicketComment } = useData();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id || null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // New ticket modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newForm, setNewForm] = useState<{
    type: TicketType;
    title: string;
    body: string;
    priority: TicketPriority;
  }>({
    type: 'bug',
    title: '',
    body: '',
    priority: 'normal',
  });
  const [newError, setNewError] = useState('');

  // Comment input
  const [commentText, setCommentText] = useState('');

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;
  const currentComments = selectedTicketId ? ticketComments[selectedTicketId] || [] : [];

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const getStatusLabel = (s: TicketStatus) => {
    switch (s) {
      case 'new':
        return 'Нове';
      case 'accepted':
        return 'Прийнято';
      case 'in_progress':
        return 'В роботі';
      case 'done':
        return 'Виконано';
      case 'rejected':
        return 'Відхилено';
      case 'closed':
        return 'Закрито';
      default:
        return s;
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'done':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200 font-bold';
      case 'normal':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'low':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return '';
    }
  };

  // State transitions per role
  const getAllowedTransitions = (status: TicketStatus): TicketStatus[] => {
    if (user?.role === 'developer') {
      switch (status) {
        case 'new':
          return ['accepted', 'rejected'];
        case 'accepted':
          return ['in_progress', 'rejected'];
        case 'in_progress':
          return ['done'];
        case 'done':
        case 'rejected':
          return ['closed', 'accepted'];
        case 'closed':
          return ['accepted'];
        default:
          return [];
      }
    } else if (user?.role === 'admin') {
      switch (status) {
        case 'new':
          return ['closed'];
        case 'done':
        case 'rejected':
        case 'closed':
          return ['closed', 'accepted'];
        default:
          return [];
      }
    }
    return [];
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewError('');

    if (newForm.title.trim().length < 3) {
      setNewError('Тема звернення має бути від 3 символів.');
      return;
    }
    if (newForm.body.trim().length < 10) {
      setNewError('Опишіть деталі звернення (мінімум 10 символів).');
      return;
    }

    try {
      await createTicket(newForm);
      setNewModalOpen(false);
      setNewForm({ type: 'bug', title: '', body: '', priority: 'normal' });
    } catch (e: any) {
      setNewError(e.message || 'Помилка створення');
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !commentText.trim()) return;
    await addTicketComment(selectedTicketId, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-900">
              <Headphones className="w-5 h-5 text-purple-700" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Служба Підтримки Дачі
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Координація між адміністрацією та технічною командою розробників
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => setNewModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#36674D] hover:bg-[#2A523D] text-white text-xs font-bold shadow transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Створити звернення</span>
          </button>
        )}
      </div>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Tickets List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 p-1.5 bg-gray-50 font-medium"
            >
              <option value="all">Усі статуси</option>
              <option value="new">Нові</option>
              <option value="in_progress">В роботі</option>
              <option value="done">Виконані</option>
              <option value="closed">Закриті</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 p-1.5 bg-gray-50 font-medium"
            >
              <option value="all">Усі пріоритети</option>
              <option value="high">Високий</option>
              <option value="normal">Звичайний</option>
              <option value="low">Низький</option>
            </select>
          </div>

          {/* List items */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredTickets.map((t) => {
              const isSelected = t.id === selectedTicketId;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#36674D] bg-emerald-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                        t.status
                      )}`}
                    >
                      {getStatusLabel(t.status)}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${getPriorityBadge(
                        t.priority
                      )}`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <p className="font-bold text-xs text-gray-900 line-clamp-1">{t.title}</p>
                  <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{t.body}</p>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2">
                    <span>{t.type}</span>
                    <span>{t.createdAt.toLocaleDateString('uk-UA')}</span>
                  </div>
                </div>
              );
            })}

            {filteredTickets.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-8">Немає звернень</p>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Ticket Details & Comments thread */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-5">
              {/* Ticket header */}
              <div className="border-b border-gray-100 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        selectedTicket.status
                      )}`}
                    >
                      {getStatusLabel(selectedTicket.status)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded border uppercase tracking-wider font-semibold ${getPriorityBadge(
                        selectedTicket.priority
                      )}`}
                    >
                      Пріоритет: {selectedTicket.priority}
                    </span>
                    <span className="text-xs text-gray-400 uppercase font-mono">
                      Тип: {selectedTicket.type}
                    </span>
                  </div>

                  <span className="text-xs text-gray-400">
                    Версія: {selectedTicket.version}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 leading-snug">
                  {selectedTicket.title}
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  Автор: {selectedTicket.createdBy} • Створено:{' '}
                  {selectedTicket.createdAt.toLocaleString('uk-UA')}
                </p>
              </div>

              {/* Body */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs sm:text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                {selectedTicket.body}
              </div>

              {/* Status Actions allowed for current role */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-700">
                  Змінити статус ({user?.role === 'developer' ? 'Розробник' : 'Адміністратор'}):
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {getAllowedTransitions(selectedTicket.status).map((nextStatus) => (
                    <button
                      key={nextStatus}
                      onClick={() => updateTicketStatus(selectedTicket.id, nextStatus)}
                      className="px-3 py-1 rounded-lg bg-white border border-gray-300 hover:border-[#36674D] hover:text-[#36674D] text-xs font-semibold shadow-sm transition-all"
                    >
                      → {getStatusLabel(nextStatus)}
                    </button>
                  ))}
                  {getAllowedTransitions(selectedTicket.status).length === 0 && (
                    <span className="text-xs text-gray-400 italic">
                      Немає доступних дій для поточної ролі
                    </span>
                  )}
                </div>
              </div>

              {/* Comments Thread */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                  Коментарі та історія опрацювання ({currentComments.length})
                </h4>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {currentComments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">
                          {c.authorId} ({c.authorRole})
                        </span>
                        <span className="text-gray-400 text-[10px]">
                          {c.createdAt.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{c.body}</p>
                    </div>
                  ))}

                  {currentComments.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Коментарів ще немає.</p>
                  )}
                </div>

                {/* Add comment input */}
                <form onSubmit={handleSendComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Додати коментар до звернення..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 text-xs rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-gray-900 focus:ring-2 focus:ring-[#36674D] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-[#36674D] text-white hover:bg-[#2A523D] transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400">
              <Headphones className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="font-bold text-sm">Оберіть звернення зі списку</p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Нове звернення до підтримки
            </h3>

            {newError && (
              <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{newError}</p>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Тип звернення</label>
                  <select
                    value={newForm.type}
                    onChange={(e) => setNewForm({ ...newForm, type: e.target.value as TicketType })}
                    className="w-full rounded-xl border border-gray-200 p-2 font-medium"
                  >
                    <option value="bug">Помилка (Bug)</option>
                    <option value="feature">Побажання (Feature)</option>
                    <option value="feedback">Відгук (Feedback)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Пріоритет</label>
                  <select
                    value={newForm.priority}
                    onChange={(e) => setNewForm({ ...newForm, priority: e.target.value as TicketPriority })}
                    className="w-full rounded-xl border border-gray-200 p-2 font-medium"
                  >
                    <option value="low">Низький</option>
                    <option value="normal">Звичайний</option>
                    <option value="high">Високий</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Тема звернення *</label>
                <input
                  type="text"
                  required
                  placeholder="Короткий зміст проблеми чи пропозиції"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Опис (деталі) *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Детально опишіть ситуацію або потрібну функцію..."
                  value={newForm.body}
                  onChange={(e) => setNewForm({ ...newForm, body: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-semibold"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#36674D] text-white font-bold hover:bg-[#2A523D]"
                >
                  Надіслати звернення
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
