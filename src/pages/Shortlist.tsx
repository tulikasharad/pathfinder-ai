import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@/hooks/use-supabase-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  Search,
  ArrowUpDown,
  X,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface College {
  _id: string;
  dreamCollegeId: string;
  name: string;
  location: string;
  state: string;
  courses: string[];
  entranceExams: string[];
  fees: string;
  eligibility: string;
  applicationDeadline: string;
  scholarshipsAvailable: string[];
  officialUrl: string;
  isVerified: boolean;
  description: string;
  ranking: number | null;
  course: string; // first course shortcut
  status: string;
  statusColor: string;
  match: number;
}

// ── Data fetchers ────────────────────────────────────────────────────────────

const DEMO_COLLEGES: College[] = [];

async function fetchDreamCollegesForShortlist(args: { userId?: string }) {
  if (!args.userId) return [];
  const { data: dreams } = await supabase
    .from("dream_colleges")
    .select("id, college_id")
    .eq("student_id", args.userId);
  if (!dreams || dreams.length === 0) return [];
  const ids = dreams.map((d) => d.college_id);
  const { data: colleges } = await supabase.from("colleges").select("*").in("id", ids);
  return (colleges ?? []).map((c) => {
    const dream = dreams.find((d) => d.college_id === c.id);
    return {
      _id: c.id,
      dreamCollegeId: dream?.id || "",
      name: c.name,
      location: c.location || "",
      state: c.state || "",
      courses: c.courses ?? [],
      entranceExams: c.entrance_exams ?? [],
      fees: c.fees || "—",
      eligibility: c.eligibility || "—",
      applicationDeadline: c.application_deadline || "—",
      scholarshipsAvailable: c.scholarships_available ?? [],
      officialUrl: c.official_url || "",
      isVerified: c.is_verified || false,
      description: c.description || "",
      ranking: c.ranking,
      course: c.courses?.[0] || "B.Tech CSE",
      status: "In Progress",
      statusColor: "bg-primary/15 text-primary",
      match: c.ranking ? Math.max(70, 100 - (c.ranking || 50) + 10) : 85,
    };
  });
}

async function removeDreamCollege(args: { dreamCollegeId: string }) {
  const { error } = await supabase
    .from("dream_colleges")
    .delete()
    .eq("id", args.dreamCollegeId);
  if (error) throw new Error(`Failed to remove: ${error.message}`);
  return { removed: true };
}

// ── Comparison row helper ─────────────────────────────────────────────────────

