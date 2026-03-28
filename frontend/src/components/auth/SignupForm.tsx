"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-config";

// ─── Tiny inline primitives (no shadcn dependency needed yet) ────────────────

function Input({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  disabled,
  error,
}: {
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        className={[
          "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white",
          "placeholder:text-white/30 outline-none transition-all duration-200",
          "focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error ? "border-red-400/70" : "border-white/10",
        ].join(" ")}
      />
      {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-xs text-white/30 uppercase tracking-widest">{label}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

// ─── Google OAuth button ─────────────────────────────────────────────────────

function GoogleButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex w-full items-center justify-center gap-3 rounded-xl border border-white/10",
        "bg-white/5 px-4 py-3 text-sm font-medium text-white/80",
        "transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:text-white",
        "focus:outline-none focus:ring-2 focus:ring-violet-400/30",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      ].join(" ")}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
          fill="#4285F4"
        />
        <path
          d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
          fill="#34A853"
        />
        <path
          d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
          fill="#FBBC05"
        />
        <path
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
          fill="#EA4335"
        />
      </svg>
      Continue with Google
    </button>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Save user info to Firestore ─────────────────────────────────────────────

async function saveUserToFirestore(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string;
}) {
  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      provider: user.providerId,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ─── Main form ───────────────────────────────────────────────────────────────

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
  global?: string;
}

function validate(email: string, password: string, confirmPassword: string): FormErrors {
  const errors: FormErrors = {};
  if (!email) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email";
  if (!password) errors.password = "Password is required";
  else if (password.length < 8) errors.password = "Password must be at least 8 characters";
  if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
  else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
  return errors;
}

const googleProvider = new GoogleAuthProvider();

export function SignupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validate(email, password, confirmPassword);
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }
    setErrors({});
    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const user = credential.user;

      if (displayName.trim()) {
        await updateProfile(user, { displayName: displayName.trim() });
      }

      await saveUserToFirestore({
        uid: user.uid,
        email: user.email,
        displayName: displayName.trim() || user.displayName,
        photoURL: user.photoURL,
        providerId: "password",
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setErrors({ global: message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrors({});
    setLoading(true);

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const user = credential.user;
      await saveUserToFirestore({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        providerId: "google.com",
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-up failed. Please try again.";
      setErrors({ global: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Global error banner */}
      {errors.global && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errors.global}
        </div>
      )}

      {/* OAuth */}
      <GoogleButton disabled={loading} onClick={handleGoogleSignUp} />

      <Divider label="or sign up with email" />

      {/* Display name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="displayName" className="text-sm font-medium text-white/60">
          Full name <span className="text-white/20">(optional)</span>
        </label>
        <Input
          id="displayName"
          type="text"
          placeholder="Jane Doe"
          value={displayName}
          onChange={setDisplayName}
          autoComplete="name"
          disabled={loading}
          error={errors.displayName}
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-white/60">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          disabled={loading}
          error={errors.email}
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-white/60">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            disabled={loading}
            error={errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-3 text-white/30 hover:text-white/60 transition-colors"
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-white/60">
          Confirm password
        </label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          disabled={loading}
          error={errors.confirmPassword}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={[
          "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3",
          "bg-violet-600 text-sm font-semibold text-white",
          "transition-all duration-200 hover:bg-violet-500 active:scale-[0.98]",
          "focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:ring-offset-2 focus:ring-offset-transparent",
          "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-violet-600",
          "shadow-lg shadow-violet-900/40",
        ].join(" ")}
      >
        {loading ? (
          <>
            <Spinner />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </button>

      {/* Sign in link */}
      <p className="text-center text-sm text-white/40">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-violet-400 font-medium hover:text-violet-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
