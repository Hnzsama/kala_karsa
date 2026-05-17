import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export type Product = {
    id: number;
    name: string;
    slug: string;
    sku: string;
    description: string | null;
    cover: string | null;
    cover_url: string;
    price: string;
    stock: number;
    metadata: {
        brand?: string;
        category?: string;
        color?: string;
        size?: string;
        tags?: string[];
    } | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const getColumns = (
  onEdit: (product: Product) => void,
  onDelete: (product: Product) => void
): ColumnDef<Product>[] => [
  {
    accessorKey: "cover_url",
    header: "Cover",
    cell: ({ row }) => (
      <img
        src={row.original.cover_url}
        alt={row.original.name}
        className="h-10 w-10 rounded-md object-cover border border-sidebar-border"
      />
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-3"
      >
        Nama Produk
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <div className="font-semibold text-neutral-900 dark:text-neutral-100">{row.original.name}</div>
        <div className="text-xs text-neutral-500">{row.original.slug}</div>
      </div>
    ),
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono">{row.original.sku}</code>,
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-3"
      >
        Harga
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(price)
      return <div className="font-medium text-emerald-600 dark:text-emerald-400">{formatted}</div>
    },
  },
  {
    accessorKey: "stock",
    header: "Stok",
    cell: ({ row }) => {
      const stock = row.original.stock
      return (
        <span className={stock <= 5 ? "text-red-500 font-bold" : "text-neutral-700 dark:text-neutral-300"}>
          {stock} unit
        </span>
      )
    },
  },
  {
    id: "category",
    header: "Kategori",
    cell: ({ row }) => row.original.metadata?.category || "-",
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? "default" : "secondary"} className={row.original.is_active ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 border-emerald-500/30" : ""}>
        {row.original.is_active ? "Aktif" : "Non-aktif"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
              <span className="sr-only">Menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(product)} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Edit Produk
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(product)} className="text-red-600 dark:text-red-400 focus:text-red-600 cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus Produk
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
