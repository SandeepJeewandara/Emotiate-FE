import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";

const G = {
  gold: "#C9A96E", goldLight: "#E8C87A", goldDark: "#A88A49",
  bg: "#060A17", sidebar: "#0A0E1F", card: "rgba(255,255,255,0.03)",
  border: "rgba(201,169,110,0.15)", borderHover: "rgba(201,169,110,0.35)",
  text: "#E8E4DC", muted: "rgba(232,228,220,0.5)", faint: "rgba(232,228,220,0.25)",
};

const DEMO_CREDS = [
  { username: "admin", password: "admin123", role: "ADMIN", firstName: "Admin" },
  { username: "staff", password: "staff123", role: "STAFF", firstName: "Staff" },
];

const mkUsers = () => [
  { id: 1, firstName: "Nimal", lastName: "Perera", username: "nimal.p", email: "nimal@emerald.lk", phoneNumber: "0771234567", role: "ADMIN", isActive: true },
  { id: 2, firstName: "Kavya", lastName: "Silva", username: "kavya.s", email: "kavya@emerald.lk", phoneNumber: "0777654321", role: "STAFF", isActive: true },
  { id: 3, firstName: "Roshan", lastName: "De Mel", username: "roshan.d", email: "roshan@emerald.lk", phoneNumber: "0712223344", role: "STAFF", isActive: true },
  { id: 4, firstName: "Amali", lastName: "Perera", username: "amali.p", email: "amali@emerald.lk", phoneNumber: "0769998877", role: "GUEST", isActive: false },
  { id: 5, firstName: "Thilak", lastName: "Bandara", username: "thilak.b", email: "thilak@emerald.lk", phoneNumber: "0754445566", role: "GUEST", isActive: true },
];
const mkRooms = () => [
  { id: 1, roomNumber: "101", floor: 1, roomType: "SINGLE", description: "Cozy single room with garden view", maxOccupancy: 1, isActive: true },
  { id: 2, roomNumber: "203", floor: 2, roomType: "DELUXE", description: "Sea-view deluxe room with private balcony", maxOccupancy: 3, isActive: true },
  { id: 3, roomNumber: "305", floor: 3, roomType: "SUITE", description: "Luxury suite with panoramic ocean view", maxOccupancy: 2, isActive: true },
  { id: 4, roomNumber: "402", floor: 4, roomType: "FAMILY", description: "Spacious family villa with garden access", maxOccupancy: 5, isActive: false },
  { id: 5, roomNumber: "204", floor: 2, roomType: "DOUBLE", description: "Standard double room near the pool", maxOccupancy: 2, isActive: true },
];
const mkPackages = () => [
  { id: 1, name: "Weekend Deluxe Escape", description: "Two-night deluxe coastal getaway with curated experiences", roomId: 2, roomNumber: "203", roomType: "DELUXE", lowerBoundPrice: 15000, upperBoundPrice: 22000, maxOccupancy: 3, addOns: ["BREAKFAST", "SPA"], imageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", isActive: true },
  { id: 2, name: "Honeymoon Suite", description: "Romantic ocean suite designed for couples with premium amenities", roomId: 3, roomNumber: "305", roomType: "SUITE", lowerBoundPrice: 28000, upperBoundPrice: 38000, maxOccupancy: 2, addOns: ["BREAKFAST", "DINNER", "SPA", "LATE_CHECKOUT"], imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80", isActive: true },
  { id: 3, name: "Family Adventure", description: "Wholesome family package with island activities and all-inclusive meals", roomId: 4, roomNumber: "402", roomType: "FAMILY", lowerBoundPrice: 32000, upperBoundPrice: 45000, maxOccupancy: 5, addOns: ["FULL_BOARD", "AIRPORT_TRANSFER", "POOL_ACCESS"], imageUrl: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80", isActive: false },
];
const mkSessions = () => [
  { id: 1, sessionId: "EMT-S8F72K", guestName: "John Smith", status: "ACTIVE", currentRound: 3, offeredPrice: 18500, startedAt: "2026-03-19T09:12:00", updatedAt: "2026-03-19T09:45:00" },
  { id: 2, sessionId: "EMT-P4X91M", guestName: "Priya Kumar", status: "COMPLETED", currentRound: 5, offeredPrice: 22000, startedAt: "2026-03-18T14:30:00", updatedAt: "2026-03-18T15:10:00" },
  { id: 3, sessionId: "EMT-R3W65N", guestName: "David Chen", status: "ABORTED", currentRound: 2, offeredPrice: 0, startedAt: "2026-03-17T11:00:00", updatedAt: "2026-03-17T11:22:00" },
  { id: 4, sessionId: "EMT-T7V43L", guestName: "Sarah Johnson", status: "ACTIVE", currentRound: 1, offeredPrice: 15000, startedAt: "2026-03-19T10:05:00", updatedAt: "2026-03-19T10:15:00" },
  { id: 5, sessionId: "EMT-Q2U87H", guestName: "Arun Fernando", status: "COMPLETED", currentRound: 4, offeredPrice: 35000, startedAt: "2026-03-16T16:00:00", updatedAt: "2026-03-16T16:50:00" },
  { id: 6, sessionId: "EMT-M9K23B", guestName: "Li Wei", status: "ABORTED", currentRound: 1, offeredPrice: 0, startedAt: "2026-03-15T08:00:00", updatedAt: "2026-03-15T08:12:00" },
];
const mkBookings = () => [
  { id: 1, reference: "EMT-12AB34CD", guestId: 2, packageId: 1, roomId: 2, roomNumber: "203", status: "CONFIRMED", offeredPricePerNight: 18000, totalPrice: 36000, checkInDate: "2026-03-20", checkOutDate: "2026-03-22", totalNights: 2, guestCount: 2, sessionId: "EMT-P4X91M", packageName: "Weekend Deluxe Escape", createdAt: "2026-03-18T15:10:00" },
  { id: 2, reference: "EMT-56EF78GH", guestId: 5, packageId: 2, roomId: 3, roomNumber: "305", status: "PENDING", offeredPricePerNight: 32000, totalPrice: 96000, checkInDate: "2026-03-25", checkOutDate: "2026-03-28", totalNights: 3, guestCount: 2, sessionId: "EMT-Q2U87H", packageName: "Honeymoon Suite", createdAt: "2026-03-16T16:50:00" },
  { id: 3, reference: "EMT-90IJ12KL", guestId: 3, packageId: null, roomId: 1, roomNumber: "101", status: "CANCELLED", offeredPricePerNight: 8000, totalPrice: 8000, checkInDate: "2026-03-15", checkOutDate: "2026-03-16", totalNights: 1, guestCount: 1, sessionId: null, packageName: null, createdAt: "2026-03-14T10:00:00" },
  { id: 4, reference: "EMT-34MN56OP", guestId: null, packageId: 1, roomId: 2, roomNumber: "203", status: "NO_SHOW", offeredPricePerNight: 15000, totalPrice: 45000, checkInDate: "2026-03-10", checkOutDate: "2026-03-13", totalNights: 3, guestCount: 2, sessionId: null, packageName: "Weekend Deluxe Escape", createdAt: "2026-03-09T09:00:00" },
];

const CHART_DATA = [
  { m: "Apr", sessions: 12, bookings: 8 }, { m: "May", sessions: 18, bookings: 13 },
  { m: "Jun", sessions: 24, bookings: 17 }, { m: "Jul", sessions: 31, bookings: 22 },
  { m: "Aug", sessions: 28, bookings: 20 }, { m: "Sep", sessions: 35, bookings: 26 },
  { m: "Oct", sessions: 42, bookings: 31 }, { m: "Nov", sessions: 38, bookings: 28 },
  { m: "Dec", sessions: 55, bookings: 42 }, { m: "Jan", sessions: 48, bookings: 36 },
  { m: "Feb", sessions: 62, bookings: 47 }, { m: "Mar", sessions: 71, bookings: 53 },
];

const ROOM_TYPES = ["SINGLE", "DOUBLE", "DELUXE", "SUITE", "FAMILY"];
const ADDONS = ["BREAKFAST","LUNCH","DINNER","FULL_BOARD","SPA","POOL_ACCESS","AIRPORT_TRANSFER","LATE_CHECKOUT","EARLY_CHECKIN"];
const USER_ROLES = ["ADMIN","STAFF","GUEST"];
const BOOKING_STATUSES = ["PENDING","CONFIRMED","CANCELLED","NO_SHOW"];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%;background:#060A17;font-family:'DM Sans',sans-serif;color:#E8E4DC}
  
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideLeft{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}
  @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes floatGlow{0%,100%{box-shadow:0 0 20px rgba(201,169,110,0.15)}50%{box-shadow:0 0 40px rgba(201,169,110,0.3)}}
  @keyframes spinSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes notif{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
  @keyframes barGrow{from{opacity:0;transform:scaleY(0)}to{opacity:1;transform:scaleY(1)}}
  
  .fu{animation:fadeUp 0.5s ease both}
  .fi{animation:fadeIn 0.4s ease both}
  .sl{animation:slideLeft 0.4s ease both}
  .si{animation:scaleIn 0.3s ease both}
  
  .d1{animation-delay:0.04s}.d2{animation-delay:0.08s}.d3{animation-delay:0.12s}
  .d4{animation-delay:0.16s}.d5{animation-delay:0.20s}.d6{animation-delay:0.24s}
  .d7{animation-delay:0.28s}.d8{animation-delay:0.32s}
  
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(201,169,110,0.2);border-radius:3px}
  ::-webkit-scrollbar-thumb:hover{background:rgba(201,169,110,0.4)}
  
  .input{background:rgba(255,255,255,0.04);border:1px solid rgba(201,169,110,0.2);color:#E8E4DC;
    font-family:'DM Sans',sans-serif;border-radius:10px;outline:none;width:100%;font-size:14px;
    transition:border-color 0.2s,box-shadow 0.2s;padding:10px 14px}
  .input:focus{border-color:#C9A96E;box-shadow:0 0 0 3px rgba(201,169,110,0.12)}
  .input::placeholder{color:rgba(232,228,220,0.3)}
  .input option{background:#111827;color:#E8E4DC}
  
  .btn-gold{background:linear-gradient(135deg,#C9A96E,#A88A49);color:#070A18;font-family:'DM Sans',sans-serif;
    font-weight:600;border:none;cursor:pointer;border-radius:10px;transition:opacity 0.2s,transform 0.15s,box-shadow 0.2s;
    font-size:13px}
  .btn-gold:hover{opacity:0.9;transform:translateY(-1px);box-shadow:0 4px 20px rgba(201,169,110,0.3)}
  .btn-gold:active{transform:translateY(0)}
  
  .btn-ghost{background:rgba(201,169,110,0.08);border:1px solid rgba(201,169,110,0.2);color:#C9A96E;
    font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;border-radius:10px;
    transition:all 0.2s;font-size:13px}
  .btn-ghost:hover{background:rgba(201,169,110,0.15);border-color:rgba(201,169,110,0.4)}
  
  .btn-danger{background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.25);color:#f87171;
    font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;border-radius:10px;
    transition:all 0.2s;font-size:13px}
  .btn-danger:hover{background:rgba(248,113,113,0.15);border-color:rgba(248,113,113,0.45)}
  
  .btn-blue{background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.25);color:#60a5fa;
    font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;border-radius:10px;
    transition:all 0.2s;font-size:13px}
  .btn-blue:hover{background:rgba(96,165,250,0.18);border-color:#60a5fa}
  
  .nav-item{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:10px;
    cursor:pointer;transition:all 0.2s;color:rgba(232,228,220,0.48);font-size:13.5px;font-weight:500;
    border:1px solid transparent;user-select:none}
  .nav-item:hover{color:#C9A96E;background:rgba(201,169,110,0.07)}
  .nav-item.active{color:#C9A96E;background:rgba(201,169,110,0.12);border-color:rgba(201,169,110,0.18)}
  
  .card{background:rgba(255,255,255,0.03);border:1px solid rgba(201,169,110,0.13);border-radius:16px;
    transition:border-color 0.2s,box-shadow 0.2s,transform 0.2s}
  .card:hover{border-color:rgba(201,169,110,0.28);box-shadow:0 8px 30px rgba(0,0,0,0.35)}
  
  .stat-card{background:rgba(255,255,255,0.03);border:1px solid rgba(201,169,110,0.13);border-radius:14px;
    padding:18px 20px;transition:all 0.2s;cursor:default}
  .stat-card:hover{border-color:rgba(201,169,110,0.3);transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,0.4)}
  
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);
    z-index:999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease}
  .modal{animation:scaleIn 0.25s ease;border-radius:20px;overflow:hidden;
    background:#0D1325;border:1px solid rgba(201,169,110,0.2);max-height:90vh;overflow-y:auto;
    box-shadow:0 30px 80px rgba(0,0,0,0.7)}
  
  .tr-hover:hover{background:rgba(201,169,110,0.04)}
  
  .badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:500;letter-spacing:0.02em}
  .badge-active{color:#4ade80;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.22)}
  .badge-inactive{color:#94a3b8;background:rgba(148,163,184,0.08);border:1px solid rgba(148,163,184,0.18)}
  .badge-completed{color:#60a5fa;background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.22)}
  .badge-aborted{color:#f87171;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.22)}
  .badge-pending{color:#fbbf24;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.22)}
  .badge-confirmed{color:#4ade80;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.22)}
  .badge-cancelled{color:#f87171;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.22)}
  .badge-noshow{color:#fb923c;background:rgba(251,146,60,0.1);border:1px solid rgba(251,146,60,0.22)}
  .badge-admin{color:#a78bfa;background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.22)}
  .badge-staff{color:#C9A96E;background:rgba(201,169,110,0.1);border:1px solid rgba(201,169,110,0.22)}
  .badge-guest{color:#94a3b8;background:rgba(148,163,184,0.08);border:1px solid rgba(148,163,184,0.18)}
  
  .notif{position:fixed;top:20px;right:20px;z-index:9999;animation:notif 0.35s ease;
    padding:12px 18px;border-radius:12px;font-size:13.5px;font-weight:500;
    display:flex;align-items:center;gap:8px;backdrop-filter:blur(10px);min-width:220px}
  .notif-success{background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.3);color:#4ade80}
  .notif-error{background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.3);color:#f87171}
  .notif-info{background:rgba(201,169,110,0.12);border:1px solid rgba(201,169,110,0.3);color:#C9A96E}
  
  .tab-btn{padding:7px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;
    border:1px solid transparent;transition:all 0.2s;color:rgba(232,228,220,0.5);background:transparent}
  .tab-btn:hover{color:#C9A96E;background:rgba(201,169,110,0.08)}
  .tab-btn.active{color:#C9A96E;background:rgba(201,169,110,0.12);border-color:rgba(201,169,110,0.2)}
  
  .search{background:rgba(255,255,255,0.04);border:1px solid rgba(201,169,110,0.15);color:#E8E4DC;
    font-family:'DM Sans',sans-serif;border-radius:10px;outline:none;font-size:13.5px;
    transition:border-color 0.2s;padding:8px 12px 8px 36px}
  .search:focus{border-color:rgba(201,169,110,0.4)}
  .search::placeholder{color:rgba(232,228,220,0.28)}
  
  .pkg-img{width:100%;height:140px;object-fit:cover;border-radius:10px;border:1px solid rgba(201,169,110,0.12)}
  
  .cal-day{width:36px;height:36px;display:flex;align-items:center;justify-content:center;
    border-radius:8px;font-size:12.5px;cursor:default;transition:all 0.15s}
  .cal-day:hover{background:rgba(201,169,110,0.08)}
  .cal-day.has-booking{background:rgba(201,169,110,0.15);color:#C9A96E;font-weight:600;
    border:1px solid rgba(201,169,110,0.25)}
  .cal-day.today{background:rgba(201,169,110,0.25);color:#E8C87A;font-weight:700}
  
  .divider{border:none;border-top:1px solid rgba(201,169,110,0.1);margin:0}
  
  .login-card{background:rgba(13,19,37,0.95);border:1px solid rgba(201,169,110,0.2);
    border-radius:24px;padding:44px 40px;width:420px;box-shadow:0 40px 100px rgba(0,0,0,0.7);
    animation:scaleIn 0.4s ease;backdrop-filter:blur(20px)}
  
  .err-msg{color:#f87171;font-size:12px;margin-top:4px;display:flex;align-items:center;gap:4px}
`;

const fmt = (n) => new Intl.NumberFormat("en-LK").format(n);
const fmtDate = (s) => s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "â€”";
const fmtTime = (s) => s ? new Date(s).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "â€”";
const nextId = (arr) => Math.max(0, ...arr.map((x) => x.id)) + 1;

function useBadge(val) {
  const map = {
    ACTIVE: "badge-active", COMPLETED: "badge-completed", ABORTED: "badge-aborted",
    PENDING: "badge-pending", CONFIRMED: "badge-confirmed", CANCELLED: "badge-cancelled",
    NO_SHOW: "badge-noshow", ADMIN: "badge-admin", STAFF: "badge-staff", GUEST: "badge-guest",
    true: "badge-active", false: "badge-inactive",
  };
  return `badge ${map[val] ?? "badge-inactive"}`;
}

const Ico = ({ d, size = 16, stroke = "currentColor", fill = "none", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z",
  rooms: "M3 10.5V19a2 2 0 002 2h14a2 2 0 002-2v-8.5M3 10.5L12 3l9 7.5M9 22V12h6v10",
  packages: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  sessions: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  bookings: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  plus: "M12 5v14M5 12h14",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  x: "M6 18L18 6M6 6l12 12",
  check: "M5 13l4 4L19 7",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8M12 9a3 3 0 100 6 3 3 0 000-6z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  chevron: "M19 9l-7 7-7-7",
  ban: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  stop: "M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
  img: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
};

function ELLogo({ size = 36, textSize = 16 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" stroke={G.gold} strokeWidth="1.2" />
        <path d="M9 26 L18 10 L27 26" stroke={G.gold} strokeWidth="1.5" fill="none" />
        <path d="M12.5 20.5 L23.5 20.5" stroke={G.gold} strokeWidth="1.5" />
        <circle cx="18" cy="10" r="1.5" fill={G.gold} />
      </svg>
      <div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: textSize, fontWeight: 600, color: G.goldLight, letterSpacing: "0.05em", lineHeight: 1.1 }}>Emerald Lagoon</div>
        <div style={{ fontSize: 9.5, color: G.muted, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 1 }}>Admin Portal</div>
      </div>
    </div>
  );
}

function Notif({ items, remove }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((n) => (
        <div key={n.id} className={`notif notif-${n.type}`} onClick={() => remove(n.id)} style={{ cursor: "pointer" }}>
          <Ico d={n.type === "success" ? ICONS.check : n.type === "error" ? ICONS.x : ICONS.alert} size={14} />
          {n.msg}
        </div>
      ))}
    </div>
  );
}

function useNotif() {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setItems((p) => [...p, { id, msg, type }]);
    setTimeout(() => setItems((p) => p.filter((x) => x.id !== id)), 3200);
  }, []);
  const remove = useCallback((id) => setItems((p) => p.filter((x) => x.id !== id)), []);
  return { items, push, remove };
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: wide ? 700 : 480, padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 28px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: G.goldLight }}>{title}</div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "6px 8px", borderRadius: 8 }}>
            <Ico d={ICONS.x} size={15} />
          </button>
        </div>
        <div style={{ padding: "24px 28px" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, error, children, half }) {
  return (
    <div style={{ flex: half ? "1 1 45%" : "1 1 100%", minWidth: half ? 180 : "auto" }}>
      <label style={{ display: "block", fontSize: 12.5, color: G.muted, marginBottom: 6, fontWeight: 500 }}>{label}</label>
      {children}
      {error && <div className="err-msg"><Ico d={ICONS.alert} size={12} />{error}</div>}
    </div>
  );
}

function Confirm({ msg, onConfirm, onCancel }) {
  return (
    <div className="overlay">
      <div className="modal" style={{ width: 380, padding: 28, textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Ico d={ICONS.alert} size={22} stroke="#f87171" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Confirm Action</div>
        <div style={{ fontSize: 13.5, color: G.muted, marginBottom: 24 }}>{msg}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn-ghost" style={{ padding: "9px 24px" }} onClick={onCancel}>Cancel</button>
          <button className="btn-danger" style={{ padding: "9px 24px" }} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setLoading(true);
    setTimeout(() => {
      const enteredUsername = form.username.trim();
      const user = DEMO_CREDS.find((u) => u.username === enteredUsername && u.password === form.password);
      if (user) onLogin({ ...user, username: enteredUsername, firstName: enteredUsername });
      else { setErrors({ password: "Invalid username or password" }); setLoading(false); }
    }, 700);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: G.bg, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)", top: "10%", left: "15%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)", bottom: "15%", right: "10%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(201,169,110,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(201,169,110,0.08)", border: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "center", animation: "floatGlow 3s ease-in-out infinite" }}>
              <svg width="38" height="38" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="17" stroke={G.gold} strokeWidth="1.2" />
                <path d="M9 26 L18 10 L27 26" stroke={G.gold} strokeWidth="1.5" fill="none" />
                <path d="M12.5 20.5 L23.5 20.5" stroke={G.gold} strokeWidth="1.5" />
                <circle cx="18" cy="10" r="1.5" fill={G.gold} />
              </svg>
            </div>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: G.goldLight, letterSpacing: "0.03em" }}>Emerald Lagoon</div>
          <div style={{ fontSize: 12, color: G.muted, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 4 }}>Admin Portal</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12.5, color: G.muted, marginBottom: 6, fontWeight: 500 }}>Username</label>
            <input className="input" placeholder="Enter your username" value={form.username}
              onChange={(e) => { setForm((p) => ({ ...p, username: e.target.value })); setErrors((p) => ({ ...p, username: "" })); }}
              onKeyDown={(e) => e.key === "Enter" && submit()} />
            {errors.username && <div className="err-msg"><Ico d={ICONS.alert} size={12} />{errors.username}</div>}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12.5, color: G.muted, marginBottom: 6, fontWeight: 500 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input className="input" type={showPass ? "text" : "password"} placeholder="Enter your password"
                value={form.password} style={{ paddingRight: 40 }}
                onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setErrors((p) => ({ ...p, password: "" })); }}
                onKeyDown={(e) => e.key === "Enter" && submit()} />
              <button onClick={() => setShowPass((v) => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: G.muted, padding: 2 }}>
                <Ico d={ICONS.eye} size={15} />
              </button>
            </div>
            {errors.password && <div className="err-msg"><Ico d={ICONS.alert} size={12} />{errors.password}</div>}
          </div>
          <button className="btn-gold" onClick={submit} disabled={loading} style={{ padding: "12px", marginTop: 6, borderRadius: 12, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#000", borderRadius: "50%", animation: "spinSlow 0.7s linear infinite" }} /> Signing in...</> : "Sign In"}
          </button>
        </div>

        <div style={{ marginTop: 24, padding: "12px 16px", borderRadius: 10, background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.12)" }}>
          <div style={{ fontSize: 11.5, color: G.muted, marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>Demo Credentials</div>
          <div style={{ fontSize: 12.5, color: G.text, display: "flex", flexDirection: "column", gap: 4 }}>
            <span><span style={{ color: G.gold }}>Admin:</span> admin / admin123</span>
            <span><span style={{ color: G.gold }}>Staff:</span> staff / staff123</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ user, active, setActive, onLogout }) {
  const isAdmin = user.role === "ADMIN";
  const profileName = user?.username || user?.firstName || "User";
  const sections = [
    { key: "dashboard", label: "Dashboard", icon: ICONS.dashboard },
    ...(isAdmin ? [{ key: "users", label: "User Management", icon: ICONS.users }] : []),
    { key: "rooms", label: "Room Management", icon: ICONS.rooms },
    { key: "packages", label: "Packages", icon: ICONS.packages },
    { key: "sessions", label: "Chat Sessions", icon: ICONS.sessions },
    { key: "bookings", label: "Bookings", icon: ICONS.bookings },
  ];
  return (
    <div className="sl" style={{ width: 230, minHeight: "100vh", background: G.sidebar, borderRight: `1px solid ${G.border}`, display: "flex", flexDirection: "column", padding: "20px 12px", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
      <div style={{ padding: "8px 6px 24px" }}>
        <ELLogo size={30} textSize={14} />
      </div>
      <hr className="divider" style={{ marginBottom: 16 }} />
      <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
        {sections.map((s) => (
          <div key={s.key} className={`nav-item ${active === s.key ? "active" : ""}`} onClick={() => setActive(s.key)}>
            <Ico d={s.icon} size={15} />
            {s.label}
          </div>
        ))}
      </nav>
      <hr className="divider" style={{ margin: "12px 0" }} />
      <div style={{ padding: "10px 8px", display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(201,169,110,0.12)", border: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: G.gold }}>
          {profileName[0]?.toUpperCase() || "?"}
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profileName}</div>
          <div><span className={`badge badge-${user.role.toLowerCase()}`} style={{ fontSize: 10 }}>{user.role}</span></div>
        </div>
      </div>
      <div className="nav-item" onClick={onLogout} style={{ color: "rgba(248,113,113,0.7)" }}>
        <Ico d={ICONS.logout} size={14} stroke="rgba(248,113,113,0.7)" />Logout
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: G.goldLight, lineHeight: 1.1 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: G.muted, marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, icon, sub, color, delay = "" }) {
  const c = color || G.gold;
  return (
    <div className={`stat-card fu ${delay}`}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: G.muted, fontWeight: 500, letterSpacing: "0.03em" }}>{label}</div>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${c}18`, border: `1px solid ${c}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ico d={icon} size={14} stroke={c} />
        </div>
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: G.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: G.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function BookingCalendar({ bookings }) {
  const now = new Date(2026, 2);
  const year = now.getFullYear(), month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const bookingDays = new Set(bookings.flatMap((b) => {
    const dates = [];
    if (!b.checkInDate) return dates;
    let d = new Date(b.checkInDate);
    const end = new Date(b.checkOutDate);
    while (d <= end) {
      if (d.getMonth() === month && d.getFullYear() === year) dates.push(d.getDate());
      d.setDate(d.getDate() + 1);
    }
    return dates;
  }));
  const weeks = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 500, color: G.goldLight }}>March 2026</div>
        <div style={{ fontSize: 11.5, color: G.muted }}>Booking calendar</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
        {weeks.map((w) => <div key={w} style={{ textAlign: "center", fontSize: 11, color: G.muted, padding: "4px 0", fontWeight: 600 }}>{w}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const d = i + 1;
          const isToday = d === 19;
          const hasB = bookingDays.has(d);
          return (
            <div key={d} className={`cal-day ${isToday ? "today" : hasB ? "has-booking" : ""}`} style={{ fontSize: 12 }}>{d}</div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 11.5, color: G.muted }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(201,169,110,0.35)", border: "1px solid rgba(201,169,110,0.4)", display: "inline-block" }} />Booked</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(201,169,110,0.6)", display: "inline-block" }} />Today</span>
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0D1325", border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: G.muted, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ user, sessions, bookings, rooms, packages }) {
  const totalSessions = sessions.length;
  const active = sessions.filter((s) => s.status === "ACTIVE").length;
  const completed = sessions.filter((s) => s.status === "COMPLETED").length;
  const aborted = sessions.filter((s) => s.status === "ABORTED").length;
  const totalBookings = bookings.length;
  const availableRooms = rooms.filter((r) => r.isActive).length;
  const activePkgs = packages.filter((p) => p.isActive).length;
  const revenue = bookings.filter((b) => b.status === "CONFIRMED").reduce((a, b) => a + b.totalPrice, 0);
  const convRate = totalSessions ? Math.round((completed / totalSessions) * 100) : 0;
  const guestSessions = totalSessions;
  const avgResp = "3";

  const stats = [
    { label: "Guest Sessions", value: guestSessions, icon: ICONS.users, sub: "Total initiated sessions", delay: "d1" },
    { label: "Conversion Rate", value: `${convRate}%`, icon: ICONS.check, sub: `${completed} of ${totalSessions} completed`, color: "#4ade80", delay: "d2" },
    { label: "Active Sessions", value: active, icon: ICONS.sessions, sub: "Currently negotiating", color: "#60a5fa", delay: "d3" },
    { label: "Completed Sessions", value: completed, icon: ICONS.check, sub: "Successfully closed", color: "#4ade80", delay: "d4" },
    { label: "Aborted Sessions", value: aborted, icon: ICONS.ban, sub: "Dropped sessions", color: "#f87171", delay: "d5" },
    { label: "Total Bookings", value: totalBookings, icon: ICONS.bookings, delay: "d6" },
    { label: "Available Rooms", value: availableRooms, icon: ICONS.rooms, sub: `of ${rooms.length} total rooms`, delay: "d7" },
    { label: "Active Packages", value: activePkgs, icon: ICONS.packages, sub: `of ${packages.length} total`, delay: "d8" },
  ];

  return (
    <div>
      <PageHeader
        title="Welcome to Emerald Lagoon"
        subtitle="Here's what's happening at Emerald Lagoon."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="fu d1" style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(168,138,73,0.06) 100%)", border: `1px solid rgba(201,169,110,0.25)`, borderRadius: 16, padding: "22px 24px" }}>
          <div style={{ fontSize: 12, color: G.muted, fontWeight: 500, marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>Revenue from Completed Deals</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 600, color: G.goldLight }}>LKR {fmt(revenue)}</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 6 }}>From {bookings.filter((b) => b.status === "CONFIRMED").length} confirmed bookings</div>
        </div>
        <div className="fu d2" style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.18)", borderRadius: 16, padding: "22px 24px" }}>
          <div style={{ fontSize: 12, color: G.muted, fontWeight: 500, marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>Avg. Response Time</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 600, color: "#60a5fa" }}>{avgResp}</div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 6 }}>Per negotiation round</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <div className="card fu d3" style={{ padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 500, color: G.goldLight, marginBottom: 6 }}>Customer Growth</div>
          <div style={{ fontSize: 12, color: G.muted, marginBottom: 20 }}>Sessions vs Bookings â€” last 12 months</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={G.gold} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={G.gold} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="m" tick={{ fill: G.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: G.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Legend formatter={(v) => <span style={{ fontSize: 12, color: G.muted }}>{v}</span>} />
              <Area type="monotone" dataKey="sessions" name="Sessions" stroke={G.gold} strokeWidth={2} fill="url(#gs)" dot={false} />
              <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#60a5fa" strokeWidth={2} fill="url(#gb)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card fu d4" style={{ padding: "22px 20px" }}>
          <BookingCalendar bookings={bookings} />
        </div>
      </div>

      <div className="card fu d5" style={{ marginTop: 16, padding: "20px 24px" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 500, color: G.goldLight, marginBottom: 16 }}>Recent Active Sessions</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${G.border}` }}>
              {["Session ID", "Guest", "Round", "Offered Price", "Started", "Status"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "0 12px 10px", color: G.muted, fontWeight: 500, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.filter((s) => s.status === "ACTIVE").slice(0, 4).map((s) => (
              <tr key={s.id} className="tr-hover" style={{ borderBottom: `1px solid rgba(201,169,110,0.06)` }}>
                <td style={{ padding: "10px 12px", color: G.gold, fontFamily: "monospace", fontSize: 12 }}>{s.sessionId}</td>
                <td style={{ padding: "10px 12px" }}>{s.guestName}</td>
                <td style={{ padding: "10px 12px", color: G.muted }}>Round {s.currentRound}</td>
                <td style={{ padding: "10px 12px", color: "#4ade80", fontWeight: 500 }}>LKR {fmt(s.offeredPrice)}</td>
                <td style={{ padding: "10px 12px", color: G.muted }}>{fmtTime(s.startedAt)}</td>
                <td style={{ padding: "10px 12px" }}><span className="badge badge-active">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserManagement({ users, setUsers, notify }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({});
  const [errs, setErrs] = useState({});

  const filtered = users.filter((u) => {
    if (!u.isActive) return false;
    const q = search.toLowerCase();
    const matchSearch = u.firstName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = filter === "ALL" || u.role === filter;
    return matchSearch && matchRole;
  });

  const openAdd = () => { setForm({ isActive: true }); setErrs({}); setModal({ mode: "add" }); };
  const openEdit = (u) => { setForm({ ...u }); setErrs({}); setModal({ mode: "edit", data: u }); };

  const validate = () => {
    const e = {};
    if (!form.firstName?.trim()) e.firstName = "Required";
    if (!form.username?.trim()) e.username = "Required";
    else if (!/^[a-z0-9._]+$/.test(form.username)) e.username = "Lowercase letters, digits, . _ only";
    if (!form.email?.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (modal?.mode === "add" && !form.password?.trim()) e.password = "Required";
    else if (modal?.mode === "add" && form.password?.length < 6) e.password = "Min 6 characters";
    if (!form.role) e.role = "Required";
    return e;
  };

  const save = () => {
    const e = validate();
    if (Object.keys(e).length) return setErrs(e);
    if (modal.mode === "add") {
      if (users.find((u) => u.username === form.username)) return setErrs((p) => ({ ...p, username: "Username taken" }));
      setUsers((p) => [...p, { ...form, id: nextId(p), isActive: form.isActive ?? true }]);
      notify("User added successfully");
    } else {
      if (users.find((u) => u.username === form.username && u.id !== form.id)) return setErrs((p) => ({ ...p, username: "Username taken" }));
      setUsers((p) => p.map((u) => u.id === form.id ? { ...u, ...form } : u));
      notify("User updated");
    }
    setModal(null);
  };

  const remove = (id) => {
    setUsers((p) => p.map((u) => u.id === id ? { ...u, isActive: false } : u));
    notify("User deactivated", "info");
    setConfirm(null);
  };

  const sf = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrs((p) => ({ ...p, [k]: "" })); };

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage system users. Admin-only section."
        action={<button className="btn-gold" style={{ padding: "9px 18px", display: "flex", alignItems: "center", gap: 7 }} onClick={openAdd}><Ico d={ICONS.plus} size={14} />Add User</button>} />

      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: G.muted }}><Ico d={ICONS.search} size={14} /></div>
          <input className="search" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%" }} />
        </div>
        {["ALL", "ADMIN", "STAFF", "GUEST"].map((r) => (
          <button key={r} className={`tab-btn ${filter === r ? "active" : ""}`} onClick={() => setFilter(r)}>{r}</button>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${G.border}`, background: "rgba(255,255,255,0.02)" }}>
              {["Name", "Username", "Email", "Phone", "Role", "Status", "Actions"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: G.muted, fontWeight: 500, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} className={`tr-hover fu d${Math.min(i + 1, 8)}`} style={{ borderBottom: `1px solid rgba(201,169,110,0.06)` }}>
                <td style={{ padding: "12px 16px", fontWeight: 500 }}>{u.firstName} {u.lastName}</td>
                <td style={{ padding: "12px 16px", color: G.gold, fontFamily: "monospace", fontSize: 12.5 }}>@{u.username}</td>
                <td style={{ padding: "12px 16px", color: G.muted }}>{u.email}</td>
                <td style={{ padding: "12px 16px", color: G.muted }}>{u.phoneNumber || "â€”"}</td>
                <td style={{ padding: "12px 16px" }}><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                <td style={{ padding: "12px 16px" }}><span className={`badge ${u.isActive ? "badge-active" : "badge-inactive"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-ghost" style={{ padding: "5px 10px" }} onClick={() => openEdit(u)}><Ico d={ICONS.edit} size={13} /></button>
                    <button className="btn-danger" style={{ padding: "5px 10px" }} onClick={() => setConfirm(u.id)} disabled={!u.isActive}><Ico d={ICONS.trash} size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: G.muted }}>No users found</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.mode === "add" ? "Add New User" : "Edit User"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <Field label="First Name *" half error={errs.firstName}><input className="input" value={form.firstName || ""} onChange={(e) => sf("firstName", e.target.value)} /></Field>
            <Field label="Last Name" half><input className="input" value={form.lastName || ""} onChange={(e) => sf("lastName", e.target.value)} /></Field>
            <Field label="Username *" half error={errs.username}><input className="input" value={form.username || ""} onChange={(e) => sf("username", e.target.value.toLowerCase())} /></Field>
            <Field label="Email *" half error={errs.email}><input className="input" type="email" value={form.email || ""} onChange={(e) => sf("email", e.target.value)} /></Field>
            <Field label="Phone Number" half><input className="input" value={form.phoneNumber || ""} onChange={(e) => sf("phoneNumber", e.target.value)} /></Field>
            <Field label={modal.mode === "add" ? "Password *" : "New Password (leave blank to keep)"} half error={errs.password}><input className="input" type="password" value={form.password || ""} onChange={(e) => sf("password", e.target.value)} /></Field>
            <Field label="Role *" half error={errs.role}>
              <select className="input" value={form.role || ""} onChange={(e) => sf("role", e.target.value)}>
                <option value="">Select role</option>
                {["ADMIN", "STAFF", "GUEST"].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Status" half>
              <select className="input" value={form.isActive ? "true" : "false"} onChange={(e) => sf("isActive", e.target.value === "true")}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
            <button className="btn-ghost" style={{ padding: "9px 20px" }} onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-gold" style={{ padding: "9px 24px" }} onClick={save}>{modal.mode === "add" ? "Add User" : "Save Changes"}</button>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg="Deactivate this user? They will no longer be able to log in." onConfirm={() => remove(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

function RoomManagement({ rooms, setRooms, notify }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({});
  const [errs, setErrs] = useState({});

  const filtered = rooms.filter((r) => {
    const q = search.toLowerCase();
    const ms = r.roomNumber.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    const mf = filter === "ALL" || (filter === "ACTIVE" ? r.isActive : !r.isActive) || r.roomType === filter;
    return ms && mf;
  });

  const validate = () => {
    const e = {};
    if (!form.roomNumber?.trim()) e.roomNumber = "Required";
    if (!form.floor || form.floor < 1) e.floor = "Must be â‰¥ 1";
    if (!form.roomType) e.roomType = "Required";
    if (!form.maxOccupancy || form.maxOccupancy < 1) e.maxOccupancy = "Must be â‰¥ 1";
    return e;
  };

  const save = () => {
    const e = validate();
    if (Object.keys(e).length) return setErrs(e);
    if (modal.mode === "add") {
      setRooms((p) => [...p, { ...form, id: nextId(p), isActive: true, floor: +form.floor, maxOccupancy: +form.maxOccupancy }]);
      notify("Room added");
    } else {
      setRooms((p) => p.map((r) => r.id === form.id ? { ...r, ...form, floor: +form.floor, maxOccupancy: +form.maxOccupancy } : r));
      notify("Room updated");
    }
    setModal(null);
  };
  const remove = (id) => {
    setRooms((p) => p.map((r) => r.id === id ? { ...r, isActive: false } : r));
    notify("Room deactivated", "info"); setConfirm(null);
  };
  const sf = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrs((p) => ({ ...p, [k]: "" })); };

  return (
    <div>
      <PageHeader title="Room Management" subtitle="Manage hotel rooms and their configurations."
        action={<button className="btn-gold" style={{ padding: "9px 18px", display: "flex", alignItems: "center", gap: 7 }} onClick={() => { setForm({ isActive: true }); setErrs({}); setModal({ mode: "add" }); }}><Ico d={ICONS.plus} size={14} />Add Room</button>} />

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: G.muted }}><Ico d={ICONS.search} size={14} /></div>
          <input className="search" placeholder="Search rooms..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%" }} />
        </div>
        {["ALL", "ACTIVE", ...ROOM_TYPES].map((f) => (
          <button key={f} className={`tab-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${G.border}`, background: "rgba(255,255,255,0.02)" }}>
              {["Room No.", "Floor", "Type", "Description", "Max Occ.", "Status", "Actions"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: G.muted, fontWeight: 500, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} className={`tr-hover fu d${Math.min(i + 1, 8)}`} style={{ borderBottom: `1px solid rgba(201,169,110,0.06)` }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: G.gold }}>{r.roomNumber}</td>
                <td style={{ padding: "12px 16px", color: G.muted }}>Floor {r.floor}</td>
                <td style={{ padding: "12px 16px" }}><span className="badge badge-staff">{r.roomType}</span></td>
                <td style={{ padding: "12px 16px", color: G.muted, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</td>
                <td style={{ padding: "12px 16px" }}>{r.maxOccupancy}</td>
                <td style={{ padding: "12px 16px" }}><span className={`badge ${r.isActive ? "badge-active" : "badge-inactive"}`}>{r.isActive ? "Active" : "Inactive"}</span></td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-ghost" style={{ padding: "5px 10px" }} onClick={() => { setForm({ ...r }); setErrs({}); setModal({ mode: "edit" }); }}><Ico d={ICONS.edit} size={13} /></button>
                    <button className="btn-danger" style={{ padding: "5px 10px" }} onClick={() => setConfirm(r.id)}><Ico d={ICONS.trash} size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: G.muted }}>No rooms found</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.mode === "add" ? "Add New Room" : "Edit Room"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <Field label="Room Number *" half error={errs.roomNumber}><input className="input" value={form.roomNumber || ""} onChange={(e) => sf("roomNumber", e.target.value)} /></Field>
            <Field label="Floor *" half error={errs.floor}><input className="input" type="number" min="1" value={form.floor || ""} onChange={(e) => sf("floor", e.target.value)} /></Field>
            <Field label="Room Type *" half error={errs.roomType}>
              <select className="input" value={form.roomType || ""} onChange={(e) => sf("roomType", e.target.value)}>
                <option value="">Select type</option>
                {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Max Occupancy *" half error={errs.maxOccupancy}><input className="input" type="number" min="1" value={form.maxOccupancy || ""} onChange={(e) => sf("maxOccupancy", e.target.value)} /></Field>
            <Field label="Description">
              <textarea className="input" rows={2} value={form.description || ""} onChange={(e) => sf("description", e.target.value)} style={{ resize: "vertical" }} />
            </Field>
            {modal.mode === "edit" && (
              <Field label="Status" half>
                <select className="input" value={form.isActive ? "true" : "false"} onChange={(e) => sf("isActive", e.target.value === "true")}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </Field>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
            <button className="btn-ghost" style={{ padding: "9px 20px" }} onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-gold" style={{ padding: "9px 24px" }} onClick={save}>{modal.mode === "add" ? "Add Room" : "Save Changes"}</button>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg="Deactivate this room? It will be hidden from booking options." onConfirm={() => remove(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

function PackageManagement({ packages, setPackages, rooms, notify }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({});
  const [errs, setErrs] = useState({});
  const [viewPkg, setViewPkg] = useState(null);

  const filtered = packages.filter((p) => {
    const q = search.toLowerCase();
    const ms = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const mf = filter === "ALL" || (filter === "ACTIVE" ? p.isActive : !p.isActive) || p.roomType === filter;
    return ms && mf;
  });

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Required";
    if (!form.roomId) e.roomId = "Select a room";
    if (!form.lowerBoundPrice || +form.lowerBoundPrice < 1) e.lowerBoundPrice = "Required";
    if (!form.upperBoundPrice || +form.upperBoundPrice < 1) e.upperBoundPrice = "Required";
    if (+form.upperBoundPrice < +form.lowerBoundPrice) e.upperBoundPrice = "Must be â‰¥ lower bound";
    if (!form.maxOccupancy || +form.maxOccupancy < 1) e.maxOccupancy = "Required";
    return e;
  };

  const save = () => {
    const e = validate();
    if (Object.keys(e).length) return setErrs(e);
    const room = rooms.find((r) => r.id === +form.roomId);
    const addOns = Array.isArray(form.addOns) ? form.addOns : [];
    const base = { ...form, roomId: +form.roomId, roomNumber: room?.roomNumber, roomType: room?.roomType, lowerBoundPrice: +form.lowerBoundPrice, upperBoundPrice: +form.upperBoundPrice, maxOccupancy: +form.maxOccupancy, addOns, isActive: form.isActive ?? true };
    if (modal.mode === "add") { setPackages((p) => [...p, { ...base, id: nextId(p) }]); notify("Package added"); }
    else { setPackages((p) => p.map((pk) => pk.id === form.id ? { ...pk, ...base } : pk)); notify("Package updated"); }
    setModal(null);
  };
  const remove = (id) => { setPackages((p) => p.map((pk) => pk.id === id ? { ...pk, isActive: false } : pk)); notify("Package deactivated", "info"); setConfirm(null); };
  const sf = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrs((p) => ({ ...p, [k]: "" })); };
  const toggleAddon = (a) => sf("addOns", (form.addOns || []).includes(a) ? (form.addOns || []).filter((x) => x !== a) : [...(form.addOns || []), a]);

  return (
    <div>
      <PageHeader title="Package Management" subtitle="Create and manage hotel packages with rooms and add-ons."
        action={<button className="btn-gold" style={{ padding: "9px 18px", display: "flex", alignItems: "center", gap: 7 }} onClick={() => { setForm({ addOns: [], isActive: true }); setErrs({}); setModal({ mode: "add" }); }}><Ico d={ICONS.plus} size={14} />Add Package</button>} />

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: G.muted }}><Ico d={ICONS.search} size={14} /></div>
          <input className="search" placeholder="Search packages..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%" }} />
        </div>
        {["ALL", "ACTIVE", ...ROOM_TYPES].map((f) => (
          <button key={f} className={`tab-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {filtered.map((p, i) => (
          <div key={p.id} className={`card fu d${Math.min(i + 1, 8)}`} style={{ overflow: "hidden" }}>
            <div style={{ position: "relative" }}>
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="pkg-img" style={{ borderRadius: "14px 14px 0 0", height: 160 }} onError={(e) => { e.target.style.display = "none"; }} />
              ) : (
                <div style={{ height: 160, background: "rgba(255,255,255,0.03)", borderRadius: "14px 14px 0 0", display: "flex", alignItems: "center", justifyContent: "center", color: G.muted }}>
                  <Ico d={ICONS.img} size={32} />
                </div>
              )}
              <div style={{ position: "absolute", top: 10, right: 10 }}>
                <span className={`badge ${p.isActive ? "badge-active" : "badge-inactive"}`}>{p.isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>
            <div style={{ padding: "16px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 600, color: G.goldLight, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 12.5, color: G.muted, marginBottom: 10, lineHeight: 1.4 }}>{p.description}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                <span className="badge badge-staff">{p.roomType}</span>
                <span style={{ fontSize: 11.5, color: G.muted }}>Room {p.roomNumber}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: G.text, fontWeight: 600 }}>LKR {fmt(p.lowerBoundPrice)} â€“ {fmt(p.upperBoundPrice)}</div>
                <div style={{ fontSize: 12, color: G.muted }}>Max {p.maxOccupancy} guests</div>
              </div>
              {p.addOns.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                  {p.addOns.slice(0, 4).map((a) => <span key={a} style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 20, background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.15)", color: G.muted }}>{a.replace("_", " ")}</span>)}
                  {p.addOns.length > 4 && <span style={{ fontSize: 10.5, color: G.muted }}>+{p.addOns.length - 4}</span>}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost" style={{ padding: "6px 14px", flex: 1, fontSize: 12.5 }} onClick={() => setViewPkg(p)}>View</button>
                <button className="btn-ghost" style={{ padding: "6px 10px" }} onClick={() => { setForm({ ...p }); setErrs({}); setModal({ mode: "edit" }); }}><Ico d={ICONS.edit} size={13} /></button>
                <button className="btn-danger" style={{ padding: "6px 10px" }} onClick={() => setConfirm(p.id)}><Ico d={ICONS.trash} size={13} /></button>
              </div>
            </div>
          </div>
        ))}
        {!filtered.length && <div style={{ gridColumn: "1/-1", padding: 48, textAlign: "center", color: G.muted }}>No packages found</div>}
      </div>

      {viewPkg && (
        <Modal title={viewPkg.name} onClose={() => setViewPkg(null)} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              {viewPkg.imageUrl && <img src={viewPkg.imageUrl} alt={viewPkg.name} style={{ width: "100%", borderRadius: 12, marginBottom: 14 }} />}
              <div style={{ fontSize: 13.5, color: G.muted, lineHeight: 1.6 }}>{viewPkg.description}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["Room", `${viewPkg.roomType} â€” #${viewPkg.roomNumber}`],
                ["Price Range", `LKR ${fmt(viewPkg.lowerBoundPrice)} â€“ ${fmt(viewPkg.upperBoundPrice)}`],
                ["Max Occupancy", `${viewPkg.maxOccupancy} guests`],
                ["Status", viewPkg.isActive ? "Active" : "Inactive"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${G.border}` }}>
                  <span style={{ fontSize: 12.5, color: G.muted }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              <div>
                <div style={{ fontSize: 12.5, color: G.muted, marginBottom: 8 }}>Add-ons Included</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {viewPkg.addOns.map((a) => <span key={a} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.2)", color: G.gold }}>{a.replace("_", " ")}</span>)}
                  {!viewPkg.addOns.length && <span style={{ color: G.muted, fontSize: 13 }}>No add-ons</span>}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title={modal.mode === "add" ? "Add New Package" : "Edit Package"} onClose={() => setModal(null)} wide>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <Field label="Package Name *" error={errs.name}><input className="input" value={form.name || ""} onChange={(e) => sf("name", e.target.value)} /></Field>
            <Field label="Description">
              <textarea className="input" rows={2} value={form.description || ""} onChange={(e) => sf("description", e.target.value)} style={{ resize: "vertical" }} />
            </Field>
            <Field label="Room *" half error={errs.roomId}>
              <select className="input" value={form.roomId || ""} onChange={(e) => sf("roomId", e.target.value)}>
                <option value="">Select room</option>
                {rooms.filter((r) => r.isActive).map((r) => <option key={r.id} value={r.id}>#{r.roomNumber} â€” {r.roomType}</option>)}
              </select>
            </Field>
            <Field label="Max Occupancy *" half error={errs.maxOccupancy}><input className="input" type="number" min="1" value={form.maxOccupancy || ""} onChange={(e) => sf("maxOccupancy", e.target.value)} /></Field>
            <Field label="Lower Bound Price (LKR) *" half error={errs.lowerBoundPrice}><input className="input" type="number" min="0" value={form.lowerBoundPrice || ""} onChange={(e) => sf("lowerBoundPrice", e.target.value)} /></Field>
            <Field label="Upper Bound Price (LKR) *" half error={errs.upperBoundPrice}><input className="input" type="number" min="0" value={form.upperBoundPrice || ""} onChange={(e) => sf("upperBoundPrice", e.target.value)} /></Field>
            <Field label="Image URL">
              <input className="input" placeholder="https://..." value={form.imageUrl || ""} onChange={(e) => sf("imageUrl", e.target.value)} />
              {form.imageUrl && <img src={form.imageUrl} alt="" style={{ marginTop: 8, height: 80, borderRadius: 8, objectFit: "cover", width: "100%", border: `1px solid ${G.border}` }} onError={(e) => e.target.style.display = "none"} />}
            </Field>
            <Field label="Add-ons">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
                {ADDONS.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAddon(a)}
                    style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", transition: "all 0.15s",
                      background: (form.addOns || []).includes(a) ? "rgba(201,169,110,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${(form.addOns || []).includes(a) ? G.gold : "rgba(255,255,255,0.1)"}`,
                      color: (form.addOns || []).includes(a) ? G.gold : G.muted }}>
                    {a.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </Field>
            {modal.mode === "edit" && (
              <Field label="Status" half>
                <select className="input" value={form.isActive ? "true" : "false"} onChange={(e) => sf("isActive", e.target.value === "true")}>
                  <option value="true">Active</option><option value="false">Inactive</option>
                </select>
              </Field>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
            <button className="btn-ghost" style={{ padding: "9px 20px" }} onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-gold" style={{ padding: "9px 24px" }} onClick={save}>{modal.mode === "add" ? "Add Package" : "Save Changes"}</button>
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg="Deactivate this package? It will no longer appear for guests." onConfirm={() => remove(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

function SessionManagement({ sessions, setSessions, notify }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [confirm, setConfirm] = useState(null);
  const [detailSession, setDetailSession] = useState(null);

  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase();
    const ms = s.guestName.toLowerCase().includes(q) || s.sessionId.toLowerCase().includes(q);
    const mf = filter === "ALL" || s.status === filter;
    return ms && mf;
  });

  const abort = (id) => { setSessions((p) => p.map((s) => s.id === id ? { ...s, status: "ABORTED" } : s)); notify("Session aborted", "info"); setConfirm(null); };
  const complete = (id) => { setSessions((p) => p.map((s) => s.id === id ? { ...s, status: "COMPLETED" } : s)); notify("Session marked completed"); };
  const remove = (id) => { setSessions((p) => p.filter((s) => s.id !== id)); notify("Session deleted", "info"); setConfirm(null); };

  const counts = { ACTIVE: sessions.filter((s) => s.status === "ACTIVE").length, COMPLETED: sessions.filter((s) => s.status === "COMPLETED").length, ABORTED: sessions.filter((s) => s.status === "ABORTED").length };

  return (
    <div>
      <PageHeader title="Chat Sessions" subtitle="Monitor and manage negotiation sessions with guests." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <div className="stat-card fu d1"><div style={{ fontSize: 11, color: "#60a5fa", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Active</div><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600 }}>{counts.ACTIVE}</div></div>
        <div className="stat-card fu d2"><div style={{ fontSize: 11, color: "#4ade80", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Completed</div><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600 }}>{counts.COMPLETED}</div></div>
        <div className="stat-card fu d3"><div style={{ fontSize: 11, color: "#f87171", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Aborted</div><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600 }}>{counts.ABORTED}</div></div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: G.muted }}><Ico d={ICONS.search} size={14} /></div>
          <input className="search" placeholder="Search sessions..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%" }} />
        </div>
        {["ALL", "ACTIVE", "COMPLETED", "ABORTED"].map((f) => (
          <button key={f} className={`tab-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${G.border}`, background: "rgba(255,255,255,0.02)" }}>
              {["Session ID", "Guest", "Round", "Offered Price", "Started", "Updated", "Status", "Actions"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "12px 14px", color: G.muted, fontWeight: 500, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} className={`tr-hover fu d${Math.min(i + 1, 8)}`} style={{ borderBottom: `1px solid rgba(201,169,110,0.06)` }}>
                <td style={{ padding: "12px 14px", color: G.gold, fontFamily: "monospace", fontSize: 12 }}>{s.sessionId}</td>
                <td style={{ padding: "12px 14px", fontWeight: 500 }}>{s.guestName}</td>
                <td style={{ padding: "12px 14px", color: G.muted }}>#{s.currentRound}</td>
                <td style={{ padding: "12px 14px", color: "#4ade80", fontWeight: 500 }}>{s.offeredPrice ? `LKR ${fmt(s.offeredPrice)}` : "â€”"}</td>
                <td style={{ padding: "12px 14px", color: G.muted, fontSize: 12 }}>{fmtDate(s.startedAt)}<br />{fmtTime(s.startedAt)}</td>
                <td style={{ padding: "12px 14px", color: G.muted, fontSize: 12 }}>{fmtTime(s.updatedAt)}</td>
                <td style={{ padding: "12px 14px" }}>
                  <span className={`badge badge-${s.status.toLowerCase()}`}>{s.status}</span>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {s.status === "ACTIVE" && (<>
                      <button className="btn-blue" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => complete(s.id)}>Complete</button>
                      <button className="btn-danger" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setConfirm({ type: "abort", id: s.id })}>Abort</button>
                    </>)}
                    <button className="btn-danger" style={{ padding: "4px 8px" }} onClick={() => setConfirm({ type: "delete", id: s.id })}><Ico d={ICONS.trash} size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={8} style={{ padding: "32px", textAlign: "center", color: G.muted }}>No sessions found</td></tr>}
          </tbody>
        </table>
      </div>

      {confirm?.type === "abort" && <Confirm msg="Abort this active session? The guest will be notified." onConfirm={() => abort(confirm.id)} onCancel={() => setConfirm(null)} />}
      {confirm?.type === "delete" && <Confirm msg="Permanently delete this session and all its chat history?" onConfirm={() => remove(confirm.id)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

function BookingManagement({ bookings, setBookings, notify }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [confirm, setConfirm] = useState(null);
  const [detail, setDetail] = useState(null);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const ms = b.reference.toLowerCase().includes(q) || (b.packageName || "").toLowerCase().includes(q) || b.roomNumber.toLowerCase().includes(q);
    const mf = filter === "ALL" || b.status === filter;
    return ms && mf;
  });

  const updateStatus = (id, status) => { setBookings((p) => p.map((b) => b.id === id ? { ...b, status } : b)); notify(`Booking ${status.toLowerCase()}`); setDetail(null); };
  const remove = (id) => { setBookings((p) => p.filter((b) => b.id !== id)); notify("Booking deleted", "info"); setConfirm(null); };

  return (
    <div>
      <PageHeader title="Booking Management" subtitle="View and manage all hotel reservations." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {["PENDING", "CONFIRMED", "CANCELLED", "NO_SHOW"].map((s, i) => {
          const cnt = bookings.filter((b) => b.status === s).length;
          const colors = { PENDING: "#fbbf24", CONFIRMED: "#4ade80", CANCELLED: "#f87171", NO_SHOW: "#fb923c" };
          return (
            <div key={s} className={`stat-card fu d${i + 1}`} onClick={() => setFilter(s)} style={{ cursor: "pointer", borderColor: filter === s ? colors[s] + "44" : undefined }}>
              <div style={{ fontSize: 11, color: colors[s], marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.replace("_", " ")}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600 }}>{cnt}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: G.muted }}><Ico d={ICONS.search} size={14} /></div>
          <input className="search" placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%" }} />
        </div>
        <button className={`tab-btn ${filter === "ALL" ? "active" : ""}`} onClick={() => setFilter("ALL")}>ALL</button>
      </div>

      <div className="card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${G.border}`, background: "rgba(255,255,255,0.02)" }}>
              {["Reference", "Room", "Package", "Check-in", "Check-out", "Nights", "Total Price", "Status", "Actions"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "12px 14px", color: G.muted, fontWeight: 500, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, i) => (
              <tr key={b.id} className={`tr-hover fu d${Math.min(i + 1, 8)}`} style={{ borderBottom: `1px solid rgba(201,169,110,0.06)` }}>
                <td style={{ padding: "12px 14px", color: G.gold, fontFamily: "monospace", fontSize: 12, whiteSpace: "nowrap" }}>{b.reference}</td>
                <td style={{ padding: "12px 14px", fontWeight: 500 }}>#{b.roomNumber}</td>
                <td style={{ padding: "12px 14px", color: G.muted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.packageName || "â€”"}</td>
                <td style={{ padding: "12px 14px", color: G.muted, whiteSpace: "nowrap" }}>{fmtDate(b.checkInDate)}</td>
                <td style={{ padding: "12px 14px", color: G.muted, whiteSpace: "nowrap" }}>{fmtDate(b.checkOutDate)}</td>
                <td style={{ padding: "12px 14px" }}>{b.totalNights}n</td>
                <td style={{ padding: "12px 14px", fontWeight: 600, color: "#4ade80", whiteSpace: "nowrap" }}>LKR {fmt(b.totalPrice)}</td>
                <td style={{ padding: "12px 14px" }}><span className={`badge badge-${b.status === "NO_SHOW" ? "noshow" : b.status.toLowerCase()}`}>{b.status.replace("_", " ")}</span></td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setDetail(b)}>Details</button>
                    <button className="btn-danger" style={{ padding: "4px 8px" }} onClick={() => setConfirm(b.id)}><Ico d={ICONS.trash} size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={9} style={{ padding: "32px", textAlign: "center", color: G.muted }}>No bookings found</td></tr>}
          </tbody>
        </table>
      </div>

      {detail && (
        <Modal title={`Booking â€” ${detail.reference}`} onClose={() => setDetail(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Reference", detail.reference],
              ["Room", `#${detail.roomNumber}`],
              ["Package", detail.packageName || "â€”"],
              ["Check-in", fmtDate(detail.checkInDate)],
              ["Check-out", fmtDate(detail.checkOutDate)],
              ["Nights", detail.totalNights],
              ["Guests", detail.guestCount || "â€”"],
              ["Price/Night", `LKR ${fmt(detail.offeredPricePerNight)}`],
              ["Total Price", `LKR ${fmt(detail.totalPrice)}`],
              ["Session ID", detail.sessionId || "â€”"],
              ["Created", fmtDate(detail.createdAt)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${G.border}` }}>
                <span style={{ fontSize: 12.5, color: G.muted }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500, fontFamily: k === "Reference" || k === "Session ID" ? "monospace" : undefined, color: k === "Total Price" ? "#4ade80" : G.text }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
              <span style={{ fontSize: 12.5, color: G.muted }}>Status</span>
              <span className={`badge badge-${detail.status === "NO_SHOW" ? "noshow" : detail.status.toLowerCase()}`}>{detail.status.replace("_", " ")}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
            {detail.status === "PENDING" && <button className="btn-gold" style={{ padding: "8px 16px" }} onClick={() => updateStatus(detail.id, "CONFIRMED")}>Confirm</button>}
            {detail.status !== "CANCELLED" && detail.status !== "NO_SHOW" && <button className="btn-danger" style={{ padding: "8px 16px" }} onClick={() => updateStatus(detail.id, "CANCELLED")}>Cancel Booking</button>}
            {detail.status === "CONFIRMED" && <button className="btn-ghost" style={{ padding: "8px 16px" }} onClick={() => updateStatus(detail.id, "NO_SHOW")}>Mark No-Show</button>}
          </div>
        </Modal>
      )}
      {confirm && <Confirm msg="Permanently delete this booking?" onConfirm={() => remove(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [users, setUsers] = useState(mkUsers());
  const [rooms, setRooms] = useState(mkRooms());
  const [packages, setPackages] = useState(mkPackages());
  const [sessions, setSessions] = useState(mkSessions());
  const [bookings, setBookings] = useState(mkBookings());
  const notif = useNotif();

  const handleLogin = (user) => {
    setCurrentUser(user);
    setTab("dashboard");
    setTimeout(() => notif.push(`Welcome back, ${user.firstName}!`), 400);
  };

  const handleLogout = () => { setCurrentUser(null); setTab("dashboard"); };

  const notify = (msg, type = "success") => notif.push(msg, type);

  const renderTab = () => {
    if (tab === "dashboard") return <Dashboard user={currentUser} sessions={sessions} bookings={bookings} rooms={rooms} packages={packages} />;
    if (tab === "users" && currentUser?.role === "ADMIN") return <UserManagement users={users} setUsers={setUsers} notify={notify} />;
    if (tab === "rooms") return <RoomManagement rooms={rooms} setRooms={setRooms} notify={notify} />;
    if (tab === "packages") return <PackageManagement packages={packages} setPackages={setPackages} rooms={rooms} notify={notify} />;
    if (tab === "sessions") return <SessionManagement sessions={sessions} setSessions={setSessions} notify={notify} />;
    if (tab === "bookings") return <BookingManagement bookings={bookings} setBookings={setBookings} notify={notify} />;
    return null;
  };

  return (
    <>
      <style>{STYLES}</style>
      <Notif items={notif.items} remove={notif.remove} />
      {!currentUser ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <div style={{ display: "flex", minHeight: "100vh", background: G.bg }}>
          <Sidebar user={currentUser} active={tab} setActive={setTab} onLogout={handleLogout} />
          <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", overflowX: "hidden" }}>
            {renderTab()}
          </main>
        </div>
      )}
    </>
  );
}
