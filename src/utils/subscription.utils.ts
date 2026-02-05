import prisma from "./prisma";

/**
 * Generate unique Service ID
 * Format: ISP-YYYYMM-XXXX (e.g., ISP-202601-0001)
 */
export async function generateServiceId(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `ISP-${year}${month}`;

    // Find the latest subscription with same prefix
    const latest = await prisma.subscriptions.findFirst({
        where: {
            serviceId: {
                startsWith: prefix,
            },
        },
        orderBy: {
            serviceId: "desc",
        },
    });

    let nextNumber = 1;
    if (latest) {
        const lastNumber = parseInt(latest.serviceId.split("-")[2], 10);
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
}

/**
 * Calculate contract end date based on package duration
 */
export function calculateContractEndDate(
    activationDate: Date,
): Date {
    const endDate = new Date(activationDate);
    endDate.setMonth(endDate.getMonth() + 1);
    return endDate;
}
