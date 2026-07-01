import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import logo from "../assets/logo img.png";

export default function CircuitLoader({ onFinished }) {
  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const titleRef = useRef(null);
  const taglineRef = useRef(null);
  const progressFillRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // --- GSAP Entrance & Progress Animation ---
    const tl = gsap.timeline({
      onComplete: () => {
        // Exit animation when progress completes
        const exitTl = gsap.timeline({
          onComplete: () => {
            if (onFinished) onFinished();
          },
        });

        exitTl.to(
          [
            logoRef.current,
            titleRef.current,
            taglineRef.current,
            ".progress-container",
          ],
          {
            opacity: 0,
            y: -20,
            stagger: 0.08,
            duration: 0.4,
            ease: "power2.in",
          }
        );

        exitTl.to(
          containerRef.current,
          {
            opacity: 0,
            duration: 0.6,
            ease: "power2.inOut",
          },
          "-=0.2"
        );
      },
    });

    // Logo entrance animation
    tl.fromTo(
      logoRef.current,
      { scale: 0.3, opacity: 0, rotate: -15 },
      {
        scale: 1.1,
        opacity: 1,
        rotate: 0,
        duration: 1.0,
        ease: "back.out(1.8)",
      }
    );
    tl.to(
      logoRef.current,
      { scale: 1.0, duration: 0.3, ease: "power2.out" },
      "-=0.2"
    );

    // Title and tagline entrance
    tl.fromTo(
      [titleRef.current, taglineRef.current],
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.15, duration: 0.6, ease: "power3.out" },
      "-=0.6"
    );

    // Progress counting animation
    const progressObj = { value: 0 };
    tl.fromTo(
      progressObj,
      { value: 0 },
      {
        value: 100,
        duration: 2.0,
        ease: "power1.inOut",
        onUpdate: () => {
          const val = Math.floor(progressObj.value);
          setProgress(val);
          if (progressFillRef.current) {
            progressFillRef.current.style.width = `${val}%`;
          }
        },
      },
      "-=0.4"
    );

    return () => {
      tl.kill();
    };
  }, [onFinished]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen bg-[#070f22] flex flex-col items-center justify-center overflow-hidden z-[999999] pointer-events-auto select-none"
    >
      {/* Lighting radial overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18)_0%,rgba(13,27,56,0.75)_55%,#070f22_95%)] pointer-events-none z-0" />

      {/* Brand logo & texts */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-md w-[90%] mx-auto text-center">
        {/* Animated Brand Logo */}
        <div ref={logoRef} className="mb-0 relative flex items-center justify-center">
          <div className="absolute w-48 h-48 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
          <img
            src={logo}
            alt="Holiday Circuit Logo"
            className="h-36 w-auto object-contain relative z-10 filter drop-shadow-[0_8px_20px_rgba(59,130,246,0.4)]"
          />
        </div>

        {/* Animated Brand Name */}
        <h1
          ref={titleRef}
          className="text-4xl mt-0 mb-1 text-white drop-shadow-[0_4px_15px_rgba(0,0,0,0.7)] whitespace-nowrap"
          style={{
            fontFamily: "'Bodoni Moda', 'Playfair Display', serif",
            fontStyle: "italic",
            fontWeight: "700",
            letterSpacing: "-0.04em"
          }}
        >
          Holiday Circuit
        </h1>

        {/* Animated Tagline */}
        <p
          ref={taglineRef}
          className="text-blue-400 text-[10px] tracking-[0.45em] mb-4 font-semibold uppercase opacity-95"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Exploring The World
        </p>

        {/* Progress Bar container */}
        <div className="progress-container w-64 relative h-1.5 bg-white/10 rounded-full mb-3.5 overflow-hidden">
          <div
            ref={progressFillRef}
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-blue-400 to-zinc-900 rounded-full"
            style={{ width: "0%" }}
          />
        </div>

        {/* Progress Value */}
        <div className="progress-container flex items-center justify-between w-64 text-white/50 text-[10px] font-bold tracking-widest">
          <span>INITIALIZING</span>
          <span className="text-blue-400">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
