import { useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sun,
  Moon,
  LayoutDashboard,
  Compass,
  Heart,
  FileText,
  Calendar,
  GraduationCap,
  Bell,
  User,
  LogOut,
  Menu,
  HelpCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const navItems = [
  { path: "/dashboard", label: "Today", icon: LayoutDashboard },
  { path: "/discover", label: "Discover", icon: Compass },
  { path: "/shortlist", label: "Shortlist", icon: Heart },
  { path: "/applications", label: "Applications", icon: FileText },
  { path: "/deadlines", label: "Deadlines", icon: Calendar },
  { path: "/scholarships", label: "Scholarships", icon: GraduationCap },
  { path: "/notifications", label: "Notifications", icon: Bell, showBadge: true },
  { path: "/profile", label: "Profile", icon: User },
];

const routeLabels: Record<string, string> = {
  "/dashboard": "Today",
  "/discover": "Discover",
  "/shortlist": "Shortlist",
  "/applications": "Applications",
  "/deadlines": "Deadlines",
  "/scholarships": "Scholarships",
  "/notifications": "Notifications",
  "/profile": "Profile",
};

function NavItem({
  item,
  onClick,
}: {
  item: (typeof navItems)[number];
  onClick?: () => void;
}) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;

  return (
    <NavLink to={item.path} onClick={onClick} className="block">
      <div
        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-primary" />
        )}
        <Icon
          className={`size-[18px] shrink-0 transition-colors ${
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          }`}
        />
        <span className="flex-1">{item.label}</span>
        {item.showBadge && (
          <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            3
          </span>
        )}
      </div>
    </NavLink>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="size-9 shrink-0"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === "light" ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="size-[18px]" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="size-[18px]" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    onNavClick?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight">CollegePath</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            AI Admissions Guide
          </p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} onClick={onNavClick} />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="mt-auto space-y-3 px-4 pb-4">
        <p className="text-xs italic text-muted-foreground">
          "Make one smart move today."
        </p>
        <Separator />
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function TopBar() {
  const location = useLocation();
  const pageName = routeLabels[location.pathname] || "Page";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <p className="text-sm text-muted-foreground">
        Student workspace <span className="mx-1">/</span> <span className="text-foreground">{pageName}</span>
      </p>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="size-9">
          <HelpCircle className="size-[18px]" />
        </Button>
        <NavLink to="/notifications">
          <Button variant="ghost" size="icon" className="relative size-9">
            <Bell className="size-[18px]" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
          </Button>
        </NavLink>
        <div className="ml-1 flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          A
        </div>
      </div>
    </header>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isMobile) {
    return (
      <TooltipProvider delayDuration={300}>
        <div className="flex min-h-screen flex-col">
          {/* Mobile header */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <SidebarContent onNavClick={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <GraduationCap className="size-4" />
                </div>
                <span className="text-sm font-bold">CollegePath</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NavLink to="/notifications">
                <Button variant="ghost" size="icon" className="relative size-9">
                  <Bell className="size-[18px]" />
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
                </Button>
              </NavLink>
            </div>
          </header>

          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 w-[240px] border-r bg-sidebar">
          <SidebarContent />
        </aside>

        {/* Main content */}
        <div className="ml-[240px] flex min-h-screen flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
