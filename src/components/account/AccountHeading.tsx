"use client";

import { useAuth } from "@/context/AuthContext";

export function AccountHeading() {
  const { isStaff } = useAuth();
  return (
    <>
      <p className="text-[10px] tracking-[0.35em] text-muted font-mono mb-2">
        {isStaff ? "STAFF" : "CUSTOMER"}
      </p>
      <h1 className="text-3xl sm:text-5xl font-display tracking-[0.08em] mb-8">ACCOUNT</h1>
    </>
  );
}
