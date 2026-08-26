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
  Search,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ExternalLink,
  Filter,
  X,
  Star,
  ArrowUpDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
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

function calculateMatch(scholarship: any, profile: EligibilityProfile) {
  let score = 0;
  const totalCriteria = 6;
  const reasons: string[] = [];

  if (scholarship.maxIncome && profile.annualFamilyIncome) {
    const income = parseInt(profile.annualFamilyIncome);
    if (income <= scholarship.maxIncome) {
      score += 1;
      reasons.push("✓ Income is within the eligible range");
    } else {
      reasons.push("✗ Income exceeds the eligible limit");
    }
  } else {
    score += 0.5;
    reasons.push("○ No income restriction");
  }

  if (scholarship.educationLevel) {
    if (scholarship.educationLevel.toLowerCase() === profile.educationLevel.toLowerCase()) {
      score += 1;
      reasons.push("✓ Education level matches");
    } else {
      reasons.push(`✗ Requires ${scholarship.educationLevel} level`);
    }
  } else {
    score += 0.5;
    reasons.push("○ Open to all education levels");
  }

  if (scholarship.minScore && profile.academicScore) {
    const scoreVal = parseFloat(profile.academicScore);
    if (scoreVal >= scholarship.minScore) {
      score += 1;
      reasons.push("✓ Academic score meets requirement");
    } else {
      reasons.push(`✗ Requires minimum ${scholarship.minScore}%`);
    }
  } else {
    score += 0.5;
    reasons.push("○ No minimum score requirement");
  }

  if (scholarship.state && scholarship.state !== "all") {
    if (scholarship.state.toLowerCase() === profile.state.toLowerCase()) {
      score += 1;
      reasons.push("✓ State is eligible");
    } else {
      reasons.push(`✗ Only for ${scholarship.state} residents`);
    }
  } else {
    score += 1;
    reasons.push("✓ Available across all states");
  }

  if (scholarship.category && scholarship.category !== "general") {
    if (scholarship.category.toLowerCase() === profile.category.toLowerCase()) {
      score += 1;
      reasons.push("✓ Category requirement met");
    } else {
      reasons.push(`✗ Restricted to ${scholarship.category} category`);
    }
  } else {
    score += 1;
    reasons.push("✓ Open to all categories");
  }

  if (scholarship.gender && scholarship.gender !== "all") {
    if (scholarship.gender.toLowerCase() === profile.gender.toLowerCase()) {
      score += 1;
      reasons.push("✓ Gender eligibility confirmed");
    } else {
      reasons.push(`✗ Restricted to ${scholarship.gender} candidates`);
    }
  } else {
    score += 1;
    reasons.push("✓ Open to all genders");
  }

  const matchPercentage = Math.round((score / totalCriteria) * 100);
  return { scholarship, matchPercentage, reasons };
}

