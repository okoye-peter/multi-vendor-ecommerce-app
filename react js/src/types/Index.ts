import type { ColumnDef } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface User {
    name: string,
    email: string,
    emailVerifiedAt: string | null,
    phone: string,
    phoneVerifiedAt: string | null,
    type: 'CUSTOMER' | 'VENDOR' | 'ADMIN',
    pictureUrl: string | null,
}

export interface loginData {
    email: string,
    password: string
}

export interface PasswordResetData {
    email: string,
    resetAuthorizationCode: string,
    newPassword: string,
    repeat_newPassword: string
}

export interface BackendError {
    status?: number | string;
    data?: {
        message?: Record<string, string[]> | string;
    };
    // Legacy support for direct response access
    response?: {
        data?: {
            message?: Record<string, string[]> | string;
        };
    };
    message?: string;
}

export interface LogoutResponse {
    message: string;
};

export interface state {
    id: number,
    name: string
}

export interface Country {
    id: number;
    name: string;
}

export interface State {
    id: number;
    name: string;
    countryId: number;
}

export interface LGA {
    id: number;
    name: string;
    stateId: number;
}

export interface VendorLayoutProps {
    children: ReactNode;
}

export interface VendorSidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export interface MenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
    path: string;
}
export interface FilterOption {
    value: string | number | boolean;
    label: string;
}

export interface Filter {
    column: string;
    label: string;
    type: 'select' | 'date' | 'dateRange' | 'text';
    options?: FilterOption[];
    placeholder?: string;
}

export interface DataTableProps<T> {
    url: string;
    columns: ColumnDef<T, string>[];
    filters?: Filter[];
    title?: string;
    enableGlobalSearch?: boolean;
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    onRowClick?: (row: T) => void;
    transformData?: (data: unknown) => T[];
    headerActions?: React.ReactNode;
}

export interface Category {
    id: number;
    name: string;
    departmentId?: number;
    [key: string]: unknown;
}

export interface Department {
    id: number;
    name: string;
    [key: string]: unknown;
};

export interface Product {
    id: number;
    name: string;
    category: Category;
    department: Department;
    price: string;
    quantity: number;
    [key: string]: unknown;
}

export interface Vendor {
    id: number,
    name: string
}

export interface SubProduct {
    id: number;
    batch_no: string;
    quantity: number;
    quantity_sold: number;
    expiry_date: string;
    cost_price: number;
    createdAt: string;
    [key: string]: unknown;
};
