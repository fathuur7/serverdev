import type { AssetLocationType, AssetStatus } from "@prisma/client";

// Warehouse Types
export interface CreateWarehouseData {
    name: string;
    locationAddress: string;
}

export interface UpdateWarehouseData {
    name?: string;
    locationAddress?: string;
}

// Stock Item Types
export interface CreateStockItemData {
    sku: string;
    name: string;
    category: string;
    unit: string;
}

export interface UpdateStockItemData {
    name?: string;
    category?: string;
    unit?: string;
}

export interface StockItemFilters {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
}

// Asset Tracking Types
export interface CreateAssetData {
    stockItemId: number;
    serialNumber: string;
    currentLocationType: AssetLocationType;
    locationId: number;
    status?: AssetStatus;
}

export interface UpdateAssetData {
    status?: AssetStatus;
}

export interface MoveAssetData {
    currentLocationType: AssetLocationType;
    locationId: number;
}

export interface AssetFilters {
    stockItemId?: number;
    locationType?: AssetLocationType;
    locationId?: number;
    status?: AssetStatus;
    search?: string;
    page?: number;
    limit?: number;
}
