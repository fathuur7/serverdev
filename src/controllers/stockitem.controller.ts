import type { Context } from "elysia";
import { stockItemService } from "../services/inventory/stockitem.service";

export class StockItemController {
    /**
     * POST /stock-items
     * Create new stock item
     */
    create = async ({ body, set }: Context) => {
        try {
            const { sku, name, category, unit } = body as {
                sku: string;
                name: string;
                category: string;
                unit: string;
            };

            if (!sku || !name || !category || !unit) {
                set.status = 400;
                return {
                    success: false,
                    message: "SKU, name, category, and unit are required",
                };
            }

            const item = await stockItemService.create({
                sku,
                name,
                category,
                unit,
            });

            set.status = 201;
            return {
                success: true,
                message: "Stock item created successfully",
                data: item,
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
     * GET /stock-items
     * Get all stock items with filters
     */
    getAll = async ({ query, set }: Context) => {
        try {
            const { category, search, page, limit } = query as any;

            const filters: any = {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 10,
            };

            if (category) filters.category = category;
            if (search) filters.search = search;

            const result = await stockItemService.getAll(filters);

            return {
                success: true,
                ...result,
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
     * GET /stock-items/:id
     * Get stock item by ID
     */
    getById = async ({ params, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            const item = await stockItemService.getById(id);

            return {
                success: true,
                data: item,
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
     * GET /stock-items/sku/:sku
     * Get stock item by SKU
     */
    getBySku = async ({ params, set }: Context) => {
        try {
            const sku = (params as any).sku;
            const item = await stockItemService.getBySku(sku);

            return {
                success: true,
                data: item,
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
     * PATCH /stock-items/:id
     * Update stock item
     */
    update = async ({ params, body, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            const item = await stockItemService.update(id, body as any);

            return {
                success: true,
                message: "Stock item updated successfully",
                data: item,
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
     * DELETE /stock-items/:id
     * Delete stock item
     */
    delete = async ({ params, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            await stockItemService.delete(id);

            return {
                success: true,
                message: "Stock item deleted successfully",
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
     * GET /stock-items/summary/location
     * Get stock summary by location
     */
    getSummaryByLocation = async ({ set }: Context) => {
        try {
            const summary = await stockItemService.getStockSummaryByLocation();

            return {
                success: true,
                data: summary,
            };
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };
}

export const stockItemController = new StockItemController();
