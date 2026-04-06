import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import logoIcon from "../assets/logos/logo-icon.png";


type SenderType = "GUEST" | "AGENT" | "SYSTEM";
type MessageType = "TEXT" | "PACKAGE_CARD" | "BOOKING_CARD" | "OPTION_BUTTONS" | "SYSTEM_NOTICE";

interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

interface StartSessionRequestDto {
  guestName: string;
}

interface SendMessageRequestDto {
  sessionId: string;
  message: string;
}

interface NegotiationSessionResponseDto {
  sessionId: string;
}

interface ServerMessage {
  id?: string | number;
  messageId?: string | number;
  senderType: SenderType;
  messageType?: MessageType;
  content: string;
  createdAt?: string;
  timestamp?: string;
  metadata?: unknown;
}

interface PackageCardOption {
  available?: boolean;
  packageId: number;
  packageName: string;
  lowerBoundPrice?: number;
  upperBoundPrice?: number;
  addOns?: string[];
  totalNights?: number;
  checkInDate?: string;
  checkOutDate?: string;
  imageUrl?: string;
  message?: string;
}

interface UiMessage {
  key: string;
  senderType: SenderType;
  content: string;
  messageType?: MessageType;
  packageOptions?: PackageCardOption[];
  bookingConfirmation?: BookingConfirmation;
}

interface BookingConfirmation {
  reference: string;
  packageName: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  pricePerNight: number;
  totalPrice: number;
  addOns: string[];
  imageUrl?: string;
  guestName: string;
}

interface Props {
  onClose: () => void;
  onMinimize: () => void;
}


const buildWelcomeMessage = (name: string) =>
  `Welcome to Emerald Lagoon, ${name}. How can I help you today?`;
const RESPONSE_TIMEOUT_MS = 8000;
const priceFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const dateFormatterWithYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const calendarMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const calendarWeekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];


function normalizeMetadata(metadata: unknown): string {
  if (typeof metadata === "string") return metadata.trim();
  if (metadata == null) return "";

  try {
    return JSON.stringify(metadata);
  } catch {
    return "";
  }
}

function parseMetadataObject(metadata: unknown): Record<string, unknown> | null {
  if (!metadata) return null;

  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata) as unknown;
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  return typeof metadata === "object" && metadata !== null
    ? (metadata as Record<string, unknown>)
    : null;
}

function parsePackageOptions(metadata: unknown): PackageCardOption[] {
  const parsed = parseMetadataObject(metadata);
  const packages = parsed?.availablePackages;
  if (!Array.isArray(packages)) return [];

  return packages.filter((item): item is PackageCardOption => {
    if (typeof item !== "object" || item === null) return false;

    const pkg = item as Record<string, unknown>;
    return typeof pkg.packageId === "number" && typeof pkg.packageName === "string";
  });
}

function parseBookingConfirmation(metadata: unknown): BookingConfirmation | null {
  const parsed = parseMetadataObject(metadata);
  const confirmation = parsed?.bookingConfirmation;
  if (typeof confirmation !== "object" || confirmation === null) return null;

  const booking = confirmation as Record<string, unknown>;

  if (
    typeof booking.reference !== "string" ||
    typeof booking.packageName !== "string" ||
    typeof booking.checkInDate !== "string" ||
    typeof booking.checkOutDate !== "string" ||
    typeof booking.totalNights !== "number" ||
    typeof booking.pricePerNight !== "number" ||
    typeof booking.totalPrice !== "number" ||
    typeof booking.guestName !== "string"
  ) {
    return null;
  }

  return {
    reference: booking.reference,
    packageName: booking.packageName,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    totalNights: booking.totalNights,
    pricePerNight: booking.pricePerNight,
    totalPrice: booking.totalPrice,
    addOns: Array.isArray(booking.addOns)
      ? booking.addOns.filter((item): item is string => typeof item === "string")
      : [],
    imageUrl: typeof booking.imageUrl === "string" ? booking.imageUrl : undefined,
    guestName: booking.guestName,
  };
}

function formatRoundedMidPrice(option: PackageCardOption): string {
  const low = option.lowerBoundPrice;
  const high = option.upperBoundPrice;

  if (typeof low === "number" && typeof high === "number") {
    const midpoint = (low + high) / 2;
    return priceFormatter.format(Math.round(midpoint / 1000) * 1000);
  }

  if (typeof low === "number") return priceFormatter.format(Math.round(low / 1000) * 1000);
  if (typeof high === "number") return priceFormatter.format(Math.round(high / 1000) * 1000);
  return "Price available on request";
}

function formatDateLabel(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return dateFormatter.format(new Date(year, month - 1, day));
}

function formatStayDates(option: PackageCardOption): string {
  if (!option.checkInDate || !option.checkOutDate) return "Dates to be confirmed";

  const checkIn = option.checkInDate;
  const checkOut = option.checkOutDate;
  const [startYear] = checkIn.split("-").map(Number);
  const [endYear] = checkOut.split("-").map(Number);

  if (startYear && endYear && startYear !== endYear) {
    return `${formatDateLabel(checkIn)} - ${dateFormatterWithYear.format(new Date(endYear, Number(checkOut.split("-")[1]) - 1, Number(checkOut.split("-")[2])))}`;
  }

  return `${formatDateLabel(checkIn)} - ${formatDateLabel(checkOut)}, ${endYear}`;
}

function formatFullDateLabel(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return dateFormatterWithYear.format(new Date(year, month - 1, day));
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addMonths(value: Date, amount: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1);
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isDateBefore(left: Date, right: Date): boolean {
  return startOfDay(left).getTime() < startOfDay(right).getTime();
}

function isDateAfter(left: Date, right: Date): boolean {
  return startOfDay(left).getTime() > startOfDay(right).getTime();
}

function formatCalendarSubmitDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNightCount(checkIn: Date, checkOut: Date): number {
  return Math.round(
    (startOfDay(checkOut).getTime() - startOfDay(checkIn).getTime()) / 86400000,
  );
}

function isStayDatePrompt(content: string): boolean {
  const text = content.toLowerCase();
  const hasCheckInSignal = /(check[\s-]?in|arrival)/i.test(text);
  const hasCheckOutSignal = /(check[\s-]?out|departure)/i.test(text);
  const hasRequestSignal = /(choose|pick|select|share|tell|provide|confirm|what|when|submit|send|let me know)/i.test(text);
  const hasDateSignal = /(date|day|stay|night)/i.test(text);

  return hasCheckInSignal && hasCheckOutSignal && (hasRequestSignal || hasDateSignal);
}

function formatAddOn(addOn: string): string {
  return addOn
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function renderInlineContent(text: string): ReactNode[] {
  const matches = text.matchAll(/\*\*(.+?)\*\*/g);
  const segments: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of matches) {
    const [fullMatch, boldText] = match;
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      segments.push(text.slice(lastIndex, matchIndex));
    }

    segments.push(<strong key={`bold-${key}`}>{boldText}</strong>);
    key += 1;
    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }

  return segments.length > 0 ? segments : [text];
}

