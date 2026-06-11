import { cn } from "@/lib/utils";
import type { HQAgent } from "@/lib/hq/types";

/**
 * Phase 28 — cute office-mascot characters.
 * Each agent is a recognizable mascot with a signature looping animation
 * (pure CSS keyframes defined in globals.css, cheap to render).
 */
function CharacterSvg({ character, accent }: { character: HQAgent["character"]; accent: string }) {
  const props = { fill: "none", stroke: accent, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const thin = { ...props, strokeWidth: 1 };

  switch (character) {
    // ── Scout: fox explorer with glasses, hat, backpack, magnifying glass ──
    case "scout_explorer":
      return (
        <>
          {/* backpack peeking behind */}
          <rect x="9" y="26" width="9" height="12" rx="3" fill="#8d6e4b" stroke="#6b4f33" strokeWidth="1" />
          <path d="M11 28 L16 28" stroke="#6b4f33" strokeWidth="1" />
          {/* fox ears */}
          <path d="M15 9 L18 2 L22 8 Z" fill="#e8853d" stroke="#c9651f" strokeWidth="1" />
          <path d="M33 9 L30 2 L26 8 Z" fill="#e8853d" stroke="#c9651f" strokeWidth="1" />
          <path d="M16.5 7.5 L18 4 L20.5 7.5 Z" fill="#fff3e6" />
          <path d="M31.5 7.5 L30 4 L27.5 7.5 Z" fill="#fff3e6" />
          {/* head */}
          <circle cx="24" cy="14" r="9" fill="#f59e54" stroke="#c9651f" strokeWidth="1.2" />
          {/* white muzzle */}
          <path d="M19 16 Q24 23 29 16 Q27 19.5 24 19.5 Q21 19.5 19 16" fill="#fff3e6" />
          {/* explorer hat */}
          <path d="M13 9 Q24 1 35 9 L33 6.5 Q24 -1 15 6.5 Z" fill="#7a9b66" stroke="#5d7a4d" strokeWidth="1" />
          <rect x="13" y="8" width="22" height="2.4" rx="1.2" fill="#5d7a4d" />
          {/* glasses */}
          <circle cx="20.5" cy="13.5" r="3" fill="white" fillOpacity="0.6" stroke="#5b4632" strokeWidth="1.2" />
          <circle cx="27.5" cy="13.5" r="3" fill="white" fillOpacity="0.6" stroke="#5b4632" strokeWidth="1.2" />
          <path d="M23.5 13.5 L24.5 13.5" stroke="#5b4632" strokeWidth="1.2" />
          <circle cx="20.5" cy="13.5" r="1.2" fill="#3b2c1d" />
          <circle cx="27.5" cy="13.5" r="1.2" fill="#3b2c1d" />
          {/* nose + smile */}
          <circle cx="24" cy="17" r="1.2" fill="#5b4632" />
          <path d="M22.5 19 Q24 20.4 25.5 19" {...thin} stroke="#5b4632" />
          {/* body with scarf */}
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill="#f8b878" stroke="#c9651f" strokeWidth="1.2" />
          <path d="M17 27.5 Q24 31 31 27.5 L30.5 30.5 Q24 33.5 17.5 30.5 Z" fill="#b54834" />
          <path d="M24 32 L24 41" stroke="#fff3e6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          {/* fox tail */}
          <path d="M31 40 Q40 42 39 34 Q44 42 33 45 Z" fill="#f59e54" stroke="#c9651f" strokeWidth="1" />
          <path d="M37.5 35.5 Q40.5 38 36 41" fill="#fff3e6" />
          {/* signature: sweeping magnifying glass */}
          <g className="hq-anim-inspect" style={{ transformOrigin: "36px 30px" }}>
            <circle cx="36" cy="26" r="4.5" fill="#dff0fa" fillOpacity="0.7" stroke="#5b4632" strokeWidth="1.5" />
            <path d="M39 29.5 L42.5 33.5" stroke="#5b4632" strokeWidth="2" strokeLinecap="round" />
            <path d="M34 24.5 Q35.5 23.5 37 24.5" {...thin} stroke="#9cc7e0" />
          </g>
        </>
      );

    // ── Roots: green community listener, headphones + plant hoodie ──
    case "roots":
      return (
        <>
          {/* hoodie hood behind head */}
          <path d="M13 16 Q12 6 24 5 Q36 6 35 16 Q36 22 33 24 L15 24 Q12 22 13 16" fill="#4d8a5b" stroke="#356645" strokeWidth="1.2" />
          {/* head */}
          <circle cx="24" cy="14" r="8" fill="#a3d9a5" stroke="#356645" strokeWidth="1.2" />
          {/* sprout on head */}
          <g className="hq-anim-sway" style={{ transformOrigin: "24px 7px" }}>
            <path d="M24 7 L24 3.5" stroke="#356645" strokeWidth="1.2" />
            <path d="M24 4 Q20.5 1.5 19.5 4.5 Q22 6 24 4" fill="#74c365" stroke="#356645" strokeWidth="0.8" />
            <path d="M24 4 Q27.5 1.5 28.5 4.5 Q26 6 24 4" fill="#74c365" stroke="#356645" strokeWidth="0.8" />
          </g>
          {/* face */}
          <circle cx="21" cy="13.5" r="1.4" fill="#1f3d2b" />
          <circle cx="27" cy="13.5" r="1.4" fill="#1f3d2b" />
          <path d="M22 17 Q24 19 26 17" {...thin} stroke="#1f3d2b" />
          <circle cx="18.5" cy="16" r="1.3" fill="#74c365" opacity="0.5" />
          <circle cx="29.5" cy="16" r="1.3" fill="#74c365" opacity="0.5" />
          {/* signature: pulsing headphones */}
          <g className="hq-anim-pulse-soft" style={{ transformOrigin: "24px 13px" }}>
            <path d="M15 13 Q15 4.5 24 4.5 Q33 4.5 33 13" fill="none" stroke="#2b4d3a" strokeWidth="2" />
            <rect x="13" y="11" width="4.5" height="7" rx="2" fill="#2b4d3a" />
            <rect x="30.5" y="11" width="4.5" height="7" rx="2" fill="#2b4d3a" />
          </g>
          {/* sound waves */}
          <g className="hq-anim-wave">
            <path d="M10 12 Q8.5 14 10 16" {...thin} stroke="#74c365" />
            <path d="M38 12 Q39.5 14 38 16" {...thin} stroke="#74c365" />
          </g>
          {/* plant hoodie body */}
          <path d="M15 28 Q24 24 33 28 L31 44 L17 44 Z" fill="#5ea36c" stroke="#356645" strokeWidth="1.2" />
          <path d="M24 28 L24 44" stroke="#356645" strokeWidth="1" opacity="0.5" />
          <path d="M20 31 Q22 29 24 31 M24 31 Q26 29 28 31" {...thin} stroke="#cfe8cf" />
          {/* hoodie pocket with tiny leaf */}
          <path d="M19 36 L29 36 L28 41 L20 41 Z" fill="#4d8a5b" stroke="#356645" strokeWidth="0.8" />
          <path d="M24 37 Q22 35 21 37.5 Q23 39 24 37" fill="#a3d9a5" />
        </>
      );

    // ── Bloom: pink flower content creator with laptop ──
    case "bloom":
      return (
        <>
          {/* petal crown */}
          <g className="hq-anim-sway" style={{ transformOrigin: "24px 10px" }}>
            <ellipse cx="17" cy="8" rx="3.5" ry="4.5" fill="#f9a8d4" stroke="#db5f9a" strokeWidth="0.8" transform="rotate(-30 17 8)" />
            <ellipse cx="31" cy="8" rx="3.5" ry="4.5" fill="#f9a8d4" stroke="#db5f9a" strokeWidth="0.8" transform="rotate(30 31 8)" />
            <ellipse cx="20" cy="5" rx="3.2" ry="4.2" fill="#fbc1e0" stroke="#db5f9a" strokeWidth="0.8" transform="rotate(-12 20 5)" />
            <ellipse cx="28" cy="5" rx="3.2" ry="4.2" fill="#fbc1e0" stroke="#db5f9a" strokeWidth="0.8" transform="rotate(12 28 5)" />
            <ellipse cx="24" cy="4" rx="3.2" ry="4.2" fill="#f9a8d4" stroke="#db5f9a" strokeWidth="0.8" />
          </g>
          {/* head */}
          <circle cx="24" cy="14" r="8" fill="#fde2ef" stroke="#db5f9a" strokeWidth="1.2" />
          <circle cx="21" cy="13.5" r="1.4" fill="#8c2f5c" />
          <circle cx="27" cy="13.5" r="1.4" fill="#8c2f5c" />
          <path d="M21.5 16.5 Q24 19 26.5 16.5" {...thin} stroke="#8c2f5c" />
          <circle cx="18.5" cy="15.5" r="1.4" fill="#f9a8d4" />
          <circle cx="29.5" cy="15.5" r="1.4" fill="#f9a8d4" />
          {/* body */}
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill="#f6b9d8" stroke="#db5f9a" strokeWidth="1.2" />
          <path d="M20 30 Q24 32.5 28 30" {...thin} stroke="#db5f9a" />
          {/* signature: laptop with rapid typing dots */}
          <path d="M14 38 L28 38 L29 44 L13 44 Z" fill="#9d7bb8" stroke="#6d4f87" strokeWidth="1.2" />
          <rect x="15" y="30.5" width="12.5" height="8" rx="1" fill="#f3eafa" stroke="#6d4f87" strokeWidth="1.2" />
          <g className="hq-anim-type">
            <circle cx="18.5" cy="34.5" r="1" fill="#a855f7" />
            <circle cx="21.5" cy="34.5" r="1" fill="#a855f7" />
            <circle cx="24.5" cy="34.5" r="1" fill="#a855f7" />
          </g>
          {/* signature: content card flying off */}
          <g className="hq-anim-card-toss">
            <rect x="33" y="26" width="8" height="6" rx="1" fill="white" stroke="#db5f9a" strokeWidth="1" />
            <path d="M34.5 28 L39 28 M34.5 30 L37.5 30" {...thin} stroke="#db5f9a" />
          </g>
        </>
      );

    // ── Sage: wise turtle professor reviewing papers ──
    case "sage":
      return (
        <>
          {/* shell */}
          <path d="M14 32 Q14 23 24 23 Q34 23 34 32 Q34 42 24 43 Q14 42 14 32" fill="#2f8077" stroke="#1d5a52" strokeWidth="1.4" />
          <path d="M19 27 L24 25 L29 27 L30.5 33 L27 38.5 L21 38.5 L17.5 33 Z" fill="#56a89b" stroke="#1d5a52" strokeWidth="0.9" />
          <path d="M24 25 L24 38.5 M17.5 33 L30.5 33" stroke="#1d5a52" strokeWidth="0.7" opacity="0.6" />
          {/* head */}
          <circle cx="24" cy="13" r="7.5" fill="#bfe3c0" stroke="#1d5a52" strokeWidth="1.2" />
          {/* little professor brows */}
          <path d="M18.5 9.5 Q20.5 8.5 22 9.5 M26 9.5 Q27.5 8.5 29.5 9.5" {...thin} stroke="#1d5a52" />
          {/* round glasses */}
          <circle cx="21" cy="12.5" r="2.8" fill="white" fillOpacity="0.65" stroke="#5b4632" strokeWidth="1.2" />
          <circle cx="27" cy="12.5" r="2.8" fill="white" fillOpacity="0.65" stroke="#5b4632" strokeWidth="1.2" />
          <path d="M23.8 12.5 L24.2 12.5" stroke="#5b4632" strokeWidth="1.2" />
          <circle cx="21" cy="12.5" r="1.1" fill="#1f3d2b" />
          <circle cx="27" cy="12.5" r="1.1" fill="#1f3d2b" />
          {/* gentle smile */}
          <path d="M22 16.5 Q24 18 26 16.5" {...thin} stroke="#1d5a52" />
          {/* signature: paper + stamping arm */}
          <rect x="6" y="30" width="10" height="13" rx="1" fill="white" stroke="#1d5a52" strokeWidth="1.1" />
          <path d="M8 33 L14 33 M8 36 L13 36 M8 39 L12.5 39" {...thin} stroke="#94a3b8" />
          <g className="hq-anim-stamp" style={{ transformOrigin: "34px 30px" }}>
            <rect x="33" y="24" width="6" height="4" rx="1" fill="#b54834" stroke="#8c2f20" strokeWidth="0.9" />
            <path d="M36 28 L36 31" stroke="#8c2f20" strokeWidth="2" strokeLinecap="round" />
          </g>
          <path d="M9 41.5 L13 41.5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" className="hq-anim-blink" />
        </>
      );

    // ── Gate: serious-but-cute approval guard with checklist + stamp ──
    case "gatekeeper":
      return (
        <>
          {/* guard cap */}
          <path d="M15 9 Q24 3 33 9 L33 11 L15 11 Z" fill="#2d6a4f" stroke="#1d4733" strokeWidth="1" />
          <rect x="14" y="10.5" width="20" height="2.6" rx="1.3" fill="#1d4733" />
          <circle cx="24" cy="7.5" r="1.3" fill="#facc15" stroke="#1d4733" strokeWidth="0.6" />
          {/* head */}
          <circle cx="24" cy="15" r="8" fill="#d9eadf" stroke="#1d4733" strokeWidth="1.2" />
          <circle cx="21" cy="14.5" r="1.4" fill="#1d3a2b" />
          <circle cx="27" cy="14.5" r="1.4" fill="#1d3a2b" />
          {/* serious-but-cute straight mouth */}
          <path d="M22 18.5 L26 18.5" {...thin} stroke="#1d3a2b" />
          <path d="M19 12.5 L22.5 12.5 M25.5 12.5 L29 12.5" {...thin} stroke="#1d4733" />
          {/* uniform body */}
          <path d="M16 29 Q24 25 32 29 L30 44 L18 44 Z" fill="#3c8765" stroke="#1d4733" strokeWidth="1.2" />
          <path d="M24 29 L24 44" stroke="#1d4733" strokeWidth="1" opacity="0.5" />
          <circle cx="24" cy="33" r="0.9" fill="#facc15" />
          <circle cx="24" cy="37" r="0.9" fill="#facc15" />
          {/* shoulder badge */}
          <rect x="17" y="30" width="4" height="3" rx="0.8" fill="#facc15" stroke="#1d4733" strokeWidth="0.6" />
          {/* signature: checklist clipboard */}
          <rect x="6.5" y="28" width="9.5" height="13" rx="1.2" fill="white" stroke="#1d4733" strokeWidth="1.1" />
          <rect x="9.5" y="26.8" width="3.5" height="2.4" rx="0.8" fill="#9ca3af" />
          <path d="M8.5 32 L10 33.5 L12.5 30.5" {...thin} stroke="#22c55e" strokeWidth="1.3" />
          <path d="M8.5 36.5 L10 38 L12.5 35" {...thin} stroke="#22c55e" strokeWidth="1.3" className="hq-anim-blink" />
          <path d="M13.5 32.5 L15 32.5 M13.5 37 L15 37" {...thin} stroke="#94a3b8" />
          {/* signature: gate barrier opening/closing */}
          <g className="hq-anim-gate" style={{ transformOrigin: "34px 42px" }}>
            <rect x="33" y="28" width="10" height="3" rx="1.5" fill="#f87171" stroke="#b54834" strokeWidth="0.9" />
            <path d="M35 28.4 L37 30.6 M39 28.4 L41 30.6" stroke="white" strokeWidth="1.2" />
          </g>
          <rect x="32.5" y="40" width="3" height="4" rx="1" fill="#6b7280" />
        </>
      );

    // ── Sprout: cheerful blue messenger with calendar + megaphone ──
    case "sprout":
      return (
        <>
          {/* messenger cap (blue) */}
          <path d="M16 9.5 Q24 3.5 32 9.5 L32 11 L16 11 Z" fill="#3b82c4" stroke="#1d5a96" strokeWidth="1" />
          <path d="M30 10.5 L37 10.5 Q35 13 30 12.6 Z" fill="#1d5a96" />
          {/* sprout leaf through the cap */}
          <g className="hq-anim-sway" style={{ transformOrigin: "24px 6px" }}>
            <path d="M24 6.5 Q20.5 3 19 5.5 Q21.5 7.5 24 6.5" fill="#74c365" stroke="#356645" strokeWidth="0.8" />
            <path d="M24 6.5 Q27.5 3 29 5.5 Q26.5 7.5 24 6.5" fill="#74c365" stroke="#356645" strokeWidth="0.8" />
          </g>
          {/* head */}
          <circle cx="24" cy="15" r="8" fill="#cfe6f7" stroke="#1d5a96" strokeWidth="1.2" />
          <circle cx="21" cy="14.5" r="1.4" fill="#173d5e" />
          <circle cx="27" cy="14.5" r="1.4" fill="#173d5e" />
          {/* big cheerful smile */}
          <path d="M21 17.5 Q24 20.5 27 17.5" {...thin} stroke="#173d5e" />
          <circle cx="18.5" cy="16.5" r="1.3" fill="#7db8e8" opacity="0.6" />
          <circle cx="29.5" cy="16.5" r="1.3" fill="#7db8e8" opacity="0.6" />
          {/* messenger body with satchel strap */}
          <path d="M16 29 Q24 25 32 29 L30 44 L18 44 Z" fill="#5ea3d8" stroke="#1d5a96" strokeWidth="1.2" />
          <path d="M17 29.5 L30 41" stroke="#facc15" strokeWidth="2" opacity="0.85" />
          {/* signature: calendar satchel */}
          <rect x="13" y="33" width="9" height="8" rx="1.2" fill="white" stroke="#1d5a96" strokeWidth="1.1" />
          <rect x="13" y="33" width="9" height="2.4" fill="#ef6a6a" />
          <path d="M15 37.5 L17 37.5 M19 37.5 L20.5 37.5 M15 39.5 L17 39.5" {...thin} stroke="#94a3b8" />
          {/* signature: megaphone with sound burst */}
          <g className="hq-anim-megaphone" style={{ transformOrigin: "33px 33px" }}>
            <path d="M31 31 L38 27.5 L38 38.5 L31 35 Z" fill="#facc15" stroke="#b8860b" strokeWidth="1" />
            <rect x="29" y="31" width="3" height="4" rx="1" fill="#b8860b" />
            <g className="hq-anim-wave">
              <path d="M40 29.5 Q42 33 40 36.5" {...thin} stroke="#3b82c4" />
              <path d="M42.5 28 Q45.5 33 42.5 38" {...thin} stroke="#3b82c4" opacity="0.6" />
            </g>
          </g>
          {/* flying envelope */}
          <g className="hq-anim-card-toss">
            <rect x="36" y="18" width="7" height="5" rx="0.8" fill="white" stroke="#1d5a96" strokeWidth="0.9" />
            <path d="M36 18.5 L39.5 21 L43 18.5" {...thin} stroke="#1d5a96" />
          </g>
        </>
      );

    // ── Sentinel: robot crow analyst at radar screens ──
    case "sentinel":
      return (
        <>
          {/* antenna */}
          <path d="M24 5.5 L24 2.5" stroke="#3d4f5f" strokeWidth="1.4" />
          <circle cx="24" cy="2" r="1.6" fill="#ef4444" className="hq-anim-blink" />
          {/* crow head — angular robot */}
          <path d="M15 13 Q15 5.5 24 5.5 Q33 5.5 33 13 Q33 20 24 21 Q15 20 15 13" fill="#46586a" stroke="#2c3a47" strokeWidth="1.3" />
          {/* beak */}
          <path d="M22 16 L26 16 L24 20.5 Z" fill="#f59e0b" stroke="#b8860b" strokeWidth="0.9" />
          {/* glowing robot eyes */}
          <circle cx="20.5" cy="12.5" r="2.3" fill="#0f172a" stroke="#67e8f9" strokeWidth="0.8" />
          <circle cx="27.5" cy="12.5" r="2.3" fill="#0f172a" stroke="#67e8f9" strokeWidth="0.8" />
          <circle cx="20.5" cy="12.5" r="1" fill="#67e8f9" className="hq-anim-blink" />
          <circle cx="27.5" cy="12.5" r="1" fill="#67e8f9" className="hq-anim-blink" />
          {/* head plate seams */}
          <path d="M17 9 L21 8 M27 8 L31 9" {...thin} stroke="#2c3a47" />
          {/* feathered robot body */}
          <path d="M16 27 Q24 23.5 32 27 L30 44 L18 44 Z" fill="#5a6e80" stroke="#2c3a47" strokeWidth="1.2" />
          <path d="M19 31 Q21 33 23 31 M25 31 Q27 33 29 31 M21 35.5 Q23 37.5 25 35.5" {...thin} stroke="#2c3a47" opacity="0.7" />
          {/* chest light */}
          <circle cx="24" cy="29.5" r="1.4" fill="#67e8f9" className="hq-anim-blink" />
          {/* wing */}
          <path d="M31 29 Q38 31 36 38 Q33 35 31 36 Z" fill="#46586a" stroke="#2c3a47" strokeWidth="1" />
          {/* signature: radar screen with sweep */}
          <rect x="4.5" y="26" width="12" height="10" rx="1.4" fill="#0f2433" stroke="#2c3a47" strokeWidth="1.1" />
          <circle cx="10.5" cy="31" r="3.6" fill="none" stroke="#1e5f74" strokeWidth="0.7" />
          <circle cx="10.5" cy="31" r="1.9" fill="none" stroke="#1e5f74" strokeWidth="0.7" />
          <g className="hq-anim-radar" style={{ transformOrigin: "10.5px 31px" }}>
            <path d="M10.5 31 L10.5 27" stroke="#22d3ee" strokeWidth="1.1" strokeLinecap="round" />
          </g>
          <circle cx="12.5" cy="29.5" r="0.8" fill="#22d3ee" className="hq-anim-blink" />
          <path d="M6 38.5 L15 38.5" stroke="#6b7280" strokeWidth="1.6" />
          <path d="M10.5 36 L10.5 38.5" stroke="#6b7280" strokeWidth="1.6" />
        </>
      );

    // ── Oak: beaver partnership builder with briefcase ──
    case "oak":
      return (
        <>
          {/* round beaver ears */}
          <circle cx="17" cy="7" r="3" fill="#9c6b3f" stroke="#6b4423" strokeWidth="1" />
          <circle cx="31" cy="7" r="3" fill="#9c6b3f" stroke="#6b4423" strokeWidth="1" />
          <circle cx="17" cy="7" r="1.3" fill="#caa479" />
          <circle cx="31" cy="7" r="1.3" fill="#caa479" />
          {/* head */}
          <circle cx="24" cy="14" r="8.5" fill="#b08152" stroke="#6b4423" strokeWidth="1.2" />
          {/* muzzle + buck teeth */}
          <ellipse cx="24" cy="17.5" rx="4.5" ry="3.4" fill="#e3c9a8" />
          <circle cx="24" cy="15.5" r="1.5" fill="#4a2f17" />
          <rect x="22.2" y="17.5" width="1.7" height="3" rx="0.5" fill="white" stroke="#6b4423" strokeWidth="0.5" />
          <rect x="24.1" y="17.5" width="1.7" height="3" rx="0.5" fill="white" stroke="#6b4423" strokeWidth="0.5" />
          <circle cx="20.5" cy="12.5" r="1.4" fill="#4a2f17" />
          <circle cx="27.5" cy="12.5" r="1.4" fill="#4a2f17" />
          {/* smart tie + vest body */}
          <path d="M16 28 Q24 24.5 32 28 L30 44 L18 44 Z" fill="#c79a6b" stroke="#6b4423" strokeWidth="1.2" />
          <path d="M22 28 L24 31 L26 28" fill="white" stroke="#6b4423" strokeWidth="0.8" />
          <path d="M24 31 L25.3 36 L24 39 L22.7 36 Z" fill="#b54834" stroke="#8c2f20" strokeWidth="0.7" />
          {/* flat beaver tail with crosshatch */}
          <g className="hq-anim-tail" style={{ transformOrigin: "33px 41px" }}>
            <ellipse cx="37" cy="41.5" rx="6.5" ry="3.6" fill="#8c6243" stroke="#6b4423" strokeWidth="1" />
            <path d="M33 40 L41 43 M33 43 L41 40" {...thin} stroke="#6b4423" opacity="0.6" />
          </g>
          {/* signature: briefcase + handshake card */}
          <rect x="6" y="33" width="11" height="8.5" rx="1.4" fill="#7a4f2a" stroke="#54351b" strokeWidth="1.1" />
          <rect x="9.8" y="31.4" width="3.4" height="2.4" rx="0.9" fill="none" stroke="#54351b" strokeWidth="1.1" />
          <path d="M6 36.8 L17 36.8" stroke="#54351b" strokeWidth="0.8" />
          <g className="hq-anim-handshake" style={{ transformOrigin: "12px 27px" }}>
            <rect x="7.5" y="23" width="9" height="6" rx="1" fill="white" stroke="#6b4423" strokeWidth="0.9" />
            <path d="M9.5 26 Q11 24.5 12 26 Q13 27.5 14.5 26" {...thin} stroke="#b54834" />
          </g>
        </>
      );

    // ── Ivy: calm plant-crowned Chief of Staff ──
    case "ivy":
      return (
        <>
          {/* vine crown */}
          <g className="hq-anim-sway" style={{ transformOrigin: "24px 7px" }}>
            <path d="M14 9 Q19 4 24 6.5 Q29 4 34 9" fill="none" stroke="#356645" strokeWidth="1.4" />
            <path d="M16 7.5 Q14.5 4.5 17.5 4 Q18.5 6.5 16 7.5" fill="#74c365" stroke="#356645" strokeWidth="0.7" />
            <path d="M24 5.8 Q23 2.5 26 2.5 Q26.8 5.2 24 5.8" fill="#74c365" stroke="#356645" strokeWidth="0.7" />
            <path d="M32 7.5 Q33.5 4.5 30.5 4 Q29.5 6.5 32 7.5" fill="#74c365" stroke="#356645" strokeWidth="0.7" />
            <circle cx="20" cy="6.3" r="1" fill="#fbbf24" />
            <circle cx="28" cy="6.3" r="1" fill="#fbbf24" />
          </g>
          {/* head — calm expression */}
          <circle cx="24" cy="14.5" r="8" fill="#d8ead9" stroke="#356645" strokeWidth="1.2" />
          <path d="M19.8 13.5 Q21 12.6 22.2 13.5" {...thin} stroke="#1f3d2b" />
          <path d="M25.8 13.5 Q27 12.6 28.2 13.5" {...thin} stroke="#1f3d2b" />
          <path d="M22.5 17.2 Q24 18.4 25.5 17.2" {...thin} stroke="#1f3d2b" />
          {/* executive blazer */}
          <path d="M16 28 Q24 24.5 32 28 L30 44 L18 44 Z" fill="#3c8765" stroke="#1d4733" strokeWidth="1.2" />
          <path d="M21 27.5 L24 32 L27 27.5" fill="#d8ead9" stroke="#1d4733" strokeWidth="0.8" />
          <path d="M19 29 L21 27.5 M29 29 L27 27.5" stroke="#1d4733" strokeWidth="1" />
          {/* leaf brooch */}
          <path d="M27.5 31 Q26 29 24.8 31 Q26.2 33 27.5 31" fill="#74c365" stroke="#1d4733" strokeWidth="0.6" />
          {/* signature: organizing papers */}
          <g className="hq-anim-papers" style={{ transformOrigin: "12px 34px" }}>
            <rect x="7" y="29" width="9.5" height="12" rx="1" fill="white" stroke="#356645" strokeWidth="1" />
            <path d="M9 32.5 L14.5 32.5 M9 35.5 L14 35.5 M9 38.5 L13 38.5" {...thin} stroke="#94a3b8" />
          </g>
          <rect x="9" y="31" width="9.5" height="12" rx="1" fill="#f4f9f4" stroke="#356645" strokeWidth="0.8" opacity="0.7" />
          {/* signature: pointing at command board */}
          <g className="hq-anim-point" style={{ transformOrigin: "33px 30px" }}>
            <path d="M32 30 L39 27" stroke="#356645" strokeWidth="2" strokeLinecap="round" />
            <circle cx="40" cy="26.6" r="1.4" fill="#d8ead9" stroke="#356645" strokeWidth="0.8" />
          </g>
          <rect x="36" y="31" width="9" height="11" rx="1.2" fill="#fffdf6" stroke="#356645" strokeWidth="1" />
          <path d="M38 34 L43 34 M38 36.5 L42 36.5 M38 39 L41 39" {...thin} stroke="#356645" opacity="0.7" />
        </>
      );

    // ── Atlas: globe/tree strategist with maps + charts ──
    case "atlas":
      return (
        <>
          {/* tiny tree sprig on head */}
          <g className="hq-anim-sway" style={{ transformOrigin: "24px 6px" }}>
            <path d="M24 7 L24 3.8" stroke="#356645" strokeWidth="1.2" />
            <circle cx="24" cy="3.2" r="2.2" fill="#74c365" stroke="#356645" strokeWidth="0.8" />
          </g>
          {/* head */}
          <circle cx="24" cy="14" r="8" fill="#cfe2f3" stroke="#0d4a73" strokeWidth="1.2" />
          <circle cx="21" cy="13.5" r="1.4" fill="#0b2e47" />
          <circle cx="27" cy="13.5" r="1.4" fill="#0b2e47" />
          <path d="M22 17 Q24 18.8 26 17" {...thin} stroke="#0b2e47" />
          {/* explorer vest body */}
          <path d="M16 28 Q24 24.5 32 28 L30 44 L18 44 Z" fill="#6fa8d4" stroke="#0d4a73" strokeWidth="1.2" />
          <path d="M20 28.5 L20 43 M28 28.5 L28 43" stroke="#0d4a73" strokeWidth="0.9" opacity="0.5" />
          <rect x="21.5" y="31" width="5" height="3.6" rx="0.7" fill="#fffdf6" stroke="#0d4a73" strokeWidth="0.7" />
          <path d="M22.5 32.5 L25.5 32.5 M22.5 33.6 L24.8 33.6" stroke="#0d4a73" strokeWidth="0.5" />
          {/* signature: rotating globe on stand */}
          <g className="hq-anim-globe" style={{ transformOrigin: "11.5px 32px" }}>
            <circle cx="11.5" cy="32" r="5.5" fill="#bfdbf7" stroke="#0d4a73" strokeWidth="1.2" />
            <path d="M11.5 26.5 Q14.5 32 11.5 37.5 M11.5 26.5 Q8.5 32 11.5 37.5" {...thin} stroke="#0d4a73" opacity="0.65" />
            <path d="M6.3 30.5 Q11.5 33 16.7 30.5" {...thin} stroke="#0d4a73" opacity="0.65" />
            <path d="M7.5 28 Q9 26.5 11 27.5 Q12.5 29 10.5 30 Q8.5 30 7.5 28" fill="#74c365" opacity="0.85" />
            <path d="M12.5 33 Q15 32.5 15.5 34.5 Q13.5 36 12.5 33" fill="#74c365" opacity="0.85" />
          </g>
          <path d="M11.5 37.5 L11.5 40.5 M8.5 41 L14.5 41" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" />
          {/* signature: route plotting on chart */}
          <rect x="33" y="28" width="11" height="13" rx="1.2" fill="#fffdf6" stroke="#0d4a73" strokeWidth="1" />
          <g className="hq-anim-route">
            <path d="M35 38 L38 33.5 L40 36 L42.5 30.5" fill="none" stroke="#0d9488" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="14" />
          </g>
          <circle cx="42.5" cy="30.5" r="1.1" fill="#ef4444" className="hq-anim-blink" />
        </>
      );

    // ── Echo: blue voice-of-customer with headphones + speech bubbles ──
    case "echo":
      return (
        <>
          {/* head */}
          <circle cx="24" cy="14" r="8" fill="#c8dcf5" stroke="#1e4f8f" strokeWidth="1.2" />
          <circle cx="21" cy="13.5" r="1.4" fill="#10294d" />
          <circle cx="27" cy="13.5" r="1.4" fill="#10294d" />
          <path d="M21.5 17 Q24 19.2 26.5 17" {...thin} stroke="#10294d" />
          <circle cx="18.3" cy="15.8" r="1.3" fill="#93b8e8" opacity="0.7" />
          <circle cx="29.7" cy="15.8" r="1.3" fill="#93b8e8" opacity="0.7" />
          {/* signature: big headphones with mic */}
          <g className="hq-anim-pulse-soft" style={{ transformOrigin: "24px 13px" }}>
            <path d="M15 13 Q15 4.5 24 4.5 Q33 4.5 33 13" fill="none" stroke="#1e3a5f" strokeWidth="2.2" />
            <rect x="12.8" y="10.5" width="5" height="7.5" rx="2.2" fill="#1e3a5f" />
            <rect x="30.2" y="10.5" width="5" height="7.5" rx="2.2" fill="#1e3a5f" />
          </g>
          <path d="M33 17 Q35 21 30 21.5" {...thin} stroke="#1e3a5f" strokeWidth="1.3" />
          <circle cx="29" cy="21.5" r="1.4" fill="#1e3a5f" />
          {/* cozy sweater body */}
          <path d="M16 28 Q24 24.5 32 28 L30 44 L18 44 Z" fill="#7da9dd" stroke="#1e4f8f" strokeWidth="1.2" />
          <path d="M18 31 Q21 29.5 24 31 Q27 29.5 30 31 M18.5 35 Q21.5 33.5 24.5 35 Q27 33.5 29.5 35" {...thin} stroke="#dbeafe" opacity="0.9" />
          {/* signature: floating speech bubbles being caught */}
          <g className="hq-anim-bubble-1">
            <path d="M6 24 Q6 20.5 10 20.5 Q14 20.5 14 24 Q14 27 10.5 27.2 L8.5 29 L9 27 Q6 26.6 6 24" fill="white" stroke="#1e4f8f" strokeWidth="0.9" />
            <path d="M8.5 23.8 L11.5 23.8" {...thin} stroke="#7da9dd" />
          </g>
          <g className="hq-anim-bubble-2">
            <path d="M36 22 Q36 19 39.5 19 Q43 19 43 22 Q43 24.5 40 24.7 L38.3 26.2 L38.7 24.6 Q36 24.2 36 22" fill="white" stroke="#1e4f8f" strokeWidth="0.9" />
            <circle cx="38.5" cy="21.8" r="0.6" fill="#7da9dd" />
            <circle cx="40.5" cy="21.8" r="0.6" fill="#7da9dd" />
          </g>
          {/* open catching hand */}
          <path d="M14 32 Q11 30.5 9.5 32.5" stroke="#1e4f8f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </>
      );

    // ── Fern: squirrel growth hacker with calculator + experiments ──
    case "fern":
      return (
        <>
          {/* big fluffy tail */}
          <g className="hq-anim-tail" style={{ transformOrigin: "36px 38px" }}>
            <path d="M34 40 Q44 38 42 27 Q40 19 34 22 Q40 24 38 31 Q36.5 37 32 38 Z" fill="#c97b3d" stroke="#9c5a26" strokeWidth="1.1" />
            <path d="M37 25 Q40 28 37.5 33" {...thin} stroke="#e8a866" />
          </g>
          {/* pointy ears with tufts */}
          <path d="M16 9 L18 2.5 L21.5 8 Z" fill="#c97b3d" stroke="#9c5a26" strokeWidth="1" />
          <path d="M32 9 L30 2.5 L26.5 8 Z" fill="#c97b3d" stroke="#9c5a26" strokeWidth="1" />
          <path d="M18 3 L18 1" stroke="#9c5a26" strokeWidth="0.9" />
          <path d="M30 3 L30 1" stroke="#9c5a26" strokeWidth="0.9" />
          {/* head */}
          <circle cx="24" cy="14" r="8" fill="#e0a06a" stroke="#9c5a26" strokeWidth="1.2" />
          {/* cream cheeks/muzzle */}
          <ellipse cx="24" cy="17" rx="4.5" ry="3.2" fill="#f6e3c8" />
          <circle cx="24" cy="15.5" r="1.3" fill="#4a2f17" />
          <path d="M22.5 18.5 Q24 19.8 25.5 18.5" {...thin} stroke="#4a2f17" />
          {/* bright curious eyes */}
          <circle cx="20.5" cy="12.5" r="1.5" fill="#4a2f17" />
          <circle cx="27.5" cy="12.5" r="1.5" fill="#4a2f17" />
          <circle cx="21" cy="12" r="0.5" fill="white" />
          <circle cx="28" cy="12" r="0.5" fill="white" />
          {/* lab-apron body */}
          <path d="M16 28 Q24 24.5 32 28 L30 44 L18 44 Z" fill="#eab884" stroke="#9c5a26" strokeWidth="1.2" />
          <path d="M19 29 L29 29 L28 42 L20 42 Z" fill="#f6f8f4" stroke="#9c5a26" strokeWidth="0.8" />
          {/* signature: painter's palette on apron */}
          <ellipse cx="24" cy="35" rx="4.2" ry="3.2" fill="#f6e3c8" stroke="#9c5a26" strokeWidth="0.9" />
          <circle cx="22.4" cy="34" r="0.8" fill="#e85d9a" />
          <circle cx="25.4" cy="33.6" r="0.8" fill="#3b82f6" />
          <circle cx="24" cy="36.2" r="0.8" fill="#65a30d" />
          {/* signature: easel with canvas being painted */}
          <path d="M8 41 L11 27 M16 41 L13 27" stroke="#9c5a26" strokeWidth="1.1" strokeLinecap="round" />
          <rect x="7.5" y="27" width="9" height="7" rx="0.8" fill="#fffdf7" stroke="#9c5a26" strokeWidth="1" />
          <path d="M8.5 32 Q10 29.5 11.5 31 Q13 32.5 15.5 29" stroke="#65a30d" strokeWidth="0.9" fill="none" strokeLinecap="round" />
          <circle cx="13.5" cy="29.5" r="0.9" fill="#e85d9a" opacity="0.85" />
          {/* animated paintbrush hand */}
          <g className="hq-anim-paint" style={{ transformOrigin: "14px 33px" }}>
            <path d="M14 35 L18 30" stroke="#7c4a1f" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M13.2 36.2 L14.6 34.6" stroke="#e85d9a" strokeWidth="1.8" strokeLinecap="round" />
          </g>
          {/* tiny camera + film reel — video assets */}
          <g className="hq-anim-spark-2">
            <rect x="33" y="30" width="6" height="4.4" rx="0.9" fill="#374151" stroke="#1f2937" strokeWidth="0.7" />
            <circle cx="36" cy="32.2" r="1.3" fill="#93c5fd" stroke="#1f2937" strokeWidth="0.5" />
            <path d="M39 31 L41 30 L41 34.4 L39 33.4 Z" fill="#374151" />
          </g>
        </>
      );

    /* ── Legacy character shapes (still referenced by older data) ── */
    case "scout":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M22 17 Q24 19 26 17" {...props} />
          <circle cx="34" cy="20" r="5" {...props} />
          <path d="M37 20 L40 18" {...props} />
        </>
      );
    case "writer":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M30 32 L38 28 L38 40 L30 44 Z" fill="white" stroke={accent} strokeWidth="1.5" />
          <path d="M32 34 L36 32" {...props} />
          <path d="M32 37 L35 35" {...props} />
        </>
      );
    case "director":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <rect x="14" y="10" width="20" height="3" rx="1.5" fill={accent} opacity="0.3" />
          <path d="M20 36 L24 32 L28 36 L26 40 L22 40 Z" fill={accent} opacity="0.5" stroke={accent} strokeWidth="1" />
        </>
      );
    case "listener":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M12 22 Q8 24 10 28" {...props} />
          <path d="M36 22 Q40 24 38 28" {...props} />
          <path d="M18 38 Q24 42 30 38" {...props} />
        </>
      );
    case "scout_creator":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M22 17 Q24 19 26 17" {...props} />
          <circle cx="34" cy="30" r="4" fill="white" stroke={accent} strokeWidth="1.5" />
          <path d="M33 30 L35 32 L37 28" {...props} />
        </>
      );
    case "watchtower":
      return (
        <>
          <circle cx="24" cy="14" r="8" fill={`${accent}22`} stroke={accent} strokeWidth="1.5" />
          <path d="M16 28 Q24 24 32 28 L30 44 L18 44 Z" fill={`${accent}18`} stroke={accent} strokeWidth="1.5" />
          <circle cx="21" cy="13" r="1.5" fill={accent} />
          <circle cx="27" cy="13" r="1.5" fill={accent} />
          <path d="M10 36 L24 30 L38 36 L36 44 L12 44 Z" fill="white" stroke={accent} strokeWidth="1.5" />
          <path d="M24 30 L24 24" {...props} />
        </>
      );
  }
}

export function AgentCharacter({
  agent,
  floatDelay,
  isActive,
}: {
  agent: HQAgent;
  floatDelay: string;
  isActive?: boolean;
}) {
  const working = ["researching", "writing", "reviewing", "needs_attention"].includes(agent.status);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center",
        `hq-float ${floatDelay}`,
        working && "hq-breathe"
      )}
    >
      {working && (
        <div
          className="hq-pulse-ring absolute inset-0 rounded-2xl text-brand-accent"
          style={{ color: agent.accent }}
        />
      )}
      <div
        className={cn(
          "relative rounded-2xl border-2 bg-white/90 p-1 shadow-md backdrop-blur-sm transition-shadow",
          isActive && "shadow-lg ring-2 ring-brand-accent/40"
        )}
        style={{ borderColor: `${agent.accent}55` }}
      >
        <svg width="48" height="52" viewBox="0 0 48 52" aria-hidden>
          <CharacterSvg character={agent.character} accent={agent.accent} />
        </svg>
      </div>
      <div
        className="mt-1 h-1 w-8 rounded-full opacity-40"
        style={{ background: `linear-gradient(90deg, transparent, ${agent.accent}, transparent)` }}
      />
    </div>
  );
}
