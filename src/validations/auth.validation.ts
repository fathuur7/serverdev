import { t } from "elysia";

/**
 * Validation schemas for Auth endpoints
 */

// Register & Login
export const emailPasswordSchema = t.Object({
    email: t.String({ format: "email", minLength: 3, maxLength: 100 }),
    password: t.String({ minLength: 6, maxLength: 100 }),
});

// OTP Verification
export const verifyOtpSchema = t.Object({
    email: t.String({ format: "email" }),
    otp: t.String({ minLength: 6, maxLength: 6 }),
});

// Resend OTP / Forgot Password
export const emailOnlySchema = t.Object({
    email: t.String({ format: "email" }),
});

// Reset Password
export const resetPasswordSchema = t.Object({
    email: t.String({ format: "email" }),
    otp: t.String({ minLength: 6, maxLength: 6 }),
    password: t.String({ minLength: 6, maxLength: 100 }),
});

// Refresh Token / Logout
export const refreshTokenSchema = t.Object({
    refreshToken: t.String(),
});

// Verify Email (Admin)
export const verifyEmailSchema = t.Object({
    verified: t.Boolean(),
});

// Customer Profile (Create)
export const createCustomerProfileSchema = t.Object({
    fullName: t.String({ minLength: 3, maxLength: 100 }),
    nik: t.String({ minLength: 16, maxLength: 16 }),
    phoneNumber: t.String({ minLength: 10, maxLength: 15 }),
    secondaryPhone: t.Optional(t.String({ minLength: 10, maxLength: 15 })),
    npwp: t.Optional(t.String({ minLength: 15, maxLength: 16 })),
    address: t.Optional(t.String({ minLength: 5, maxLength: 500 })),
    city: t.Optional(t.String({ maxLength: 100 })),
    province: t.Optional(t.String({ maxLength: 100 })),
    postalCode: t.Optional(t.String({ minLength: 5, maxLength: 10 })),
    phoneVerified: t.Optional(t.Boolean()),
    district: t.Optional(t.String({ maxLength: 100 })),
    subDistrict: t.Optional(t.String({ maxLength: 100 })),
});

// Customer Profile (Update)
export const updateCustomerProfileSchema = t.Object({
    fullName: t.Optional(t.String({ minLength: 3, maxLength: 100 })),
    nik: t.Optional(t.String({ minLength: 16, maxLength: 16 })),
    phoneNumber: t.Optional(t.String({ minLength: 10, maxLength: 15 })),
    secondaryPhone: t.Optional(t.String({ minLength: 10, maxLength: 15 })),
    npwp: t.Optional(t.String({ minLength: 15, maxLength: 16 })),
    address: t.Optional(t.String({ minLength: 5, maxLength: 500 })),

    // Penambahan hirarki alamat
    province: t.Optional(t.String({ maxLength: 100 })),
    city: t.Optional(t.String({ maxLength: 100 })), // Kota/Kabupaten
    district: t.Optional(t.String({ maxLength: 100 })), // Kecamatan
    subDistrict: t.Optional(t.String({ maxLength: 100 })), // Kelurahan/Desa

    postalCode: t.Optional(t.String({ minLength: 5, maxLength: 10 })),
    phoneVerified: t.Optional(t.Boolean()),
});