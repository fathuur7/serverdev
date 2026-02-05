import type { Context } from "elysia";
import { warehouseService } from "../services/inventory/warehouse.service";

export class WarehouseController {
    /**
     * POST /warehouses
     * Create new warehouse
     */
    create = async ({ body, set }: Context) => {
        try {
            const { name, locationAddress } = body as {
                name: string;
                locationAddress: string;
            };

            if (!name || !locationAddress) {
                set.status = 400;
                return {
                    success: false,
                    message: "Name and location address are required",
                };
            }

            const warehouse = await warehouseService.create({
                name,
                locationAddress,
            });

            set.status = 201;
            return {
                success: true,
                message: "Warehouse created successfully",
                data: warehouse,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * GET /warehouses
     * Get all warehouses
     */
    getAll = async ({ set }: Context) => {
        try {
            const warehouses = await warehouseService.getAll();

            return {
                success: true,
                data: warehouses,
            };
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * GET /warehouses/:id
     * Get warehouse by ID
     */
    getById = async ({ params, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            const warehouse = await warehouseService.getById(id);

            return {
                success: true,
                data: warehouse,
            };
        } catch (error) {
            set.status = 404;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * PATCH /warehouses/:id
     * Update warehouse
     */
    update = async ({ params, body, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            const warehouse = await warehouseService.update(id, body as any);

            return {
                success: true,
                message: "Warehouse updated successfully",
                data: warehouse,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * DELETE /warehouses/:id
     * Delete warehouse
     */
    delete = async ({ params, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            await warehouseService.delete(id);

            return {
                success: true,
                message: "Warehouse deleted successfully",
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * GET /warehouses/:id/stock
     * Get warehouse stock summary
     */
    getStockSummary = async ({ params, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            const summary = await warehouseService.getStockSummary(id);

            return {
                success: true,
                data: summary,
            };
        } catch (error) {
            set.status = 404;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };
}

export const warehouseController = new WarehouseController();
