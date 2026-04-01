import type {
  ApiResponse, LoginRequestDto, AuthResponseDto, LogoutRequestDto,
  UserResponseDto, UserAddRequestDto, UserUpdateRequestDto,
  RoomResponseDto, RoomAddRequestDto, RoomUpdateRequestDto,
  PackageResponseDto, PackageAddRequestDto, PackageUpdateRequestDto,
  BookingResponseDto,
  NegotiationSessionResponseDto, ChatMessageResponseDto,
  StartSessionRequestDto, SendMessageRequestDto,
  EmotionResultDto,
  ResponseTimeStatsDto,
} from './types';

// ─── Config ───────────────────────────────────────────────────────────────────
export const BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ||
  'http://localhost:8080';

// ─── Token helpers ────────────────────────────────────────────────────────────
export function getToken(): string | null  { return localStorage.getItem('el_token'); }
export function setToken(t: string): void  { localStorage.setItem('el_token', t); }
export function clearToken(): void         { localStorage.removeItem('el_token'); }

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function req<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const body = await res.json(); msg = body?.message || msg; } catch {}
    throw new ApiError(res.status, msg);
  }
  const body: ApiResponse<T> = await res.json();
  return body.data;
}

const get  = <T>(path: string, auth = true) => req<T>(path, { method: 'GET' }, auth);
const post = <T>(path: string, data: unknown, auth = true) =>
  req<T>(path, { method: 'POST', body: JSON.stringify(data) }, auth);
const put  = <T>(path: string, data: unknown) =>
  req<T>(path, { method: 'PUT', body: JSON.stringify(data) });
const del  = <T>(path: string) => req<T>(path, { method: 'DELETE' });

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:  (dto: LoginRequestDto)  => post<AuthResponseDto>('/api/auth/login',  dto, false),
  logout: (dto: LogoutRequestDto) => post<null>('/api/auth/logout', dto),
};

// ─── User  (Admin only) ───────────────────────────────────────────────────────
export const userApi = {
  getAll:   (params?: { isActive?: boolean; role?: string }) => {
    const qs = new URLSearchParams();
    if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive));
    if (params?.role)                   qs.set('role', params.role);
    const q = qs.toString();
    return get<UserResponseDto[]>(`/api/user/get${q ? `?${q}` : ''}`);
  },
  add:    (dto: UserAddRequestDto)                  => post<UserResponseDto>('/api/user/add', dto),
  edit:   (id: number, dto: UserUpdateRequestDto)   => put<UserResponseDto>(`/api/user/edit/${id}`, dto),
  remove: (id: number)                              => del<null>(`/api/user/remove/${id}`),
};

// ─── Room ─────────────────────────────────────────────────────────────────────
export const roomApi = {
  getAll: (params?: { isActive?: boolean; roomType?: string; floor?: number }) => {
    const qs = new URLSearchParams();
    if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive));
    if (params?.roomType) qs.set('roomType', params.roomType);
    if (params?.floor)    qs.set('floor', String(params.floor));
    const q = qs.toString();
    return get<RoomResponseDto[]>(`/api/room/get${q ? `?${q}` : ''}`);
  },
  add:    (dto: RoomAddRequestDto)                => post<RoomResponseDto>('/api/room/add', dto),
  edit:   (id: number, dto: RoomUpdateRequestDto) => put<RoomResponseDto>(`/api/room/edit/${id}`, dto),
  remove: (id: number)                            => del<null>(`/api/room/remove/${id}`),
};

// ─── Package ──────────────────────────────────────────────────────────────────
export const packageApi = {
  getAll: (params?: { isActive?: boolean; roomType?: string }) => {
    const qs = new URLSearchParams();
    if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive));
    if (params?.roomType) qs.set('roomType', params.roomType);
    const q = qs.toString();
    return get<PackageResponseDto[]>(`/api/package/get${q ? `?${q}` : ''}`);
  },
  getById: (id: number)                                => get<PackageResponseDto>(`/api/package/get/${id}`),
  add:     (dto: PackageAddRequestDto)                 => post<PackageResponseDto>('/api/package/add', dto),
  edit:    (id: number, dto: PackageUpdateRequestDto)  => put<PackageResponseDto>(`/api/package/edit/${id}`, dto),
  remove:  (id: number)                               => del<null>(`/api/package/remove/${id}`),
};

// ─── Booking ──────────────────────────────────────────────────────────────────
export const bookingApi = {
  getAll:  ()          => get<BookingResponseDto[]>('/api/booking/get'),
  remove:  (id: number) => del<null>(`/api/booking/remove/${id}`),
};

// ─── Chat / Negotiation ───────────────────────────────────────────────────────
export const chatApi = {
  startSession:   (dto: StartSessionRequestDto)                  => post<NegotiationSessionResponseDto>('/api/chat/session/start', dto, false),
  sendMessage:    (dto: SendMessageRequestDto)                   => post<ChatMessageResponseDto>('/api/chat/session/message', dto, false),
  getSession:     (sessionId: string)                            => get<NegotiationSessionResponseDto>(`/api/chat/session/${sessionId}`, false),
  getAllSessions:  ()                                             => get<NegotiationSessionResponseDto[]>('/api/chat/sessions'),
  getMessages:    (sessionId: string)                            => get<ChatMessageResponseDto[]>(`/api/chat/session/${sessionId}/messages`, false),
  getResponseTimeStats: ()                                       => get<ResponseTimeStatsDto>('/api/chat/stats/response-time'),
  getActiveSessions: ()                                          => get<NegotiationSessionResponseDto[]>('/api/chat/sessions/active'),
  deleteSession:  (id: number)                                   => del<null>(`/api/chat/sessions/${id}`),
  abortSession:   (sessionId: string)                            => put<NegotiationSessionResponseDto>(`/api/chat/session/${sessionId}/abort`, {}),
  completeSession:(sessionId: string)                            => put<NegotiationSessionResponseDto>(`/api/chat/session/${sessionId}/complete`, {}),
};

// ─── Emotion ──────────────────────────────────────────────────────────────────
export const emotionApi = {
  detect: (userMessage: string) => post<EmotionResultDto>('/api/emotion/detect', { userMessage }, false),
};
