import { jwt } from "@elysiajs/jwt";

/**
 * JWT Plugin Configuration
 */
export const jwtPlugin = jwt({
    name: "jwt",
    secret: process.env.JWT_SECRET || "",
});

/**
 * Derive user from JWT token
 */
export const deriveUser = async ({ jwt, headers: { authorization } }: any) => {
    if (!authorization?.startsWith("Bearer ")) {
        return {};
    }
    const token = authorization.slice(7);
    console.time("jwt-verify");
    const profile = await jwt.verify(token);
    console.timeEnd("jwt-verify");
    if (!profile) {
        return {};
    }
    return {
        userId: profile.id as string,
        role: profile.role as string,
    };
};

/**
 * Admin-only guard
 */
export const adminOnly = ({ userId, role, set }: any) => {
    if (!userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
    }
    if (role !== "ADMIN") {
        set.status = 403;
        return { success: false, message: "Forbidden: Admin only" };
    }
};

/**
 * Admin or Technician guard
 */
export const adminOrTechnician = ({ userId, role, set }: any) => {
    if (!userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
    }
    if (role !== "ADMIN" && role !== "TECHNICIAN") {
        set.status = 403;
        return { success: false, message: "Forbidden: Admin or Technician only" };
    }
};

/**
 * Authenticated user guard (any role)
 */
export const authenticated = ({ userId, set }: any) => {
    if (!userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
    }
};

/**
 * Technician-only guard
 */
export const technicianOnly = ({ userId, role, set }: any) => {
    if (!userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
    }
    if (role !== "TECHNICIAN") {
        set.status = 403;
        return { success: false, message: "Forbidden: Technician only" };
    }
};
