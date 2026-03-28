import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign up — AdCraft",
  description: "Create your AdCraft account to generate AI-powered ad campaigns.",
};

// ─── Decorative background blobs (pure CSS, no JS) ──────────────────────────

function BackgroundBlobs() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}

// ─── Brand mark ──────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="relative h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50 group-hover:bg-violet-500 transition-colors">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2L3 7v6l7 5 7-5V7l-7-5z" fill="white" fillOpacity="0.9" />
          <path d="M10 2L3 7l7 5 7-5-7-5z" fill="white" fillOpacity="0.4" />
        </svg>
      </div>
      <span className="text-lg font-bold text-white tracking-tight">AdCraft</span>
    </Link>
  );
}

// ─── Trust badges strip ───────────────────────────────────────────────────────

function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/30">
      {[
        { icon: "🔒", label: "256-bit encryption" },
        { icon: "✦", label: "Powered by Imagen · Veo · Lyria" },
        { icon: "⚡", label: "Results in under 2 minutes" },
      ].map(({ icon, label }) => (
        <span key={label} className="flex items-center gap-1.5">
          <span>{icon}</span>
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── Auth flow step indicator ─────────────────────────────────────────────────

function StepBreadcrumb() {
  const steps = [
    { label: "Sign up", href: null, active: true },
    { label: "Verify email", href: null, done: false },
    { label: "Sign in", href: "/auth/login", done: false },
    { label: "Profile setup", href: null, done: false },
  ];

  return (
    <nav aria-label="Auth progress" className="flex items-center gap-1.5">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1.5">
          {i > 0 && (
            <div
              className={[
                "h-px w-5 transition-colors",
                step.done ? "bg-violet-400/60" : "bg-white/10",
              ].join(" ")}
            />
          )}
          <span
            className={[
              "text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors",
              step.active
                ? "bg-violet-600/40 text-violet-300 ring-1 ring-violet-400/40"
                : step.done
                ? "text-violet-400/70"
                : "text-white/20",
            ].join(" ")}
          >
            {step.label}
          </span>
        </div>
      ))}
    </nav>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  return (
    <>
      <BackgroundBlobs />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">

        {/* Top nav strip */}
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5">
          <Logo />
          <p className="text-sm text-white/40">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-violet-400 font-medium hover:text-violet-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </header>

        {/* Card */}
        <main className="w-full max-w-md">

          <div className="mb-6 flex justify-center">
            <StepBreadcrumb />
          </div>

          {/* Glass card */}
          <div
            className="rounded-2xl border border-white/[0.07] p-8 backdrop-blur-xl"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Create your account
              </h1>
              <p className="mt-1.5 text-sm text-white/40">
                Get started building AI-powered ad campaigns
              </p>
            </div>

            <SignupForm />
          </div>

          <div className="mt-8">
            <TrustBadges />
          </div>
        </main>
      </div>
    </>
  );
}
