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