import { OrderStatus } from '@/app/types/order';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig = {
  [OrderStatus.PENDING]: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  [OrderStatus.CONFIRMED]: {
    label: 'Confirmed',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  [OrderStatus.PROCESSING]: {
    label: 'Processing',
    className: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  [OrderStatus.SHIPPED]: {
    label: 'Shipped',
    className: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  [OrderStatus.DELIVERED]: {
    label: 'Delivered',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  [OrderStatus.CANCELLED]: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(config.className, 'font-medium', className)}
    >
      {config.label}
    </Badge>
  );
}
