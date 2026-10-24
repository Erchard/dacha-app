export type UserRole = 'guest' | 'organizer' | 'admin' | 'developer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isDisabled: boolean;
  canPublish?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
  schemaVersion?: number;
  adminRevision?: number;
  lastAdminAuditId?: string | null;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  locationLabel: string;
  capacity: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  revision: number;
  lastAuditId: string;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'deleted';

export type BookingAction =
  | 'create'
  | 'createPending'
  | 'createApproved'
  | 'edit'
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'reschedule'
  | 'delete';

export interface BookingInterval {
  start: Date;
  end: Date;
}

export interface BookingDraft {
  roomId: string;
  title: string;
  description: string;
  responsibleName: string;
  contactPhone: string;
  notes: string;
  directions: string[];
  interval: BookingInterval;
}

export interface Booking {
  id: string;
  organizerId: string;
  draft: BookingDraft;
  status: BookingStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  roomNameSnapshot: string;
  locationSnapshot: string;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  cancelledAt?: Date | null;
  cancelledBy?: string | null;
  occupancyBlockIds?: string[];
  lastAction?: string;
}

export interface PublicEvent {
  id: string;
  title: string;
  description: string;
  roomId: string;
  roomNameSnapshot: string;
  locationSnapshot: string;
  responsibleName: string;
  contactPhone: string;
  notes: string;
  directions: string[];
  interval: BookingInterval;
  bookingVersion: number;
  publishedAt: Date;
  updatedAt: Date;
}

export type TicketType = 'bug' | 'feature' | 'feedback';
export type TicketStatus = 'new' | 'accepted' | 'in_progress' | 'done' | 'rejected' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high';

export interface SupportTicket {
  id: string;
  type: TicketType;
  title: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  lastActivityAt: Date;
  version: number;
  lastAction?: string;
}

export interface SupportComment {
  id: string;
  authorId: string;
  authorRole: string;
  body: string;
  createdAt: Date;
  version: number;
}

export interface AdminAuditEntry {
  id: string;
  entityType: 'room' | 'user';
  entityId: string;
  action: 'create' | 'update' | 'archive' | 'delete' | 'set_disabled' | 'set_publishing';
  actorId: string;
  at: Date;
  changedFields: string[];
  revision: number;
  before: Record<string, any>;
  after: Record<string, any>;
}

export const EVENT_DIRECTIONS = [
  'Емоційна підтримка',
  'Екологія',
  'Культура',
  'Громадська активність',
  'Освіта, просвіта',
  'Толока',
  'Благоустрій Дачі',
  'Психологічна допомога',
  'Майстер-клас',
  'Клуб',
  'Для людей старшого віку',
  'Для дітей',
  'Для молоді',
  'Творчі зустрічі',
  'Концерт',
] as const;

export type EventDirection = typeof EVENT_DIRECTIONS[number];
