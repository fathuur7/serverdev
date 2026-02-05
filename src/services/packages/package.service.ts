import prisma from "../../utils/prisma";
import { CreatePackageInput } from "../../types/package.types";

export class PackageService {
    // Get all packages
    async getAllPackages() {
        return await prisma.package.findMany({
            orderBy: { monthlyPrice: "asc" },
        });
    }

    // Get active packages only
    async getActivePackages() {
        return await prisma.package.findMany({
            where: { isActive: true },
            orderBy: { monthlyPrice: "asc" },
        });
    }

    // Get package by id
    async getPackageById(id: string) {
        const pkg = await prisma.package.findUnique({
            where: { id },
        });
        if (!pkg) {
            throw new Error("Package not found");
        }
        return pkg;
    }

    // Create package
    async createPackage(data: CreatePackageInput) {
        return await prisma.package.create({
            data,
        });
    }

    // Update package (optimized - single query)
    async updatePackage(id: string, data: Partial<CreatePackageInput>) {
        try {
            return await prisma.package.update({
                where: { id },
                data,
            });
        } catch (error: any) {
            if (error.code === "P2025") {
                throw new Error("Package not found");
            }
            throw error;
        }
    }

    // Delete package (optimized - single query)
    async deletePackage(id: string) {
        try {
            return await prisma.package.delete({
                where: { id },
            });
        } catch (error: any) {
            if (error.code === "P2025") {
                throw new Error("Package not found");
            }
            throw error;
        }
    }

    // Toggle active status (optimized - use updateMany with conditional)
    async toggleActive(id: string) {
        // First get current state (required for toggle logic)
        const existing = await prisma.package.findUnique({
            where: { id },
            select: { isActive: true } // Only fetch what we need
        });
        if (!existing) {
            throw new Error("Package not found");
        }
        return await prisma.package.update({
            where: { id },
            data: { isActive: !existing.isActive },
        });
    }
}