export default function ScholarshipNavigator() {
  const { user } = useAuth();
  const scholarships = useQuery(api.scholarships.getActive);
  const bookmarks = useQuery(
    api.scholarships.listBookmarks,
    user ? { userId: user._id } : "skip"
  );
  const toggleBookmark = useMutation(api.scholarships.toggleBookmark);
  const createApplication = useMutation(api.scholarships.createApplication);

  const [showForm, setShowForm] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("match");
  const [selectedScholarship, setSelectedScholarship] = useState<any>(null);

  const [profile, setProfile] = useState<EligibilityProfile>({
    name: user?.name || "Arjun Sharma",
    age: "18",
    state: "Maharashtra",
    gender: "male",
    annualFamilyIncome: "600000",
    category: "general",
    educationLevel: "undergraduate",
    course: "Engineering",
    academicScore: "87",
  });

  const isFormComplete = profile.age && profile.state && profile.educationLevel;

  const matchedScholarships = useMemo(() => {
    if (!scholarships) return [];
    if (!isFormComplete) return scholarships.map((s) => ({ scholarship: s, matchPercentage: 0, reasons: [] }));
    return scholarships.map((s) => calculateMatch(s, profile));
  }, [scholarships, profile, isFormComplete]);

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

    if (sortBy === "match" && isFormComplete) {
      results.sort((a, b) => b.matchPercentage - a.matchPercentage);
    } else if (sortBy === "name") {
      results.sort((a, b) => a.scholarship.name.localeCompare(b.scholarship.name));
    }

    return results;
  }, [matchedScholarships, searchQuery, filterType, sortBy, isFormComplete]);

  const bookmarkedIds = useMemo(
    () =>
      new Set(
        bookmarks?.filter((b) => b.itemType === "scholarship").map((b) => b.itemId) || []
      ),
    [bookmarks]
  );

  const handleBookmark = useCallback(
    async (id: string) => {
      if (!user) return;
      await toggleBookmark({ userId: user._id, itemType: "scholarship", itemId: id });
    },
    [user, toggleBookmark]
  );

  return (
    <div className="p-6 md:p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl space-y-6">
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
            <Button variant="outline" onClick={() => setShowForm(!showForm)} className="px-8">
              {showForm ? "Hide Profile Form" : "Browse All Scholarships"}
            </Button>
          </div>
        </div>

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
                  <h2 className="text-lg font-bold">Your Eligibility Profile</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Fill in your details to get personalized scholarship matches.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Name</Label>
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Age</Label>
                      <Input
                        type="number"
                        value={profile.age}
                        onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">State</Label>
                      <Select value={profile.state} onValueChange={(v) => setProfile({ ...profile, state: v })}>
                        <SelectTrigger>
                          <SelectValue />
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
                      <Select value={profile.gender} onValueChange={(v) => setProfile({ ...profile, gender: v })}>
                        <SelectTrigger>
                          <SelectValue />
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
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Community / Category</Label>
                      <Select value={profile.category} onValueChange={(v) => setProfile({ ...profile, category: v })}>
                        <SelectTrigger>
                          <SelectValue />
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
                      <Select value={profile.educationLevel} onValueChange={(v) => setProfile({ ...profile, educationLevel: v })}>
                        <SelectTrigger>
                          <SelectValue />
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
                      <Select value={profile.course} onValueChange={(v) => setProfile({ ...profile, course: v })}>
                        <SelectTrigger>
                          <SelectValue />
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
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} scholarship{filtered.length !== 1 ? "s" : ""}
          {isFormComplete && " matched to your profile"}
        </p>

        {/* Scholarship Cards */}
        <div className="space-y-4">
          {filtered.map((result, idx) => {
            const s = result.scholarship;
            const daysUntil = Math.ceil(
              (new Date(s.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const isBookmarked = bookmarkedIds.has(s._id);

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
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold leading-tight">{s.name}</h3>
                          {s.isVerified && (
                            <Badge variant="secondary" className="shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
                              ✓ Verified
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{s.provider}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {result.matchPercentage > 0 && (
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
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleBookmark(s._id)}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="size-4 text-primary" />
                          ) : (
                            <Bookmark className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px] capitalize">{s.type}</Badge>
                      <Badge variant="outline" className="text-[10px]">{s.educationLevel}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{s.category}</Badge>
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{s.benefit}</p>

                    {result.reasons.length > 0 && (
                      <div className="mt-3 rounded-lg bg-accent/50 p-3">
                        <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Why am I eligible?</p>
                        <div className="space-y-1">
                          {result.reasons.map((reason, i) => (
                            <p key={i} className="text-[11px] text-muted-foreground">{reason}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                      <div className="text-xs text-muted-foreground">
                        <span className={`font-medium ${daysUntil <= 7 ? "text-red-500" : ""}`}>
                          {daysUntil > 0 ? `${daysUntil} days left` : "Expired"}
                        </span>
                        <span className="mx-1.5">·</span>
                        <span>{s.educationLevel}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setSelectedScholarship(s)}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                        >
                          Apply Now
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
            <p className="text-sm font-medium text-muted-foreground">No scholarships found</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Try adjusting your filters or search query
            </p>
          </div>
        )}

        {/* Detail Dialog */}
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
                className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{selectedScholarship.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedScholarship.provider}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedScholarship(null)} className="size-8">
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Benefit:</span>{" "}
                    <span className="text-muted-foreground">{selectedScholarship.benefit}</span>
                  </div>
                  <div>
                    <span className="font-medium">Eligibility:</span>{" "}
                    <span className="text-muted-foreground">{selectedScholarship.eligibility}</span>
                  </div>
                  <div>
                    <span className="font-medium">Deadline:</span>{" "}
                    <span className="text-muted-foreground">{selectedScholarship.deadline}</span>
                  </div>
                  <div>
                    <span className="font-medium">Description:</span>{" "}
                    <span className="text-muted-foreground">{selectedScholarship.description}</span>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedScholarship(null)}>
                    Close
                  </Button>
                  <Button className="flex-1">Apply Now</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
