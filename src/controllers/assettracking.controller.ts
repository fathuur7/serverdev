import type { Context } from "elysia";
import { assetTrackingService } from "../services/inventory/assettracking.service";
import type { AssetLocationType, AssetStatus } from "@prisma/client";

export class AssetTrackingController {
    /**
     * POST /assets
     * Create new asset
     */
    create = async ({ body, set }: Context) => {
        try {
            const {
                stockItemId,
                serialNumber,
                currentLocationType,
                locationId,
                status,
            } = body as {
                stockItemId: number;
                serialNumber: string;
                currentLocationType: AssetLocationType;
                locationId: number;
                status?: AssetStatus;
            };

            if (!stockItemId || !serialNumber || !currentLocationType || !locationId) {
                set.status = 400;
                return {
                    success: false,
                    message: "All fields are required",
                };
            }

            const asset = await assetTrackingService.create({
                stockItemId,
                serialNumber,
                currentLocationType,
                locationId,
                status,
            });

            set.status = 201;
            return {
                success: true,
                message: "Asset created successfully",
                data: asset,
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
     * POST /assets/bulk
     * Bulk create assets
     */
    bulkCreate = async ({ body, set }: Context) => {
        try {
            const {
                stockItemId,
                serialPrefix,
                startNumber,
                endNumber,
                currentLocationType,
                locationId,
            } = body as {
                stockItemId: number;
                serialPrefix: string;
                startNumber: number;
                endNumber: number;
                currentLocationType: AssetLocationType;
                locationId: number;
            };

            if (
                !stockItemId ||
                !serialPrefix ||
                !startNumber ||
                !endNumber ||
                !currentLocationType ||
                !locationId
            ) {
                set.status = 400;
                return {
                    success: false,
                    message: "All fields are required",
                };
            }

            if (endNumber <= startNumber) {
                set.status = 400;
                return {
                    success: false,
                    message: "End number must be greater than start number",
                };
            }

            const result = await assetTrackingService.bulkCreate({
                stockItemId,
                serialPrefix,
                startNumber,
                endNumber,
                currentLocationType,
                locationId,
            });

            set.status = 201;
            return {
                success: true,
                message: `Successfully created ${result.count} assets`,
                data: result,
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
     * GET /assets
     * Get all assets with filters
     */
    getAll = async ({ query, set }: Context) => {
        try {
            const {
                stockItemId,
                locationType,
                locationId,
                status,
                search,
                page,
                limit,
            } = query as any;

            const filters: any = {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 10,
            };

            if (stockItemId) filters.stockItemId = parseInt(stockItemId);
            if (locationType) filters.locationType = locationType as AssetLocationType;
            if (locationId) filters.locationId = parseInt(locationId);
            if (status) filters.status = status as AssetStatus;
            if (search) filters.search = search;

            const result = await assetTrackingService.getAll(filters);

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
     * GET /assets/:id
     * Get asset by ID
     */
    getById = async ({ params, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            const asset = await assetTrackingService.getById(id);

            return {
                success: true,
                data: asset,
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
     * GET /assets/serial/:serialNumber
     * Get asset by serial number
     */
    getBySerialNumber = async ({ params, set }: Context) => {
        try {
            const serialNumber = (params as any).serialNumber;
            const asset = await assetTrackingService.getBySerialNumber(serialNumber);

            return {
                success: true,
                data: asset,
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
     * PATCH /assets/:id/status
     * Update asset status
     */
    updateStatus = async ({ params, body, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            const { status } = body as { status: AssetStatus };

            if (!status) {
                set.status = 400;
                return {
                    success: false,
                    message: "Status is required",
                };
            }

            const asset = await assetTrackingService.updateStatus(id, { status });

            return {
                success: true,
                message: "Asset status updated successfully",
                data: asset,
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
     * PATCH /assets/:id/move
     * Move asset to new location
     */
    moveAsset = async ({ params, body, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            const { currentLocationType, locationId } = body as {
                currentLocationType: AssetLocationType;
                locationId: number;
            };

            if (!currentLocationType || !locationId) {
                set.status = 400;
                return {
                    success: false,
                    message: "Location type and location ID are required",
                };
            }

            const asset = await assetTrackingService.moveAsset(id, {
                currentLocationType,
                locationId,
            });

            return {
                success: true,
                message: "Asset moved successfully",
                data: asset,
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
     * DELETE /assets/:id
     * Delete asset
     */
    delete = async ({ params, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            await assetTrackingService.delete(id);

            return {
                success: true,
                message: "Asset deleted successfully",
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
     * GET /assets/summary/location
     * Get asset location summary
     */
    getLocationSummary = async ({ set }: Context) => {
        try {
            const summary = await assetTrackingService.getLocationSummary();

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

export const assetTrackingController = new AssetTrackingController();
