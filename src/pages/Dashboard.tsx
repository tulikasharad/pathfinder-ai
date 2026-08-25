import { useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  Clock,
  FileCheck,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Target,
  BookOpen,
  Calendar,
} from "lucide-react";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function getDaysUntil(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const applications = useQuery(
    api.scholarships.listApplications,
    user ? { userId: user._id } : "skip"
  );
  const deadlines = useQuery(
    api.scholarships.listDeadlines,
    user ? { userId: user._id } : "skip"
  );
  const seedDemo = useMutation(api.scholarships.seedDemoData);

  useEffect(() => {
    seedDemo();
  }, [seedDemo]);

  const urgentActions = useMemo(() => {
    if (!deadlines) return [];
    const actions = deadlines
      .filter((d) => !d.isCompleted)
      .map((d) => ({
        ...d,
        daysUntil: getDaysUntil(d.date),
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil);
    return actions.slice(0, 5);
  }, [deadlines]);

  const appStats = useMemo(() => {
    if (!applications) return { total: 0, applied: 0, inProgress: 0 };
    return {
      total: applications.length,
      applied: applications.filter((a) => a.status === "applied").length,
      inProgress: applications.filter(
        (a) => a.status !== "applied" && a.status !== "selected" && a.status !== "not_selected"
      ).length,
    };
  }, [applications]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="p-6 md:p-8">
      <motion.div variants={stagger} initial="hidden" animate="show" className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {greeting}
            {user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's what's happening with your admissions journey
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Target className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{appStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileCheck className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{appStats.applied}</p>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{appStats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <GraduationCap className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">6</p>
                  <p className="text-xs text-muted-foreground">Shortlisted Colleges</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Urgent Actions - Left */}
          <motion.div variants={fadeUp} className="lg:col-span-3">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Action Center
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {urgentActions.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <CheckCircle2 className="mx-auto size-10 text-muted-foreground/40" />
                    <p className="mt-3 text-sm font-medium text-muted-foreground">All clear!</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      No urgent actions right now
                    </p>
                  </div>
                ) : (
                  urgentActions.map((action) => {
                    const isUrgent = action.daysUntil <= 3 && action.daysUntil >= 0;
                    const isPast = action.daysUntil < 0;
                    return (
                      <div
                        key={action._id}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                          isUrgent
                            ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                            : isPast
                              ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                              : "hover:bg-accent/50"
                        }`}
                      >
                        <div
                          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                            isUrgent
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : isPast
                                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                : "bg-primary/10 text-primary"
                          }`}
                        >
                          {action.type === "exam" ? (
                            <BookOpen className="size-4" />
                          ) : action.type === "scholarship" ? (
                            <GraduationCap className="size-4" />
                          ) : (
                            <Calendar className="size-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{action.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {isPast ? "Overdue" : `${action.daysUntil} day${action.daysUntil !== 1 ? "s" : ""} remaining`}
                          </p>
                        </div>
                        <Badge
                          variant={isUrgent ? "destructive" : isPast ? "destructive" : "secondary"}
                          className="shrink-0 text-[10px]"
                        >
                          {isUrgent ? "URGENT" : isPast ? "OVERDUE" : action.type.toUpperCase()}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right column */}
          <motion.div variants={fadeUp} className="space-y-6 lg:col-span-2">
            {/* Application Progress */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4 text-primary" />
                  Application Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Overall completion</span>
                    <span className="font-medium">
                      {appStats.total > 0 ? Math.round((appStats.applied / appStats.total) * 100) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={
                      appStats.total > 0
                        ? (appStats.applied / appStats.total) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-accent/50 p-3 text-center">
                    <p className="text-lg font-bold text-primary">{appStats.applied}</p>
                    <p className="text-[11px] text-muted-foreground">Submitted</p>
                  </div>
                  <div className="rounded-lg bg-accent/50 p-3 text-center">
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {appStats.inProgress}
                    </p>
                    <p className="text-[11px] text-muted-foreground">In Progress</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/applications")}
                >
                  View Applications
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Discover Scholarships", path: "/scholarships", icon: GraduationCap, color: "text-primary" },
                  { label: "Browse Colleges", path: "/discover", icon: BookOpen, color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Track Deadlines", path: "/deadlines", icon: Calendar, color: "text-amber-600 dark:text-amber-400" },
                ].map((link) => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
                  >
                    <link.icon className={`size-4 ${link.color}`} />
                    <span className="flex-1 text-sm font-medium">{link.label}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
