import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import BedOutlinedIcon from "@mui/icons-material/BedOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import RoomServiceOutlinedIcon from "@mui/icons-material/RoomServiceOutlined";
import "../App.css";
import { packageApi } from "../api";
import type { PackageResponseDto } from "../types";
import logo from "../assets/logos/logo-vertical.png";
import promovideo from "../assets/bg_video.mp4";
import bgImg from "../assets/bg_img.png";
import favicon from "../assets/logos/logo-icon.png";
import bgPattern from "../assets/bg_pattern.png";
import ChatInterface from "./ChatInterface";

export default function EmeraldLagoonHotelHomepage() {
  const [currency, setCurrency] = useState<"LKR" | "USD">("LKR");
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [featuredPackages, setFeaturedPackages] = useState<PackageResponseDto[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const roomsSliderRef = useRef<HTMLDivElement | null>(null);
  const DEFAULT_PACKAGE_IMAGE =
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80";

  useEffect(() => {
    const els = document.querySelectorAll<Element>(
      '.scroll-fade-up, .scroll-fade-left, .scroll-fade-right, .scroll-scale-in'
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-visible');
          } else {
            entry.target.classList.remove('scroll-visible');
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [featuredPackages.length]);

  useEffect(() => {
    let active = true;
    const loadPackages = async () => {
      setPackagesLoading(true);
      setPackagesError(null);
      try {
        const packages = await packageApi.getAll({ isActive: true });
        if (!active) return;
        setFeaturedPackages(packages.filter((pkg) => pkg.isActive));
      } catch (error: unknown) {
        if (!active) return;
        setPackagesError(error instanceof Error ? error.message : "Failed to load packages.");
        setFeaturedPackages([]);
      } finally {
        if (active) setPackagesLoading(false);
      }
    };
    loadPackages();
    return () => {
      active = false;
    };
  }, []);
  const openChat = () => {
    setIsChatMinimized(false);
    setIsChatOpen(true);
  };
  const minimizeChat = () => {
    setIsChatMinimized(true);
  };
  const restoreChat = () => {
    setIsChatMinimized(false);
  };
  const closeChat = () => {
    setIsChatOpen(false);
    setIsChatMinimized(false);
  };

  const openPackageChat = () => {
    openChat();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getAddonMeta = (addon: string) => {
    switch (addon) {
      case "BREAKFAST":
        return {
          label: "Breakfast",
          icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 11h14M7 7v4m5-6v6m5-4v4M6 15h12l-1.2 3H7.2L6 15Z" />
            </svg>
          ),
        };
      case "LUNCH":
      case "DINNER":
      case "FULL_BOARD":
        return {
          label: addon === "FULL_BOARD" ? "Full Board" : addon === "LUNCH" ? "Lunch" : "Dinner",
          icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v7M10 4v7M7 8h3M14 4v16m0-9c1.657 0 3-1.79 3-4s-1.343-4-3-4" />
            </svg>
          ),
        };
      case "SPA":
        return {
          label: "Spa",
          icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20c4-2.2 6-5 6-8.5A3.5 3.5 0 0 0 14.5 8C13 8 12 9 12 9s-1-1-2.5-1A3.5 3.5 0 0 0 6 11.5C6 15 8 17.8 12 20Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9c0-2 1.4-3.5 3.5-4" />
            </svg>
          ),
        };
      case "POOL_ACCESS":
        return {
          label: "Pool",
          icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 15c1.4 0 1.9-1 3.3-1s1.9 1 3.4 1 2-1 3.4-1 1.9 1 3.3 1 1.9-1 2.6-1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12V8a2 2 0 1 1 4 0v4" />
            </svg>
          ),
        };
      case "AIRPORT_TRANSFER":
        return {
          label: "Transfer",
          icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16h18M5 16l1-5h12l1 5M7 16v2m10-2v2M8 11l1.5-3h5L16 11" />
            </svg>
          ),
        };
      case "LATE_CHECKOUT":
      case "EARLY_CHECKIN":
        return {
          label: addon === "LATE_CHECKOUT" ? "Late Checkout" : "Early Check-in",
          icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-9-9" />
            </svg>
          ),
        };
      default:
        return {
          label: addon.replace(/_/g, " "),
          icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12" />
            </svg>
          ),
        };
    }
  };

  const hotelHighlights = [
    {
      title: "Luxurious Rooms",
      description:
        "Stay in spacious rooms with refined interiors, private balconies, and serene views inspired by Sri Lanka's coastal charm.",
      icon: (
        <BedOutlinedIcon sx={{ fontSize: 40, color: "#fff" }} />
      ),
    },
    {
      title: "Quality Service",
      description:
        "Enjoy warm island hospitality with attentive staff, curated dining, and concierge support from check-in to departure.",
      icon: (
        <RoomServiceOutlinedIcon sx={{ fontSize: 40, color: "#fff" }} />
      ),
    },
    {
      title: "Great Environment",
      description:
        "Experience tranquil gardens, ocean breeze, and peaceful surroundings designed for rest, wellness, and family escapes.",
      icon: (
        <ParkOutlinedIcon sx={{ fontSize: 40, color: "#fff" }} />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <header className="navbar-enter fixed top-0 z-50 w-full border-b border-yellow-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/admin" aria-label="Go to admin panel" className="inline-flex">
            <img src={logo} alt="Emerald Lagoon" className="h-12 w-auto" />
          </Link>
          <nav className="hidden items-center gap-8 text-base md:flex">
            <a href="#about" className="text-stone-900/80 transition hover:text-stone-900">About</a>
            <a href="#rooms" className="text-stone-900/80 transition hover:text-stone-900">Rooms</a>
            <a href="#offers" className="text-stone-900/80 transition hover:text-stone-900">Experience</a>
            <a href="#chatbot" className="text-stone-900/80 transition hover:text-stone-900">Discover</a>
          </nav>
          <div className="hidden items-center divide-x divide-stone-300 text-sm md:flex">
            <button className="flex items-center gap-1 px-3 text-stone-700 transition hover:text-stone-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" /></svg>
              English
            </button>
            <div className="relative px-3 text-stone-700">
              <button
                type="button"
                onClick={() => setIsCurrencyMenuOpen((open) => !open)}
                className="flex items-center gap-1 transition hover:text-stone-900"
              >
                {currency}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {isCurrencyMenuOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-24 rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
                  <button type="button" onClick={() => { setCurrency("LKR"); setIsCurrencyMenuOpen(false); }} className="block w-full px-3 py-1 text-left text-stone-700 transition hover:bg-stone-100">LKR</button>
                  <button type="button" onClick={() => { setCurrency("USD"); setIsCurrencyMenuOpen(false); }} className="block w-full px-3 py-1 text-left text-stone-700 transition hover:bg-stone-100">USD</button>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={openChat}
            className="rounded-full bg-stone-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            Book Now
          </button>
        </div>
      </header>
      <section className={`hero-shell relative flex min-h-screen items-center justify-center overflow-hidden ${isChatOpen ? "hero-shell--chat-active" : ""}`}>
        {isChatOpen ? (
          <img src={bgImg} alt="Luxury room background" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <video autoPlay muted loop playsInline className="hero-video absolute inset-0 h-full w-full object-cover" src={promovideo} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 to-black/50" />

        <div className={`hero-content relative mx-auto w-full max-w-6xl px-6 text-white ${isChatOpen ? "hero-content--chat-active" : "mt-20"}`}>
          <div className={`hero-intro reveal-up delay-1 ${isChatOpen ? "hero-intro--chat-active" : ""}`}>
            <p className="mb-4 text-sm uppercase tracking-[0.35em] text-yellow-400">Boutique Hotel Experience</p>
            {!isChatOpen ? (
              <h1 className="reveal-up delay-2 text-5xl font-semibold leading-tight md:text-7xl">
                <img src={favicon} alt="Emerald Lagoon icon" className="hero-logo mx-auto h-20 w-20 md:h-24 md:w-24" />
              </h1>
            ) : null}
            <p className={`reveal-up delay-3 mt-6 text-sm uppercase tracking-[0.35em] text-white/90 md:text-base ${isChatOpen ? "max-w-md" : "mx-auto max-w-2xl"}`}>
              A serene destination where luxury and nature come together.
            </p>
            {!isChatOpen && (
              <div className="reveal-up delay-4 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={openChat}
                  className="sparkle-btn rounded-full bg-[#BD9D52] px-7 py-3 font-medium text-stone-950 transition hover:bg-[#B09046]"
                >
                  Unlock Your Exclusive Deal
                </button>
              </div>
            )}
          </div>
          {isChatOpen && (
            <div className={`hero-chat-entry${isChatMinimized ? " hero-chat-entry--hidden" : ""}`}>
              <ChatInterface
                onClose={closeChat}
                onMinimize={minimizeChat}
              />
            </div>
          )}
        </div>
      </section>
      {isChatOpen && isChatMinimized && (
        <button
          type="button"
          onClick={restoreChat}
          className="chat-pill"
          aria-label="Restore chat"
        >
          <span className="chat-pill__dot" />
          <img src={favicon} alt="" className="chat-pill__icon" />
          <span className="chat-pill__label">Emerald Chat</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="chat-pill__chevron">
            <path d="M18 15l-6-6-6 6" />
          </svg>
          <style>{`
            .chat-pill {
              position: fixed;
              bottom: 28px;
              right: 28px;
              z-index: 200;
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 18px 10px 12px;
              border-radius: 999px;
              border: 1px solid rgba(200, 157, 70, 0.45);
              background: #fffefb;
              box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(200,157,70,0.18);
              cursor: pointer;
              font-family: 'DM Sans', sans-serif;
              font-size: 13.5px;
              font-weight: 500;
              color: #3b2a07;
              transition: transform 0.2s ease, box-shadow 0.2s ease;
              animation: pill-rise 0.32s cubic-bezier(0.22,1,0.36,1) both;
            }
            .chat-pill:hover {
              transform: translateY(-3px);
              box-shadow: 0 14px 40px rgba(0,0,0,0.22), 0 0 0 1px rgba(200,157,70,0.28);
            }
            @keyframes pill-rise {
              from { opacity: 0; transform: translateY(18px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .chat-pill__dot {
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: #c39338;
              flex-shrink: 0;
              animation: pill-pulse 2s ease-in-out infinite;
            }
            @keyframes pill-pulse {
              0%,100% { opacity:1; transform:scale(1); }
              50% { opacity:0.55; transform:scale(0.8); }
            }
            .chat-pill__icon {
              width: 20px;
              height: 20px;
              object-fit: contain;
              flex-shrink: 0;
            }
            .chat-pill__label {
              white-space: nowrap;
            }
            .chat-pill__chevron {
              width: 14px;
              height: 14px;
              color: #a07828;
              flex-shrink: 0;
            }
            .hero-chat-entry--hidden {
              display: none !important;
            }
          `}</style>
        </button>
      )}
      <section id="about" className="mx-auto max-w-7xl px-6 pb-16 pt-24 md:pb-20 md:pt-28">
        <div className="mx-auto mt-4 max-w-5xl text-center scroll-fade-up">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-[#A88A49]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>About Us</p>
          <div className="mx-auto h-[2px] w-14 bg-[#A88A49]" />
          <h2 className="mt-5 text-4xl font-normal text-[#111827] md:text-3xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Your Life At Emerald
          </h2>
          <div className="mx-auto mt-8 max-w-4xl text-[17px] font-normal leading-relaxed tracking-[0.01em] text-stone-600">
            <p style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              A peaceful atmosphere and elegant rooms make every stay special and relaxing.
              <br />
              <span>You can unwind, enjoy warm hospitality, and experience comfort designed for memorable moments.</span>
            </p>
          </div>
        </div>
        <div className="mt-19 grid gap-6 md:grid-cols-3">
          {hotelHighlights.map((item, i) => (
            <div key={item.title} className={`text-center scroll-fade-up stagger-${i + 1}`} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <div className="about-icon mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#A88A49] shadow-md">
                {item.icon}
              </div>
              <h3 className="text-2xl font-semibold md:text-2xl">{item.title}</h3>
              <p className="mx-auto mt-3 max-w-sm text-base text-stone-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
      <section id="rooms" className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        <div className="mb-12 flex flex-col items-center gap-4 text-center scroll-fade-up">
          <div className="max-w-5xl">
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#A88A49]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Rooms & Suites</p>
            <div className="mx-auto h-[3px] w-14 bg-[#A88A49]" />
            <h3 className="mt-5 text-4xl font-normal text-[#111827] md:text-3xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Choose the experience that fits your stay
            </h3>
          </div>
        </div>
        <style>{`
          .rooms-slider {
            -ms-overflow-style: none;
            scrollbar-width: none;
            overflow-y: hidden;
          }
          .rooms-slider::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {packagesLoading ? (
          <div className="rounded-[24px] border border-[#E7D8B5] bg-[linear-gradient(135deg,#fffdf7_0%,#f6efe2_100%)] p-8 text-center text-stone-700 shadow-[0_18px_50px_rgba(85,63,21,0.08)]">
            Loading packages...
          </div>
        ) : packagesError ? (
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-8 text-center text-red-700">
            Unable to load packages right now.
          </div>
        ) : featuredPackages.length === 0 ? (
          <div className="rounded-[24px] border border-[#E7D8B5] bg-[linear-gradient(135deg,#fffdf7_0%,#f6efe2_100%)] p-8 text-center text-stone-700 shadow-[0_18px_50px_rgba(85,63,21,0.08)]">
            No active packages available at the moment.
          </div>
        ) : (
          <>
            <div
              ref={roomsSliderRef}
              className="rooms-slider flex snap-x snap-mandatory gap-5 overflow-x-auto overflow-y-hidden px-1 pb-2 scroll-smooth"
            >
              {featuredPackages.map((pkg, i) => (
                <div
                  key={pkg.id}
                  data-room-card="true"
                  className={`group relative flex h-full w-full min-w-[250px] max-w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-[26px] border border-[#E8DABD] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,239,224,0.94)_100%)] shadow-[0_20px_45px_rgba(87,63,14,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(87,63,14,0.16)] scroll-fade-up stagger-${Math.min(i + 1, 8)}`}
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={pkg.imageUrl || DEFAULT_PACKAGE_IMAGE}
                      alt={pkg.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_PACKAGE_IMAGE;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1f1a12]/75 via-[#1f1a12]/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
                      <span className="rounded-full border border-white/25 bg-white/14 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white backdrop-blur-sm">
                        {pkg.roomType}
                      </span>
                      <span className="rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur-sm">
                        Room {pkg.roomNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="space-y-2">
                      <h4 className="text-[1.1rem] font-semibold leading-tight text-stone-900">{pkg.name}</h4>
                      <p
                        className="text-sm leading-6 text-stone-600"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {pkg.description || "Curated stay experience with elegant comforts and thoughtful details."}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-stone-500">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-[#E9DEC9]">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#A88A49]" fill="none" stroke="currentColor" strokeWidth="1.9">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5h16M6 17V9.5A2.5 2.5 0 0 1 8.5 7h7A2.5 2.5 0 0 1 18 9.5V17M6 12h12" />
                        </svg>
                        {pkg.maxOccupancy} Guests
                      </span>
                    </div>

                    {pkg.addOns.length > 0 && (
                      <div className="mt-4 flex min-h-[84px] flex-wrap content-start gap-2">
                        {pkg.addOns.slice(0, 4).map((addon) => {
                          const meta = getAddonMeta(addon);
                          return (
                            <span
                              key={addon}
                              className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-medium text-stone-700 ring-1 ring-[#E9DEC9]"
                            >
                              <span className="text-[#A88A49]">{meta.icon}</span>
                              {meta.label}
                            </span>
                          );
                        })}
                        {pkg.addOns.length > 4 && (
                          <span className="inline-flex items-center rounded-full bg-[#F3E7CC] px-3 py-1.5 text-[11px] font-medium text-[#8A6A25]">
                            +{pkg.addOns.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto pt-5">
                      <button
                        type="button"
                        onClick={openPackageChat}
                        className="inline-flex w-full items-center justify-center rounded-full bg-[#B9964C] px-4 py-2.5 text-sm font-medium text-stone-950 transition hover:bg-[#AC8B43]"
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </>
        )}
      </section>
      <section id="offers" className="bg-white py-20 text-stone-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-0 lg:flex-row lg:items-center">
            <div className="order-1 flex flex-col justify-center py-8 lg:w-[35%] lg:shrink-0 lg:pr-14 scroll-fade-left">
              <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#A88A49]">Experience</p>
              <div className="mb-3 h-[2px] w-14 bg-[#A88A49]" />
              <h3 className="text-4xl font-normal leading-tight md:text-5xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Luxury Stays &amp; Unforgettable Moments</h3>
              <p className="mt-6 text-base leading-relaxed text-stone-500 md:text-lg" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                Experience extraordinary stays with our portfolio of luxury and lifestyle properties, designed to be the backdrop of your life&apos;s special moments.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button className="border border-stone-800 px-8 py-3 text-sm uppercase tracking-widest text-stone-800 transition hover:bg-stone-800 hover:text-white">
                  View More
                </button>
              </div>
            </div>
            <div className="order-2 flex-1 overflow-hidden scroll-fade-right">
              <div className="flex border-b border-[#C9A96E]" style={{ height: "360px" }}>
                <div className="flex w-1/3 shrink-0 items-center justify-center border-r border-[#C9A96E] p-6 text-center" style={{ backgroundImage: `linear-gradient(90deg,#fff 0%,rgba(255,255,255,0) 18%),linear-gradient(270deg,#fff 0%,rgba(255,255,255,0) 18%),linear-gradient(0deg,#fff 0%,rgba(255,255,255,0) 18%),linear-gradient(180deg,#fff 0%,rgba(255,255,255,0) 18%),url(${bgPattern})`, backgroundRepeat: "no-repeat", backgroundSize: "cover" }}>
                  <p className="text-3xl font-normal leading-snug text-stone-700" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Sunset <br />Lounge</p>
                </div>
                <div className="h-full flex-1 overflow-hidden p-3">
                  <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80" alt="Sunset Lounge" className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="flex border-b border-[#C9A96E]" style={{ height: "300px" }}>
                <div className="hidden h-full w-1/2 overflow-hidden border-r border-[#C9A96E] p-3 sm:block">
                  <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80" alt="Luxury room" className="h-full w-full object-cover" />
                </div>
                <div className="flex w-1/4 shrink-0 items-center justify-center border-r border-[#C9A96E] p-4 text-center sm:w-[18%]" style={{ backgroundImage: `linear-gradient(90deg,#fff 0%,rgba(255,255,255,0) 18%),linear-gradient(270deg,#fff 0%,rgba(255,255,255,0) 18%),linear-gradient(0deg,#fff 0%,rgba(255,255,255,0) 18%),linear-gradient(180deg,#fff 0%,rgba(255,255,255,0) 18%),url(${bgPattern})`, backgroundRepeat: "no-repeat", backgroundSize: "cover" }}>
                  <p className="text-2xl font-normal leading-snug text-stone-700" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Life At<br />Verticle</p>
                </div>
                <div className="h-full flex-1 overflow-hidden p-3">
                  <img src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80" alt="Resort pool" className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="flex" style={{ height: "260px" }}>
                <div className="h-full w-2/3 overflow-hidden border-r border-[#C9A96E] p-3">
                  <img src="https://images.unsplash.com/photo-1591343395082-e120087004b4?q=80&w=1171&auto=format&fit=crop" alt="Spa" className="h-full w-full object-cover" />
                </div>
                <div className="flex w-1/3 shrink-0 items-center justify-center p-6 text-center" style={{ backgroundImage: `linear-gradient(90deg,#fff 0%,rgba(255,255,255,0) 18%),linear-gradient(270deg,#fff 0%,rgba(255,255,255,0) 18%),linear-gradient(0deg,#fff 0%,rgba(255,255,255,0) 18%),linear-gradient(180deg,#fff 0%,rgba(255,255,255,0) 18%),url(${bgPattern})`, backgroundRepeat: "no-repeat", backgroundSize: "cover" }}>
                  <p className="text-3xl font-normal leading-snug text-stone-700" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Zhu,<br />The Spa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="chatbot" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 text-center scroll-fade-up">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#A88A49]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Discover Your Stay</p>
          <div className="mx-auto h-[2px] w-14 bg-[#A88A49]" />
        </div>
        <div className="grid gap-8 rounded-[32px] border border-yellow-200 bg-yellow-50 p-8 md:grid-cols-2 md:p-12 scroll-scale-in">
          <div>
            <h3 className="text-3xl font-normal text-[#111827]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Turn your hotel booking experience seamless and personalized
            </h3>
            <p className="mt-5 leading-relaxed md:leading-6 text-stone-900/75" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Explore elegant and thoughtfully designed rooms, discover exclusive packages crafted for unforgettable stays, and complete your reservation through a smooth and personalized booking experience designed for your comfort.
            </p>
          </div>
          <div className="hover-lift rounded-[28px] bg-[#F5EDE0] p-6 shadow-2xl">
            <div className="space-y-4">
              <div className="ml-auto max-w-xs rounded-2xl px-4 py-3 text-white text-sm leading-relaxed" style={{ background: "linear-gradient(135deg, #D4A84B 0%, #C8922A 100%)" }}>
                Hi, I want a room for 2 nights near beach.
              </div>
              <div className="max-w-sm rounded-2xl bg-[#FDF6ED] px-4 py-3 text-sm leading-relaxed text-stone-700 shadow-sm">
                I found 3 great options for you. Would you like to explore our Deluxe Ocean Room package starting at $120 per night?
              </div>
              <div className="ml-auto max-w-xs rounded-2xl px-4 py-3 text-white text-sm leading-relaxed" style={{ background: "linear-gradient(135deg, #D4A84B 0%, #C8922A 100%)" }}>
                Can you offer a better rate?
              </div>
              <div className="max-w-sm rounded-2xl bg-[#FDF6ED] px-4 py-3 text-sm leading-relaxed text-stone-700 shadow-sm">
                I can offer a limited discount with breakfast included. Would you like to continue?
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="border-t border-yellow-200 bg-white px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 text-center scroll-fade-up">
          <img src={logo} alt="Emerald Lagoon" className="h-10 w-auto" />
          <p className="text-sm text-stone-900/55">Â© 2026 Emerald Lagoon</p>
        </div>
      </footer>
    </div>
  );
}
