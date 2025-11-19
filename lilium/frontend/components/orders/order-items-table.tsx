import Image from 'next/image';
import type { OrderItem } from '@/app/types/order';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface OrderItemsTableProps {
  items: OrderItem[];
  showImages?: boolean;
}

export function OrderItemsTable({
  items,
  showImages = true,
}: OrderItemsTableProps) {
  const calculateSubtotal = (item: OrderItem) => {
    return item.quantity * item.price;
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + calculateSubtotal(item), 0);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showImages && <TableHead className="w-20">Image</TableHead>}
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              {showImages && (
                <TableCell>
                  {item.product.images && item.product.images.length > 0 ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                      No image
                    </div>
                  )}
                </TableCell>
              )}
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-500">{item.product.nameAr}</p>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-500">
                  {item.product.sku || 'N/A'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                ${item.price.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right font-medium">
                ${calculateSubtotal(item).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell
              colSpan={showImages ? 5 : 4}
              className="text-right font-medium"
            >
              Total:
            </TableCell>
            <TableCell className="text-right font-bold">
              ${calculateTotal().toFixed(2)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
