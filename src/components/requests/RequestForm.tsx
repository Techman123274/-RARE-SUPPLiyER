"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { useAuth } from "@/context/AuthContext";
import { submitItemRequest } from "@/app/request/actions";
import { REQUEST_CATEGORIES, REQUEST_CONDITIONS } from "@/lib/store/requests";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const fieldClass = "field-input";

export function RequestForm() {
  const { isAuthenticated } = useAuth();
  const [gate, setGate] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setGate(true);
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("The store database is not connected yet.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await submitItemRequest(new FormData(e.currentTarget));
    setLoading(false);
    if (!result.ok) {
      if (result.error === "auth") {
        setGate(true);
        return;
      }
      setError(result.error ?? "Something went wrong. Try again.");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <FadeIn>
        <div className="glass p-8 sm:p-10 text-center">
          <p className="text-[10px] tracking-[0.28em] font-mono text-accent-secondary mb-3">REQUEST RECEIVED</p>
          <h2 className="text-2xl sm:text-3xl font-display tracking-wide mb-4">Thanks — we got it.</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            We&apos;ve received your request and will review it. This is not an order or a preorder, and we
            can&apos;t promise the item will be found.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/account/requests">
              <Button variant="secondary">MY REQUESTS</Button>
            </Link>
            <Button variant="ghost" onClick={() => setSubmitted(false)}>
              SUBMIT ANOTHER
            </Button>
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={0.1}>
      <form onSubmit={handleSubmit} className="space-y-5 relative">
        {error && (
          <p className="text-sm text-red-400 border border-red-400/30 rounded-md px-4 py-3">{error}</p>
        )}

        <Field label="PRODUCT" hint="What are you looking for?">
          <input name="product_name" required maxLength={200} placeholder="Nike Air Max 95" className={fieldClass} />
        </Field>

        <Field label="BRAND">
          <input name="brand" maxLength={80} placeholder="Nike" className={fieldClass} />
        </Field>

        <Field label="CATEGORY">
          <select name="category" defaultValue="Sneakers" className={fieldClass}>
            {REQUEST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="SIZE" hint="Optional">
            <input name="size" maxLength={40} placeholder="9, 10, XL, 32x32, One Size" className={fieldClass} />
          </Field>
          <Field label="COLOR" hint="Optional">
            <input name="color" maxLength={40} placeholder="Black" className={fieldClass} />
          </Field>
        </div>

        <Field label="CONDITION">
          <select name="condition_preference" defaultValue="Any" className={fieldClass}>
            {REQUEST_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="BUDGET" hint="Optional">
          <input name="budget" maxLength={40} placeholder="$150–$200" className={fieldClass} />
        </Field>

        <Field label="DETAILS" hint="Tell us anything else about what you're looking for.">
          <textarea
            name="details"
            rows={5}
            maxLength={2000}
            placeholder="Looking for a size 10 in black, preferably in good or better condition."
            className={`${fieldClass} resize-none`}
          />
        </Field>

        <p className="text-[11px] text-muted">
          Submitting a request does not reserve, order, or guarantee an item. It tells us what you want us to look for.
        </p>

        <Button type="submit" size="lg" className="w-full sm:w-auto" loading={loading}>
          {loading ? "SUBMITTING..." : "SUBMIT REQUEST"}
        </Button>

        {gate && (
          <div className="absolute inset-0 bg-background/85 backdrop-blur-md border border-border flex items-center justify-center p-6">
            <div className="max-w-sm text-center space-y-4">
              <p className="text-[10px] tracking-[0.28em] font-mono text-accent-secondary">ACCOUNT REQUIRED</p>
              <h3 className="text-xl font-display tracking-wide">CREATE AN ACCOUNT TO SUBMIT A REQUEST</h3>
              <p className="text-sm text-muted">
                You can browse this page without signing in. An account lets us attach the request to you.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/login?next=/request">
                  <Button className="w-full">SIGN IN</Button>
                </Link>
                <Link href="/signup?next=/request">
                  <Button variant="secondary" className="w-full">
                    CREATE ACCOUNT
                  </Button>
                </Link>
              </div>
              <button type="button" className="text-xs text-muted hover:text-foreground" onClick={() => setGate(false)}>
                Keep browsing
              </button>
            </div>
          </div>
        )}
      </form>
    </FadeIn>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] tracking-[0.22em] font-mono text-muted">{label}</span>
        {hint && <span className="text-[11px] text-muted/70">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
