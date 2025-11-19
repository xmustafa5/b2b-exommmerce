import { OrderStatus, type OrderStatusHistory } from '@/app/types/order';
import { format } from 'date-fns';
import { Check, X, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusTimelineProps {
  currentStatus: OrderStatus;
  statusHistory?: OrderStatusHistory[];
}

const statusFlow = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export function StatusTimeline({
  currentStatus,
  statusHistory = [],
}: StatusTimelineProps) {
  const isCancelled = currentStatus === OrderStatus.CANCELLED;
  const currentIndex = statusFlow.indexOf(currentStatus);

  const getStatusInfo = (status: OrderStatus, index: number) => {
    if (isCancelled && status === currentStatus) {
      return {
        completed: false,
        current: true,
        icon: X,
        label: 'Cancelled',
        className: 'text-red-600 bg-red-100',
      };
    }

    if (isCancelled) {
      return {
        completed: false,
        current: false,
        icon: Circle,
        label: getStatusLabel(status),
        className: 'text-gray-400 bg-gray-100',
      };
    }

    const isCompleted = index < currentIndex;
    const isCurrent = status === currentStatus;

    return {
      completed: isCompleted,
      current: isCurrent,
      icon: isCompleted ? Check : Circle,
      label: getStatusLabel(status),
      className: isCompleted
        ? 'text-green-600 bg-green-100'
        : isCurrent
        ? 'text-blue-600 bg-blue-100'
        : 'text-gray-400 bg-gray-100',
    };
  };

  const getStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Pending',
      [OrderStatus.CONFIRMED]: 'Confirmed',
      [OrderStatus.PROCESSING]: 'Processing',
      [OrderStatus.SHIPPED]: 'Shipped',
      [OrderStatus.DELIVERED]: 'Delivered',
      [OrderStatus.CANCELLED]: 'Cancelled',
    };
    return labels[status];
  };

  const getStatusDate = (status: OrderStatus) => {
    const history = statusHistory.find((h) => h.status === status);
    return history ? format(new Date(history.createdAt), 'MMM dd, yyyy HH:mm') : null;
  };

  return (
    <div className="space-y-6">
      {statusFlow.map((status, index) => {
        const info = getStatusInfo(status, index);
        const statusDate = getStatusDate(status);
        const Icon = info.icon;

        return (
          <div key={status} className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2',
                info.completed || info.current
                  ? 'border-transparent'
                  : 'border-gray-300',
                info.className
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1 pt-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  info.current || info.completed
                    ? 'text-gray-900'
                    : 'text-gray-500'
                )}
              >
                {info.label}
              </p>
              {statusDate && (
                <p className="text-xs text-gray-500">{statusDate}</p>
              )}
              {statusHistory.find((h) => h.status === status)?.note && (
                <p className="text-xs text-gray-600 mt-1">
                  {statusHistory.find((h) => h.status === status)?.note}
                </p>
              )}
            </div>

            {/* Connector Line */}
            {index < statusFlow.length - 1 && (
              <div
                className={cn(
                  'absolute left-[19px] top-[50px] h-6 w-0.5',
                  info.completed ? 'bg-green-600' : 'bg-gray-300'
                )}
                style={{ marginTop: `${index * 80}px` }}
              />
            )}
          </div>
        );
      })}

      {/* Show cancelled status if order is cancelled */}
      {isCancelled && (
        <div className="flex items-start gap-4 border-t pt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-transparent bg-red-100 text-red-600">
            <X className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1 pt-1">
            <p className="text-sm font-medium text-gray-900">Cancelled</p>
            {getStatusDate(OrderStatus.CANCELLED) && (
              <p className="text-xs text-gray-500">
                {getStatusDate(OrderStatus.CANCELLED)}
              </p>
            )}
            {statusHistory.find((h) => h.status === OrderStatus.CANCELLED)
              ?.note && (
              <p className="text-xs text-gray-600 mt-1">
                {
                  statusHistory.find((h) => h.status === OrderStatus.CANCELLED)
                    ?.note
                }
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
