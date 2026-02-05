import prisma from "../../utils/prisma";
import type { CreateWarehouseData, UpdateWarehouseData } from "../../types/inventory.types";

export class WarehouseService {
    /**
     * Create new warehouse
     */
    async create(data: CreateWarehouseData) {
        return await prisma.warehouse.create({
            data,
        });
    }

    /**
     * Get all warehouses
     */
    async getAll() {
        return await prisma.warehouse.findMany({
            orderBy: { name: "asc" },
        });
    }

    /**
     * Get warehouse by ID
     */
    async getById(id: number) {
        const warehouse = await prisma.warehouse.findUnique({
            where: { id },
        });

        if (!warehouse) {
            throw new Error("Warehouse not found");
        }

        return warehouse;
    }

    /**
     * Update warehouse
     */
    async update(id: number, data: UpdateWarehouseData) {
        const warehouse = await this.getById(id);

        return await prisma.warehouse.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete warehouse
     */
    async delete(id: number) {
        await this.getById(id);

        return await prisma.warehouse.delete({
            where: { id },
        });
    }

    /**
     * Get warehouse stock summary
     */
    async getStockSummary(id: number) {
        await this.getById(id);

        const assets = await prisma.assetTracking.findMany({
            where: {
                currentLocationType: "WAREHOUSE",
                locationId: id,
            },
            include: {
                stockItem: true,
            },
        });

        // Group by SKU
        const summary = assets.reduce((acc: any, asset) => {
            const sku = asset.stockItem.sku;
            if (!acc[sku]) {
                acc[sku] = {
                    sku,
                    name: asset.stockItem.name,
                    category: asset.stockItem.category,
                    unit: asset.stockItem.unit,
                    count: 0,
                    assets: [],
                };
            }
            acc[sku].count++;
            acc[sku].assets.push({
                id: asset.id,
                serialNumber: asset.serialNumber,
                status: asset.status,
            });
            return acc;
        }, {});

        return Object.values(summary);
    }
}

export const warehouseService = new WarehouseService();
