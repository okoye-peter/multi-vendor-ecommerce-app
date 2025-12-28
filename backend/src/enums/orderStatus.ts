export const OrderStatusValue = {
  PENDING: 0,
  CONFIRMED: 1,
  AWAITING_SHIPMENT: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: 5,
} as const;

export type OrderStatusValue =
  typeof OrderStatusValue[keyof typeof OrderStatusValue];

export const OrderStatusLabels: Record<OrderStatusValue, string> = {
  [OrderStatusValue.PENDING]: 'Pending',
  [OrderStatusValue.CONFIRMED]: 'Confirmed',
  [OrderStatusValue.AWAITING_SHIPMENT]: 'Awaiting Shipment',
  [OrderStatusValue.SHIPPED]: 'Shipped',
  [OrderStatusValue.DELIVERED]: 'Delivered',
  [OrderStatusValue.CANCELLED]: 'Cancelled',
};

export const getOrderStatusLabel = (status: OrderStatusValue): string => {
  return OrderStatusLabels[status] ?? 'Unknown';
};

export const getOrderStatusValue = (
  statusName: keyof typeof OrderStatusValue
): OrderStatusValue => {
  return OrderStatusValue[statusName];
};

export const formatOrderStatus = (status: OrderStatusValue | keyof typeof OrderStatusValue) => {
  const value =
    typeof status === 'string'
      ? OrderStatusValue[status]
      : status;

  return {
    value,
    label: getOrderStatusLabel(value),
  };
};

export const isValidOrderStatus = (status: number): status is OrderStatusValue => {
  return Object.values(OrderStatusValue).includes(status as OrderStatusValue);
};
