export enum OrderStatusValue {
    PENDING = 0,
    CONFIRMED = 1,
    AWAITING_SHIPMENT = 2,
    SHIPPED = 3,
    DELIVERED = 4,
    CANCELLED = 5
}

export const OrderStatusLabels: Record<number, string> = {
    [OrderStatusValue.PENDING]: 'Pending',
    [OrderStatusValue.CONFIRMED]: 'Confirmed',
    [OrderStatusValue.AWAITING_SHIPMENT]: 'Awaiting Shipment',
    [OrderStatusValue.SHIPPED]: 'Shipped',
    [OrderStatusValue.DELIVERED]: 'Delivered',
    [OrderStatusValue.CANCELLED]: 'Cancelled'
};

export const getOrderStatusLabel = (status: number): string => {
    return OrderStatusLabels[status] ?? 'Unknown';
};

export const getOrderStatusValue = (statusName: string): number => {
    const map: Record<string, number> = {
        'PENDING': 0,
        'CONFIRMED': 1,
        'AWAITING_SHIPMENT': 2,
        'SHIPPED': 3,
        'DELIVERED': 4,
        'CANCELLED': 5
    };
    return map[statusName] ?? 0;
};

// For API responses
export const formatOrderStatus = (status: string | number) => {
    const value = typeof status === 'string' ? getOrderStatusValue(status) : status;
    return {
        value,
        label: getOrderStatusLabel(value)
    };
};

export const isValidOrderStatus = (status: number): status is OrderStatusValue => {
    return getOrderStatusLabel(status) !== 'Unknown';
};