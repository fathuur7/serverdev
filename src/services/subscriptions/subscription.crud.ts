import prisma from "../../utils/prisma";
import {
    CreateSubscriptionInput,
    UpdateSubscriptionInput,
    SubscriptionFilters,
    PaginatedSubscriptions,
} from "../../types/subscription.types";
import { generateServiceId, calculateContractEndDate } from "../../utils/subscription.utils";
import { generateInvoiceNumber } from "../../utils/invoice.utils";

/**
 * CRUD Operations for Subscriptions
 */

/**
 * Create a new subscription + Generate First Invoice (Prepaid Model)
 */
export async function createSubscription(data: CreateSubscriptionInput) {
    // Jalankan semuanya dalam satu transaksi
    return await prisma.$transaction(async (tx) => {

        // 1. Validasi Customer & Package di dalam transaksi
        const customer = await tx.customerProfile.findUnique({
            where: { id: data.customerId },
        });
        if (!customer) throw new Error("Customer not found");

        const pkg = await tx.package.findUnique({
            where: { id: data.packageId },
        });
        if (!pkg || !pkg.isActive) throw new Error("Package not found or inactive");

        const existingPending = await tx.subscriptions.findFirst({
            where: {
                customerId: data.customerId,
                status: 'PENDING_INSTALL'
            },
            include: { invoices: { where: { status: 'UNPAID' } } }
        });

        if (existingPending && existingPending.invoices.length > 0) {
            // Bukannya buat baru, kita kasih tau user untuk bayar yang lama
            throw new Error("Anda memiliki pendaftaran yang menunggu pembayaran. Silakan selesaikan pembayaran sebelumnya.");
        }

        // 1.6 Cek apakah sudah ada layanan ACTIVE (Jangan asal matikan!)
        const activeSub = await tx.subscriptions.findFirst({
            where: { customerId: data.customerId, status: 'ACTIVE' }
        });

        if (activeSub) {
            throw new Error("Anda sudah memiliki layanan aktif. Gunakan fitur 'Upgrade Paket' jika ingin mengubah layanan.");
        }

        // 2. Generate ID (Sebaiknya generator ini juga aman dari race condition)
        const serviceId = await generateServiceId();
        const invoiceNumber = await generateInvoiceNumber();

        // 2.5 Prepare dates if provided (Requested Installation Date)
        let activationDate: Date | null = null;
        let contractEndDate: Date | null = null;

        if (data.activationDate) {
            activationDate = new Date(data.activationDate);
            contractEndDate = calculateContractEndDate(activationDate);
        }

        // 3. Simpan Subscription
        const subscription = await tx.subscriptions.create({
            data: {
                customerId: data.customerId,
                packageId: data.packageId,
                serviceId,
                installationAddressFull: data.installationAddressFull,
                geoLat: data.geoLat,
                geoLong: data.geoLong,
                photoHomeCustomer: data.photoHomeCustomer,
                status: "PENDING_INSTALL",
                activationDate: activationDate, // Cant be null
                contractEndDate: contractEndDate, // Can be null
            },
            include: { customer: true, package: true },
        });

        // 4. Hitung Pajak
        const taxes = await tx.tax.findMany();
        const totalTaxPercentage = taxes.reduce((acc, t) => acc + Number(t.percentage), 0);

        const amountBasic = Number(pkg.monthlyPrice);
        const amountTax = amountBasic * (totalTaxPercentage / 100);
        const totalAmount = amountBasic + amountTax;

        // 5. Simpan Invoice dengan dueDate yang benar
        const now = new Date();
        const dueDate = new Date();
        dueDate.setHours(now.getHours() + 24); // Batas bayar cuma 24 jam

        const firstInvoice = await tx.invoice.create({
            data: {
                subscriptionId: subscription.id,
                invoiceNumber,
                billingPeriod: now,
                dueDate: dueDate,
                amountBasic: amountBasic,
                amountTax: amountTax,
                amountDiscount: 0,
                penaltyFee: 0,
                totalAmount: totalAmount,
                status: "UNPAID",
            },
        });

        return { subscription, firstInvoice };
    });
}

