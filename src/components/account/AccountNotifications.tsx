import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { markNotificationsRead } from "@/app/request/actions";

export default async function AccountNotifications({ limit = 8 }: { limit?: number }) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: notes } = await supabase
    .from("notifications")
    .select("id, title, body, href, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!notes?.length) return null;

  const unread = notes.some((n) => !n.read_at);

  return (
    <section className="glass p-6 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-[0.22em] font-mono text-muted">UPDATES</p>
        {unread && (
          <form action={markNotificationsRead}>
            <button className="text-[10px] tracking-[0.16em] font-mono text-muted hover:text-foreground">
              MARK READ
            </button>
          </form>
        )}
      </div>
      <ul className="space-y-3">
        {notes.map((note) => (
          <li key={note.id} className="text-sm">
            {note.href ? (
              <Link href={note.href} className="hover:text-white">
                <span className="font-medium">{note.title}</span>
                <span className="block text-xs text-muted mt-1">{note.body}</span>
              </Link>
            ) : (
              <>
                <span className="font-medium">{note.title}</span>
                <span className="block text-xs text-muted mt-1">{note.body}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
