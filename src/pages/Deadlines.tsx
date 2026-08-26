import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  X,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function getDaysUntil(dateStr: string) {
  return Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

const DEMO_DEADLINES = [
  {
    _id: "demo-d1",
    name: "VIT University Vellore",
    course: "B.Tech CSE (AI & ML) · Phase 1",
    deadline: "25 Aug 2026",
    examDate: "8 Sept 2026",
    verified: "2026-08-12",
    status: "Urgent",
    statusColor: "bg-red-500/15 text-red-500",
    saved: true,
    sourceUrl: "https://vit.ac.in",
  },
  {
    _id: "demo-d2",
    name: "Northstar Institute of Technology",
    course: "B.Tech CSE · Phase 1",
    deadline: "30 Aug 2026",
    examDate: "10 Sept 2026",
    verified: "2026-08-10",
    status: "Closing Soon",
    statusColor: "bg-amber-500/15 text-amber-500",
    saved: true,
    sourceUrl: "https://northstar.edu",
  },
  {
    _id: "demo-d3",
    name: "BITS Pilani",
    course: "B.E. CSE · Phase 1",
    deadline: "28 Aug 2026",
    examDate: "8 Sept 2026",
    verified: "2026-08-15",
    status: "Closing Soon",
    statusColor: "bg-amber-500/15 text-amber-500",
    saved: true,
    sourceUrl: "https://bits-pilani.ac.in",
  },
  {
    _id: "demo-d4",
    name: "Symbiosis Institute of Technology",
    course: "B.Tech CSE · Phase 1",
    deadline: "5 Sept 2026",
    examDate: "15 Sept 2026",
    verified: "2026-08-10",
    status: "Upcoming",
    statusColor: "bg-blue-500/15 text-blue-500",
    saved: false,
    sourceUrl: "https://sit.ac.in",
  },
];

export default function Deadlines() {
  const { user } = useAuth();
  const deadlines = useQuery(
    api.scholarships.listDeadlines,
    user ? { userId: user._id } : "skip"
  );
  const createDeadline = useMutation(api.scholarships.createDeadline);
  const toggleDeadline = useMutation(api.scholarships.toggleDeadline);

  const [showForm, setShowForm] = useState(false);
  const [newDeadline, setNewDeadline] = useState({
    title: "",
    date: "",
    type: "application",
    priority: "medium",
  });

  // Use demo data if no real data
  const allDeadlines = useMemo(() => {
    if (deadlines && deadlines.length > 0) {
      return deadlines.map((d) => ({
        _id: d._id,
        name: d.title,
        course: d.type || "Application",
        deadline: d.date,
        examDate: "—",
        verified: "—",
        status: getDaysUntil(d.date) <= 3 ? "Urgent" : "Upcoming",
        statusColor: getDaysUntil(d.date) <= 3 ? "bg-red-500/15 text-red-500" : "bg-blue-500/15 text-blue-500",
        saved: true,
        sourceUrl: "",
        isCompleted: d.isCompleted,
      }));
    }
    return DEMO_DEADLINES.map((d) => ({ ...d, isCompleted: false }));
  }, [deadlines]);

  const sorted = useMemo(() => {
    return [...allDeadlines]
      .map((d) => ({ ...d, daysUntil: getDaysUntil(d.deadline) }))
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return a.daysUntil - b.daysUntil;
      });
  }, [allDeadlines]);

  const handleCreate = useCallback(async () => {
    if (!user || !newDeadline.title || !newDeadline.date) return;
    await createDeadline({
      userId: user._id,
      title: newDeadline.title,
      date: newDeadline.date,
      type: newDeadline.type,
      priority: newDeadline.priority,
    });
    setNewDeadline({ title: "", date: "", type: "application", priority: "medium" });
    setShowForm(false);
  }, [user, newDeadline, createDeadline]);

  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deadlines</h1>
          <p className="mt-1 text-muted-foreground">
            Your upcoming college application and exam deadlines.
          </p>
        </div>

        {/* Alert Banners */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-accent/30 px-4 py-3">
            <Badge className="bg-amber-500/15 text-amber-500 border-0 font-mono text-[10px] uppercase">
              Deadline Extended
            </Badge>
            <p className="text-sm">
              <span className="font-bold">VIT University Vellore</span> extended the Phase 1 deadline from{" "}
              <span className="text-muted-foreground line-through">20 Aug 2026</span> to{" "}
              <span className="font-bold text-amber-500">25 Aug 2026</span>.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-accent/30 px-4 py-3">
            <Badge className="bg-emerald-500/15 text-emerald-500 border-0 font-mono text-[10px] uppercase">
              Exam Rescheduled
            </Badge>
            <p className="text-sm">
              <span className="font-bold">VITEEE Phase 1</span> rescheduled from{" "}
              <span className="text-muted-foreground line-through">5 Sept 2026</span> to{" "}
              <span className="font-bold text-emerald-500">8 Sept 2026</span>.
            </p>
          </div>
        </div>

        {/* Deadline Cards */}
        <div className="space-y-3">
          {sorted.map((d, idx) => {
            const daysUntil = d.daysUntil;
            const isUrgent = daysUntil <= 3 && daysUntil >= 0;
            const isPast = daysUntil < 0;

            return (
              <motion.div
                key={d._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="border-border/60">
                  <CardContent className="flex items-center gap-5 p-5">
                    {/* Left color bar */}
                    <div
                      className={`h-14 w-1 shrink-0 rounded-full ${
                        isPast ? "bg-red-500" : isUrgent ? "bg-amber-500" : "bg-muted-foreground/20"
                      }`}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold">{d.name}</h3>
                        <Badge className={`${d.statusColor} border-0 text-[10px]`}>
                          {d.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{d.course}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-4 text-xs">
                        <span>
                          <span className="text-muted-foreground">DEADLINE: </span>
                          <span className={`font-medium ${isUrgent ? "text-amber-500" : isPast ? "text-red-500" : ""}`}>
                            {d.deadline}
                          </span>
                        </span>
                        {d.examDate && (
                          <span>
                            <span className="text-muted-foreground">EXAM: </span>
                            <span className="font-medium">{d.examDate}</span>
                          </span>
                        )}
                        {d.verified && (
                          <span>
                            <span className="text-muted-foreground">VERIFIED: </span>
                            <span className="font-medium">{d.verified}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Days left */}
                    <div className="text-right shrink-0">
                      <p className={`text-3xl font-bold ${
                        isPast ? "text-red-500" : isUrgent ? "text-amber-500" : "text-foreground"
                      }`}>
                        {Math.max(0, daysUntil)}
                      </p>
                      <p className="text-xs text-muted-foreground">days left</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {d.saved ? (
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          <CheckCircle2 className="size-3" /> Saved
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          + Save
                        </Button>
                      )}
                      {d.sourceUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-muted-foreground"
                          onClick={() => window.open(d.sourceUrl, "_blank")}
                        >
                          Source ↗
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {sorted.length === 0 && (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Calendar className="mx-auto size-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No upcoming deadlines
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
