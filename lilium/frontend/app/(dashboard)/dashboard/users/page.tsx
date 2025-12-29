"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  KeyRound,
  Search,
  Store,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdmins,
  useAdminStats,
  useShopOwners,
  useToggleAdminActive,
  useToggleShopOwnerActive,
} from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";
import { AdminCreateDialog } from "./_components/admin-create-dialog";
import { AdminEditDialog } from "./_components/admin-edit-dialog";
import { AdminDeleteDialog } from "./_components/admin-delete-dialog";
import { ZoneAssignmentDialog } from "./_components/zone-assignment-dialog";
import { ResetPasswordDialog } from "./_components/reset-password-dialog";
import type { Admin, ShopOwner, AdminFilters, ShopOwnerFilters, Zone } from "@/types/user";

export default function UsersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuthStore();

  // Role-based access control - only SUPER_ADMIN can access this page
  const allowedRoles = ["SUPER_ADMIN"];
  const hasAccess = user?.role && allowedRoles.includes(user.role);

  // Admin filters state
  const [adminFilters, setAdminFilters] = useState<AdminFilters>({});
  const [adminSearch, setAdminSearch] = useState("");

  // Shop owner filters state
  const [shopOwnerFilters, setShopOwnerFilters] = useState<ShopOwnerFilters>({});
  const [shopOwnerSearch, setShopOwnerSearch] = useState("");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  // Queries
  const { data: adminsData, isLoading: isLoadingAdmins } = useAdmins({
    ...adminFilters,
    search: adminSearch || undefined,
  });
  const { data: stats, isLoading: isLoadingStats } = useAdminStats();
  const { data: shopOwnersData, isLoading: isLoadingShopOwners } = useShopOwners({
    ...shopOwnerFilters,
    search: shopOwnerSearch || undefined,
  });

  // Mutations
  const toggleAdminActive = useToggleAdminActive();
  const toggleShopOwnerActive = useToggleShopOwnerActive();

  const handleAdminStatusToggle = async (admin: Admin) => {
    try {
      await toggleAdminActive.mutateAsync({
        id: admin.id,
        isActive: !admin.isActive,
      });
      toast({
        title: "Success",
        description: `Admin ${admin.isActive ? "deactivated" : "activated"} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleShopOwnerStatusToggle = async (owner: ShopOwner) => {
    try {
      await toggleShopOwnerActive.mutateAsync({
        id: owner.id,
        isActive: !owner.isActive,
      });
      toast({
        title: "Success",
        description: `Shop owner ${owner.isActive ? "deactivated" : "activated"} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Show access denied message for unauthorized users
  if (!hasAccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Access Denied</h3>
                <p className="text-muted-foreground">
                  You don't have permission to access this page. This page is only available to Super Admins.
                </p>
              </div>
              <Button onClick={() => router.push("/dashboard")} className="mt-4">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <Header title="User Management" />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {isLoadingStats ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAdmins || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.superAdmins || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Location Admins</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.locationAdmins || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats?.activeAdmins || 0}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="admins" className="space-y-4">
        <TabsList>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admins
          </TabsTrigger>
          <TabsTrigger value="shop-owners" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Shop Owners
          </TabsTrigger>
        </TabsList>

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search admins..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={adminFilters.role || "all"}
                onValueChange={(value) =>
                  setAdminFilters((prev) => ({
                    ...prev,
                    role: value === "all" ? undefined : (value as "SUPER_ADMIN" | "LOCATION_ADMIN"),
                  }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="LOCATION_ADMIN">Location Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={adminFilters.zone || "all"}
                onValueChange={(value) =>
                  setAdminFilters((prev) => ({
                    ...prev,
                    zone: value === "all" ? undefined : (value as Zone),
                  }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  <SelectItem value="KARKH">Karkh</SelectItem>
                  <SelectItem value="RUSAFA">Rusafa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Administrators</CardTitle>
              <CardDescription>
                Manage super admins and location admins
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAdmins ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !adminsData?.admins?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No admins found</p>
                  <p className="text-sm text-muted-foreground">
                    Add a new admin to get started
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Zones</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminsData.admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{admin.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {admin.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              admin.role === "SUPER_ADMIN" ? "default" : "secondary"
                            }
                          >
                            {admin.role === "SUPER_ADMIN"
                              ? "Super Admin"
                              : "Location Admin"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {admin.zones.map((zone) => (
                              <Badge key={zone} variant="outline">
                                {zone}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={admin.isActive}
                            onCheckedChange={() => handleAdminStatusToggle(admin)}
                            disabled={
                              toggleAdminActive.isPending ||
                              admin.role === "SUPER_ADMIN"
                            }
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(admin.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setZoneDialogOpen(true);
                                }}
                              >
                                <MapPin className="mr-2 h-4 w-4" />
                                Assign Zones
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setPasswordDialogOpen(true);
                                }}
                              >
                                <KeyRound className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setDeleteDialogOpen(true);
                                }}
                                disabled={admin.role === "SUPER_ADMIN"}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shop Owners Tab */}
        <TabsContent value="shop-owners" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search shop owners..."
                value={shopOwnerSearch}
                onChange={(e) => setShopOwnerSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={shopOwnerFilters.zone || "all"}
              onValueChange={(value) =>
                setShopOwnerFilters((prev) => ({
                  ...prev,
                  zone: value === "all" ? undefined : (value as Zone),
                }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="KARKH">Karkh</SelectItem>
                <SelectItem value="RUSAFA">Rusafa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Shop Owners</CardTitle>
              <CardDescription>
                View and manage shop owner accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingShopOwners ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !shopOwnersData?.shopOwners?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Store className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No shop owners found</p>
                  <p className="text-sm text-muted-foreground">
                    Shop owners will appear here when they register
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop Owner</TableHead>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Zones</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shopOwnersData.shopOwners.map((owner) => (
                      <TableRow key={owner.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{owner.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {owner.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {owner.businessName || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {owner.zones.map((zone) => (
                              <Badge key={zone} variant="outline">
                                {zone}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {owner._count?.orders || 0} orders
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={owner.isActive}
                            onCheckedChange={() =>
                              handleShopOwnerStatusToggle(owner)
                            }
                            disabled={toggleShopOwnerActive.isPending}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(owner.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AdminCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <AdminEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        admin={selectedAdmin}
      />
      <AdminDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        admin={selectedAdmin}
      />
      <ZoneAssignmentDialog
        open={zoneDialogOpen}
        onOpenChange={setZoneDialogOpen}
        admin={selectedAdmin}
      />
      <ResetPasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        admin={selectedAdmin}
      />
    </div>
  );
}
