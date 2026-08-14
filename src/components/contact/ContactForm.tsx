"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <FadeIn>
        <div className="glass p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl">
            ✓
          </div>
          <h2 className="text-lg font-medium mb-2">Message sent</h2>
          <p className="text-sm text-muted">
            Thanks {form.name.split(" ")[0]} — we&apos;ll get back to you at {form.email}.
          </p>
          <p className="text-xs text-muted/60 mt-4">
            Email delivery is not connected yet. Use the store contact details if you need a reply now.
          </p>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={0.1}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="field-input"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="field-input"
        />
        <textarea
          required
          placeholder="Message"
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="field-input resize-none"
        />
        <Button type="submit" size="lg">
          SEND MESSAGE
        </Button>
      </form>
    </FadeIn>
  );
}