export async function upgradeSubscription(userId: string, data: { subscriptionId: string, newPackageId: string }) {
    return await prisma.$transaction(async (tx) => {
        const oldSub = await tx.subscriptions.findUnique({
            where: { id: data.subscriptionId },
            include: { package: true }
        });

        if (!oldSub) throw new Error("Layanan tidak ditemukan");
        if (oldSub.customerId !== userId) throw new Error("Akses ditolak. Layanan bukan milik Anda.");
        if (!oldSub.contractEndDate) throw new Error("Masa kontrak tidak valid");

        const newPkg = await tx.package.findUnique({
            where: { id: data.newPackageId },
        });

        if (!newPkg || !newPkg.isActive) throw new Error("Paket tidak ditemukan atau tidak aktif");

        // SUB-005: Prevent upgrade to same package
        if (oldSub.packageId === data.newPackageId) {
            throw new Error("Anda sudah menggunakan paket ini. Pilih paket yang berbeda.");
        }

        // SUB-006: Prevent downgrade - only allow upgrade to more expensive package
        const oldPrice = Number(oldSub.package.monthlyPrice);
        const newPrice = Number(newPkg.monthlyPrice);

        if (newPrice < oldPrice) {
            throw new Error(`Tidak dapat downgrade ke paket yang lebih murah. Paket saat ini: Rp ${oldPrice.toLocaleString('id-ID')}/bulan`);
        }

        // 1. Batalkan invoice perpanjangan yang menggantung (H-7 logic)
        const pendingMonthlyInvoice = await tx.invoice.findFirst({
            where: {
                subscriptionId: data.subscriptionId,
                status: 'UNPAID',
            }
        });

        if (pendingMonthlyInvoice) {
            await tx.invoice.update({
                where: { id: pendingMonthlyInvoice.id },
                data: { status: 'CANCELLED' }
            });
        }

        // 2. Hitung Nominal (Full Price, Tanpa Prorata)
        const amountBasic = Number(newPkg.monthlyPrice);

        // Ambil pajak (misal PPN 11%)
        const taxes = await tx.tax.findMany();
        const totalTaxPercentage = taxes.reduce((acc, t) => acc + Number(t.percentage), 0);
        const amountTax = Math.round(amountBasic * (totalTaxPercentage / 100));

        const totalAmount = amountBasic + amountTax;

        // 3. Buat Invoice Upgrade dengan kolom lengkap
        const now = new Date();
        const dueDate = new Date();
        dueDate.setHours(now.getHours() + 24); // Deadline bayar 24 jam

        const upgradeInvoice = await tx.invoice.create({
            data: {
                subscriptionId: oldSub.id,
                invoiceNumber: await generateInvoiceNumber(),
                billingPeriod: now,
                dueDate: dueDate,
                amountBasic: amountBasic,
                amountTax: amountTax,
                amountDiscount: 0,
                totalAmount: totalAmount,
                status: "UNPAID",
            },
            include: { subscription: true }
        });

        return { upgradeInvoice, totalAmount };
    });
}


/**
 * Get all subscriptions with pagination and filters
 */
export async function getAllSubscriptions(
    filters: SubscriptionFilters
): Promise<PaginatedSubscriptions> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.packageId) where.packageId = filters.packageId;

    const [data, total] = await Promise.all([
        prisma.subscriptions.findMany({
            where,
            skip,
            take: limit,
            orderBy: { id: "desc" },
            include: {
                customer: true,
                package: true,
                invoices: {
                    select: {
                        id: true,
                        status: true,
                        payments: {
                            select: {
                                paidAt: true
                            }
                        }
                    },
                    orderBy: { id: 'asc' }
                }
            },
        }),
        prisma.subscriptions.count({ where }),
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Get subscription by ID with all relations
 */
export async function getSubscriptionById(id: string) {
    const subscription = await prisma.subscriptions.findUnique({
        where: { id },
        include: {
            customer: true,
            package: true,
            invoices: { take: 5, orderBy: { id: "desc" } },
            device: true,
            workOrders: { take: 5, orderBy: { id: "desc" } },
            tickets: { take: 5, orderBy: { id: "desc" } },
        },
    });

    if (!subscription) {
        throw new Error("Subscription not found");
    }

    return subscription;
}

/**
 * Update subscription (address/geo only)
 */
export async function updateSubscription(
    id: string,
    data: UpdateSubscriptionInput
) {
    const existing = await prisma.subscriptions.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new Error("Subscription not found");
    }

    const updateData: any = {};
    if (data.installationAddressFull)
        updateData.installationAddressFull = data.installationAddressFull;
    if (data.geoLat !== undefined) updateData.geoLat = data.geoLat;
    if (data.geoLong !== undefined) updateData.geoLong = data.geoLong;

    return await prisma.subscriptions.update({
        where: { id },
        data: updateData,
        include: {
            customer: true,
            package: true,
        },
    });
}

/**
 * Soft delete (set status to TERMINATED)
 */
export async function softDeleteSubscription(id: string) {
    const existing = await prisma.subscriptions.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new Error("Subscription not found");
    }

    return await prisma.subscriptions.update({
        where: { id },
        data: { status: "TERMINATED" },
    });
}
