// ─── Enums ────────────────────────────────────────────────────────────────────
export type UserRole    = 'ADMIN' | 'STAFF' | 'GUEST';
export type RoomType    = 'SINGLE' | 'DOUBLE' | 'DELUXE' | 'SUITE' | 'FAMILY';
export type PackageAddOn =
  | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'FULL_BOARD'
  | 'SPA' | 'POOL_ACCESS' | 'AIRPORT_TRANSFER' | 'LATE_CHECKOUT' | 'EARLY_CHECKIN';
export type BookingStatus  = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
export type SessionStatus  = 'ACTIVE' | 'COMPLETED' | 'ABORTED';
export type SenderType     = 'GUEST' | 'AGENT' | 'SYSTEM';
export type MessageType    = 'TEXT' | 'PACKAGE_CARD' | 'OPTION_BUTTONS' | 'SYSTEM_NOTICE';
export type EmotionState   =
  | 'FRUSTRATED' | 'HESITANT' | 'NEUTRAL' | 'INTERESTED' | 'SATISFIED' | 'EXCITED';

// ─── Generic wrapper ──────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data:    T;
  message: string;
  status:  number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginRequestDto   { username: string; password: string; }
export interface LogoutRequestDto  { username: string; }
export interface AuthResponseDto   {
  token:    string;
  userId:   number;
  username: string;
  role:     UserRole;
}

// Local session user (enriched after login)
export interface AuthUser extends AuthResponseDto { firstName: string; }

// ─── User ─────────────────────────────────────────────────────────────────────
export interface UserResponseDto {
  id:        number;
  firstName: string;
  username:  string;
  email:     string;
}
export interface UserAddRequestDto {
  firstName:   string;
  lastName:    string;
  username:    string;
  email:       string;
  phoneNumber: string;
  password:    string;
  role:        string;
}
export interface UserUpdateRequestDto {
  firstName?:   string;
  lastName?:    string;
  username?:    string;
  email?:       string;
  phoneNumber?: string;
  password?:    string;
  role?:        string;
  isActive?:    boolean;
}

// ─── Room ─────────────────────────────────────────────────────────────────────
export interface RoomResponseDto {
  id:           number;
  roomNumber:   string;
  floor:        number;
  roomType:     RoomType;
  description:  string;
  maxOccupancy: number;
  isActive:     boolean;
}
export interface RoomAddRequestDto {
  roomNumber:   string;
  floor:        number;
  roomType:     string;
  description:  string;
  maxOccupancy: number;
}
export interface RoomUpdateRequestDto extends Partial<RoomAddRequestDto> {
  isActive?: boolean;
}

// ─── Package ──────────────────────────────────────────────────────────────────
export interface PackageResponseDto {
  id:              number;
  name:            string;
  description:     string;
  roomId:          number;
  roomNumber:      string;
  roomType:        string;
  lowerBoundPrice: number;
  upperBoundPrice: number;
  maxOccupancy:    number;
  addOns:          string[];
  imageUrl:        string;
  isActive:        boolean;
}
export interface PackageAddRequestDto {
  name:            string;
  description:     string;
  roomId:          number;
  lowerBoundPrice: number;
  upperBoundPrice: number;
  maxOccupancy:    number;
  addOns:          string[];
  imageUrl:        string;
}
export interface PackageUpdateRequestDto extends Partial<PackageAddRequestDto> {
  isActive?: boolean;
}

// ─── Booking ──────────────────────────────────────────────────────────────────
export interface BookingResponseDto {
  id:                  number;
  reference:           string;
  guestId:             number | null;
  packageId:           number | null;
  roomId:              number | null;
  roomNumber:          string | null;
  status:              BookingStatus;
  offeredPricePerNight: number;
  totalPrice:          number;
  checkInDate:         string;
  checkOutDate:        string;
  totalNights:         number;
  guestCount:          number | null;
  sessionId:           string | null;
  packageName:         string | null;
  createdAt:           string;
  message:             string;
}

// ─── Chat / Negotiation ───────────────────────────────────────────────────────
export interface NegotiationSessionResponseDto {
  id:                   number;
  sessionId:            string;
  guestName:            string;
  status:               SessionStatus;
  currentRound:         number;
  offeredPrice:         number;
  recommendedPackageId: number;
  bookingReference:     string;
  startedAt:            string;
  updatedAt:            string;
  endedAt:              string;
}
export interface ChatMessageResponseDto {
  id:             number;
  sessionId:      string;
  senderType:     SenderType;
  messageType:    MessageType;
  content:        string;
  detectedEmotion: string;
  offeredPrice:   number;
  metadata:       string;
  timestamp:      string;
}
export interface ResponseTimeStatsDto {
  averageResponseTimeMs: number;
  totalReplies: number;
}
export interface StartSessionRequestDto  { guestName: string; initialMessage: string; }
export interface SendMessageRequestDto   { sessionId: string; message: string; }

// ─── Emotion ──────────────────────────────────────────────────────────────────
export interface EmotionResultDto {
  emotion:    EmotionState;
  confidence: number;
  reasoning:  string;
}
