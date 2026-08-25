import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertTriangle,
  Plus,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  high: { label: "High", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  medium: { label: "Medium", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  low: { label: "Low", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
};

function getDaysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

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

  const sorted = useMemo(() => {
    if (!deadlines) return [];
    return [...deadlines]
      .map((d) => ({ ...d, daysUntil: getDaysUntil(d.date) }))
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
        }
        return a.daysUntil - b.daysUntil;
      });
  }, [deadlines]);

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

  const upcoming = sorted.filter((d) => !d.isCompleted && d.daysUntil >= 0);
  const overdue = sorted.filter((d) => !d.isCompleted && d.daysUntil < 0);
  const completed = sorted.filter((d) => d.isCompleted);

  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Deadlines</h1>
            <p className="mt-1 text-muted-foreground">
              Stay on top of important dates and never miss a deadline
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 size-4" />
            Add Deadline
          </Button>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-border/60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">New Deadline</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="size-8">
                      <X className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Title</Label>
                      <Input
                        placeholder="e.g. JEE Registration"
                        value={newDeadline.title}
                        onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Date</Label>
                      <Input
                        type="date"
                        value={newDeadline.date}
                        onChange={(e) => setNewDeadline({ ...newDeadline, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={newDeadline.type}
                        onValueChange={(v) => setNewDeadline({ ...newDeadline, type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="application">Application</SelectItem>
                          <SelectItem value="scholarship">Scholarship</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Priority</Label>
                      <Select
                        value={newDeadline.priority}
                        onValueChange={(v) => setNewDeadline({ ...newDeadline, priority: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleCreate} className="mt-4" disabled={!newDeadline.title || !newDeadline.date}>
                    Add Deadline
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overdue */}
        {overdue.length > 0 && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
              <AlertTriangle className="size-4" />
              Overdue ({overdue.length})
            </h2>
            <div className="space-y-2">
              {overdue.map((d) => (
                <DeadlineItem
                  key={d._id}
                  deadline={d}
                  onToggle={() => toggleDeadline({ id: d._id })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Clock className="size-4 text-primary" />
            Upcoming ({upcoming.length})
          </h2>
          <div className="space-y-2">
            {upcoming.map((d) => (
              <DeadlineItem
                key={d._id}
                deadline={d}
                onToggle={() => toggleDeadline({ id: d._id })}
              />
            ))}
          </div>
          {upcoming.length === 0 && overdue.length === 0 && (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Calendar className="mx-auto size-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No upcoming deadlines
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Add deadlines to track your important dates
              </p>
            </div>
          )}
        </div>

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <CheckCircle2 className="size-4" />
              Completed ({completed.length})
            </h2>
            <div className="space-y-2 opacity-60">
              {completed.map((d) => (
                <DeadlineItem
                  key={d._id}
                  deadline={d}
                  onToggle={() => toggleDeadline({ id: d._id })}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function DeadlineItem({
  deadline,
  onToggle,
}: {
  deadline: any;
  onToggle: () => void;
}) {
  const config = PRIORITY_CONFIG[deadline.priority] || PRIORITY_CONFIG.medium;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
        deadline.isCompleted ? "opacity-60" : ""
      } ${
        !deadline.isCompleted && deadline.daysUntil <= 3 && deadline.daysUntil >= 0
          ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
          : ""
      }`}
    >
      <button
        onClick={onToggle}
        className={`size-5 shrink-0 rounded-full border-2 transition-all ${
          deadline.isCompleted
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30 hover:border-primary"
        } flex items-center justify-center`}
      >
        {deadline.isCompleted && <CheckCircle2 className="size-3" />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            deadline.isCompleted ? "line-through" : ""
          }`}
        >
          {deadline.title}
        </p>
        <p className="text-xs text-muted-foreground">{deadline.date}</p>
      </div>

      <div className="flex items-center gap-2">
        {!deadline.isCompleted && deadline.daysUntil >= 0 && (
          <span className="text-xs text-muted-foreground">
            {deadline.daysUntil}d left
          </span>
        )}
        {!deadline.isCompleted && deadline.daysUntil < 0 && (
          <span className="text-xs font-medium text-red-500">Overdue</span>
        )}
        <Badge variant="outline" className="text-[10px] capitalize">
          {deadline.type}
        </Badge>
        <Badge className={`text-[10px] ${config.color}`}>
          {config.label}
        </Badge>
      </div>
    </div>
  );
}
