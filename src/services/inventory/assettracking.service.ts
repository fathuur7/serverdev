import prisma from "../../utils/prisma";
import type { AssetLocationType, AssetStatus } from "@prisma/client";
import type { CreateAssetData, UpdateAssetData, MoveAssetData, AssetFilters } from "../../types/inventory.types";

export class AssetTrackingService {
    /**
     * Create new asset
     */
    async create(data: CreateAssetData) {
        // Verify stock item exists
        const stockItem = await prisma.stockItem.findUnique({
            where: { id: data.stockItemId },
        });

        if (!stockItem) {
            throw new Error("Stock item not found");
        }

        // Check if serial number already exists
        const existing = await prisma.assetTracking.findUnique({
            where: { serialNumber: data.serialNumber },
        });

        if (existing) {
            throw new Error("Serial number already exists");
        }

        return await prisma.assetTracking.create({
            data: {
                ...data,
                status: data.status || "NEW",
            },
            include: {
                stockItem: true,
            },
        });
    }

    /**
     * Get all assets with filters
     */
    async getAll(filters: AssetFilters) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters.stockItemId) {
            where.stockItemId = filters.stockItemId;
        }

        if (filters.locationType) {
            where.currentLocationType = filters.locationType;
        }

        if (filters.locationId) {
            where.locationId = filters.locationId;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.search) {
            where.serialNumber = {
                contains: filters.search,
                mode: "insensitive",
            };
        }

        const [assets, total] = await Promise.all([
            prisma.assetTracking.findMany({
                where,
                skip,
                take: limit,
                orderBy: { serialNumber: "asc" },
                include: {
                    stockItem: true,
                },
            }),
            prisma.assetTracking.count({ where }),
        ]);

        return {
            data: assets,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get asset by ID
     */
    async getById(id: number) {
        const asset = await prisma.assetTracking.findUnique({
            where: { id },
            include: {
                stockItem: true,
            },
        });

        if (!asset) {
            throw new Error("Asset not found");
        }

        return asset;
    }

    /**
     * Get asset by serial number
     */
    async getBySerialNumber(serialNumber: string) {
        const asset = await prisma.assetTracking.findUnique({
            where: { serialNumber },
            include: {
                stockItem: true,
            },
        });

        if (!asset) {
            throw new Error("Asset not found");
        }

        return asset;
    }

    /**
     * Update asset status
     */
    async updateStatus(id: number, data: UpdateAssetData) {
        await this.getById(id);

        return await prisma.assetTracking.update({
            where: { id },
            data,
            include: {
                stockItem: true,
            },
        });
    }

    /**
     * Move asset to new location
     */
    async moveAsset(id: number, data: MoveAssetData) {
        const asset = await this.getById(id);

        return await prisma.assetTracking.update({
            where: { id },
            data: {
                currentLocationType: data.currentLocationType,
                locationId: data.locationId,
            },
            include: {
                stockItem: true,
            },
        });
    }

    /**
     * Delete asset
     */
    async delete(id: number) {
        await this.getById(id);

        return await prisma.assetTracking.delete({
            where: { id },
        });
    }

    /**
     * Get asset movement history grouped by location
     */
    async getLocationSummary() {
        const assets = await prisma.assetTracking.groupBy({
            by: ["currentLocationType", "status"],
            _count: {
                _all: true,
            },
        });

        return assets.map((item) => ({
            locationType: item.currentLocationType,
            status: item.status,
            count: item._count._all,
        }));
    }

    /**
     * Bulk create assets with serial number range
     */
    async bulkCreate(baseData: {
        stockItemId: number;
        serialPrefix: string;
        startNumber: number;
        endNumber: number;
        currentLocationType: AssetLocationType;
        locationId: number;
    }) {
        // Verify stock item exists
        const stockItem = await prisma.stockItem.findUnique({
            where: { id: baseData.stockItemId },
        });

        if (!stockItem) {
            throw new Error("Stock item not found");
        }

        const assets = [];
        for (let i = baseData.startNumber; i <= baseData.endNumber; i++) {
            const serialNumber = `${baseData.serialPrefix}${i.toString().padStart(6, "0")}`;
            assets.push({
                stockItemId: baseData.stockItemId,
                serialNumber,
                currentLocationType: baseData.currentLocationType,
                locationId: baseData.locationId,
                status: "NEW" as AssetStatus,
            });
        }

        return await prisma.assetTracking.createMany({
            data: assets,
            skipDuplicates: true,
        });
    }
}

export const assetTrackingService = new AssetTrackingService();
