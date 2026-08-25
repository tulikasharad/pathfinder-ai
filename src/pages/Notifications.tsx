import { useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, CheckCheck, Clock, GraduationCap, FileText, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  deadline: { icon: Clock, color: "text-amber-600 dark:text-amber-400" },
  update: { icon: FileText, color: "text-blue-600 dark:text-blue-400" },
  reminder: { icon: AlertTriangle, color: "text-red-600 dark:text-red-400" },
  new_scholarship: { icon: GraduationCap, color: "text-emerald-600 dark:text-emerald-400" },
};

export default function Notifications() {
  const { user } = useAuth();
  const notifications = useQuery(
    api.scholarships.listNotifications,
    user ? { userId: user._id } : "skip"
  );
  const markRead = useMutation(api.scholarships.markNotificationRead);
  const markAllRead = useMutation(api.scholarships.markAllNotificationsRead);

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Notifications</h1>
            <p className="mt-1 text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "You're all caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => user && markAllRead({ userId: user._id })}
            >
              <CheckCheck className="mr-2 size-4" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {notifications?.map((n, idx) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.update;
            const Icon = config.icon;

            return (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card
                  className={`border-border/60 cursor-pointer transition-all hover:border-primary/20 ${
                    !n.isRead ? "bg-primary/[0.02] dark:bg-primary/[0.03]" : ""
                  }`}
                  onClick={() => !n.isRead && markRead({ id: n._id })}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent ${config.color}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{n.title}</h3>
                        {!n.isRead && (
                          <span className="size-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px] capitalize">
                      {n.type.replace("_", " ")}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {(!notifications || notifications.length === 0) && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <BellOff className="mx-auto size-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              No notifications yet
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
