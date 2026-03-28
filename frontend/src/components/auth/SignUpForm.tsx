"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-config";
import { Input } from "@/components/ui/Input";
import { Divider } from "@/components/ui/Divider";
import { Spinner } from "@/components/ui/Spinner";
import { PasswordToggle } from "@/components/ui/PasswordToggle";
import { GoogleButton } from "@/components/auth/GoogleButton";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  global?: string;
}

function validate(name: string, email: string, password: string, confirmPassword: string): FormErrors {
  const errors: FormErrors = {};

  if (!name.trim()) errors.name = "Name is required";

  if (!email) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email";

  if (!password) errors.password = "Password is required";
  else if (password.length < 8) errors.password = "Must be at least 8 characters";
  else if (!/[A-Z]/.test(password)) errors.password = "Must contain an uppercase letter";
  else if (!/[0-9]/.test(password)) errors.password = "Must contain a number";

  if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
  else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";

  return errors;
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-400", "bg-yellow-400", "bg-violet-400", "bg-green-400"];

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-1 flex-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={[
              "h-1 flex-1 rounded-full transition-all duration-300",
              i < strength ? colors[strength - 1] : "bg-white/10",
            ].join(" ")}
          />
        ))}
      </div>
      <span className="text-[11px] text-white/40">{labels[strength - 1]}</span>
    </div>
  );
}

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validate(name, email, password, confirmPassword);
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }
    setErrors({});
    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const user = credential.user;

      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          displayName: name.trim() || user.displayName,
          photoURL: user.photoURL,
          provider: "password",
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
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
        label="Sign up with Google"
        onSuccess={() => router.push("/dashboard")}
        onError={(msg) => setErrors({ global: msg })}
      />

      <Divider label="or sign up with email" />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-white/60">
          Full name
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Jane Smith"
          value={name}
          onChange={setName}
          autoComplete="name"
          disabled={loading}
          error={errors.name}
        />
      </div>

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
          <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
        </div>
        <PasswordStrength password={password} />
      </div>

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

      <p className="text-xs text-white/30 leading-relaxed">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="text-violet-400/70 hover:text-violet-300 transition-colors">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-violet-400/70 hover:text-violet-300 transition-colors">
          Privacy Policy
        </Link>
        .
      </p>

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
        {loading ? (<><Spinner /> Creating account…</>) : "Create account"}
      </button>

      <p className="text-center text-sm text-white/40">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-violet-400 font-medium hover:text-violet-300 transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  );
}
