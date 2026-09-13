"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import {
  isStrongPassword,
  PasswordStrength,
} from "@/components/auth/PasswordStrength";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const canSubmit =
    isStrongPassword(password) && password === confirmPassword && password !== "";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 44,
    padding: "10px 48px 10px 14px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--foreground)",
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
    outline: "none",
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="card-base w-full max-w-md p-5 sm:p-6">
        <Link
          href="/auth?mode=login"
          className="mb-6 inline-flex min-h-11 items-center text-sm font-semibold"
          style={{ color: "var(--accent-text)", textDecoration: "none" }}
        >
          Back to sign in
        </Link>
        <h1 className="font-display text-3xl" style={{ margin: 0 }}>
          Reset Password
        </h1>
        <p
          className="mt-2 text-sm leading-6"
          style={{ color: "var(--muted-foreground)" }}
        >
          Enter a new secure password that meets all account requirements.
        </p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            setMessage("Password is ready to reset.");
          }}
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              New password
            </label>
            <PasswordInput
              value={password}
              show={showPassword}
              inputStyle={inputStyle}
              onToggle={() => setShowPassword((value) => !value)}
              onChange={setPassword}
            />
            <PasswordStrength password={password} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Confirm password
            </label>
            <PasswordInput
              value={confirmPassword}
              show={showConfirmPassword}
              inputStyle={inputStyle}
              onToggle={() => setShowConfirmPassword((value) => !value)}
              onChange={setConfirmPassword}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-2 text-xs" style={{ color: "var(--destructive)" }}>
                Passwords do not match.
              </p>
            )}
          </div>

          {message && (
            <p
              className="rounded-md px-3 py-2 text-sm"
              style={{ background: "var(--secondary)", color: "#16a34a" }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="min-h-11 rounded-md font-semibold"
            style={{
              background: "var(--accent)",
              color: "var(--accent-foreground)",
              opacity: canSubmit ? 1 : 0.55,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            Reset Password
          </button>
        </form>
      </div>
    </main>
  );
}

function PasswordInput({
  value,
  show,
  inputStyle,
  onToggle,
  onChange,
}: {
  value: string;
  show: boolean;
  inputStyle: React.CSSProperties;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        required
        minLength={12}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: 4,
          top: "50%",
          transform: "translateY(-50%)",
          width: 44,
          height: 44,
          border: 0,
          background: "transparent",
          color: "var(--muted-foreground)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
