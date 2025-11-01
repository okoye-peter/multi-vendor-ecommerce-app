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