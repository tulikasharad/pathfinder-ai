import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const DEMO_NOTIFICATIONS = [
  {
    _id: "n1",
    title: "Deadline approaching",
    message: "Your Northstar Institute of Technology application closes in 7 days.",
    type: "deadline",
    timeAgo: "2d ago",
    isRead: false,
    dotColor: "bg-red-500",
  },
  {
    _id: "n2",
    title: "Deadline extended",
    message: "VIT University extended VITEEE Phase 1 registration from August 20 to August 25.",
    type: "update",
    timeAgo: "3d ago",
    isRead: false,
    dotColor: "bg-blue-500",
  },
  {
    _id: "n3",
    title: "New opportunity",
    message: "You are eligible for 3 new colleges based on your updated profile.",
    type: "new_scholarship",
    timeAgo: "4d ago",
    isRead: false,
    dotColor: "bg-purple-500",
  },
  {
    _id: "n4",
    title: "Exam rescheduled",
    message: "VITEEE Phase 1 exam has been rescheduled from September 5 to September 8.",
    type: "update",
    timeAgo: "5d ago",
    isRead: true,
    dotColor: "bg-blue-400",
  },
  {
    _id: "n5",
    title: "Scholarship available",
    message: "SRM EEF Scholarship applications are now open. 84% match based on your profile.",
    type: "new_scholarship",
    timeAgo: "6d ago",
    isRead: true,
    dotColor: "bg-purple-400",
  },
  {
    _id: "n6",
    title: "Application submitted",
    message: "Your VIT University VITEEE application has been confirmed. Application ID: VITEEE2026AI004512.",
    type: "deadline",
    timeAgo: "7d ago",
    isRead: true,
    dotColor: "bg-emerald-500",
  },
];

export default function Notifications() {
  const { user } = useAuth();
  const notifications = useQuery(
    api.scholarships.listNotifications,
    user ? { userId: user._id } : "skip"
  );
  const markRead = useMutation(api.scholarships.markNotificationRead);
  const markAllRead = useMutation(api.scholarships.markAllNotificationsRead);

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());

  // Use demo data if no real notifications
  const allNotifications = useMemo(() => {
    if (notifications && notifications.length > 0) {
      return notifications.map((n) => ({
        ...n,
        timeAgo: "recently",
        dotColor: n.type === "deadline" ? "bg-red-500" : n.type === "update" ? "bg-blue-500" : "bg-purple-500",
      }));
    }
    return DEMO_NOTIFICATIONS;
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter(
      (n) => !n.isRead && !localRead.has(n._id)
    ).length;
  }, [allNotifications, localRead]);

  const filtered = useMemo(() => {
    if (filter === "unread") {
      return allNotifications.filter((n) => !n.isRead && !localRead.has(n._id));
    }
    return allNotifications;
  }, [allNotifications, filter, localRead]);

  const handleMarkAllRead = () => {
    if (user) {
      markAllRead({ userId: user._id });
    }
    // Also mark demo notifications
    const allIds = new Set(allNotifications.map((n) => n._id));
    setLocalRead(new Set([...localRead, ...allIds]));
  };

  const handleMarkRead = (id: string) => {
    setLocalRead(new Set([...localRead, id]));
  };

  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="mt-1 text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "You're all caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === "unread"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-1">
          {filtered.map((n, idx) => {
            const isUnread = !n.isRead && !localRead.has(n._id);

            return (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <button
                  onClick={() => isUnread && handleMarkRead(n._id)}
                  className={`flex w-full items-center gap-4 rounded-lg border border-border/60 px-4 py-4 text-left transition-all hover:border-border ${
                    isUnread ? "bg-accent/20" : ""
                  }`}
                >
                  {/* Unread dot */}
                  {isUnread && (
                    <span className="size-2 shrink-0 rounded-full bg-primary" />
                  )}

                  {/* Colored circle icon */}
                  <div className={`size-10 shrink-0 rounded-full ${n.dotColor}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold">{n.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  </div>

                  {/* Time */}
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {n.timeAgo}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No notifications
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              We'll notify you when there are deadline updates or new scholarships
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
