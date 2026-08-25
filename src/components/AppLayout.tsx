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
  SheetHeader,
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
  X,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/dashboard", label: "Today", icon: LayoutDashboard },
  { path: "/discover", label: "Discover", icon: Compass },
  { path: "/shortlist", label: "Shortlist", icon: Heart },
  { path: "/applications", label: "Applications", icon: FileText },
  { path: "/deadlines", label: "Deadlines", icon: Calendar },
  { path: "/scholarships", label: "Scholarships", icon: GraduationCap },
];

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
        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        <Icon
          className={`size-[18px] shrink-0 transition-colors ${
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          }`}
        />
        <span className="flex-1">{item.label}</span>
        {isActive && (
          <ChevronRight className="size-4 text-primary/60" />
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
  const unreadCount = 3; // Would come from notifications query

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
          <p className="text-[11px] text-muted-foreground">AI Admissions Guide</p>
        </div>
      </div>

      <Separator className="mx-3 w-auto" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} onClick={onNavClick} />
          ))}
        </nav>
      </ScrollArea>

      <Separator className="mx-3 w-auto" />

      {/* Bottom actions */}
      <div className="flex flex-col gap-1 p-3">
        <NavLink
          to="/notifications"
          onClick={onNavClick}
          className="block"
        >
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground">
            <div className="relative">
              <Bell className="size-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="flex-1">Notifications</span>
          </div>
        </NavLink>

        <NavLink to="/profile" onClick={onNavClick} className="block">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground">
            <User className="size-[18px]" />
            <span className="flex-1">Profile</span>
          </div>
        </NavLink>

        <div className="flex items-center gap-2 pt-1">
          <ThemeToggle />
          <Separator orientation="vertical" className="h-6" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="size-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        </div>

        {/* User info */}
        <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name || "Student"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email || "guest@collegepath"}
            </p>
          </div>
        </div>
      </div>
    </div>
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
                  <SheetHeader className="border-b px-4 py-3">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <GraduationCap className="size-4" />
                      </div>
                      CollegePath
                    </SheetTitle>
                  </SheetHeader>
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
        <aside className="fixed inset-y-0 left-0 z-30 w-[260px] border-r bg-sidebar">
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="ml-[260px] min-h-screen flex-1">
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}
