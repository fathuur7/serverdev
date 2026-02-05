import prisma from "./prisma";
import { randomBytes } from "crypto";

/**
 * Generate unique Invoice ID
 * Format: INV-YYYYMM-XXXX-RRRR (e.g., INV-202601-0001-A3F2)
 * RRRR = random 4-char hex to ensure uniqueness even after DB deletion
 */
export async function generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `INV-${year}${month}`;

    // Find the latest invoice with same prefix
    const latest = await prisma.invoice.findFirst({
        where: {
            invoiceNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            invoiceNumber: "desc",
        },
    });

    let nextNumber = 1;
    if (latest) {
        // Extract number from format INV-YYYYMM-XXXX-RRRR
        const parts = latest.invoiceNumber.split("-");
        if (parts.length >= 3) {
            const lastNumber = parseInt(parts[2], 10);
            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1;
            }
        }
    }

    // Add random suffix to prevent collision after deletion
    const randomSuffix = randomBytes(2).toString("hex").toUpperCase();

    return `${prefix}-${String(nextNumber).padStart(4, "0")}-${randomSuffix}`;
}
