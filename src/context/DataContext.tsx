import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import {
  Room,
  PublicEvent,
  Booking,
  BookingDraft,
  SupportTicket,
  SupportComment,
  AdminAuditEntry,
  TicketStatus,
  TicketPriority,
  TicketType,
} from '../types';
import {
  INITIAL_ROOMS,
  INITIAL_EVENTS,
  INITIAL_BOOKINGS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';
import { getSlotsByBlock } from '../services/kyivTime';

interface DataContextType {
  rooms: Room[];
  publicEvents: PublicEvent[];
  myBookings: Booking[];
  allBookings: Booking[];
  tickets: SupportTicket[];
  ticketComments: Record<string, SupportComment[]>;
  auditLogs: AdminAuditEntry[];
  loading: boolean;
  isLiveFirebase: boolean;
  refreshData: () => Promise<void>;
  createBooking: (draft: BookingDraft, approveDirectly: boolean, seriesCount?: number) => Promise<string>;
  approveBooking: (bookingId: string) => Promise<void>;
  rejectBooking: (bookingId: string, reason: string) => Promise<void>;
  cancelBooking: (bookingId: string, reason?: string) => Promise<void>;
  deleteBooking: (bookingId: string) => Promise<void>;
  createRoom: (roomData: { name: string; description: string; locationLabel: string; capacity: number | null; sortOrder: number }) => Promise<void>;
  updateRoom: (roomId: string, changes: Partial<Room>) => Promise<void>;
  archiveRoom: (roomId: string, isActive: boolean) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  createTicket: (data: { type: TicketType; title: string; body: string; priority: TicketPriority }) => Promise<void>;
  updateTicketStatus: (ticketId: string, newStatus: TicketStatus, comment?: string) => Promise<void>;
  addTicketComment: (ticketId: string, body: string) => Promise<void>;
  updateUserPermission: (uid: string, canPublish: boolean, isDisabled: boolean) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoUser } = useAuth();
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('dacha_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });
  const [publicEvents, setPublicEvents] = useState<PublicEvent[]>(() => {
    const saved = localStorage.getItem('dacha_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });
  const [myBookings, setMyBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('dacha_my_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });
  const [allBookings, setAllBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('dacha_all_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('dacha_tickets');
    return saved ? JSON.parse(saved) : INITIAL_SUPPORT_TICKETS;
  });
  const [ticketComments, setTicketComments] = useState<Record<string, SupportComment[]>>({});
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>(() => {
    const saved = localStorage.getItem('dacha_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });
  const [loading, setLoading] = useState(false);
  const [isLiveFirebase, setIsLiveFirebase] = useState(false);

  // Sync state to local storage for offline continuity
  useEffect(() => {
    localStorage.setItem('dacha_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('dacha_events', JSON.stringify(publicEvents));
  }, [publicEvents]);

  useEffect(() => {
    localStorage.setItem('dacha_my_bookings', JSON.stringify(myBookings));
  }, [myBookings]);

  useEffect(() => {
    localStorage.setItem('dacha_all_bookings', JSON.stringify(allBookings));
  }, [allBookings]);

  useEffect(() => {
    localStorage.setItem('dacha_tickets', JSON.stringify(tickets));
  }, [tickets]);

  const loadFromFirestore = useCallback(async () => {
    setLoading(true);
    let liveSuccess = false;

    try {
      // 1. Fetch Rooms (public: active rooms)
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('isActive', '==', true),
        limit(50)
      );
      const roomsSnap = await getDocs(roomsQuery);
      if (!roomsSnap.empty) {
        const fetchedRooms: Room[] = roomsSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            name: d.name || '',
            description: d.description || '',
            locationLabel: d.locationLabel || 'Дача',
            capacity: d.capacity ?? null,
            isActive: d.isActive !== false,
            sortOrder: d.sortOrder || 0,
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
            updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : new Date(),
            revision: d.revision || 1,
            lastAuditId: d.lastAuditId || '',
          };
        });
        setRooms(fetchedRooms);
        liveSuccess = true;
      }

      // 2. Fetch Public Events
      const eventsQuery = query(
        collection(db, 'publicEvents'),
        limit(100)
      );
      const eventsSnap = await getDocs(eventsQuery);
      if (!eventsSnap.empty) {
        const fetchedEvents: PublicEvent[] = eventsSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            title: d.title || 'Подія',
            description: d.description || '',
            roomId: d.roomId || '',
            roomNameSnapshot: d.roomNameSnapshot || '',
            locationSnapshot: d.locationSnapshot || 'Дача',
            responsibleName: d.responsibleName || '',
            contactPhone: d.contactPhone || '',
            notes: d.notes || '',
            directions: Array.isArray(d.directions) ? d.directions : [],
            interval: {
              start: d.startAt?.toDate ? d.startAt.toDate() : new Date(d.startAt?.seconds * 1000 || Date.now()),
              end: d.endAt?.toDate ? d.endAt.toDate() : new Date(d.endAt?.seconds * 1000 || Date.now() + 3600000),
            },
            bookingVersion: d.bookingVersion || 1,
            publishedAt: d.publishedAt?.toDate ? d.publishedAt.toDate() : new Date(),
            updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : new Date(),
          };
        });
        setPublicEvents(fetchedEvents);
        liveSuccess = true;
      }
    } catch (err) {
      console.info('Live Firestore read note:', err);
    } finally {
      setIsLiveFirebase(liveSuccess);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromFirestore();
  }, [loadFromFirestore]);

  // Create booking
  const createBooking = async (
    draft: BookingDraft,
    approveDirectly: boolean,
    seriesCount = 1
  ): Promise<string> => {
    const targetRoom = rooms.find((r) => r.id === draft.roomId) || rooms[0];
    const baseId = `book-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const createdDate = new Date();

    const newBookings: Booking[] = [];
    const newEvents: PublicEvent[] = [];

    for (let i = 0; i < seriesCount; i++) {
      const occurrenceStart = new Date(draft.interval.start.getTime() + i * 7 * 86400000);
      const occurrenceEnd = new Date(draft.interval.end.getTime() + i * 7 * 86400000);
      const dateSuffix = occurrenceStart.toISOString().slice(0, 10).replace(/-/g, '');
      const bookingId = seriesCount > 1 ? `${baseId}-${dateSuffix}` : baseId;

      const occurrenceDraft: BookingDraft = {
        ...draft,
        interval: {
          start: occurrenceStart,
          end: occurrenceEnd,
        },
      };

      const status = approveDirectly ? 'approved' : 'pending';
      const bookingItem: Booking = {
        id: bookingId,
        organizerId: user?.uid || 'guest-uid',
        draft: occurrenceDraft,
        status,
        version: 1,
        createdAt: createdDate,
        updatedAt: createdDate,
        roomNameSnapshot: targetRoom.name,
        locationSnapshot: targetRoom.locationLabel,
        reviewedAt: approveDirectly ? createdDate : null,
        reviewedBy: approveDirectly ? user?.uid : null,
        lastAction: approveDirectly ? 'createApproved' : 'createPending',
      };

      newBookings.push(bookingItem);

      if (approveDirectly) {
        newEvents.push({
          id: bookingId,
          title: draft.title,
          description: draft.description,
          roomId: targetRoom.id,
          roomNameSnapshot: targetRoom.name,
          locationSnapshot: targetRoom.locationLabel,
          responsibleName: draft.responsibleName || user?.displayName || 'Організатор',
          contactPhone: draft.contactPhone,
          notes: draft.notes,
          directions: draft.directions,
          interval: {
            start: occurrenceStart,
            end: occurrenceEnd,
          },
          bookingVersion: 1,
          publishedAt: createdDate,
          updatedAt: createdDate,
        });
      }
    }

    // Try committing to Firestore if online
    if (!isDemoUser && user && user.role !== 'guest') {
      try {
        for (const b of newBookings) {
          await setDoc(doc(db, 'bookings', b.id), {
            organizerId: b.organizerId,
            roomId: b.draft.roomId,
            title: b.draft.title,
            description: b.draft.description,
            responsibleName: b.draft.responsibleName,
            contactPhone: b.draft.contactPhone,
            notes: b.draft.notes,
            directions: b.draft.directions,
            startAt: b.draft.interval.start,
            endAt: b.draft.interval.end,
            timeZone: 'Europe/Kyiv',
            status: b.status,
            roomNameSnapshot: b.roomNameSnapshot,
            locationSnapshot: b.locationSnapshot,
            rejectionReason: null,
            cancellationReason: null,
            reviewedAt: b.reviewedAt,
            reviewedBy: b.reviewedBy,
            cancelledAt: null,
            cancelledBy: null,
            occupancyBlockIds: Object.keys(getSlotsByBlock(b.draft.interval.start, b.draft.interval.end)),
            version: 1,
            lastAction: b.lastAction,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: user.uid,
            updatedBy: user.uid,
            schemaVersion: 1,
          });

          if (b.status === 'approved') {
            await setDoc(doc(db, 'publicEvents', b.id), {
              title: b.draft.title,
              description: b.draft.description,
              roomId: b.draft.roomId,
              roomNameSnapshot: b.roomNameSnapshot,
              locationSnapshot: b.locationSnapshot,
              responsibleName: b.draft.responsibleName,
              contactPhone: b.draft.contactPhone,
              notes: b.draft.notes,
              directions: b.draft.directions,
              startAt: b.draft.interval.start,
              endAt: b.draft.interval.end,
              timeZone: 'Europe/Kyiv',
              bookingVersion: 1,
              publishedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              schemaVersion: 1,
            });
          }
        }
      } catch (err) {
        console.warn('Could not write booking to Firestore (fallback to local state):', err);
      }
    }

    setMyBookings((prev) => [...newBookings, ...prev]);
    setAllBookings((prev) => [...newBookings, ...prev]);
    if (newEvents.length > 0) {
      setPublicEvents((prev) => [...newEvents, ...prev]);
    }

    return baseId;
  };

  const approveBooking = async (bookingId: string) => {
    const booking = allBookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const updatedBooking: Booking = {
      ...booking,
      status: 'approved',
      version: booking.version + 1,
      reviewedAt: new Date(),
      reviewedBy: user?.uid || 'admin',
      lastAction: 'approve',
      updatedAt: new Date(),
    };

    const targetRoom = rooms.find((r) => r.id === booking.draft.roomId) || rooms[0];
    const newPublicEvent: PublicEvent = {
      id: bookingId,
      title: booking.draft.title,
      description: booking.draft.description,
      roomId: targetRoom.id,
      roomNameSnapshot: targetRoom.name,
      locationSnapshot: targetRoom.locationLabel,
      responsibleName: booking.draft.responsibleName || 'Організатор',
      contactPhone: booking.draft.contactPhone,
      notes: booking.draft.notes,
      directions: booking.draft.directions,
      interval: booking.draft.interval,
      bookingVersion: updatedBooking.version,
      publishedAt: new Date(),
      updatedAt: new Date(),
    };

    setAllBookings((prev) => prev.map((b) => (b.id === bookingId ? updatedBooking : b)));
    setMyBookings((prev) => prev.map((b) => (b.id === bookingId ? updatedBooking : b)));
    setPublicEvents((prev) => [newPublicEvent, ...prev.filter((e) => e.id !== bookingId)]);

    if (!isDemoUser && user?.role === 'admin') {
      try {
        await setDoc(doc(db, 'publicEvents', bookingId), {
          title: newPublicEvent.title,
          description: newPublicEvent.description,
          roomId: newPublicEvent.roomId,
          roomNameSnapshot: newPublicEvent.roomNameSnapshot,
          locationSnapshot: newPublicEvent.locationSnapshot,
          responsibleName: newPublicEvent.responsibleName,
          contactPhone: newPublicEvent.contactPhone,
          notes: newPublicEvent.notes,
          directions: newPublicEvent.directions,
          startAt: newPublicEvent.interval.start,
          endAt: newPublicEvent.interval.end,
          timeZone: 'Europe/Kyiv',
          bookingVersion: updatedBooking.version,
          publishedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          schemaVersion: 1,
        });
      } catch (err) {
        console.warn('Firestore approve sync error:', err);
      }
    }
  };

  const rejectBooking = async (bookingId: string, reason: string) => {
    const updated = (b: Booking) => ({
      ...b,
      status: 'rejected' as const,
      rejectionReason: reason,
      version: b.version + 1,
      reviewedAt: new Date(),
      reviewedBy: user?.uid || 'admin',
      lastAction: 'reject',
      updatedAt: new Date(),
    });

    setAllBookings((prev) => prev.map((b) => (b.id === bookingId ? updated(b) : b)));
    setMyBookings((prev) => prev.map((b) => (b.id === bookingId ? updated(b) : b)));
  };

  const cancelBooking = async (bookingId: string, reason?: string) => {
    const updated = (b: Booking) => ({
      ...b,
      status: 'cancelled' as const,
      cancellationReason: reason || 'Скасовано організатором',
      version: b.version + 1,
      cancelledAt: new Date(),
      cancelledBy: user?.uid,
      lastAction: 'cancel',
      updatedAt: new Date(),
    });

    setAllBookings((prev) => prev.map((b) => (b.id === bookingId ? updated(b) : b)));
    setMyBookings((prev) => prev.map((b) => (b.id === bookingId ? updated(b) : b)));
    setPublicEvents((prev) => prev.filter((e) => e.id !== bookingId));

    if (!isDemoUser) {
      try {
        await deleteDoc(doc(db, 'publicEvents', bookingId));
      } catch (e) {
        console.warn('Firestore delete publicEvent error:', e);
      }
    }
  };

  const deleteBooking = async (bookingId: string) => {
    setAllBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'deleted', updatedAt: new Date() } : b)));
    setMyBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'deleted', updatedAt: new Date() } : b)));
    setPublicEvents((prev) => prev.filter((e) => e.id !== bookingId));

    if (!isDemoUser) {
      try {
        await deleteDoc(doc(db, 'publicEvents', bookingId));
      } catch {
        // ignore
      }
    }
  };

  const createRoom = async (roomData: { name: string; description: string; locationLabel: string; capacity: number | null; sortOrder: number }) => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: roomData.name,
      description: roomData.description,
      locationLabel: roomData.locationLabel,
      capacity: roomData.capacity,
      sortOrder: roomData.sortOrder,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      revision: 1,
      lastAuditId: `audit-create-${Date.now()}`,
    };

    setRooms((prev) => [...prev, newRoom]);

    const auditEntry: AdminAuditEntry = {
      id: newRoom.lastAuditId,
      entityType: 'room',
      entityId: newRoom.id,
      action: 'create',
      actorId: user?.uid || 'admin',
      at: new Date(),
      changedFields: ['name', 'description', 'locationLabel', 'capacity', 'sortOrder', 'isActive'],
      revision: 1,
      before: {},
      after: { ...newRoom },
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const updateRoom = async (roomId: string, changes: Partial<Room>) => {
    const existing = rooms.find((r) => r.id === roomId);
    if (!existing) return;

    const revision = (existing.revision || 1) + 1;
    const auditId = `audit-update-${roomId}-${revision}`;

    const updatedRoom: Room = {
      ...existing,
      ...changes,
      revision,
      lastAuditId: auditId,
      updatedAt: new Date(),
    };

    setRooms((prev) => prev.map((r) => (r.id === roomId ? updatedRoom : r)));

    const auditEntry: AdminAuditEntry = {
      id: auditId,
      entityType: 'room',
      entityId: roomId,
      action: 'update',
      actorId: user?.uid || 'admin',
      at: new Date(),
      changedFields: Object.keys(changes),
      revision,
      before: { ...existing },
      after: { ...updatedRoom },
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const archiveRoom = async (roomId: string, isActive: boolean) => {
    await updateRoom(roomId, { isActive });
  };

  const deleteRoom = async (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    // Check if room has pending or approved bookings
    const hasActiveBookings = allBookings.some(
      (b) => b.draft.roomId === roomId && (b.status === 'pending' || b.status === 'approved')
    );
    if (hasActiveBookings) {
      throw new Error('Неможливо видалити кімнату: існують активні або очікуючі заявки на цей зал.');
    }

    setRooms((prev) => prev.filter((r) => r.id !== roomId));

    const auditEntry: AdminAuditEntry = {
      id: `delete-${roomId}-${room.revision}`,
      entityType: 'room',
      entityId: roomId,
      action: 'delete',
      actorId: user?.uid || 'admin',
      at: new Date(),
      changedFields: ['isActive', 'deleted'],
      revision: room.revision + 1,
      before: { ...room },
      after: {},
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const createTicket = async (data: { type: TicketType; title: string; body: string; priority: TicketPriority }) => {
    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      type: data.type,
      title: data.title,
      body: data.body,
      status: 'new',
      priority: data.priority,
      createdBy: user?.email || 'admin@example.test',
      createdAt: new Date(),
      updatedBy: user?.email || 'admin@example.test',
      updatedAt: new Date(),
      lastActivityAt: new Date(),
      version: 1,
      lastAction: 'create',
    };

    setTickets((prev) => [newTicket, ...prev]);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: TicketStatus, comment?: string) => {
    const existing = tickets.find((t) => t.id === ticketId);
    if (!existing) return;

    const updatedTicket: SupportTicket = {
      ...existing,
      status: newStatus,
      version: existing.version + 1,
      updatedBy: user?.email || 'user',
      updatedAt: new Date(),
      lastActivityAt: new Date(),
      lastAction: `status_${newStatus}`,
    };

    setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)));

    if (comment) {
      await addTicketComment(ticketId, comment);
    }
  };

  const addTicketComment = async (ticketId: string, body: string) => {
    const commentItem: SupportComment = {
      id: `comment-${Date.now()}`,
      authorId: user?.displayName || user?.email || 'Користувач',
      authorRole: user?.role || 'admin',
      body,
      createdAt: new Date(),
      version: 1,
    };

    setTicketComments((prev) => ({
      ...prev,
      [ticketId]: [...(prev[ticketId] || []), commentItem],
    }));

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, lastActivityAt: new Date(), updatedAt: new Date(), version: t.version + 1 }
          : t
      )
    );
  };

  const updateUserPermission = async (uid: string, canPublish: boolean, isDisabled: boolean) => {
    const auditEntry: AdminAuditEntry = {
      id: `audit-user-${Date.now()}`,
      entityType: 'user',
      entityId: uid,
      action: isDisabled ? 'set_disabled' : 'set_publishing',
      actorId: user?.uid || 'admin',
      at: new Date(),
      changedFields: ['canPublish', 'isDisabled'],
      revision: 1,
      before: {},
      after: { canPublish, isDisabled },
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  return (
    <DataContext.Provider
      value={{
        rooms,
        publicEvents,
        myBookings,
        allBookings,
        tickets,
        ticketComments,
        auditLogs,
        loading,
        isLiveFirebase,
        refreshData: loadFromFirestore,
        createBooking,
        approveBooking,
        rejectBooking,
        cancelBooking,
        deleteBooking,
        createRoom,
        updateRoom,
        archiveRoom,
        deleteRoom,
        createTicket,
        updateTicketStatus,
        addTicketComment,
        updateUserPermission,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