function ComparisonRow({ label, values }: { label: string; values: (React.ReactNode | null | undefined)[] }) {
  const hasData = values.some((v) => v != null && v !== "—" && v !== "");
  if (!hasData) return null;
  return (
    <tr className="border-b border-border/40">
      <td className="py-2.5 pr-4 text-[11px] font-mono uppercase tracking-widest text-muted-foreground align-top whitespace-nowrap">
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className="py-2.5 text-sm font-medium align-top">
          {v != null && v !== "—" && v !== "" ? v : <span className="text-muted-foreground/50">—</span>}
        </td>
      ))}
    </tr>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Shortlist() {
  const { user } = useAuth();
  const dreamColleges = useQuery(fetchDreamCollegesForShortlist, { userId: user?._id });
  const removeDream = useMutation(removeDreamCollege);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("match");
  const [removingId, setRemovingId] = useState<string | null>(null);

  // View Details
  const [detailCollege, setDetailCollege] = useState<College | null>(null);

  // Compare
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const displayColleges = useMemo(() => {
    if (dreamColleges && dreamColleges.length > 0) return dreamColleges;
    return DEMO_COLLEGES;
  }, [dreamColleges]);

  const filtered = useMemo(() => {
    let results = displayColleges;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (c) => c.name.toLowerCase().includes(q) || c.course.toLowerCase().includes(q)
      );
    }
    if (sortBy === "match") results = [...results].sort((a, b) => (b.match || 0) - (a.match || 0));
    else if (sortBy === "name") results = [...results].sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }, [displayColleges, searchQuery, sortBy]);

  const selectedColleges = useMemo(
    () => displayColleges.filter((c) => selectedIds.has(c._id)),
    [displayColleges, selectedIds]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRemove = useCallback(
    async (dreamCollegeId: string) => {
      if (!dreamCollegeId) return;
      setRemovingId(dreamCollegeId);
      try {
        await removeDream({ dreamCollegeId });
        toast.success("College removed from shortlist.");
        window.location.reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove.");
      } finally {
        setRemovingId(null);
      }
    },
    [removeDream]
  );

  const toggleSelect = useCallback((collegeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(collegeId)) next.delete(collegeId);
      else next.add(collegeId);
      return next;
    });
  }, []);

  const openCompare = useCallback(() => {
    if (selectedColleges.length < 2) {
      toast.info("Select at least 2 colleges to compare.");
      return;
    }
    setShowCompare(true);
  }, [selectedColleges]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shortlist</h1>
          <p className="mt-1 text-muted-foreground">{filtered.length} colleges saved</p>
        </div>

        {/* Search + Sort + Compare bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search shortlisted colleges..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="mr-2 size-3.5" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Sort: Match score</SelectItem>
              <SelectItem value="name">Sort: Name</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={selectedIds.size >= 2 ? "default" : "outline"}
            className="gap-2"
            onClick={openCompare}
            disabled={selectedIds.size < 2}
          >
            Compare ({selectedIds.size})
          </Button>
        </div>

        {/* College cards */}
        <div className="space-y-3">
          {filtered.map((college, idx) => {
            const isSelected = selectedIds.has(college._id);
            const canSelect = !!college._id; // demo colleges have empty _id
            return (
              <motion.div
                key={college._id || idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card
                  className={`border-border/60 transition-all hover:border-primary/20 ${
                    isSelected ? "border-primary/50 bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      {/* Checkbox for compare */}
                      {canSelect && (
                        <div className="pt-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(college._id)}
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {college.isVerified && (
                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                              <CheckCircle2 className="size-3" />
                              Verified
                            </span>
                          )}
                          <h3 className="text-base font-bold">{college.name}</h3>
                          <Badge className={`${college.statusColor} border-0 text-[10px]`}>
                            {college.status}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {college.course} · {college.location}
                          {college.state ? `, ${college.state}` : ""}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-6 text-sm">
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                              Match
                            </p>
                            <p className="font-bold text-primary">{college.match}%</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                              NIRF
                            </p>
                            <p className="font-medium">#{college.ranking || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                              Fee
                            </p>
                            <p className="font-medium">{college.fees}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                              Deadline
                            </p>
                            <p className="font-medium">{college.applicationDeadline}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                              Scholarship
                            </p>
                            <p className="font-medium text-primary">
                              {college.scholarshipsAvailable.length > 0 ? "Available" : "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 shrink-0 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={!canSelect}
                          onClick={() => toggleSelect(college._id)}
                        >
                          {isSelected ? "Selected ✓" : "Select"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={!canSelect}
                          onClick={() => setDetailCollege(college)}
                        >
                          View details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-destructive"
                          disabled={!college.dreamCollegeId || removingId === college.dreamCollegeId}
                          onClick={() => handleRemove(college.dreamCollegeId)}
                        >
                          {removingId === college.dreamCollegeId ? "Removing..." : "Remove"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Heart className="mx-auto size-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              No shortlisted colleges yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Click the heart icon on a college to add it here
            </p>
          </div>
        )}
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* VIEW DETAILS MODAL                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {detailCollege && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDetailCollege(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border bg-background p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{detailCollege.name}</h2>
                    {detailCollege.isVerified && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {detailCollege.location}
                    {detailCollege.state ? `, ${detailCollege.state}` : ""}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDetailCollege(null)}
                  className="size-8"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="mt-5 space-y-4 text-sm">
                {detailCollege.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {detailCollege.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-accent/50 p-3">
                    <p className="text-[11px] text-muted-foreground">Annual Fees</p>
                    <p className="font-medium">{detailCollege.fees}</p>
                  </div>
                  <div className="rounded-lg bg-accent/50 p-3">
                    <p className="text-[11px] text-muted-foreground">Application Deadline</p>
                    <p className="font-medium">{detailCollege.applicationDeadline || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-accent/50 p-3">
                    <p className="text-[11px] text-muted-foreground">NIRF Ranking</p>
                    <p className="font-medium">
                      {detailCollege.ranking ? `#${detailCollege.ranking}` : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-accent/50 p-3">
                    <p className="text-[11px] text-muted-foreground">Eligibility</p>
                    <p className="font-medium">{detailCollege.eligibility || "—"}</p>
                  </div>
                </div>

                {detailCollege.courses.length > 0 && (
                  <div>
                    <p className="font-medium">Courses</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {detailCollege.courses.map((cr) => (
                        <Badge key={cr} variant="secondary" className="text-xs">
                          {cr}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {detailCollege.entranceExams.length > 0 && (
                  <div>
                    <p className="font-medium">Entrance Exams</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {detailCollege.entranceExams.map((exam) => (
                        <Badge key={exam} variant="outline" className="text-xs">
                          {exam}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {detailCollege.scholarshipsAvailable.length > 0 && (
                  <div>
                    <p className="font-medium">Scholarships Available</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {detailCollege.scholarshipsAvailable.map((sch) => (
                        <Badge key={sch} variant="secondary" className="text-xs">
                          {sch}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {detailCollege.officialUrl && (
                  <a
                    href={detailCollege.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Visit Official Website <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              <div className="mt-6">
                <Button variant="outline" className="w-full" onClick={() => setDetailCollege(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* COMPARE MODAL                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCompare && selectedColleges.length >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowCompare(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl border bg-background p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">
                  Compare {selectedColleges.length} Colleges
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCompare(false)}
                  className="size-8"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b-2 border-border/60">
                      <th className="py-3 pr-4 text-left text-[11px] font-mono uppercase tracking-widest text-muted-foreground w-[160px]">
                        Field
                      </th>
                      {selectedColleges.map((c) => (
                        <th key={c._id} className="py-3 px-3 text-left">
                          <p className="text-sm font-bold">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.location}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <ComparisonRow
                      label="NIRF Rank"
                      values={selectedColleges.map((c) => c.ranking ? `#${c.ranking}` : null)}
                    />
                    <ComparisonRow
                      label="Match"
                      values={selectedColleges.map((c) => `${c.match}%`)}
                    />
                    <ComparisonRow
                      label="Annual Fee"
                      values={selectedColleges.map((c) => c.fees)}
                    />
                    <ComparisonRow
                      label="Deadline"
                      values={selectedColleges.map((c) => c.applicationDeadline)}
                    />
                    <ComparisonRow
                      label="Courses"
                      values={selectedColleges.map((c) => c.courses.join(", ") || null)}
                    />
                    <ComparisonRow
                      label="Entrance Exams"
                      values={selectedColleges.map((c) => c.entranceExams.join(", ") || null)}
                    />
                    <ComparisonRow
                      label="Scholarships"
                      values={selectedColleges.map((c) =>
                        c.scholarshipsAvailable.length > 0
                          ? c.scholarshipsAvailable.join(", ")
                          : null
                      )}
                    />
                    <ComparisonRow
                      label="Eligibility"
                      values={selectedColleges.map((c) => c.eligibility)}
                    />
                    <ComparisonRow
                      label="State"
                      values={selectedColleges.map((c) => c.state)}
                    />
                    <ComparisonRow
                      label="Verified"
                      values={selectedColleges.map((c) => (c.isVerified ? "Yes" : "No"))}
                    />
                    <ComparisonRow
                      label="Website"
                      values={selectedColleges.map((c) =>
                        c.officialUrl ? (
                          <a
                            key={c._id}
                            href={c.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Visit <ExternalLink className="size-2.5" />
                          </a>
                        ) : null
                      )}
                    />
                    <ComparisonRow
                      label="Description"
                      values={selectedColleges.map((c) =>
                        c.description
                          ? c.description.length > 80
                            ? c.description.slice(0, 80) + "…"
                            : c.description
                          : null
                      )}
                    />
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCompare(false)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
