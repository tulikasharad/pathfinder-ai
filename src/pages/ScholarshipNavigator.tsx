import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@/hooks/use-supabase-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
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
  Search,
  Bookmark,
  BookmarkCheck,
  X,
  Filter,
  ArrowUpDown,
  ExternalLink,
  AlertCircle,
  LinkIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  calculateScholarshipMatch,
  eligibilityLabel,
  eligibilityColor,
  deadlineUrgency,
  type ScholarshipProfile,
} from "@/lib/scholarship-match";

const states = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi",
];

interface EligibilityProfile {
  name: string;
  age: string;
  state: string;
  gender: string;
  annualFamilyIncome: string;
  category: string;
  educationLevel: string;
  course: string;
  academicScore: string;
}

// ── Data fetchers ────────────────────────────────────────────────────────────

async function fetchActiveScholarships() {
  const { data } = await supabase.from("scholarships").select("*").eq("is_active", true);
  return (data ?? []).map((r) => ({
    _id: r.id,
    name: r.name ?? "",
    provider: r.provider ?? "",
    type: r.type ?? "",
    benefit: r.benefit ?? "",
    eligibility: r.eligibility ?? "",
    deadline: r.deadline ?? null,
    educationLevel: r.education_level ?? null,
    state: r.state ?? "all",
    category: r.category ?? "general",
    minScore: r.min_score ?? null,
    maxIncome: r.max_income ?? null,
    gender: r.gender ?? null,
    description: r.description ?? "",
    officialUrl: r.official_url ?? null,
    isVerified: r.is_verified ?? false,
    isActive: r.is_active ?? true,
  }));
}

async function fetchScholarshipBookmarks(args: { userId?: string }) {
  if (!args.userId) return [];
  const { data } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("student_id", args.userId)
    .eq("item_type", "scholarship");
  return (data ?? []).map((r) => ({
    _id: r.id,
    userId: r.student_id,
    itemType: r.item_type,
    itemId: r.item_id,
  }));
}

