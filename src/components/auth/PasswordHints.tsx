"use client";

import { cn } from "@/lib/utils";

export const MIN_PASSWORD_LENGTH = 6;

export function PasswordHints({ password, confirm }: { password: string; confirm?: string }) {
  const longEnough = password.length >= MIN_PASSWORD_LENGTH;
  const match = confirm === undefined ? true : password.length > 0 && password === confirm;

  return (
    <ul className="space-y-1 text-[11px] font-mono tracking-wide">
      <Hint ok={longEnough} idle={!password}>
        At least {MIN_PASSWORD_LENGTH} characters
      </Hint>
      {confirm !== undefined && (
        <Hint ok={match} idle={!confirm}>
          Passwords match
        </Hint>
      )}
    </ul>
  );
}

function Hint({
  ok,
  idle,
  children,
}: {
  ok: boolean;
  idle: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "transition-colors",
        idle && "text-muted",
        !idle && ok && "text-accent-secondary",
        !idle && !ok && "text-red-300"
      )}
    >
      {ok && !idle ? "✓" : "•"} {children}
    </li>
  );
}
