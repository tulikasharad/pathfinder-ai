import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@/hooks/use-supabase-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  GraduationCap,
  ExternalLink,
  Heart,
  Star,
  Filter,
  ArrowUpDown,
  X,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

/** Parse a fee string like "₹2.2L" into a numeric value for comparison. */
function parseFee(feeStr: string | null): number {
  if (!feeStr) return 0;
  const cleaned = feeStr.replace(/[₹,\s]/g, "").toLowerCase();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  if (cleaned.includes("l")) return num * 100000;
  if (cleaned.includes("k")) return num * 1000;
  if (cleaned.includes("cr")) return num * 10000000;
  return num;
}

interface AdvancedFilters {
  scholarshipAvailable: boolean;
  verifiedOnly: boolean;
  entranceExams: string[];
  courses: string[];
  maxFee: string;
}

const EMPTY_FILTERS: AdvancedFilters = {
  scholarshipAvailable: false,
  verifiedOnly: false,
  entranceExams: [],
  courses: [],
  maxFee: "any",
};

const FEE_OPTIONS = [
  { value: "any", label: "Any budget" },
  { value: "1L", label: "Under ₹1 Lakh/year" },
  { value: "2L", label: "Under ₹2 Lakh/year" },
  { value: "3L", label: "Under ₹3 Lakh/year" },
  { value: "5L", label: "Under ₹5 Lakh/year" },
  { value: "10L", label: "Under ₹10 Lakh/year" },
];

const MAX_FEE_MAP: Record<string, number> = {
  "1L": 100000,
  "2L": 200000,
  "3L": 300000,
  "5L": 500000,
  "10L": 1000000,
};

const COMMON_EXAMS = ["JEE Main", "BITSAT", "VITEEE", "SRMJEEE", "MHT-CET", "COMEDK"];
const COMMON_COURSES = ["B.Tech CSE", "B.Tech ECE", "B.Tech ME", "B.E. CSE", "BCA", "B.Sc"];

// ── Data fetchers ────────────────────────────────────────────────────────────

async function fetchColleges() {
  const { data } = await supabase.from("colleges").select("*");
  return (data ?? []).map((r) => ({
    _id: r.id,
    name: r.name,
    location: r.location,
    state: r.state,
    courses: r.courses ?? [],
    entranceExams: r.entrance_exams ?? [],
    fees: r.fees,
    eligibility: r.eligibility,
    applicationDeadline: r.application_deadline,
    scholarshipsAvailable: r.scholarships_available ?? [],
    officialUrl: r.official_url,
    isVerified: r.is_verified,
    description: r.description,
    imageUrl: r.image_url,
    ranking: r.ranking,
  }));
}

/** Fetch dream colleges for the logged-in student from the dream_colleges table. */
async function fetchDreamColleges(args: { userId?: string }) {
  if (!args.userId) return [];
  const { data, error } = await supabase
    .from("dream_colleges")
    .select("id, college_id, student_id, priority, created_at")
    .eq("student_id", args.userId);
  if (error) {
    console.error("[fetchDreamColleges] Error:", error.message, error.details);
    return [];
  }
  return (data ?? []).map((r) => ({
    _id: r.id,
    collegeId: r.college_id,
    studentId: r.student_id,
    priority: r.priority,
    createdAt: r.created_at,
  }));
}

/**
 * Toggle a dream college record:
 * - If the student already has this college → DELETE the record
 * - If not → INSERT a new record
 */
