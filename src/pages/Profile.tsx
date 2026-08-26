import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";

const DEMO_PROFILE = {
  name: "Arjun Sharma",
  email: "arjun.sharma@gmail.com",
  gender: "Male",
  category: "General",
  state: "Maharashtra",
  city: "Mumbai",
  twelfthPercentage: "87",
  studentType: "12th",
  preferredCourse: "B.Tech CSE",
  specialization: "Artificial Intelligence",
  annualFamilyIncome: "250000",
  hostelRequired: "Yes",
  scholarshipRequired: "Yes",
  preferredCities: ["Pune", "Bangalore", "Hyderabad", "Chennai"],
  annualFeeBudget: "250000",
  profileStatus: "Active",
  completionPercent: 78,
  completedSections: ["Personal info", "Academic details", "Preferences"],
  pendingSections: ["Entrance exams", "Documents"],
};

function ProfileLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

function Field({ label, value, isEditing, onChange }: {
  label: string;
  value: string;
  isEditing: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <ProfileLabel>{label}</ProfileLabel>
      {isEditing && onChange !== undefined ? (
        <Input
          className="mt-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p className="mt-1 text-base font-medium">{value || "—"}</p>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable form state
  const [form, setForm] = useState({
    name: "",
    gender: "",
    category: "",
    state: "",
    city: "",
    twelfthPercentage: "",
    studentType: "",
    preferredCourse: "",
    specialization: "",
    annualFamilyIncome: "",
    hostelRequired: "Yes",
    scholarshipRequired: "Yes",
  });

  const profile = useMemo(() => {
    if (user?.studentProfile?.age) {
      return {
        name: user.name || "Student",
        email: user.email || "guest@collegepath",
        gender: user.studentProfile.gender || "—",
        category: user.studentProfile.category || "—",
        state: user.studentProfile.state || "—",
        city: "—",
        twelfthPercentage: user.studentProfile.academicScore
          ? String(user.studentProfile.academicScore)
          : "—",
        studentType: user.studentProfile.educationLevel || "—",
        preferredCourse: user.studentProfile.course || "—",
        specialization: "—",
        annualFamilyIncome: user.studentProfile.annualFamilyIncome
          ? String(user.studentProfile.annualFamilyIncome)
          : "—",
        hostelRequired: "—",
        scholarshipRequired: "Yes",
        preferredCities: ["Pune", "Bangalore", "Hyderabad", "Chennai"],
        annualFeeBudget: user.studentProfile.annualFamilyIncome
          ? String(user.studentProfile.annualFamilyIncome)
          : "—",
        profileStatus: "Active",
        completionPercent: user.onboardingCompleted ? 100 : 50,
        completedSections: ["Personal info", "Academic details"],
        pendingSections: ["Entrance exams", "Documents", "Preferences"],
      };
    }
    return DEMO_PROFILE;
  }, [user]);

  // Sync form when entering edit mode
  const startEditing = useCallback(() => {
    setForm({
      name: profile.name === "—" ? "" : profile.name,
      gender: profile.gender === "—" ? "" : profile.gender,
      category: profile.category === "—" ? "" : profile.category,
      state: profile.state === "—" ? "" : profile.state,
      city: profile.city === "—" ? "" : profile.city,
      twelfthPercentage: profile.twelfthPercentage === "—" ? "" : profile.twelfthPercentage,
      studentType: profile.studentType === "—" ? "" : profile.studentType,
      preferredCourse: profile.preferredCourse === "—" ? "" : profile.preferredCourse,
      specialization: profile.specialization === "—" ? "" : profile.specialization,
      annualFamilyIncome: profile.annualFamilyIncome === "—" ? "" : profile.annualFamilyIncome,
      hostelRequired: profile.hostelRequired || "Yes",
      scholarshipRequired: profile.scholarshipRequired || "Yes",
    });
    setIsEditing(true);
  }, [profile]);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!user?._id) return;
    setIsSaving(true);
    try {
      const updates: Record<string, unknown> = {
        name: form.name,
        gender: form.gender || null,
        category: form.category || null,
        state: form.state || null,
        education_level: form.studentType || null,
        course: form.preferredCourse || null,
        academic_score: form.twelfthPercentage ? Number(form.twelfthPercentage) : null,
        annual_family_income: form.annualFamilyIncome ? Number(form.annualFamilyIncome) : null,
        onboarding_completed: true,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user._id);

      if (error) {
        console.error("Profile update error:", error);
        toast.error("Failed to save profile. Please try again.");
        return;
      }

      // Refresh profile from DB
      await refreshProfile();
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Profile save error:", err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  }, [user, form, refreshProfile]);

  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
            <p className="mt-1 text-muted-foreground">
              Your academic details power every match and recommendation.
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={stopEditing} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 size-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={startEditing}>
                Edit profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Personal Information */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Personal Information</ProfileLabel>
              <div className="mt-4 grid grid-cols-2 gap-6">
                <Field label="Full Name" value={form.name || profile.name} isEditing={isEditing} onChange={(v) => setForm({ ...form, name: v })} />
                <Field label="Email" value={profile.email} isEditing={false} />
                <Field label="Gender" value={form.gender || profile.gender} isEditing={isEditing} onChange={(v) => setForm({ ...form, gender: v })} />
                <Field label="Category" value={form.category || profile.category} isEditing={isEditing} onChange={(v) => setForm({ ...form, category: v })} />
                <Field label="State" value={form.state || profile.state} isEditing={isEditing} onChange={(v) => setForm({ ...form, state: v })} />
                <Field label="City" value={form.city || profile.city} isEditing={isEditing} onChange={(v) => setForm({ ...form, city: v })} />
              </div>
            </div>

            {/* Academic Details */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Academic Details</ProfileLabel>
              <div className="mt-4 grid grid-cols-2 gap-6">
                <Field label="12th Percentage" value={form.twelfthPercentage || profile.twelfthPercentage} isEditing={isEditing} onChange={(v) => setForm({ ...form, twelfthPercentage: v })} />
                <Field label="Student Type" value={form.studentType || profile.studentType} isEditing={isEditing} onChange={(v) => setForm({ ...form, studentType: v })} />
                <Field label="Preferred Course" value={form.preferredCourse || profile.preferredCourse} isEditing={isEditing} onChange={(v) => setForm({ ...form, preferredCourse: v })} />
                <Field label="Specialization" value={form.specialization || profile.specialization} isEditing={isEditing} onChange={(v) => setForm({ ...form, specialization: v })} />
              </div>
            </div>

            {/* Financial Preferences */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Financial Preferences</ProfileLabel>
              <div className="mt-4 grid grid-cols-2 gap-6">
                <Field label="Annual Family Income" value={form.annualFamilyIncome || profile.annualFamilyIncome} isEditing={isEditing} onChange={(v) => setForm({ ...form, annualFamilyIncome: v })} />
                <Field label="Hostel Required" value={form.hostelRequired} isEditing={isEditing} onChange={(v) => setForm({ ...form, hostelRequired: v })} />
                <Field label="Scholarship Required" value={form.scholarshipRequired} isEditing={isEditing} onChange={(v) => setForm({ ...form, scholarshipRequired: v })} />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Profile Completion</ProfileLabel>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Overall completeness</p>
                  <p className="text-sm font-bold text-primary">{profile.completionPercent}%</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                    style={{ width: `${profile.completionPercent}%` }}
                  />
                </div>
                <div className="mt-4 space-y-3">
                  {profile.completedSections.map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      <span className="text-sm">{s}</span>
                    </div>
                  ))}
                  {profile.pendingSections.map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className="size-4 rounded-full border-2 border-muted-foreground/30" />
                      <span className="text-sm text-muted-foreground">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Saved Preferences</ProfileLabel>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <ProfileLabel>Preferred cities</ProfileLabel>
                  <p className="text-sm font-medium text-right">
                    {profile.preferredCities.join(", ")}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <ProfileLabel>Annual fee budget</ProfileLabel>
                  <p className="text-sm font-medium">{profile.annualFeeBudget}</p>
                </div>
                <div className="flex items-center justify-between">
                  <ProfileLabel>Course</ProfileLabel>
                  <p className="text-sm font-medium">{profile.preferredCourse}</p>
                </div>
                <div className="flex items-center justify-between">
                  <ProfileLabel>Profile status</ProfileLabel>
                  <p className="text-sm font-medium text-emerald-400">{profile.profileStatus}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
