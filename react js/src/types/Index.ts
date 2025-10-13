export interface User {
    name: string,
    email: string,
    emailVerifiedAt: string | null,
    phone: string,
    phoneVerifiedAt: string | null,
    type: 'CUSTOMER' | 'VENDOR' | 'ADMIN',
    pictureUrl: string | null,
}

export interface registrationData {
    name: string,
    email: string,
    phone: string,
    picture: File | null,
    type: 'CUSTOMER' | 'VENDOR',
    password: string,
    repeat_password: string,
    vendor_name: string,
    vendor_address: string,
    state: '' | number
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