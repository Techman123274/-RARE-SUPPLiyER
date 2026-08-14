import { Suspense } from "react";
import { AuthCallbackClient } from "@/components/auth/AuthCallbackClient";

export const metadata = {
  title: "Signing you in — RARE SUPPLiyER",
};

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-24 text-center text-[10px] tracking-[0.28em] text-muted font-mono">
          SIGNING YOU IN
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
