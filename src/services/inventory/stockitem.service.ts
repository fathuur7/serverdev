import prisma from "../../utils/prisma";
import type { CreateStockItemData, UpdateStockItemData, StockItemFilters } from "../../types/inventory.types";

export class StockItemService {
    /**
     * Create new stock item
     */
    async create(data: CreateStockItemData) {
        // Check if SKU already exists
        const existing = await prisma.stockItem.findUnique({
            where: { sku: data.sku },
        });

        if (existing) {
            throw new Error("SKU already exists");
        }

        return await prisma.stockItem.create({
            data,
        });
    }

    /**
     * Get all stock items with filters
     */
    async getAll(filters: StockItemFilters) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters.category) {
            where.category = filters.category;
        }

        if (filters.search) {
            where.OR = [
                { sku: { contains: filters.search, mode: "insensitive" } },
                { name: { contains: filters.search, mode: "insensitive" } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.stockItem.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
                include: {
                    _count: {
                        select: { assets: true },
                    },
                },
            }),
            prisma.stockItem.count({ where }),
        ]);

        return {
            data: items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get stock item by ID
     */
    async getById(id: number) {
        const item = await prisma.stockItem.findUnique({
            where: { id },
            include: {
                assets: {
                    orderBy: { serialNumber: "asc" },
                },
                _count: {
                    select: { assets: true },
                },
            },
        });

        if (!item) {
            throw new Error("Stock item not found");
        }

        return item;
    }

    /**
     * Get stock item by SKU
     */
    async getBySku(sku: string) {
        const item = await prisma.stockItem.findUnique({
            where: { sku },
            include: {
                assets: true,
                _count: {
                    select: { assets: true },
                },
            },
        });

        if (!item) {
            throw new Error("Stock item not found");
        }

        return item;
    }

    /**
     * Update stock item
     */
    async update(id: number, data: UpdateStockItemData) {
        await this.getById(id);

        return await prisma.stockItem.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete stock item
     */
    async delete(id: number) {
        const item = await this.getById(id);

        // Check if has assets
        if (item._count.assets > 0) {
            throw new Error("Cannot delete stock item with existing assets");
        }

        return await prisma.stockItem.delete({
            where: { id },
        });
    }

    /**
     * Get stock summary by location
     */
    async getStockSummaryByLocation() {
        const assets = await prisma.assetTracking.findMany({
            include: {
                stockItem: true,
            },
        });

        const summary: any = {
            byLocationType: {},
            byStockItem: {},
        };

        assets.forEach((asset) => {
            const locationType = asset.currentLocationType;
            const sku = asset.stockItem.sku;

            // Count by location type
            if (!summary.byLocationType[locationType]) {
                summary.byLocationType[locationType] = 0;
            }
            summary.byLocationType[locationType]++;

            // Count by SKU
            if (!summary.byStockItem[sku]) {
                summary.byStockItem[sku] = {
                    sku,
                    name: asset.stockItem.name,
                    category: asset.stockItem.category,
                    total: 0,
                    byLocation: {},
                };
            }
            summary.byStockItem[sku].total++;
            if (!summary.byStockItem[sku].byLocation[locationType]) {
                summary.byStockItem[sku].byLocation[locationType] = 0;
            }
            summary.byStockItem[sku].byLocation[locationType]++;
        });

        return {
            byLocationType: summary.byLocationType,
            byStockItem: Object.values(summary.byStockItem),
        };
    }
}

export const stockItemService = new StockItemService();
