"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Package,
  DollarSign,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanies } from "@/hooks/useCompanies";
import { uploadApi } from "@/actions/upload";
import type { Company, CompanyFilters } from "@/types/company";
import { CompanyCreateDialog } from "./_components/company-create-dialog";
import { CompanyEditDialog } from "./_components/company-edit-dialog";
import { CompanyDeleteDialog } from "./_components/company-delete-dialog";
import { CompanyProductsDialog } from "./_components/company-products-dialog";
import { CompanyPayoutsDialog } from "./_components/company-payouts-dialog";

export default function CompaniesPage() {
  const [filters, setFilters] = useState<CompanyFilters>({});
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [payoutsDialogOpen, setPayoutsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const { data, isLoading } = useCompanies(filters);

  // Filter companies by search term
  const filteredCompanies = useMemo(() => {
    if (!data?.companies) return [];
    if (!search) return data.companies;

    const searchLower = search.toLowerCase();
    return data.companies.filter(
      (company) =>
        company.nameEn.toLowerCase().includes(searchLower) ||
        company.nameAr.toLowerCase().includes(searchLower) ||
        company.email.toLowerCase().includes(searchLower)
    );
  }, [data?.companies, search]);

  const handleOpenCreate = () => {
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (company: Company) => {
    setEditingCompany(company);
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (company: Company) => {
    setDeletingCompany(company);
    setDeleteDialogOpen(true);
  };

  const handleOpenProducts = (company: Company) => {
    setSelectedCompany(company);
    setProductsDialogOpen(true);
  };

  const handleOpenPayouts = (company: Company) => {
    setSelectedCompany(company);
    setPayoutsDialogOpen(true);
  };

  return (
    <div className="flex flex-col">
      <Header title="Companies" />

      <div className="flex-1 space-y-6 p-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={filters.isActive === undefined ? "all" : filters.isActive ? "active" : "inactive"}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  isActive: value === "all" ? undefined : value === "active",
                })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.zone || "all"}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  zone: value === "all" ? undefined : (value as "KARKH" | "RUSAFA"),
                })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="KARKH">Karkh</SelectItem>
                <SelectItem value="RUSAFA">Rusafa</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </div>
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Companies</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !filteredCompanies.length ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                <Building2 className="mb-4 h-12 w-12" />
                <p>No companies found</p>
                <Button className="mt-4" onClick={handleOpenCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first company
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Zones</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {company.logo ? (
                            <img
                              src={uploadApi.getImageUrl(company.logo)}
                              alt={company.nameEn}
                              className="h-10 w-10 rounded-lg object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                              }}
                            />
                          ) : null}
                          <div className={`h-10 w-10 items-center justify-center rounded-lg bg-muted ${company.logo ? "hidden" : "flex"}`}>
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{company.nameEn}</p>
                            {company.nameAr && (
                              <p
                                className="text-sm text-muted-foreground"
                                dir="rtl"
                              >
                                {company.nameAr}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell>{company.phone || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {company.zones.map((zone) => (
                            <span
                              key={zone}
                              className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                            >
                              {zone}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{company.commission}%</TableCell>
                      <TableCell>{company._count?.products || 0}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            company.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {company.isActive ? "Active" : "Inactive"}
                        </span>
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
                              onClick={() => handleOpenEdit(company)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenProducts(company)}
                            >
                              <Package className="mr-2 h-4 w-4" />
                              View Products
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenPayouts(company)}
                            >
                              <DollarSign className="mr-2 h-4 w-4" />
                              Calculate Payouts
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenDelete(company)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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
      </div>

      {/* Create Company Dialog */}
      <CompanyCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Company Dialog */}
      {editingCompany && (
        <CompanyEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          company={editingCompany}
        />
      )}

      {/* Delete Company Dialog */}
      {deletingCompany && (
        <CompanyDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          company={deletingCompany}
        />
      )}

      {/* Company Products Dialog */}
      <CompanyProductsDialog
        open={productsDialogOpen}
        onOpenChange={setProductsDialogOpen}
        company={selectedCompany}
      />

      {/* Company Payouts Dialog */}
      <CompanyPayoutsDialog
        open={payoutsDialogOpen}
        onOpenChange={setPayoutsDialogOpen}
        company={selectedCompany}
      />
    </div>
  );
}
