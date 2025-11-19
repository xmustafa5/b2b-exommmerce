'use client';

import { useRef } from 'react';
import { format } from 'date-fns';
import type { Order } from '@/app/types/order';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface InvoicePrintProps {
  order: Order;
}

export function InvoicePrint({ order }: InvoicePrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Button onClick={handlePrint} variant="outline" className="print:hidden">
        <Printer className="mr-2 h-4 w-4" />
        Print Invoice
      </Button>

      {/* Print-only content */}
      <div ref={printRef} className="hidden print:block">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
              <p className="text-sm text-gray-600 mt-2">
                Order #{order.orderNumber}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                Lilium
              </div>
              <p className="text-sm text-gray-600">
                Your Company Address
              </p>
              <p className="text-sm text-gray-600">
                Phone: (555) 123-4567
              </p>
              <p className="text-sm text-gray-600">
                Email: info@lilium.com
              </p>
            </div>
          </div>

          {/* Order and Customer Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
              <p className="text-sm text-gray-700 font-medium">
                {order.user.name}
              </p>
              {order.user.shopName && (
                <p className="text-sm text-gray-600">{order.user.shopName}</p>
              )}
              <p className="text-sm text-gray-600">{order.user.email}</p>
              {order.user.phone && (
                <p className="text-sm text-gray-600">{order.user.phone}</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Ship To:</h3>
              <p className="text-sm text-gray-600">
                {order.deliveryAddress.street}
              </p>
              <p className="text-sm text-gray-600">
                {order.deliveryAddress.area}, {order.deliveryAddress.city}
              </p>
              <p className="text-sm text-gray-600">
                Zone: {order.deliveryAddress.zone}
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
            <div>
              <p className="text-gray-600">
                <span className="font-medium">Order Date:</span>{' '}
                {format(new Date(order.createdAt), 'MMM dd, yyyy')}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Status:</span> {order.status}
              </p>
            </div>
            <div>
              <p className="text-gray-600">
                <span className="font-medium">Zone:</span> {order.user.zone}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 text-sm font-semibold text-gray-900">
                  Product
                </th>
                <th className="text-center py-3 text-sm font-semibold text-gray-900">
                  Quantity
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-900">
                  Price
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-900">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.product.name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {item.product.nameAr}
                      </p>
                      {item.product.sku && (
                        <p className="text-gray-400 text-xs">
                          SKU: {item.product.sku}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-sm text-center text-gray-700">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-sm text-right text-gray-700">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="py-3 text-sm text-right text-gray-900 font-medium">
                    ${(item.quantity * item.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">
                  ${order.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="font-medium text-gray-900">
                  ${order.deliveryFee.toFixed(2)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">
                    -${order.discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-gray-300">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-6 text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">
              For questions about this invoice, please contact us at
              info@lilium.com
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
