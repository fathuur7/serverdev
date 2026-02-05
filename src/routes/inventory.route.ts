import { Elysia, t } from "elysia";
import { warehouseController } from "../controllers/warehouse.controller";
import { stockItemController } from "../controllers/stockitem.controller";
import { assetTrackingController } from "../controllers/assettracking.controller";
import { adminOnly, adminOrTechnician } from "../middlewares/auth.middleware";

export const inventoryRoutes = new Elysia({ prefix: "/inventory" })
    // ==================== WAREHOUSE ROUTES ====================
    .group("/warehouses", (app) =>
        app
            .post("/", warehouseController.create, {
                beforeHandle: adminOnly,
                body: t.Object({
                    name: t.String(),
                    locationAddress: t.String(),
                }),
                detail: {
                    tags: ["Inventory - Warehouse"],
                    summary: "Create warehouse",
                },
            })
            .get("/", warehouseController.getAll, {
                beforeHandle: adminOrTechnician,
                detail: {
                    tags: ["Inventory - Warehouse"],
                    summary: "Get all warehouses",
                },
            })
            .get("/:id", warehouseController.getById, {
                beforeHandle: adminOrTechnician,
                params: t.Object({ id: t.String() }),
                detail: {
                    tags: ["Inventory - Warehouse"],
                    summary: "Get warehouse by ID",
                },
            })
            .patch("/:id", warehouseController.update, {
                beforeHandle: adminOnly,
                params: t.Object({ id: t.String() }),
                body: t.Object({
                    name: t.Optional(t.String()),
                    locationAddress: t.Optional(t.String()),
                }),
                detail: {
                    tags: ["Inventory - Warehouse"],
                    summary: "Update warehouse",
                },
            })
            .delete("/:id", warehouseController.delete, {
                beforeHandle: adminOnly,
                params: t.Object({ id: t.String() }),
                detail: {
                    tags: ["Inventory - Warehouse"],
                    summary: "Delete warehouse",
                },
            })
            .get("/:id/stock", warehouseController.getStockSummary, {
                beforeHandle: adminOrTechnician,
                params: t.Object({ id: t.String() }),
                detail: {
                    tags: ["Inventory - Warehouse"],
                    summary: "Get warehouse stock summary",
                },
            })
    )

    // ==================== STOCK ITEM ROUTES ====================
    .group("/stock-items", (app) =>
        app
            .post("/", stockItemController.create, {
                beforeHandle: adminOnly,
                body: t.Object({
                    sku: t.String(),
                    name: t.String(),
                    category: t.String(),
                    unit: t.String(),
                }),
                detail: {
                    tags: ["Inventory - Stock Item"],
                    summary: "Create stock item",
                },
            })
            .get("/", stockItemController.getAll, {
                beforeHandle: adminOrTechnician,
                query: t.Optional(
                    t.Object({
                        category: t.Optional(t.String()),
                        search: t.Optional(t.String()),
                        page: t.Optional(t.String()),
                        limit: t.Optional(t.String()),
                    })
                ),
                detail: {
                    tags: ["Inventory - Stock Item"],
                    summary: "Get all stock items",
                },
            })
            .get("/summary/location", stockItemController.getSummaryByLocation, {
                beforeHandle: adminOrTechnician,
                detail: {
                    tags: ["Inventory - Stock Item"],
                    summary: "Get stock summary by location",
                },
            })
            .get("/:id", stockItemController.getById, {
                beforeHandle: adminOrTechnician,
                params: t.Object({ id: t.String() }),
                detail: {
                    tags: ["Inventory - Stock Item"],
                    summary: "Get stock item by ID",
                },
            })
            .get("/sku/:sku", stockItemController.getBySku, {
                beforeHandle: adminOrTechnician,
                params: t.Object({ sku: t.String() }),
                detail: {
                    tags: ["Inventory - Stock Item"],
                    summary: "Get stock item by SKU",
                },
            })
            .patch("/:id", stockItemController.update, {
                beforeHandle: adminOnly,
                params: t.Object({ id: t.String() }),
                body: t.Object({
                    name: t.Optional(t.String()),
                    category: t.Optional(t.String()),
                    unit: t.Optional(t.String()),
                }),
                detail: {
                    tags: ["Inventory - Stock Item"],
                    summary: "Update stock item",
                },
            })
            .delete("/:id", stockItemController.delete, {
                beforeHandle: adminOnly,
                params: t.Object({ id: t.String() }),
                detail: {
                    tags: ["Inventory - Stock Item"],
                    summary: "Delete stock item",
                },
            })
    )

    // ==================== ASSET TRACKING ROUTES ====================
    .group("/assets", (app) =>
        app
            .post("/", assetTrackingController.create, {
                beforeHandle: adminOnly,
                body: t.Object({
                    stockItemId: t.Number(),
                    serialNumber: t.String(),
                    currentLocationType: t.String(),
                    locationId: t.Number(),
                    status: t.Optional(t.String()),
                }),
                detail: {
                    tags: ["Inventory - Asset Tracking"],
                    summary: "Create asset",
                },
            })
            .post("/bulk", assetTrackingController.bulkCreate, {
                beforeHandle: adminOnly,
                body: t.Object({
                    stockItemId: t.Number(),
                    serialPrefix: t.String(),
                    startNumber: t.Number(),
                    endNumber: t.Number(),
                    currentLocationType: t.String(),
                    locationId: t.Number(),
                }),
                detail: {
                    tags: ["Inventory - Asset Tracking"],
                    summary: "Bulk create assets",
                },
            })
            .get("/", assetTrackingController.getAll, {
                beforeHandle: adminOrTechnician,
                query: t.Optional(
                    t.Object({
                        stockItemId: t.Optional(t.String()),
                        locationType: t.Optional(t.String()),
                        locationId: t.Optional(t.String()),
                        status: t.Optional(t.String()),
                        search: t.Optional(t.String()),
                        page: t.Optional(t.String()),
                        limit: t.Optional(t.String()),
                    })
                ),
                detail: {
                    tags: ["Inventory - Asset Tracking"],
                    summary: "Get all assets",
                },
            })
            .get("/summary/location", assetTrackingController.getLocationSummary, {
                beforeHandle: adminOrTechnician,
                detail: {
                    tags: ["Inventory - Asset Tracking"],
                    summary: "Get asset location summary",
                },
            })
            .get("/:id", assetTrackingController.getById, {
                beforeHandle: adminOrTechnician,
                params: t.Object({ id: t.String() }),
                detail: {
                    tags: ["Inventory - Asset Tracking"],
                    summary: "Get asset by ID",
                },
            })
            .get("/serial/:serialNumber", assetTrackingController.getBySerialNumber, {
                beforeHandle: adminOrTechnician,
                params: t.Object({ serialNumber: t.String() }),
                detail: {
                    tags: ["Inventory - Asset Tracking"],
                    summary: "Get asset by serial number",
                },
            })
            .patch("/:id/status", assetTrackingController.updateStatus, {
                beforeHandle: adminOnly,
                params: t.Object({ id: t.String() }),
                body: t.Object({
                    status: t.String(),
                }),
                detail: {
                    tags: ["Inventory - Asset Tracking"],
                    summary: "Update asset status",
                },
            })
            .patch("/:id/move", assetTrackingController.moveAsset, {
                beforeHandle: adminOnly,
                params: t.Object({ id: t.String() }),
                body: t.Object({
                    currentLocationType: t.String(),
                    locationId: t.Number(),
                }),
                detail: {
                    tags: ["Inventory - Asset Tracking"],
                    summary: "Move asset to new location",
                },
            })
            .delete("/:id", assetTrackingController.delete, {
                beforeHandle: adminOnly,
                params: t.Object({ id: t.String() }),
                detail: {
                    tags: ["Inventory - Asset Tracking"],
                    summary: "Delete asset",
                },
            })
    );
