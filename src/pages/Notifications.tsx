import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@/hooks/use-supabase-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { toast } from "sonner";

const DEMO_NOTIFICATIONS = [
  { _id: "n1", title: "Deadline approaching", message: "Your application deadline closes in 7 days.", type: "deadline", timeAgo: "2d ago", isRead: false, dotColor: "bg-red-500" },
  { _id: "n2", title: "Deadline extended", message: "VIT University extended VITEEE Phase 1 registration from August 20 to August 25.", type: "update", timeAgo: "3d ago", isRead: false, dotColor: "bg-blue-500" },
  { _id: "n3", title: "New opportunity", message: "You are eligible for 3 new colleges based on your updated profile.", type: "new_scholarship", timeAgo: "4d ago", isRead: false, dotColor: "bg-purple-500" },
  { _id: "n4", title: "Exam rescheduled", message: "VITEEE Phase 1 exam has been rescheduled from September 5 to September 8.", type: "update", timeAgo: "5d ago", isRead: true, dotColor: "bg-blue-400" },
  { _id: "n5", title: "Scholarship available", message: "SRM EEF Scholarship applications are now open. 84% match based on your profile.", type: "new_scholarship", timeAgo: "6d ago", isRead: true, dotColor: "bg-purple-400" },
  { _id: "n6", title: "Application submitted", message: "Your VIT University VITEEE application has been confirmed. Application ID: VITEEE2026AI004512.", type: "deadline", timeAgo: "7d ago", isRead: true, dotColor: "bg-emerald-500" },
];

async function fetchNotifications(args: { userId?: string; v?: number }) {
  if (!args.userId) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("student_id", args.userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[fetchNotifications] Error:", error.message);
    return [];
  }
  return (data ?? []).map((n) => ({
    _id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.is_read,
    actionUrl: n.action_url,
    timeAgo: "recently",
    dotColor: n.type === "deadline" ? "bg-red-500" : n.type === "update" ? "bg-blue-500" : "bg-purple-500",
  }));
}

async function markAllReadOp(args: { userId: string }) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("student_id", args.userId)
    .eq("is_read", false);
  if (error) {
    console.error("[markAllRead] Error:", error.message);
    throw new Error(`Failed to mark all read: ${error.message}`);
  }
  return { updated: true };
}

async function markReadOp(args: { notificationId: string }) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", args.notificationId);
  if (error) {
    console.error("[markRead] Error:", error.message);
    throw new Error(`Failed to mark read: ${error.message}`);
  }
  return { updated: true };
}

export default function Notifications() {
  const { user } = useAuth();
  const fetchVersionRef = useRef(0);
  const [fetchVersion, setFetchVersion] = useState(0);
  const notifications = useQuery(fetchNotifications, { userId: user?._id, v: fetchVersion });
  const markAllRead = useMutation(markAllReadOp);
  const markRead = useMutation(markReadOp);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());

  const allNotifications = useMemo(() => {
    if (notifications && notifications.length > 0) return notifications;
    return DEMO_NOTIFICATIONS;
  }, [notifications]);

  const unreadCount = useMemo(
    () => allNotifications.filter((n) => !n.isRead && !localRead.has(n._id)).length,
    [allNotifications, localRead]
  );

  const filtered = useMemo(() => {
    if (filter === "unread") return allNotifications.filter((n) => !n.isRead && !localRead.has(n._id));
    return allNotifications;
  }, [allNotifications, filter, localRead]);

  const handleMarkAllRead = useCallback(async () => {
    if (!user) return;
    try {
      await markAllRead({ userId: user._id });
      fetchVersionRef.current += 1;
      setFetchVersion(fetchVersionRef.current);
      setLocalRead(new Set(allNotifications.map((n) => n._id)));
      toast.success("All notifications marked as read.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  }, [user, markAllRead, allNotifications]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      try {
        await markRead({ notificationId: id });
        setLocalRead((prev) => new Set([...prev, id]));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed.");
      }
    },
    [markRead]
  );

  return (
    <div className="p-6 md:p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="mt-1 text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "You're all caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-sm text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === "all" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === "unread" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
          >
            Unread ({unreadCount})
          </button>
        </div>
        <div className="space-y-1">
          {filtered.map((n, idx) => {
            const isUnread = !n.isRead && !localRead.has(n._id);
            return (
              <motion.div key={n._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                <button
                  onClick={() => isUnread && handleMarkRead(n._id)}
                  className={`flex w-full items-center gap-4 rounded-lg border border-border/60 px-4 py-4 text-left transition-all hover:border-border ${isUnread ? "bg-accent/20" : ""}`}
                >
                  {isUnread && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                  <div className={`size-10 shrink-0 rounded-full ${n.dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold">{n.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{n.timeAgo}</span>
                </button>
              </motion.div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">No notifications</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
