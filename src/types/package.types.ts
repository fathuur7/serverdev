export interface CreatePackageInput {
    name: string;
    description: string;
    imageUrl: string;
    downloadSpeedMbps: number;
    uploadSpeedMbps: number;
    monthlyPrice: number;
    slaPercentage: number;
    contractDurationMonths: number;
    isActive?: boolean;
}