function renderMessageContent(content: string, className?: string) {
  const blocks: Array<
    | { type: "paragraph"; text: string }
    | { type: "list"; items: string[] }
  > = [];
  const lines = content.split(/\r?\n/);
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ").trim() });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push({ type: "list", items: [...listItems] });
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (bulletMatch) {
      flushParagraph();
      listItems.push(bulletMatch[1]);
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return (
    <div className={`ci-richtext${className ? ` ${className}` : ""}`}>
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul key={`list-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`item-${index}-${itemIndex}`}>{renderInlineContent(item)}</li>
              ))}
            </ul>
          );
        }

        return <p key={`paragraph-${index}`}>{renderInlineContent(block.text)}</p>;
      })}
    </div>
  );
}

function StayDatePicker({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (checkIn: Date, checkOut: Date) => void;
}) {
  const [today] = useState(() => startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);

  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOffset = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  ).getDay();
  const canGoBack = visibleMonth.getTime() > new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const nights = checkIn && checkOut ? getNightCount(checkIn, checkOut) : 0;

  function handleDaySelect(day: Date) {
    if (disabled || isDateBefore(day, today)) return;

    if (!checkIn || checkOut) {
      setCheckIn(day);
      setCheckOut(null);
      return;
    }

    if (!isDateAfter(day, checkIn)) {
      setCheckIn(day);
      setCheckOut(null);
      return;
    }

    setCheckOut(day);
  }

  function handleReset() {
    setCheckIn(null);
    setCheckOut(null);
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <div className="ci-date-picker">
      <div className="ci-date-picker__summary">
        <div className="ci-date-picker__field">
          <span className="ci-date-picker__field-label">Check in</span>
          <strong className="ci-date-picker__field-value">
            {checkIn ? dateFormatterWithYear.format(checkIn) : "Select arrival"}
          </strong>
        </div>
        <div className="ci-date-picker__field">
          <span className="ci-date-picker__field-label">Check out</span>
          <strong className="ci-date-picker__field-value">
            {checkOut ? dateFormatterWithYear.format(checkOut) : "Select departure"}
          </strong>
        </div>
        <div className="ci-date-picker__stay">
          <span className="ci-date-picker__stay-label">Stay length</span>
          <strong className="ci-date-picker__stay-value">
            {nights > 0 ? `${nights} night${nights === 1 ? "" : "s"}` : "Pick your dates"}
          </strong>
        </div>
      </div>

      <div className="ci-date-picker__calendar">
        <div className="ci-date-picker__toolbar">
          <button
            type="button"
            className="ci-date-picker__nav"
            onClick={() => setVisibleMonth((prev) => addMonths(prev, -1))}
            disabled={disabled || !canGoBack}
            aria-label="Show previous month"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <span className="ci-date-picker__month">
            {calendarMonthFormatter.format(visibleMonth)}
          </span>

          <button
            type="button"
            className="ci-date-picker__nav"
            onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
            disabled={disabled}
            aria-label="Show next month"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="ci-date-picker__weekdays">
          {calendarWeekdays.map((day) => (
            <span key={day} className="ci-date-picker__weekday">
              {day}
            </span>
          ))}
        </div>

        <div className="ci-date-picker__grid">
          {Array.from({ length: firstDayOffset }, (_, index) => (
            <span key={`empty-${index}`} className="ci-date-picker__blank" />
          ))}

          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = new Date(
              visibleMonth.getFullYear(),
              visibleMonth.getMonth(),
              index + 1,
            );
            const isPast = isDateBefore(day, today);
            const isCheckIn = checkIn ? isSameDay(day, checkIn) : false;
            const isCheckOut = checkOut ? isSameDay(day, checkOut) : false;
            const isInRange = checkIn && checkOut
              ? isDateAfter(day, checkIn) && isDateBefore(day, checkOut)
              : false;
            const isToday = isSameDay(day, today);

            return (
              <button
                key={day.toISOString()}
                type="button"
                className={[
                  "ci-date-picker__day",
                  isToday ? "ci-date-picker__day--today" : "",
                  isInRange ? "ci-date-picker__day--range" : "",
                  isCheckIn || isCheckOut ? "ci-date-picker__day--selected" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => handleDaySelect(day)}
                disabled={disabled || isPast}
                aria-label={dateFormatterWithYear.format(day)}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="ci-date-picker__actions">
        <button
          type="button"
          className="ci-date-picker__reset"
          onClick={handleReset}
          disabled={disabled || (!checkIn && !checkOut)}
        >
          Reset
        </button>
        <button
          type="button"
          className="ci-date-picker__submit"
          onClick={() => {
            if (!checkIn || !checkOut) return;
            onSubmit(checkIn, checkOut);
          }}
          disabled={disabled || !checkIn || !checkOut}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

function serverMsgKey(msg: ServerMessage): string {
  const id = msg.id ?? msg.messageId;
  if (id != null) return `id:${id}`;
  return `sig:${msg.senderType}:${msg.messageType ?? "TEXT"}:${(msg.content ?? "").trim().toLowerCase()}:${normalizeMetadata(msg.metadata)}`;
}

function extractMessages(payload: unknown): ServerMessage[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as ServerMessage[];

  if (typeof payload === "object" && payload !== null) {
    const obj = payload as Record<string, unknown>;

    if (typeof obj.senderType === "string" && typeof obj.content === "string") {
      return [obj as unknown as ServerMessage];
    }

    if (Array.isArray(obj.data)) return obj.data as ServerMessage[];

    if (typeof obj.data === "object" && obj.data !== null) {
      const inner = obj.data as Record<string, unknown>;
      if (typeof inner.senderType === "string") return [inner as unknown as ServerMessage];
      if (Array.isArray(inner.messages)) return inner.messages as ServerMessage[];
    }

    if (Array.isArray(obj.messages)) return obj.messages as ServerMessage[];
  }

  return [];
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));


export default function ChatInterface({ onClose, onMinimize }: Props) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [notice, setNotice] = useState("");
  const [gateOpen, setGateOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<Record<string, number>>({});
  const [activePackageIndexes, setActivePackageIndexes] = useState<Record<string, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const packageSliderRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stompRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<{ unsubscribe(): void } | null>(null);
  const subscribedSessionRef = useRef("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyReceivedRef = useRef(false);

  const shownKeysRef = useRef<Set<string>>(new Set());

  const apiBase = import.meta.env.VITE_CHAT_API_BASE_URL ?? "http://localhost:8080";

  function focusComposerInput() {
    const input = inputRef.current;
    if (!input) return;

    input.focus({ preventScroll: true });
    const length = input.value.length;
    input.setSelectionRange(length, length);
  }

  function updateActivePackageIndex(messageKey: string) {
    const slider = packageSliderRefs.current[messageKey];
    if (!slider) return;

    const cards = Array.from(
      slider.querySelectorAll<HTMLElement>("[data-package-card='true']"),
    );
    if (cards.length === 0) return;

    const sliderCenter = slider.scrollLeft + slider.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const distance = Math.abs(cardCenter - sliderCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActivePackageIndexes((prev) =>
      prev[messageKey] === nearestIndex ? prev : { ...prev, [messageKey]: nearestIndex },
    );
  }

  function handlePackageSelect(messageKey: string, option: PackageCardOption) {
    if (isSending || isSessionComplete) return;

    setSelectedPackages((prev) => ({ ...prev, [messageKey]: option.packageId }));
    void sendChatMessage(`I'd like to explore the ${option.packageName} package.`);
  }

  function handleStayDateSubmit(checkIn: Date, checkOut: Date) {
    if (isSending || isSessionComplete) return;

    const stayDatesMessage =
      `My check-in date is ${formatCalendarSubmitDate(checkIn)} and my check-out date is ${formatCalendarSubmitDate(checkOut)}.`;
    void sendChatMessage(stayDatesMessage);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (gateOpen) {
        nameInputRef.current?.focus({ preventScroll: true });
        return;
      }

      if (!isSessionComplete && !isSending) {
        focusComposerInput();
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [gateOpen, isSessionComplete, isSending]);

  useEffect(() => {
    return () => {
      clearResponseTimeout();
      subscriptionRef.current?.unsubscribe();
      stompRef.current?.deactivate();
    };
  }, []);

  function clearResponseTimeout() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function startResponseTimeout() {
    clearResponseTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setNotice("Response is taking longer than expectedâ€¦");
      timeoutRef.current = null;
    }, RESPONSE_TIMEOUT_MS);
  }


  function appendHardcoded(senderType: SenderType, content: string) {
    const key = `hardcoded:${senderType}:${Date.now()}`;
    setMessages((prev) => [...prev, { key, senderType, content }]);
  }

  function ingestServerMessages(raw: ServerMessage[]): number {
    const fresh: UiMessage[] = [];
    let completed = false;

    for (const msg of raw) {
      const content = msg.content?.trim() ?? "";
      const packageOptions = msg.messageType === "PACKAGE_CARD" ? parsePackageOptions(msg.metadata) : [];
      const bookingConfirmation = msg.messageType === "BOOKING_CARD"
        ? (parseBookingConfirmation(msg.metadata) ?? undefined)
        : undefined;
      if (!content && packageOptions.length === 0 && !bookingConfirmation) continue;

      if (msg.senderType === "GUEST") continue;

      const key = serverMsgKey(msg);
      if (shownKeysRef.current.has(key)) continue;

      shownKeysRef.current.add(key);
      fresh.push({
        key,
        senderType: msg.senderType ?? "AGENT",
        content,
        messageType: msg.messageType,
        packageOptions,
        bookingConfirmation,
      });

      if (msg.messageType === "BOOKING_CARD") completed = true;
    }

    if (fresh.length > 0) {
      setMessages((prev) => [...prev, ...fresh]);
    }

    if (completed) {
      setIsSessionComplete(true);
      setIsTyping(false);
      setUserInput("");
      setNotice("");
    }

    return fresh.length;
  }


  async function apiStartSession(name: string): Promise<string> {
    const res = await fetch(`${apiBase}/api/chat/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestName: name } satisfies StartSessionRequestDto),
    });
    if (!res.ok) throw new Error("Failed to start session");
    const payload = (await res.json()) as ApiResponse<NegotiationSessionResponseDto>;
    return payload.data.sessionId;
  }

  async function apiSendMessage(sid: string, message: string): Promise<ServerMessage[]> {
    const res = await fetch(`${apiBase}/api/chat/session/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sid, message } satisfies SendMessageRequestDto),
    });
    if (!res.ok) throw new Error("Failed to send message");
    const body = await res.text();
    if (!body.trim()) return [];
    try {
      return extractMessages(JSON.parse(body));
    } catch {
      return [];
    }
  }

  async function apiFetchHistory(sid: string): Promise<ServerMessage[]> {
    const res = await fetch(`${apiBase}/api/chat/session/${sid}/messages`);
    if (!res.ok) throw new Error("Failed to fetch history");
    return extractMessages(await res.json());
  }


  function subscribeToSession(client: Client, sid: string) {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;

    subscriptionRef.current = client.subscribe(`/topic/session/${sid}`, (frame) => {
      try {
        const body = frame.body.replaceAll("\0", "").trim();
        const msg = JSON.parse(body) as ServerMessage;
        const added = ingestServerMessages([msg]);
        if (added > 0) {
          replyReceivedRef.current = true;
          clearResponseTimeout();
          setIsTyping(false);
          setNotice("");
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    });

    subscribedSessionRef.current = sid;
  }

  function connectWebSocket(sid: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = stompRef.current;

      if (existing?.connected) {
        if (subscribedSessionRef.current !== sid) subscribeToSession(existing, sid);
        resolve();
        return;
      }

      const client = new Client({
        webSocketFactory: () => new SockJS(`${apiBase}/ws/negotiation`),
        reconnectDelay: 3000,
        onConnect: () => {
          setNotice("");
          subscribeToSession(client, sid);
          resolve();
        },
        onDisconnect: () => {
          subscribedSessionRef.current = "";
          setNotice("Connection lost. Reconnectingâ€¦");
        },
        onStompError: (frame) => {
          console.error("STOMP error:", frame);
          reject(new Error("WebSocket connection failed"));
        },
      });

      stompRef.current = client;
      client.activate();
    });
  }

  async function pollForReply(sid: string) {
    const delays = [500, 1200, 2200, 3500];

    if (replyReceivedRef.current) return;

    for (const delay of delays) {
      await wait(delay);
      if (replyReceivedRef.current) return;

      try {
        const history = await apiFetchHistory(sid);
        const added = ingestServerMessages(history);
        if (added > 0) {
          replyReceivedRef.current = true;
          clearResponseTimeout();
          setIsTyping(false);
          setNotice("");
          return;
        }
      } catch {
      }
    }
  }

  async function handleStartSession(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name || isStarting) return;

    setIsStarting(true);
    setNotice("");

    try {
      setGuestName(name);
      const sid = await apiStartSession(name);
      setSessionId(sid);

      await connectWebSocket(sid);

      appendHardcoded("AGENT", buildWelcomeMessage(name));

      setGateOpen(false);
      setNameInput("");
    } catch (err) {
      console.error("Session start error:", err);
      setNotice("Unable to start chat. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }

  async function sendChatMessage(rawText: string) {
    const text = rawText.trim();
    if (!text || isSending || isSessionComplete) return;

    setUserInput("");
    setIsSending(true);
    setIsTyping(true);
    setNotice("");
    replyReceivedRef.current = false;

    const guestKey = `guest:${Date.now()}`;
    setMessages((prev) => [...prev, { key: guestKey, senderType: "GUEST", content: text }]);

    startResponseTimeout();

    try {
      let sid = sessionId;

      if (!sid) {
        sid = await apiStartSession(guestName);
        setSessionId(sid);
        await connectWebSocket(sid);
      } else if (!stompRef.current?.connected) {
        await connectWebSocket(sid);
      }

      const immediate = await apiSendMessage(sid, text);
      if (immediate.length > 0) {
        const added = ingestServerMessages(immediate);
        if (added > 0) {
          replyReceivedRef.current = true;
          clearResponseTimeout();
          setIsTyping(false);
          setNotice("");
          return;
        }
      }

      await pollForReply(sid);
    } catch (err) {
      console.error("Send error:", err);
      clearResponseTimeout();
      setIsTyping(false);
      setNotice("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await sendChatMessage(userInput);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');

        .ci-root {
          --ci-bg: rgb(255, 255, 255);
          --ci-surface: rgba(255, 255, 255, 0.9);
          --ci-border: rgba(200, 157, 70, 0.32);
          --ci-accent: #c39338;
          --ci-accent-glow: rgba(226, 186, 96, 0.24);
          --ci-agent-bg: #ffffff;
          --ci-agent-text: #1f2937;
          --ci-guest-bg: linear-gradient(135deg, #f4e2bd 0%, #e0b96b 100%);
          --ci-guest-text: #1b1303;
          --ci-system-text: #5e4517;
          --ci-muted: #815f1a;
          --ci-font: 'DM Sans', sans-serif;
          --ci-radius: 18px;
          font-family: var(--ci-font);
          display: block;
          width: 500px;
          max-width: 100%;
          height: clamp(560px, 78dvh, 760px);
          overflow: hidden;
          isolation: isolate;
          transition: width 0.24s ease, height 0.24s ease;
        }

        .ci-root--expanded {
          width: 640px;
          max-width: 100%;
        }

        .ci-root * { box-sizing: border-box; margin: 0; padding: 0; }

        .ci-shell {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          background: var(--ci-bg);
          border: 2px solid var(--ci-border);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 28px 70px rgba(0,0,0,0.45);
          position: relative;
        }

        .ci-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--ci-surface);
          border-bottom: 1px solid var(--ci-border);
          flex-shrink: 0;
        }

        .ci-header__brand { display: flex; align-items: center; gap: 10px; }

        .ci-header__avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          box-shadow: 0 0 0 2px var(--ci-bg), 0 0 0 4px rgba(200,157,70,0.35);
          flex-shrink: 0;
        }

        .ci-header__avatar img { width: 72%; height: 72%; object-fit: contain; }

        .ci-header__info { display: flex; flex-direction: column; gap: 2px; }

        .ci-header__name { font-size: 14px; font-weight: 600; color: #111827; }

        .ci-header__status {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: var(--ci-muted);
        }

        .ci-header__dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--ci-accent);
          animation: ci-pulse 2s ease-in-out infinite;
        }

        @keyframes ci-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.5; transform:scale(0.8); }
        }

        .ci-header__close {
          width: 30px; height: 30px;
          border-radius: 50%; border: 1px solid var(--ci-border);
          background: transparent; color: var(--ci-muted);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .ci-header__close:hover { background: #f9e9c3; color: #5c4519; }
        .ci-header__close svg { width: 14px; height: 14px; }

        .ci-header__actions { display: flex; align-items: center; gap: 6px; }

        .ci-header__minimize {
          width: 30px; height: 30px;
          border-radius: 50%; border: 1px solid var(--ci-border);
          background: transparent; color: var(--ci-muted);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .ci-header__minimize:hover { background: #f9e9c3; color: #5c4519; }
        .ci-header__minimize svg { width: 14px; height: 14px; }

        .ci-header__expand {
          width: 30px; height: 30px;
          border-radius: 50%; border: 1px solid var(--ci-border);
          background: transparent; color: var(--ci-muted);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .ci-header__expand:hover { background: #f9e9c3; color: #5c4519; }
        .ci-header__expand svg { width: 14px; height: 14px; }

        .ci-messages {
          flex: 1; min-height: 0;
          overflow-y: auto; overflow-x: hidden;
          padding: 20px 16px;
          display: flex; flex-direction: column; gap: 4px;
          scrollbar-width: none;
        }
        .ci-messages::-webkit-scrollbar { width: 0; }

        .ci-row {
          display: flex; align-items: flex-end; gap: 8px;
          animation: ci-fadeup 0.28s ease forwards;
          opacity: 0;
        }
        @keyframes ci-fadeup {
          from { opacity:0; transform:translateY(7px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .ci-row--guest  { flex-direction: row-reverse; margin-left: 20%; }
        .ci-row--agent  { flex-direction: row; margin-right: 20%; }
        .ci-row--agent-package { margin-right: 8%; }
        .ci-row--system { justify-content: center; margin: 8px 0; }

        .ci-row + .ci-row { margin-top: 3px; }
        .ci-row--guest + .ci-row--agent,
        .ci-row--agent  + .ci-row--guest { margin-top: 12px; }

        .ci-avatar {
          width: 13px; height: 13px; border-radius: 50%;
          background: linear-gradient(135deg,#d7b05a,#bc8b2f);
          flex-shrink: 0; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 2px;
        }
        .ci-avatar img { width: 72%; height: 72%; object-fit: contain; }
        .ci-row[data-cont="1"] .ci-avatar { visibility: hidden; }

        .ci-bubble {
          max-width: 100%; padding: 11px 15px;
          font-size: 13.5px; line-height: 1.55; word-break: break-word;
        }

        .ci-bubble--agent {
          background: var(--ci-agent-bg);
          color: var(--ci-agent-text);
          border: 1px solid var(--ci-border);
          border-radius: var(--ci-radius) var(--ci-radius) var(--ci-radius) 4px;
        }

        .ci-bubble--guest {
          background: var(--ci-guest-bg);
          color: var(--ci-guest-text);
          border-radius: var(--ci-radius) var(--ci-radius) 4px var(--ci-radius);
          box-shadow: 0 4px 20px rgba(195,147,56,0.25);
        }

        .ci-bubble--system {
          background: rgba(214,173,89,0.22);
          color: var(--ci-system-text);
          border: 1px solid var(--ci-border);
          border-radius: 20px;
          font-size: 11.5px; padding: 6px 14px;
          font-weight: 500; letter-spacing: 0.03em; text-transform: uppercase;
        }

        .ci-bubble--package {
          width: min(100%, 720px);
          padding: 16px 10px 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 16px 34px rgba(75, 56, 16, 0.08);
          overflow: hidden;
        }

        .ci-bubble__text {
          color: var(--ci-agent-text);
        }

        .ci-date-picker {
          margin-top: 14px;
          border: 1px solid rgba(195, 147, 56, 0.2);
          border-radius: 22px;
          background:
            linear-gradient(180deg, rgba(255, 250, 239, 0.98) 0%, rgba(255, 255, 255, 0.94) 100%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.72),
            0 10px 24px rgba(195, 147, 56, 0.08);
          overflow: hidden;
        }

        .ci-date-picker__summary {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          padding: 14px;
          border-bottom: 1px solid rgba(195, 147, 56, 0.12);
          background: rgba(255, 249, 236, 0.78);
        }

        .ci-date-picker__field,
        .ci-date-picker__stay {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 11px 12px;
          border-radius: 16px;
          border: 1px solid rgba(195, 147, 56, 0.16);
          background: rgba(255, 255, 255, 0.8);
        }

        .ci-date-picker__stay {
          grid-column: 1 / -1;
          background: linear-gradient(135deg, rgba(250, 238, 205, 0.84) 0%, rgba(255, 255, 255, 0.92) 100%);
        }

        .ci-date-picker__field-label,
        .ci-date-picker__stay-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(129, 95, 26, 0.86);
        }

        .ci-date-picker__field-value,
        .ci-date-picker__stay-value {
          font-size: 13px;
          font-weight: 700;
          color: #2b2110;
        }

        .ci-date-picker__calendar {
          padding: 14px;
        }

        .ci-date-picker__toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .ci-date-picker__nav {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          border: 1px solid rgba(195, 147, 56, 0.18);
          background: rgba(255, 255, 255, 0.84);
          color: #7b5d21;
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }

        .ci-date-picker__nav svg {
          width: 15px;
          height: 15px;
        }

        .ci-date-picker__nav:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(195, 147, 56, 0.34);
          background: rgba(249, 241, 221, 0.92);
        }

        .ci-date-picker__nav:disabled {
          opacity: 0.42;
          cursor: not-allowed;
        }

        .ci-date-picker__month {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: #3c2c0d;
        }

        .ci-date-picker__weekdays,
        .ci-date-picker__grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
        }

        .ci-date-picker__weekdays {
          gap: 6px;
          margin-bottom: 6px;
        }

        .ci-date-picker__weekday {
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(129, 95, 26, 0.78);
        }

        .ci-date-picker__grid {
          gap: 6px;
        }

        .ci-date-picker__blank {
          aspect-ratio: 1;
        }

        .ci-date-picker__day {
          aspect-ratio: 1;
          border-radius: 14px;
          border: 1px solid transparent;
          background: rgba(250, 245, 233, 0.76);
          color: #3b2e15;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition:
            transform 0.16s ease,
            background 0.16s ease,
            border-color 0.16s ease,
            color 0.16s ease;
        }

        .ci-date-picker__day:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(195, 147, 56, 0.3);
          background: rgba(246, 232, 194, 0.88);
        }

        .ci-date-picker__day:disabled {
          background: rgba(250, 245, 233, 0.42);
          color: rgba(129, 95, 26, 0.3);
          cursor: not-allowed;
        }

        .ci-date-picker__day--today {
          border-color: rgba(195, 147, 56, 0.26);
          color: #8a651e;
        }

        .ci-date-picker__day--range {
          border-color: rgba(195, 147, 56, 0.18);
          background: rgba(224, 185, 107, 0.2);
          color: #6d4f13;
        }

        .ci-date-picker__day--selected {
          border-color: rgba(195, 147, 56, 0.48);
          background: linear-gradient(135deg, #f4e2bd 0%, #e0b96b 100%);
          color: #2a1f08;
          box-shadow: 0 8px 18px rgba(195, 147, 56, 0.18);
        }

        .ci-date-picker__actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 14px 14px;
        }

        .ci-date-picker__reset,
        .ci-date-picker__submit {
          border-radius: 14px;
          font-family: var(--ci-font);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: filter 0.18s ease, transform 0.18s ease;
        }

        .ci-date-picker__reset {
          padding: 10px 14px;
          border: 1px solid rgba(195, 147, 56, 0.18);
          background: rgba(255, 255, 255, 0.84);
          color: #7b5d21;
        }

        .ci-date-picker__submit {
          flex: 1;
          border: none;
          padding: 10px 16px;
          background: linear-gradient(135deg, #f4e2bd 0%, #e0b96b 100%);
          color: #2a1f08;
          box-shadow: 0 10px 24px rgba(195, 147, 56, 0.16);
        }

        .ci-date-picker__reset:hover:not(:disabled),
        .ci-date-picker__submit:hover:not(:disabled) {
          filter: brightness(1.02);
          transform: translateY(-1px);
        }

        .ci-date-picker__reset:disabled,
        .ci-date-picker__submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .ci-richtext {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ci-richtext p {
          margin: 0;
        }

        .ci-richtext ul {
          margin: 0;
          padding-left: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ci-richtext li {
          margin: 0;
        }

        .ci-package-head {
          display: flex;
          align-items: center;
        }

        .ci-package-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9a7425;
        }

        .ci-package-slider {
          display: flex;
          gap: 0;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          scroll-padding-inline: 16%;
          padding: 8px 16% 12px 4px;
          scrollbar-width: none;
        }

        .ci-package-slider::-webkit-scrollbar {
          display: none;
        }

        .ci-package-card {
          min-width: 74%;
          margin-right: -8%;
          scroll-snap-align: center;
          overflow: hidden;
          border-radius: 20px;
          border: 1px solid rgba(219, 225, 232, 0.9);
          background: #ffffff;
          box-shadow: 0 18px 42px rgba(32, 41, 58, 0.12);
          transform: scale(0.88);
          transform-origin: center center;
          opacity: 0.72;
          transition: transform 0.24s ease, opacity 0.24s ease, box-shadow 0.24s ease;
          position: relative;
          z-index: 1;
        }

        .ci-package-card:last-child {
          margin-right: 0;
        }

        .ci-package-card--active {
          transform: scale(1);
          opacity: 1;
          box-shadow: 0 24px 58px rgba(32, 41, 58, 0.18);
          z-index: 3;
        }

        .ci-package-card__image {
          height: 132px;
          background: linear-gradient(135deg, #dcb76a 0%, #8d6a25 100%);
        }

        .ci-package-card__image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ci-package-card__body {
          padding: 12px 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ci-package-card__top {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .ci-package-card__name {
          font-size: 14px;
          font-weight: 700;
          line-height: 1.3;
          color: #384252;
        }

        .ci-package-card__price {
          margin-top: 4px;
          font-size: 17px;
          font-weight: 700;
          color: #2f3540;
        }

        .ci-package-card__price-note {
          margin-top: 2px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8e959f;
        }

        .ci-package-card__meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 7px;
        }

        .ci-package-card__meta-item {
          padding: 7px 9px;
          border-radius: 12px;
          background: #f6f8fb;
          border: 1px solid #e5ebf1;
        }

        .ci-package-card__meta-label {
          display: block;
          margin-bottom: 3px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9a7425;
        }

        .ci-package-card__meta-value {
          font-size: 10px;
          line-height: 1.35;
          color: #374151;
        }

        .ci-package-card__addons {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .ci-package-card__chip {
          padding: 4px 7px;
          border-radius: 999px;
          background: #eef3f9;
          color: #566171;
          font-size: 9.5px;
          font-weight: 600;
        }

        .ci-package-card__footer {
          display: flex;
          justify-content: flex-start;
          margin-top: 2px;
        }

        .ci-package-card__select {
          border: none;
          border-radius: 10px;
          min-width: 108px;
          padding: 10px 16px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #2a1f08;
          background: linear-gradient(180deg, #e0b55d 0%, #c39338 100%);
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
          box-shadow: 0 10px 22px rgba(195, 147, 56, 0.22);
        }

        .ci-package-card__select:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.04);
          box-shadow: 0 14px 28px rgba(195, 147, 56, 0.28);
        }

        .ci-package-card__select:disabled {
          cursor: not-allowed;
          background: #ece4d6;
          color: #8d8473;
          box-shadow: none;
        }

        .ci-package-card__select--selected {
          background: linear-gradient(180deg, #f0d28a 0%, #d0a34a 100%);
        }

        .ci-booking-card {
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid rgba(219, 225, 232, 0.9);
          background: linear-gradient(180deg, #ffffff 0%, #fffaf1 100%);
          box-shadow: 0 16px 34px rgba(32, 41, 58, 0.12);
        }

        .ci-booking-card__image {
          height: 128px;
          background: linear-gradient(135deg, #dcb76a 0%, #8d6a25 100%);
        }

        .ci-booking-card__image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ci-booking-card__body {
          padding: 12px 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ci-booking-card__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .ci-booking-card__eyebrow {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9a7425;
        }

        .ci-booking-card__name {
          margin-top: 3px;
          font-size: 16px;
          line-height: 1.2;
          font-weight: 700;
          color: #2f3540;
        }

        .ci-booking-card__reference {
          display: inline-flex;
          align-items: center;
          padding: 6px 9px;
          border-radius: 999px;
          background: linear-gradient(180deg, #f0d28a 0%, #d0a34a 100%);
          color: #2a1f08;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .ci-booking-card__guest {
          font-size: 12px;
          color: #4b5563;
        }

        .ci-booking-card__guest strong {
          color: #1f2937;
        }

        .ci-booking-card__meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 7px;
        }

        .ci-booking-card__meta-item {
          padding: 8px 9px;
          border-radius: 12px;
          background: #f6f8fb;
          border: 1px solid #e5ebf1;
        }

        .ci-booking-card__meta-label {
          display: block;
          margin-bottom: 3px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9a7425;
        }

        .ci-booking-card__meta-value {
          font-size: 11px;
          line-height: 1.4;
          color: #374151;
        }

        .ci-booking-card__pricing {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 7px;
        }

        .ci-booking-card__price-box {
          padding: 10px 11px;
          border-radius: 12px;
          background: #fff8ea;
          border: 1px solid rgba(200, 157, 70, 0.24);
        }

        .ci-booking-card__price-label {
          display: block;
          margin-bottom: 3px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9a7425;
        }

        .ci-booking-card__price-value {
          font-size: 15px;
          font-weight: 700;
          color: #2f3540;
        }

        .ci-booking-card__addons {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .ci-booking-card__addon {
          padding: 4px 8px;
          border-radius: 999px;
          background: #eef3f9;
          color: #566171;
          font-size: 9px;
          font-weight: 700;
        }

        .ci-booking-card__footer {
          padding-top: 2px;
          font-size: 11px;
          color: #6b7280;
        }

        .ci-typing-row {
          display: flex; align-items: flex-end; gap: 8px;
          margin-right: 20%;
          animation: ci-fadeup 0.28s ease forwards; opacity: 0;
        }

        .ci-typing {
          background: var(--ci-agent-bg);
          border: 1px solid var(--ci-border);
          border-radius: var(--ci-radius) var(--ci-radius) var(--ci-radius) 4px;
          padding: 13px 16px;
          display: flex; gap: 4px; align-items: center;
        }

        .ci-typing span {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--ci-muted);
          animation: ci-bounce 1.2s ease-in-out infinite;
        }
        .ci-typing span:nth-child(2) { animation-delay: 0.15s; }
        .ci-typing span:nth-child(3) { animation-delay: 0.30s; }

        @keyframes ci-bounce {
          0%,60%,100% { transform:translateY(0); opacity:0.4; }
          30% { transform:translateY(-5px); opacity:1; }
        }

        .ci-notice {
          font-size: 11px; color: #815f1a; text-align: center;
          padding: 6px 16px;
          background: rgba(214,173,89,0.16);
          border-top: 1px solid var(--ci-border);
          flex-shrink: 0;
        }

        .ci-composer {
          flex-shrink: 0; padding: 12px 14px 14px;
          background: var(--ci-surface);
          border-top: 1px solid var(--ci-border);
        }

        .ci-composer__wrap {
          display: flex; align-items: center; gap: 8px;
          background: #fff;
          border: 1px solid var(--ci-border);
          border-radius: 50px;
          padding: 6px 6px 6px 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ci-composer__wrap:focus-within {
          border-color: #c89d46;
          box-shadow: 0 0 0 3px var(--ci-accent-glow);
        }

        .ci-composer__input {
          flex: 1; background: transparent; border: none; outline: none;
          color: #111827; font-family: var(--ci-font); font-size: 13.5px;
          caret-color: var(--ci-accent); min-width: 0;
        }
        .ci-composer__input::placeholder { color: rgba(17,24,39,0.45); }

        .ci-composer--complete {
          padding-top: 10px;
        }

        .ci-composer__done {
          padding: 12px 14px;
          border: 1px solid rgba(200, 157, 70, 0.28);
          border-radius: 18px;
          background: #fff8ea;
          color: #6b4e17;
          font-size: 12px;
          line-height: 1.45;
          text-align: center;
        }

        .ci-send-btn {
          width: 34px; height: 34px; border-radius: 50%; border: none;
          background: linear-gradient(135deg,#e0b55d 0%,#c39338 100%);
          color: #2a1f08; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.18s;
          box-shadow: 0 4px 12px rgba(200,157,70,0.3);
        }
        .ci-send-btn:hover:not(:disabled) {
          filter: brightness(1.08);
          box-shadow: 0 4px 20px rgba(200,157,70,0.45);
          transform: scale(1.05);
        }
        .ci-send-btn:disabled {
          background: #f2efe7; color: #b1a58f;
          box-shadow: none; cursor: not-allowed;
        }
        .ci-send-btn svg { width: 15px; height: 15px; }

        .ci-content { height: 100%; display: flex; flex-direction: column; transition: filter 0.25s; }
        .ci-content--blur { filter: blur(4px); pointer-events: none; user-select: none; }

        .ci-gate {
          position: absolute; inset: 0; z-index: 5;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.35); padding: 18px;
        }

        .ci-gate__panel {
          width: min(360px,100%);
          border: 1px solid var(--ci-border); border-radius: 18px;
          background: #fffefb;
          box-shadow: 0 14px 40px rgba(0,0,0,0.15);
          padding: 18px;
          display: flex; flex-direction: column; gap: 10px;
        }

        .ci-gate__title { font-size: 16px; color: #1f2937; font-weight: 600; }
        .ci-gate__sub   { font-size: 13px; color: #7a5d1f; line-height: 1.45; }

        .ci-gate__input {
          width: 100%; border: 1px solid var(--ci-border); border-radius: 12px;
          background: #fff; padding: 10px 12px; font-size: 14px;
          outline: none; color: #111827; font-family: var(--ci-font);
        }
        .ci-gate__input:focus { border-color: #c89d46; box-shadow: 0 0 0 3px var(--ci-accent-glow); }

        .ci-gate__btn {
          border: none; border-radius: 12px;
          background: linear-gradient(135deg,#e0b55d 0%,#c39338 100%);
          color: #2a1f08; padding: 10px 12px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: var(--ci-font);
          transition: filter 0.18s;
        }
        .ci-gate__btn:hover:not(:disabled) { filter: brightness(1.07); }
        .ci-gate__btn:disabled { background: #efe8d8; color: #8d8473; cursor: not-allowed; }

        @media (max-width: 640px) {
          .ci-row--guest { margin-left: 8%; }
          .ci-row--agent { margin-right: 8%; }
          .ci-row--agent-package { margin-right: 4%; }
          .ci-root,
          .ci-root--expanded { width: 100%; }
          .ci-bubble--package { width: 100%; padding-right: 6px; }
          .ci-package-slider { scroll-padding-inline: 8%; padding: 8px 8% 12px 2px; }
          .ci-package-card { min-width: 88%; margin-right: -6%; }
          .ci-package-card__meta { grid-template-columns: 1fr; }
          .ci-package-card__footer { align-items: stretch; flex-direction: column; }
          .ci-package-card__select { width: 100%; }
          .ci-booking-card__top { flex-direction: column; }
          .ci-booking-card__meta,
          .ci-booking-card__pricing { grid-template-columns: 1fr; }
          .ci-date-picker__summary { grid-template-columns: 1fr; }
          .ci-date-picker__actions { flex-direction: column-reverse; align-items: stretch; }
          .ci-date-picker__reset,
          .ci-date-picker__submit { width: 100%; }
        }
      `}</style>

      <div className={`ci-root${isExpanded ? " ci-root--expanded" : ""}`}>
        <div className="ci-shell">

          <div className={`ci-content${gateOpen ? " ci-content--blur" : ""}`}>

            <header className="ci-header">
              <div className="ci-header__brand">
                <div className="ci-header__avatar">
                  <img src={logoIcon} alt="Emerald Lagoon" />
                </div>
                <div className="ci-header__info">
                  <span className="ci-header__name">Emerald Chat</span>
                  <span className="ci-header__status">
                    <span className="ci-header__dot" />
                    Online Â· Booking Agent
                  </span>
                </div>
              </div>
              <div className="ci-header__actions">
                <button
                  type="button"
                  className="ci-header__expand"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  aria-label={isExpanded ? "Shrink chat" : "Expand chat"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 4H4v6" />
                    <path d="M4 4l7 7" />
                    <path d="M14 4h6v6" />
                    <path d="M20 4l-7 7" />
                    <path d="M4 14v6h6" />
                    <path d="M4 20l7-7" />
                    <path d="M20 14v6h-6" />
                    <path d="M20 20l-7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="ci-header__minimize"
                  onClick={onMinimize}
                  aria-label="Minimize chat"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="ci-header__close"
                  onClick={onClose}
                  aria-label="Close chat"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </header>

            <div className="ci-messages">
              {messages.map((msg, idx) => {
                const prev = messages[idx - 1];
                const isCont = prev?.senderType === msg.senderType && msg.senderType !== "SYSTEM";

                if (msg.senderType === "SYSTEM") {
                  return (
                    <div key={msg.key} className="ci-row ci-row--system">
                      <div className="ci-bubble ci-bubble--system">{msg.content}</div>
                    </div>
                  );
                }

                if (msg.senderType === "GUEST") {
                  return (
                    <div key={msg.key} className="ci-row ci-row--guest">
                      <div className="ci-bubble ci-bubble--guest">{msg.content}</div>
                    </div>
                  );
                }

                const selectedPackageId = selectedPackages[msg.key];
                const activePackageIndex = activePackageIndexes[msg.key] ?? 0;
                const hasPackageCards =
                  msg.messageType === "PACKAGE_CARD" && (msg.packageOptions?.length ?? 0) > 0;
                const hasBookingConfirmation = Boolean(msg.bookingConfirmation);
                const showStayDatePicker =
                  !hasPackageCards &&
                  !hasBookingConfirmation &&
                  !isSessionComplete &&
                  idx === messages.length - 1 &&
                  isStayDatePrompt(msg.content);

                return (
                  <div
                    key={msg.key}
                    className={`ci-row ci-row--agent${hasPackageCards || hasBookingConfirmation ? " ci-row--agent-package" : ""}`}
                    data-cont={isCont ? "1" : "0"}
                  >
                    <div className="ci-avatar">
                      <img src={logoIcon} alt="" />
                    </div>
                    <div
                      className={`ci-bubble ci-bubble--agent${hasPackageCards || hasBookingConfirmation ? " ci-bubble--package" : ""}`}
                    >
                      {msg.content &&
                        renderMessageContent(
                          msg.content,
                          hasPackageCards || hasBookingConfirmation ? "ci-bubble__text" : undefined,
                        )}

                      {showStayDatePicker && (
                        <StayDatePicker
                          disabled={isSending}
                          onSubmit={handleStayDateSubmit}
                        />
                      )}

                      {hasPackageCards && (
                        <>
                          <div className="ci-package-head">
                            <span className="ci-package-title">Available Packages</span>
                          </div>

                          <div
                            ref={(node) => {
                              packageSliderRefs.current[msg.key] = node;
                            }}
                            className="ci-package-slider"
                            onScroll={() => updateActivePackageIndex(msg.key)}
                          >
                            {msg.packageOptions?.map((option, optionIndex) => {
                              const isSelected = selectedPackageId === option.packageId;
                              const isActive = activePackageIndex === optionIndex;

                              return (
                                <article
                                  key={option.packageId}
                                  className={`ci-package-card${isActive ? " ci-package-card--active" : ""}`}
                                  data-package-card="true"
                                >
                                  <div className="ci-package-card__image">
                                    {option.imageUrl ? (
                                      <img src={option.imageUrl} alt={option.packageName} />
                                    ) : null}
                                  </div>

                                  <div className="ci-package-card__body">
                                    <div className="ci-package-card__top">
                                      <div>
                                        <h4 className="ci-package-card__name">{option.packageName}</h4>
                                        <p className="ci-package-card__price">{formatRoundedMidPrice(option)}</p>
                                        <p className="ci-package-card__price-note">Starting upwards (per night)</p>
                                      </div>
                                    </div>

                                    <div className="ci-package-card__meta">
                                      <div className="ci-package-card__meta-item">
                                        <span className="ci-package-card__meta-label">Stay</span>
                                        <span className="ci-package-card__meta-value">
                                          {formatStayDates(option)}
                                        </span>
                                      </div>
                                      <div className="ci-package-card__meta-item">
                                        <span className="ci-package-card__meta-label">Nights</span>
                                        <span className="ci-package-card__meta-value">
                                          {typeof option.totalNights === "number"
                                            ? `${option.totalNights} night${option.totalNights === 1 ? "" : "s"}`
                                            : "Flexible stay"}
                                        </span>
                                      </div>
                                    </div>

                                    {option.addOns && option.addOns.length > 0 && (
                                      <div className="ci-package-card__addons">
                                        {option.addOns.slice(0, 2).map((addOn) => (
                                          <span key={`${option.packageId}-${addOn}`} className="ci-package-card__chip">
                                            {formatAddOn(addOn)}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div className="ci-package-card__footer">
                                      <button
                                        type="button"
                                        className={`ci-package-card__select${isSelected ? " ci-package-card__select--selected" : ""}`}
                                        onClick={() => handlePackageSelect(msg.key, option)}
                                        disabled={option.available === false || isSending}
                                      >
                                        {isSelected ? "Selected" : "Select"}
                                      </button>
                                    </div>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {msg.bookingConfirmation && (
                        <article className="ci-booking-card">
                          <div className="ci-booking-card__image">
                            {msg.bookingConfirmation.imageUrl ? (
                              <img
                                src={msg.bookingConfirmation.imageUrl}
                                alt={msg.bookingConfirmation.packageName}
                              />
                            ) : null}
                          </div>

                          <div className="ci-booking-card__body">
                            <div className="ci-booking-card__top">
                              <div>
                                <p className="ci-booking-card__eyebrow">Booking Confirmed</p>
                                <h4 className="ci-booking-card__name">
                                  {msg.bookingConfirmation.packageName}
                                </h4>
                              </div>
                              <span className="ci-booking-card__reference">
                                {msg.bookingConfirmation.reference}
                              </span>
                            </div>

                            <p className="ci-booking-card__guest">
                              Guest: <strong>{msg.bookingConfirmation.guestName}</strong>
                            </p>

                            <div className="ci-booking-card__meta">
                              <div className="ci-booking-card__meta-item">
                                <span className="ci-booking-card__meta-label">Check In</span>
                                <span className="ci-booking-card__meta-value">
                                  {formatFullDateLabel(msg.bookingConfirmation.checkInDate)}
                                </span>
                              </div>
                              <div className="ci-booking-card__meta-item">
                                <span className="ci-booking-card__meta-label">Check Out</span>
                                <span className="ci-booking-card__meta-value">
                                  {formatFullDateLabel(msg.bookingConfirmation.checkOutDate)}
                                </span>
                              </div>
                              <div className="ci-booking-card__meta-item">
                                <span className="ci-booking-card__meta-label">Total Nights</span>
                                <span className="ci-booking-card__meta-value">
                                  {msg.bookingConfirmation.totalNights} night
                                  {msg.bookingConfirmation.totalNights === 1 ? "" : "s"}
                                </span>
                              </div>
                              <div className="ci-booking-card__meta-item">
                                <span className="ci-booking-card__meta-label">Add-Ons</span>
                                <span className="ci-booking-card__meta-value">
                                  {msg.bookingConfirmation.addOns.length > 0
                                    ? `${msg.bookingConfirmation.addOns.length} included`
                                    : "No add-ons"}
                                </span>
                              </div>
                            </div>

                            <div className="ci-booking-card__pricing">
                              <div className="ci-booking-card__price-box">
                                <span className="ci-booking-card__price-label">Price / Night</span>
                                <span className="ci-booking-card__price-value">
                                  {priceFormatter.format(msg.bookingConfirmation.pricePerNight)}
                                </span>
                              </div>
                              <div className="ci-booking-card__price-box">
                                <span className="ci-booking-card__price-label">Total Price</span>
                                <span className="ci-booking-card__price-value">
                                  {priceFormatter.format(msg.bookingConfirmation.totalPrice)}
                                </span>
                              </div>
                            </div>

                            {msg.bookingConfirmation.addOns.length > 0 && (
                              <div className="ci-booking-card__addons">
                                {msg.bookingConfirmation.addOns.map((addOn) => (
                                  <span key={`${msg.key}-${addOn}`} className="ci-booking-card__addon">
                                    {formatAddOn(addOn)}
                                  </span>
                                ))}
                              </div>
                            )}

                            <p className="ci-booking-card__footer">
                              Reference: <strong>{msg.bookingConfirmation.reference}</strong>
                            </p>
                          </div>
                        </article>
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && !isSessionComplete && (
                <div className="ci-typing-row">
                  <div className="ci-avatar">
                    <img src={logoIcon} alt="" />
                  </div>
                  <div className="ci-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {notice && <p className="ci-notice">{notice}</p>}

            <form className={`ci-composer${isSessionComplete ? " ci-composer--complete" : ""}`} onSubmit={handleSend}>
              {isSessionComplete && (
                <div className="ci-composer__done">
                  This booking session is complete. Your confirmation is above.
                </div>
              )}
                <div className="ci-composer__wrap">
                <input
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your messageâ€¦"
                  className="ci-composer__input"
                  autoComplete="off"
                  aria-label="Type your message"
                  disabled={isSending || isSessionComplete}
                />
                <button
                  type="submit"
                  className="ci-send-btn"
                  disabled={isSending || isSessionComplete || !userInput.trim()}
                  aria-label="Send"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
                </div>
            </form>
          </div>

          {gateOpen && (
            <div className="ci-gate">
              <form className="ci-gate__panel" onSubmit={handleStartSession}>
                <p className="ci-gate__title">Welcome to Emerald Chat</p>
                <p className="ci-gate__sub">Please enter your name to begin.</p>
                <input
                  ref={nameInputRef}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="ci-gate__input"
                  placeholder="Your name"
                  autoComplete="off"
                  aria-label="Your name"
                />
                <button
                  type="submit"
                  className="ci-gate__btn"
                  disabled={isStarting || !nameInput.trim()}
                >
                  {isStarting ? "Startingâ€¦" : "Start Chat"}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
