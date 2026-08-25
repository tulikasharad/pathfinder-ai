import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Sun, Moon, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
];

export default function Profile() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const updateProfile = useMutation(api.scholarships.updateProfile);

  const profile = user?.studentProfile;
  const [formData, setFormData] = useState({
    name: user?.name || "",
    age: profile?.age?.toString() || "",
    state: profile?.state || "",
    gender: profile?.gender || "",
    annualFamilyIncome: profile?.annualFamilyIncome?.toString() || "",
    category: profile?.category || "",
    educationLevel: profile?.educationLevel || "",
    schoolType: profile?.schoolType || "",
    course: profile?.course || "",
    institutionType: profile?.institutionType || "",
    academicScore: profile?.academicScore?.toString() || "",
    isDisabled: profile?.isDisabled || false,
    isMinority: profile?.isMinority || false,
    isFirstGeneration: profile?.isFirstGeneration || false,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(async () => {
    if (!user) return;
    await updateProfile({
      userId: user._id,
      name: formData.name || undefined,
      studentProfile: {
        age: formData.age ? parseInt(formData.age) : undefined,
        state: formData.state || undefined,
        gender: formData.gender || undefined,
        annualFamilyIncome: formData.annualFamilyIncome
          ? parseInt(formData.annualFamilyIncome)
          : undefined,
        category: formData.category || undefined,
        educationLevel: formData.educationLevel || undefined,
        schoolType: formData.schoolType || undefined,
        course: formData.course || undefined,
        institutionType: formData.institutionType || undefined,
        academicScore: formData.academicScore
          ? parseFloat(formData.academicScore)
          : undefined,
        isDisabled: formData.isDisabled,
        isMinority: formData.isMinority,
        isFirstGeneration: formData.isFirstGeneration,
      },
    });
    setSaved(true);
    toast.success("Profile saved successfully!");
    setTimeout(() => setSaved(false), 2000);
  }, [user, formData, updateProfile]);

  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Profile</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your student profile and preferences
          </p>
        </div>

        {/* User Card */}
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="size-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{user?.name || "Student"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email || "guest@collegepath"}</p>
              {user?.onboardingCompleted && (
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  <CheckCircle2 className="mr-1 size-3" />
                  Profile Complete
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "light" ? <Sun className="size-5" /> : <Moon className="size-5" />}
                <div>
                  <p className="text-sm font-medium">
                    {theme === "light" ? "Light Mode" : "Dark Mode"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>
          </CardContent>
        </Card>

        {/* Student Profile Form */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Student Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name</Label>
                <Input
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Age</Label>
                <Input
                  type="number"
                  placeholder="e.g. 18"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(v) => setFormData({ ...formData, state: v })}
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
                <Label className="text-xs">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(v) => setFormData({ ...formData, gender: v })}
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
                <Label className="text-xs">Annual Family Income (₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 300000"
                  value={formData.annualFamilyIncome}
                  onChange={(e) =>
                    setFormData({ ...formData, annualFamilyIncome: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
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
                <Label className="text-xs">Education Level</Label>
                <Select
                  value={formData.educationLevel}
                  onValueChange={(v) => setFormData({ ...formData, educationLevel: v })}
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
                <Label className="text-xs">Course/Field</Label>
                <Input
                  placeholder="e.g. Computer Science"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Academic % / CGPA</Label>
                <Input
                  type="number"
                  placeholder="e.g. 85"
                  value={formData.academicScore}
                  onChange={(e) =>
                    setFormData({ ...formData, academicScore: e.target.value })
                  }
                />
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={formData.isMinority}
                  onCheckedChange={(v) => setFormData({ ...formData, isMinority: v })}
                />
                Minority status
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={formData.isFirstGeneration}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, isFirstGeneration: v })
                  }
                />
                First-generation student
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={formData.isDisabled}
                  onCheckedChange={(v) => setFormData({ ...formData, isDisabled: v })}
                />
                Disability status
              </label>
            </div>

            <Button onClick={handleSave} className="w-full sm:w-auto">
              {saved ? (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Saved!
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
