"use client";

import { useState, useEffect } from "react";

interface PasswordGateProps {
  children: React.ReactNode;
}

const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_OPS_PASSWORD || "c0usc0us*2344";

export default function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("ops_authenticated");
    setIsAuthenticated(auth === "true");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem("ops_authenticated", "true");
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div
          className="w-1.5 h-1.5 rounded-full bg-ink-tertiary"
          style={{ animation: "breathe 2s ease-in-out infinite" }}
        />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] relative flex items-start justify-center pt-[25vh] sm:pt-0 sm:items-center overflow-y-auto">
      {/* Blurred background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/drstfu5yr/image/upload/v1735000000/riad-di-siena/courtyard.jpg')`,
          filter: "blur(20px) saturate(0.8)",
          transform: "scale(1.1)",
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[360px] mx-5 mb-8 fade-rise">
        <div className="bg-white/95 backdrop-blur-sm shadow-md px-8 py-10 sm:px-10 sm:py-12">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-[20px] sm:text-[22px] font-medium text-ink-primary tracking-[0.03em] leading-relaxed pt-1 normal-case">
              Riad di Siena
            </h1>
            <p className="text-[11px] text-ink-tertiary tracking-[0.06em] mt-2 mb-1">OPERATIONS</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  placeholder="Password"
                  autoFocus
                  className={`w-full h-[44px] px-4 pr-12 text-[14px] text-ink-primary bg-white border transition-all duration-200 placeholder:text-ink-tertiary normal-case tracking-normal ${
                    error
                      ? "border-brick focus:border-brick focus:ring-1 focus:ring-brick/20"
                      : "border-border focus:border-ink-primary focus:ring-1 focus:ring-ink-primary/10"
                  } focus:outline-none`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setShowPassword(!showPassword);
                  }}
                  className="absolute right-0 top-0 w-[44px] h-[44px] flex items-center justify-center text-ink-tertiary hover:text-ink-secondary transition-colors touch-manipulation"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
              {error && (
                <p className="text-[12px] text-brick mt-2 normal-case tracking-normal">Incorrect password</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-[48px] bg-ink-primary text-white text-[12px] tracking-[0.08em] hover:bg-black transition-colors duration-200"
            >
              ENTER
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
