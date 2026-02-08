import { t } from "elysia";

/**
 * Validation schemas for Auth endpoints
 */

// Password pattern: min 8 chars, 1 uppercase, 1 lowercase, 1 number
const passwordPattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$";

// Register & Login
export const emailPasswordSchema = t.Object({
    email: t.String({ format: "email", minLength: 3, maxLength: 100 }),
    password: t.String({
        minLength: 8,
        maxLength: 100,
        pattern: passwordPattern,
        error: "Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka"
    }),
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

// Reset Password (with strong password)
export const resetPasswordSchema = t.Object({
    email: t.String({ format: "email" }),
    otp: t.String({ minLength: 6, maxLength: 6 }),
    password: t.String({
        minLength: 8,
        maxLength: 100,
        pattern: passwordPattern,
        error: "Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka"
    }),
});

// Refresh Token / Logout
export const refreshTokenSchema = t.Object({
    refreshToken: t.String(),
});

// Verify Email (Admin)
export const verifyEmailSchema = t.Object({
    verified: t.Boolean(),
});

// Phone number pattern: Indonesian format (08xx or +628xx or 628xx)
const phonePattern = "^(\\+62|62|0)8[1-9][0-9]{7,10}$";

// Customer Profile (Create)
export const createCustomerProfileSchema = t.Object({
    fullName: t.String({ minLength: 3, maxLength: 100 }),
    nik: t.String({ minLength: 16, maxLength: 16, pattern: "^[0-9]{16}$" }),
    phoneNumber: t.String({ minLength: 10, maxLength: 15, pattern: phonePattern }),
    secondaryPhone: t.Optional(t.String({ minLength: 10, maxLength: 15, pattern: phonePattern })),
    npwp: t.Optional(t.String({ minLength: 15, maxLength: 16, pattern: "^[0-9.\\-]{15,16}$" })),
    address: t.Optional(t.String({ minLength: 5, maxLength: 500 })),
    city: t.Optional(t.String({ maxLength: 100 })),
    province: t.Optional(t.String({ maxLength: 100 })),
    postalCode: t.Optional(t.String({ minLength: 5, maxLength: 10, pattern: "^[0-9]{5}$" })),
    phoneVerified: t.Optional(t.Boolean()),
    district: t.Optional(t.String({ maxLength: 100 })),
    subDistrict: t.Optional(t.String({ maxLength: 100 })),
});

// Customer Profile (Update) - with regex patterns
export const updateCustomerProfileSchema = t.Object({
    fullName: t.Optional(t.String({ minLength: 3, maxLength: 100 })),
    nik: t.Optional(t.String({ minLength: 16, maxLength: 16, pattern: "^[0-9]{16}$" })),
    phoneNumber: t.Optional(t.String({ minLength: 10, maxLength: 15, pattern: phonePattern })),
    secondaryPhone: t.Optional(t.String({ minLength: 10, maxLength: 15, pattern: phonePattern })),
    npwp: t.Optional(t.String({ minLength: 15, maxLength: 16, pattern: "^[0-9.\\-]{15,16}$" })),
    address: t.Optional(t.String({ minLength: 5, maxLength: 500 })),

    // Hirarki alamat
    province: t.Optional(t.String({ maxLength: 100 })),
    city: t.Optional(t.String({ maxLength: 100 })),
    district: t.Optional(t.String({ maxLength: 100 })),
    subDistrict: t.Optional(t.String({ maxLength: 100 })),

    postalCode: t.Optional(t.String({ minLength: 5, maxLength: 10, pattern: "^[0-9]{5}$" })),
    phoneVerified: t.Optional(t.Boolean()),
});