"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-config";
import { Input } from "@/components/ui/Input";
import { Divider } from "@/components/ui/Divider";
import { Spinner } from "@/components/ui/Spinner";
import { PasswordToggle } from "@/components/ui/PasswordToggle";
import { GoogleButton } from "@/components/auth/GoogleButton";

interface FormErrors {
  email?: string;
  password?: string;
  global?: string;
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!email) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email";
  if (!password) errors.password = "Password is required";
  else if (password.length < 8) errors.password = "Password must be at least 8 characters";
  return errors;
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validate(email, password);
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }
    setErrors({});
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = credential.user;
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: "password",
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setErrors({ global: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {errors.global && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errors.global}
        </div>
      )}

      <GoogleButton
        disabled={loading}
        onSuccess={() => router.push("/dashboard")}
        onError={(msg) => setErrors({ global: msg })}
      />

      <Divider label="or sign in with email" />

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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-white/60">
            Password
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            disabled={loading}
            error={errors.password}
          />
          <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
        </div>
      </div>

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
        {loading ? (<><Spinner /> Signing in…</>) : "Sign in"}
      </button>

      <p className="text-center text-sm text-white/40">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-violet-400 font-medium hover:text-violet-300 transition-colors">
          Create one
        </Link>
      </p>
    </form>
  );
}
