export type RegisterType = {
    email: string;
    password: string;
}

export type LoginType = {
    email: string;
    password: string;
}

export type CustomerProfileType = {
    userId: string;
    fullName: string;
    nik: string;
    phoneNumber: string;
    secondaryPhone?: string;
    npwp?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    phoneVerified?: boolean;
}

export type CreateProfileBody = Omit<CustomerProfileType, "userId">;

// Auth Service Types

export type RegisterInput = {
    email: string;
    password: string;
};

export type CustomerProfileInput = {
    fullName: string;
    nik: string;
    phoneNumber: string;
    secondaryPhone?: string;
    npwp?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    phoneVerified?: boolean;
};

export type UpdateProfileInput = Partial<CustomerProfileInput>;