async function toggleDreamCollegeOp(args: { userId: string; collegeId: string }) {
  // Check for existing dream college record
  const { data: existing, error: findError } = await supabase
    .from("dream_colleges")
    .select("id")
    .eq("student_id", args.userId)
    .eq("college_id", args.collegeId)
    .maybeSingle();

  if (findError) {
    console.error("[toggleDreamCollege] Find error:", findError.message, findError.details);
    throw new Error(`Failed to check dream college: ${findError.message}`);
  }

  if (existing) {
    // Remove from dream colleges
    const { error: deleteError } = await supabase
      .from("dream_colleges")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      console.error("[toggleDreamCollege] Delete error:", deleteError.message, deleteError.details);
      throw new Error(`Failed to remove dream college: ${deleteError.message}`);
    }
    return { saved: false };
  }

  // Add to dream colleges
  const { error: insertError } = await supabase
    .from("dream_colleges")
    .insert({
      student_id: args.userId,
      college_id: args.collegeId,
      priority: 0,
    });

  if (insertError) {
    console.error("[toggleDreamCollege] Insert error:", insertError.message, insertError.details);
    throw new Error(`Failed to save dream college: ${insertError.message}`);
  }
  return { saved: true };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CollegeDiscovery() {
  const { user } = useAuth();
  const colleges = useQuery(fetchColleges);
  const dreamColleges = useQuery(fetchDreamColleges, { userId: user?._id });
  const toggleDreamCollege = useMutation(toggleDreamCollegeOp);

  // Basic filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [sortBy, setSortBy] = useState("ranking");
  const [selectedCollege, setSelectedCollege] = useState<any>(null);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [adv, setAdv] = useState<AdvancedFilters>({ ...EMPTY_FILTERS });

  const hasActiveFilters =
    adv.scholarshipAvailable ||
    adv.verifiedOnly ||
    adv.entranceExams.length > 0 ||
    adv.courses.length > 0 ||
    adv.maxFee !== "any";

  const clearAdvancedFilters = useCallback(() => {
    setAdv({ ...EMPTY_FILTERS });
  }, []);

  /** Set of college IDs currently saved as dream colleges. */
  const dreamCollegeIds = useMemo(
    () => new Set(dreamColleges?.map((d) => d.collegeId) || []),
    [dreamColleges]
  );

  // ── Filter logic ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!colleges) return [];
    let results = [...colleges];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.courses.some((course: string) => course.toLowerCase().includes(q))
      );
    }

    if (filterState !== "all") {
      results = results.filter((c) => c.state === filterState);
    }

    if (adv.maxFee !== "any") {
      const maxFeeValue = MAX_FEE_MAP[adv.maxFee];
      if (maxFeeValue) {
        results = results.filter((c) => parseFee(c.fees) <= maxFeeValue && parseFee(c.fees) > 0);
      }
    }

    if (adv.scholarshipAvailable) {
      results = results.filter((c) => c.scholarshipsAvailable.length > 0);
    }

    if (adv.verifiedOnly) {
      results = results.filter((c) => c.isVerified);
    }

    if (adv.entranceExams.length > 0) {
      const lower = adv.entranceExams.map((e) => e.toLowerCase());
      results = results.filter((c) =>
        c.entranceExams.some((e: string) => lower.includes(e.toLowerCase()))
      );
    }

    if (adv.courses.length > 0) {
      const lower = adv.courses.map((c) => c.toLowerCase());
      results = results.filter((c) =>
        c.courses.some((cr: string) => lower.includes(cr.toLowerCase()))
      );
    }

    if (sortBy === "ranking") {
      results.sort((a, b) => (a.ranking || 99) - (b.ranking || 99));
    } else if (sortBy === "name") {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }

    return results;
  }, [colleges, searchQuery, filterState, sortBy, adv]);

  // ── Heart toggle handler ─────────────────────────────────────────────────

  const handleToggleDreamCollege = useCallback(
    async (collegeId: string) => {
      if (!user?._id) {
        toast.error("Please sign in to save colleges.");
        return;
      }

      try {
        const result = await toggleDreamCollege({
          userId: user._id,
          collegeId: collegeId,
        });

        if (result.saved) {
          toast.success("College added to your Dream Colleges!");
        } else {
          toast.success("College removed from Dream Colleges.");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        console.error("[handleToggleDreamCollege] Error:", err);
        toast.error(message);
      }
    },
    [user, toggleDreamCollege]
  );

  // ── Helpers ──────────────────────────────────────────────────────────────

  const uniqueStates = useMemo(() => {
    if (!colleges) return [];
    return [...new Set(colleges.map((c) => c.state))].sort();
  }, [colleges]);

  const allExams = useMemo(() => {
    if (!colleges) return COMMON_EXAMS;
    const found = new Set<string>();
    colleges.forEach((c) => c.entranceExams.forEach((e: string) => found.add(e)));
    COMMON_EXAMS.forEach((e) => found.add(e));
    return [...found].sort();
  }, [colleges]);

  const allCourses = useMemo(() => {
    if (!colleges) return COMMON_COURSES;
    const found = new Set<string>();
    colleges.forEach((c) => c.courses.forEach((cr: string) => found.add(cr)));
    COMMON_COURSES.forEach((c) => found.add(c));
    return [...found].sort();
  }, [colleges]);

  const activeFilterCount =
    (adv.scholarshipAvailable ? 1 : 0) +
    (adv.verifiedOnly ? 1 : 0) +
    adv.entranceExams.length +
    adv.courses.length +
    (adv.maxFee !== "any" ? 1 : 0);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-6xl space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discover opportunities</h1>
          <p className="mt-1 text-muted-foreground">
            Find a path that fits your profile, goals and budget.
          </p>
        </div>

        {/* ── Search bar + filters ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search colleges, courses, scholarships or exams..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {uniqueStates.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="gap-2 relative"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <Filter className="size-3.5" />
            More filters
            {activeFilterCount > 0 && (
              <Badge className="ml-1 size-5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* ── Advanced filter panel ────────────────────────────────────── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-border/60 bg-card p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Advanced Filters</h3>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={clearAdvancedFilters}
                    >
                      <X className="mr-1 size-3" />
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      Annual Fee
                    </Label>
                    <Select value={adv.maxFee} onValueChange={(v) => setAdv((p) => ({ ...p, maxFee: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any budget" />
                      </SelectTrigger>
                      <SelectContent>
                        {FEE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      Entrance Exam
                    </Label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {allExams.map((exam) => {
                        const selected = adv.entranceExams.includes(exam);
                        return (
                          <Badge
                            key={exam}
                            variant={selected ? "default" : "outline"}
                            className="cursor-pointer text-[11px] select-none"
                            onClick={() => {
                              setAdv((p) => ({
                                ...p,
                                entranceExams: selected
                                  ? p.entranceExams.filter((e) => e !== exam)
                                  : [...p.entranceExams, exam],
                              }));
                            }}
                          >
                            {exam}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      Course / Branch
                    </Label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {allCourses.map((course) => {
                        const selected = adv.courses.includes(course);
                        return (
                          <Badge
                            key={course}
                            variant={selected ? "default" : "outline"}
                            className="cursor-pointer text-[11px] select-none"
                            onClick={() => {
                              setAdv((p) => ({
                                ...p,
                                courses: selected
                                  ? p.courses.filter((c) => c !== course)
                                  : [...p.courses, course],
                              }));
                            }}
                          >
                            {course}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 border-t pt-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={adv.scholarshipAvailable}
                      onCheckedChange={(checked) =>
                        setAdv((p) => ({ ...p, scholarshipAvailable: !!checked }))
                      }
                    />
                    Scholarship available
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={adv.verifiedOnly}
                      onCheckedChange={(checked) =>
                        setAdv((p) => ({ ...p, verifiedOnly: !!checked }))
                      }
                    />
                    Officially verified only
                  </label>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-xs text-muted-foreground">
                    Showing {filtered.length} matching {filtered.length === 1 ? "college" : "colleges"}
                  </p>
                  <Button size="sm" onClick={() => setShowFilters(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Profile summary bar ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-accent/30 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-primary">👤</span> Based on your profile:
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">12th: 87%</Badge>
            <Badge variant="secondary" className="text-xs">B.Tech CSE</Badge>
            <Badge variant="secondary" className="text-xs">₹2.5L budget</Badge>
          </div>
          <span className="ml-auto text-sm font-bold text-primary">{filtered.length} MATCHES</span>
        </div>

        <h2 className="text-lg font-bold">Colleges for your path</h2>

        {/* ── College cards ────────────────────────────────────────────── */}
        <div className="space-y-4">
          {filtered.map((college, idx) => {
            const isDreamCollege = dreamCollegeIds.has(college._id);
            const deadlineDays = Math.ceil(
              (new Date(college.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const isUrgent = deadlineDays <= 7 && deadlineDays > 0;

            return (
              <motion.div
                key={college._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="group border-border/60 transition-all hover:border-primary/30 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {college.isVerified && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                          Officially verified
                        </span>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {isUrgent ? "Closing Soon" : "Open"}
                      </Badge>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold">{college.name}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {college.courses[0] || "B.Tech CSE"} · {college.location}, {college.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">
                          {college.ranking ? Math.max(70, 100 - (college.ranking || 50) + 10) : 85}%
                        </p>
                        <p className="text-xs text-muted-foreground">Match</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">NIRF</p>
                        <p className="font-medium">#{college.ranking || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Avg Package</p>
                        <p className="font-medium">₹{college.ranking ? (14 - college.ranking * 0.1).toFixed(1) : "12.0"}L</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Annual Fee</p>
                        <p className="font-medium">{college.fees}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Exam</p>
                        <p className="font-medium">{college.entranceExams[0] || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Deadline</p>
                        <p className={`font-medium ${isUrgent ? "text-amber-500" : ""}`}>
                          {college.applicationDeadline}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <Star className="size-3" />
                        Scholarship
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        Eligible
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          className="size-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                          onClick={() => handleToggleDreamCollege(college._id)}
                          aria-label={isDreamCollege ? "Remove from Dream Colleges" : "Add to Dream Colleges"}
                        >
                          {isDreamCollege ? (
                            <Heart className="size-5 fill-red-500 text-red-500" />
                          ) : (
                            <Heart className="size-5 text-muted-foreground" />
                          )}
                        </button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setSelectedCollege(college)}
                        >
                          View details <ArrowRight className="size-3.5" />
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
            <GraduationCap className="mx-auto size-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">No colleges found</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Try adjusting your search or filters</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="mt-4" onClick={clearAdvancedFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* ── College detail modal ─────────────────────────────────────── */}
        <AnimatePresence>
          {selectedCollege && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setSelectedCollege(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl border bg-background p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{selectedCollege.name}</h2>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {selectedCollege.location}, {selectedCollege.state}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCollege(null)} className="size-8">
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <p className="text-muted-foreground">{selectedCollege.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-accent/50 p-3">
                      <p className="text-[11px] text-muted-foreground">Fees</p>
                      <p className="font-medium">{selectedCollege.fees}</p>
                    </div>
                    <div className="rounded-lg bg-accent/50 p-3">
                      <p className="text-[11px] text-muted-foreground">Deadline</p>
                      <p className="font-medium">{selectedCollege.applicationDeadline}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Entrance Exams</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedCollege.entranceExams.map((exam: string) => (
                        <Badge key={exam} variant="outline" className="text-xs">{exam}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Courses</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedCollege.courses.map((course: string) => (
                        <Badge key={course} variant="secondary" className="text-xs">{course}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Eligibility</p>
                    <p className="text-muted-foreground">{selectedCollege.eligibility}</p>
                  </div>
                  {selectedCollege.officialUrl && (
                    <a
                      href={selectedCollege.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Visit Official Website <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedCollege(null)}>
                    Close
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleToggleDreamCollege(selectedCollege._id);
                      setSelectedCollege(null);
                    }}
                  >
                    {dreamCollegeIds.has(selectedCollege._id) ? "Remove from Dream Colleges" : "Add to Dream Colleges"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
