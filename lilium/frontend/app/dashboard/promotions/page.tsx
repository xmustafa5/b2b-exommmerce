"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isAfter, isBefore } from "date-fns";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CalendarDays,
  Tag,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  usePromotions,
  useDeletePromotion,
  useTogglePromotionActive,
} from "@/app/hooks/usePromotions";
import type { Promotion, PromotionStatus } from "@/app/types/promotion";

export default function PromotionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState<string>("ALL");
  const [type, setType] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<PromotionStatus>("active");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = usePromotions({
    status: activeTab,
    zone: zone === "ALL" ? undefined : zone,
    type: type === "ALL" ? undefined : (type as any),
    search: search || undefined,
  });

  const deleteMutation = useDeletePromotion();
  const toggleMutation = useTogglePromotionActive();

  const promotions = data?.promotions || [];

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);

    if (!promotion.isActive || isAfter(now, end)) {
      return "expired";
    } else if (isBefore(now, start)) {
      return "upcoming";
    } else {
      return "active";
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (id: string) => {
    await toggleMutation.mutateAsync(id);
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <Tag className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">
        No promotions
      </h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      {activeTab === "active" && (
        <div className="mt-6">
          <Button asChild>
            <Link href="/dashboard/promotions/new">
              <Plus className="mr-2 h-4 w-4" />
              New Promotion
            </Link>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
          <p className="text-muted-foreground">
            Manage discounts and special offers
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/promotions/new">
            <Plus className="mr-2 h-4 w-4" />
            New Promotion
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search promotions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={zone} onValueChange={setZone}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Zones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Zones</SelectItem>
            <SelectItem value="north">North</SelectItem>
            <SelectItem value="south">South</SelectItem>
            <SelectItem value="east">East</SelectItem>
            <SelectItem value="west">West</SelectItem>
            <SelectItem value="central">Central</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed">Fixed Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PromotionStatus)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : promotions.length === 0 ? (
            <EmptyState message="Get started by creating a new promotion" />
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Zones</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{promotion.nameEn}</div>
                          <div className="text-sm text-muted-foreground">
                            {promotion.nameAr}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {promotion.type === "percentage"
                            ? "Percentage"
                            : "Fixed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {promotion.type === "percentage"
                          ? `${promotion.value}%`
                          : `$${promotion.value}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(promotion.startDate), "MMM dd")} -{" "}
                            {format(new Date(promotion.endDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {promotion.zones.length} zone(s)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            getPromotionStatus(promotion) === "active"
                              ? "default"
                              : getPromotionStatus(promotion) === "upcoming"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {getPromotionStatus(promotion)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={promotion.isActive}
                          onCheckedChange={() =>
                            handleToggleActive(promotion.id)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/promotions/${promotion.id}`
                              )
                            }
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/promotions/${promotion.id}/edit`
                              )
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(promotion.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : promotions.length === 0 ? (
            <EmptyState message="No upcoming promotions scheduled" />
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Zones</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{promotion.nameEn}</div>
                          <div className="text-sm text-muted-foreground">
                            {promotion.nameAr}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {promotion.type === "percentage"
                            ? "Percentage"
                            : "Fixed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {promotion.type === "percentage"
                          ? `${promotion.value}%`
                          : `$${promotion.value}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(promotion.startDate), "MMM dd")} -{" "}
                            {format(new Date(promotion.endDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {promotion.zones.length} zone(s)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">upcoming</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={promotion.isActive}
                          onCheckedChange={() =>
                            handleToggleActive(promotion.id)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/promotions/${promotion.id}`
                              )
                            }
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/promotions/${promotion.id}/edit`
                              )
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(promotion.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : promotions.length === 0 ? (
            <EmptyState message="No expired promotions" />
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Zones</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{promotion.nameEn}</div>
                          <div className="text-sm text-muted-foreground">
                            {promotion.nameAr}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {promotion.type === "percentage"
                            ? "Percentage"
                            : "Fixed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {promotion.type === "percentage"
                          ? `${promotion.value}%`
                          : `$${promotion.value}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(promotion.startDate), "MMM dd")} -{" "}
                            {format(new Date(promotion.endDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {promotion.zones.length} zone(s)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">expired</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/promotions/${promotion.id}`
                              )
                            }
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(promotion.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              promotion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