async function toggleSchBookmark(args: { userId: string; itemType: string; itemId: string }) {
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("student_id", args.userId)
    .eq("item_type", args.itemType)
    .eq("item_id", args.itemId)
    .maybeSingle();
  if (existing) {
    await supabase.from("bookmarks").delete().eq("id", existing.id);
    return { bookmarked: false };
  }
  await supabase.from("bookmarks").insert({
    student_id: args.userId,
    item_type: args.itemType,
    item_id: args.itemId,
  });
  return { bookmarked: true };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Open a URL safely in a new tab without navigating away from the app */
function openExternalUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ScholarshipNavigator() {
  const { user } = useAuth();
  const scholarships = useQuery(fetchActiveScholarships);
  const bookmarks = useQuery(fetchScholarshipBookmarks, { userId: user?._id });
  const toggleBookmark = useMutation(toggleSchBookmark);

  const [showForm, setShowForm] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("match");
  const [selectedScholarship, setSelectedScholarship] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [profile, setProfile] = useState<EligibilityProfile>({
    name: "",
    age: "",
    state: "",
    gender: "",
    annualFamilyIncome: "",
    category: "",
    educationLevel: "",
    course: "",
    academicScore: "",
  });

  // ── Load profile from Supabase on mount ─────────────────────────────────
  useEffect(() => {
    if (!user?._id || profileLoaded) return;

    async function loadProfile() {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("name, age, state, gender, annual_family_income, category, education_level, course, academic_score")
          .eq("id", user!._id)
          .maybeSingle();

        if (data) {
          setProfile({
            name: data.name || "",
            age: data.age ? String(data.age) : "",
            state: data.state || "",
            gender: data.gender || "",
            annualFamilyIncome: data.annual_family_income ? String(data.annual_family_income) : "",
            category: data.category || "",
            educationLevel: data.education_level || "",
            course: data.course || "",
            academicScore: data.academic_score ? String(data.academic_score) : "",
          });
        }
      } catch (err) {
        console.error("[ScholarshipNavigator] Failed to load profile:", err);
      } finally {
        setProfileLoaded(true);
      }
    }

    loadProfile();
  }, [user?._id, profileLoaded]);

  const isFormComplete = profile.age && profile.state && profile.educationLevel;

  // ── Build scholarship profile for matching ───────────────────────────────
  const scholarshipProfile: ScholarshipProfile = useMemo(() => ({
    academicScore: profile.academicScore ? parseFloat(profile.academicScore) : undefined,
    annualFamilyIncome: profile.annualFamilyIncome ? parseInt(profile.annualFamilyIncome) : undefined,
    category: profile.category || undefined,
    gender: profile.gender || undefined,
    state: profile.state || undefined,
    educationLevel: profile.educationLevel || undefined,
    course: profile.course || undefined,
    age: profile.age ? parseInt(profile.age) : undefined,
  }), [profile]);

  // ── Match scholarships ──────────────────────────────────────────────────
  const matchedScholarships = useMemo(() => {
    if (!scholarships) return [];
    return scholarships.map((s) => ({
      scholarship: s,
      ...calculateScholarshipMatch(s, scholarshipProfile),
    }));
  }, [scholarships, scholarshipProfile]);

  // ── Filter & sort ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let results = matchedScholarships;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (r) =>
          r.scholarship.name.toLowerCase().includes(q) ||
          r.scholarship.provider.toLowerCase().includes(q)
      );
    }

    if (filterType !== "all") {
      results = results.filter((r) => r.scholarship.type === filterType);
    }

    if (sortBy === "match") {
      results.sort((a, b) => {
        const priority = { eligible: 0, likely_eligible: 1, insufficient_info: 2, not_eligible: 3 };
        const pa = priority[a.eligibility] ?? 2;
        const pb = priority[b.eligibility] ?? 2;
        if (pa !== pb) return pa - pb;
        return b.matchPercentage - a.matchPercentage;
      });
    } else if (sortBy === "name") {
      results.sort((a, b) => a.scholarship.name.localeCompare(b.scholarship.name));
    } else if (sortBy === "deadline") {
      results.sort((a, b) => {
        const da = a.scholarship.deadline ? new Date(a.scholarship.deadline).getTime() : Infinity;
        const db = b.scholarship.deadline ? new Date(b.scholarship.deadline).getTime() : Infinity;
        return da - db;
      });
    }

    return results;
  }, [matchedScholarships, searchQuery, filterType, sortBy]);

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks?.map((b) => b.itemId) || []),
    [bookmarks]
  );

  const handleBookmark = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        await toggleBookmark({ userId: user._id, itemType: "scholarship", itemId: id });
      } catch {
        toast.error("Failed to update bookmark.");
      }
    },
    [user, toggleBookmark]
  );

  const handleApplyNow = useCallback((url: string | null) => {
    if (url && url.trim()) {
      openExternalUrl(url);
    } else {
      toast.info("Official application link is currently unavailable.");
    }
  }, []);

  /** Determine button label and action for a scholarship */
  function getScholarshipButton(officialUrl: string | null): { label: string; hasUrl: boolean } {
    if (officialUrl && officialUrl.trim()) {
      return { label: "Apply Now", hasUrl: true };
    }
    return { label: "Official Link Unavailable", hasUrl: false };
  }

  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl space-y-6"
      >
        {/* Hero */}
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-accent/50 to-card p-8 text-center md:p-10">
          <Badge variant="secondary" className="mb-4 gap-1 font-mono text-xs uppercase tracking-widest">
            ★ Scholarship Navigator
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Find Scholarships You're Eligible For
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Discover relevant government, educational, and private scholarships based on your profile.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => setShowForm(true)} className="px-8">
              Find My Scholarships
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className="px-8"
            >
              {showForm ? "Hide Profile Form" : "Browse All Scholarships"}
            </Button>
          </div>
        </div>

        {/* Profile incomplete notice */}
        {profileLoaded && !isFormComplete && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <AlertCircle className="size-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium">Complete your profile to improve scholarship recommendations.</p>
              <p className="text-xs text-muted-foreground">
                Go to{" "}
                <a href="/profile" className="underline text-primary hover:text-primary/80">
                  Profile
                </a>{" "}
                to fill in your academic score, income, category and other details.
              </p>
            </div>
          </div>
        )}

        {/* Eligibility Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Your Eligibility Profile</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {profileLoaded
                          ? "Loaded from your Supabase profile. Edit below to refine matches."
                          : "Fill in your details to get personalized scholarship matches."}
                      </p>
                    </div>
                    {!profileLoaded && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    )}
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Name</Label>
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Age</Label>
                      <Input
                        type="number"
                        value={profile.age}
                        onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                        placeholder="18"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">State</Label>
                      <Select
                        value={profile.state}
                        onValueChange={(v) => setProfile({ ...profile, state: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Gender</Label>
                      <Select
                        value={profile.gender}
                        onValueChange={(v) => setProfile({ ...profile, gender: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Annual Family Income (₹)</Label>
                      <Input
                        type="number"
                        value={profile.annualFamilyIncome}
                        onChange={(e) => setProfile({ ...profile, annualFamilyIncome: e.target.value })}
                        placeholder="400000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Community / Category</Label>
                      <Select
                        value={profile.category}
                        onValueChange={(v) => setProfile({ ...profile, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="OBC">OBC</SelectItem>
                          <SelectItem value="SC">SC</SelectItem>
                          <SelectItem value="ST">ST</SelectItem>
                          <SelectItem value="EWS">EWS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Education Level</Label>
                      <Select
                        value={profile.educationLevel}
                        onValueChange={(v) => setProfile({ ...profile, educationLevel: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="school">School (10th/12th)</SelectItem>
                          <SelectItem value="undergraduate">Undergraduate</SelectItem>
                          <SelectItem value="postgraduate">Postgraduate</SelectItem>
                          <SelectItem value="diploma">Diploma</SelectItem>
                          <SelectItem value="vocational">Vocational</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Course / Field</Label>
                      <Select
                        value={profile.course}
                        onValueChange={(v) => setProfile({ ...profile, course: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Engineering">Engineering</SelectItem>
                          <SelectItem value="Medicine">Medicine</SelectItem>
                          <SelectItem value="Arts">Arts</SelectItem>
                          <SelectItem value="Commerce">Commerce</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="Law">Law</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Academic % / CGPA</Label>
                      <Input
                        type="number"
                        value={profile.academicScore}
                        onChange={(e) => setProfile({ ...profile, academicScore: e.target.value })}
                        placeholder="85"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search scholarships..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 size-3.5" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="government">Government</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="mr-2 size-3.5" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Best Match</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} scholarship{filtered.length !== 1 ? "s" : ""}
          {isFormComplete && " matched to your profile"}
        </p>

        {/* Results */}
        <div className="space-y-4">
          {filtered.map((result, idx) => {
            const s = result.scholarship;
            const urgency = deadlineUrgency(s.deadline);
            const isBookmarked = bookmarkedIds.has(s._id);
            const btn = getScholarshipButton(s.officialUrl);

            return (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="group border-border/60 transition-all hover:border-primary/30 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold leading-tight">{s.name}</h3>
                          {s.isVerified && (
                            <Badge variant="secondary" className="shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
                              ✓ Verified
                            </Badge>
                          )}
                          <Badge className={`shrink-0 text-[10px] ${eligibilityColor(result.eligibility)}`}>
                            {eligibilityLabel(result.eligibility)}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{s.provider}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          className={`shrink-0 text-[10px] font-bold ${
                            result.matchPercentage >= 80
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : result.matchPercentage >= 50
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {result.matchPercentage}% Match
                        </Badge>
                        <button
                          className="size-8 inline-flex items-center justify-center rounded-md hover:bg-accent"
                          onClick={() => handleBookmark(s._id)}
                          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark scholarship"}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="size-4 text-primary" />
                          ) : (
                            <Bookmark className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px] capitalize">{s.type}</Badge>
                      {s.educationLevel && <Badge variant="outline" className="text-[10px]">{s.educationLevel}</Badge>}
                      {s.category && s.category !== "general" && (
                        <Badge variant="outline" className="text-[10px] capitalize">{s.category}</Badge>
                      )}
                      {s.maxIncome && (
                        <Badge variant="outline" className="text-[10px]">
                          ≤ ₹{(s.maxIncome / 100000).toFixed(1)}L income
                        </Badge>
                      )}
                      {s.minScore && (
                        <Badge variant="outline" className="text-[10px]">
                          ≥ {s.minScore}%
                        </Badge>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{s.benefit}</p>

                    {/* Eligibility reasons */}
                    {result.reasons.length > 0 && (
                      <div className="mt-3 rounded-lg bg-accent/50 p-3">
                        <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                          Why am I eligible?
                        </p>
                        <div className="space-y-1">
                          {result.reasons.slice(0, 4).map((reason, i) => (
                            <p key={i} className="text-[11px] text-muted-foreground">{reason}</p>
                          ))}
                          {result.reasons.length > 4 && (
                            <p className="text-[11px] text-muted-foreground/60">
                              +{result.reasons.length - 4} more criteria
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bottom row */}
                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`font-medium ${urgency.color}`}>{urgency.label}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{s.educationLevel || "All levels"}</span>
                        {s.officialUrl && (
                          <>
                            <span className="text-muted-foreground">·</span>
                            <span className="flex items-center gap-1 text-primary">
                              <LinkIcon className="size-3" />
                              Official source
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setSelectedScholarship({ ...s, matchResult: result })}
                        >
                          Details
                        </Button>
                        {btn.hasUrl ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => handleApplyNow(s.officialUrl)}
                          >
                            Apply Now
                            <ExternalLink className="size-3" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground"
                            disabled
                          >
                            Official Link Unavailable
                          </Button>
                        )}
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
            <p className="text-sm font-medium text-muted-foreground">No scholarships found</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Try adjusting your search, filters, or eligibility profile.
            </p>
          </div>
        )}

        {/* ── Detail Dialog ──────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedScholarship && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setSelectedScholarship(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl border bg-background p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold">{selectedScholarship.name}</h2>
                      {selectedScholarship.isVerified && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedScholarship.provider}</p>
                    {selectedScholarship.matchResult && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge className={`text-[10px] ${eligibilityColor(selectedScholarship.matchResult.eligibility)}`}>
                          {eligibilityLabel(selectedScholarship.matchResult.eligibility)}
                        </Badge>
                        <Badge className="text-[10px] font-bold bg-primary/10 text-primary">
                          {selectedScholarship.matchResult.matchPercentage}% Match
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedScholarship(null)}
                    className="size-8"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Benefit: </span>
                    <span className="text-muted-foreground">{selectedScholarship.benefit}</span>
                  </div>
                  <div>
                    <span className="font-medium">Eligibility: </span>
                    <span className="text-muted-foreground">{selectedScholarship.eligibility}</span>
                  </div>
                  <div>
                    <span className="font-medium">Deadline: </span>
                    <span className="text-muted-foreground">
                      {selectedScholarship.deadline || "Not specified"}
                    </span>
                  </div>
                  {selectedScholarship.description && (
                    <div>
                      <span className="font-medium">Description: </span>
                      <span className="text-muted-foreground">{selectedScholarship.description}</span>
                    </div>
                  )}
                  {selectedScholarship.officialUrl && (
                    <div>
                      <span className="font-medium">Official Source: </span>
                      <a
                        href={selectedScholarship.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {selectedScholarship.officialUrl} <ExternalLink className="size-3" />
                      </a>
                    </div>
                  )}

                  {/* Detailed eligibility breakdown */}
                  {selectedScholarship.matchResult?.criteriaDetails && (
                    <div className="mt-3 rounded-lg bg-accent/50 p-3">
                      <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                        Eligibility Breakdown
                      </p>
                      <div className="space-y-1.5">
                        {selectedScholarship.matchResult.criteriaDetails.map(
                          (c: { name: string; met: boolean; required: boolean; detail: string }, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-[11px]">
                              <span className={c.met ? "text-emerald-500" : "text-red-500"}>
                                {c.met ? "✓" : "✗"}
                              </span>
                              <span className="font-medium">{c.name}:</span>
                              <span className="text-muted-foreground">{c.detail}</span>
                              {c.required && !c.met && (
                                <Badge className="text-[9px] bg-red-500/10 text-red-500 ml-auto">Required</Badge>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedScholarship(null)}
                  >
                    Close
                  </Button>
                  {selectedScholarship.officialUrl ? (
                    <Button
                      className="flex-1 gap-1"
                      onClick={() => handleApplyNow(selectedScholarship.officialUrl)}
                    >
                      Apply Now
                      <ExternalLink className="size-3" />
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1" disabled>
                      Official Link Unavailable
                    </Button>
                  )}
                </div>
                {!selectedScholarship.officialUrl && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Official application link is currently unavailable.
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
