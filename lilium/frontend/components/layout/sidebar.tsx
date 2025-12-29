"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Tag,
  Boxes,
  BarChart3,
  Building2,
  Users,
  Truck,
  DollarSign,
  Bell,
  Settings,
  LogOut,
  Wallet,
  Activity,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth";
import { useMemo } from "react";

// Define navigation items with role-based access
type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[]; // Roles that can access this item
};

// All navigation items with role restrictions
const allNavigation: NavItem[] = [
  // Dashboard - all roles
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "LOCATION_ADMIN", "COMPANY_ADMIN", "COMPANY_USER"]
  },

  // Vendor Dashboard - Only for COMPANY_ADMIN and COMPANY_USER
  {
    name: "Vendor Dashboard",
    href: "/dashboard/vendors",
    icon: Store,
    roles: ["COMPANY_ADMIN", "COMPANY_USER"]
  },

  // Products - SUPER_ADMIN sees all, vendors should use Vendor Dashboard
  {
    name: "Products",
    href: "/dashboard/products",
    icon: Package,
    roles: ["SUPER_ADMIN", "LOCATION_ADMIN"]
  },

  // Orders - Different views for different roles
  {
    name: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingCart,
    roles: ["SUPER_ADMIN", "LOCATION_ADMIN"]
  },

  // Categories - Admin only
  {
    name: "Categories",
    href: "/dashboard/categories",
    icon: FolderTree,
    roles: ["SUPER_ADMIN"]
  },

  // Promotions - Admin only
  {
    name: "Promotions",
    href: "/dashboard/promotions",
    icon: Tag,
    roles: ["SUPER_ADMIN"]
  },

  // Inventory - Admin and vendors
  {
    name: "Inventory",
    href: "/dashboard/inventory",
    icon: Boxes,
    roles: ["SUPER_ADMIN", "LOCATION_ADMIN"]
  },

  // Analytics - Admin only
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "LOCATION_ADMIN"]
  },

  // Companies - SUPER_ADMIN only
  {
    name: "Companies",
    href: "/dashboard/companies",
    icon: Building2,
    roles: ["SUPER_ADMIN"]
  },

  // Users - SUPER_ADMIN only
  {
    name: "Users",
    href: "/dashboard/users",
    icon: Users,
    roles: ["SUPER_ADMIN"]
  },

  // Notifications - Admin only
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    roles: ["SUPER_ADMIN", "LOCATION_ADMIN"]
  },

  // Deliveries - Admin and location admin
  {
    name: "Deliveries",
    href: "/dashboard/deliveries",
    icon: Truck,
    roles: ["SUPER_ADMIN", "LOCATION_ADMIN"]
  },

  // Payouts - Admin and vendors
  {
    name: "Payouts",
    href: "/dashboard/payouts",
    icon: Wallet,
    roles: ["SUPER_ADMIN", "COMPANY_ADMIN"]
  },

  // Settlements - Admin and vendors
  {
    name: "Settlements",
    href: "/dashboard/settlements",
    icon: DollarSign,
    roles: ["SUPER_ADMIN", "COMPANY_ADMIN"]
  },

  // Monitoring - SUPER_ADMIN only
  {
    name: "Monitoring",
    href: "/dashboard/monitoring",
    icon: Activity,
    roles: ["SUPER_ADMIN"]
  },
];

const bottomNavigation = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

// Role display names
const roleDisplayNames: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  LOCATION_ADMIN: "Location Admin",
  COMPANY_ADMIN: "Vendor Admin",
  COMPANY_USER: "Vendor Staff",
  SHOP_OWNER: "Shop Owner",
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // Filter navigation based on user role
  const navigation = useMemo(() => {
    if (!user?.role) return [];
    return allNavigation.filter((item) => item.roles.includes(user.role));
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const displayRole = user?.role ? roleDisplayNames[user.role] || user.role : "User";

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Package className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold">Lilium</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Bottom Navigation */}
      <div className="p-4 space-y-1">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </div>

      <Separator />

      {/* User Section */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {displayRole}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
