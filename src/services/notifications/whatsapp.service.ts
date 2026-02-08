import Redis from "ioredis";
import { publishWithRetry } from "../../utils/redis-retry";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export class WhatsAppService {
    /**
     * Send WhatsApp Message via Worker
     * INT-001: Now with Redis retry and graceful degradation
     * @param to Phone number (e.g. 08123456789)
     * @param text Message text
     */
    static async sendMessage(to: string, text: string): Promise<void> {
        try {
            const payload = JSON.stringify({ to, text });
            const success = await publishWithRetry(redis, "whatsapp:send", payload);

            if (success) {
                console.log(`📨 Queued WhatsApp message to ${to}`);
            } else {
                console.error(`⚠️ Failed to queue WhatsApp message to ${to} (Redis unavailable)`);
                // TODO: Implement fallback queue (e.g., database-backed queue)
            }
        } catch (error) {
            console.error("❌ Unexpected error in sendMessage:", error);
        }
    }

    /**
     * Send Invoice Notification
     */
    static async sendInvoiceNotification(to: string, invoice: any): Promise<void> {
        if (!to) return;

        const dueDate = new Date(invoice.dueDate).toLocaleDateString("id-ID", {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        });
        const amount = formatter.format(Number(invoice.totalAmount));

        const message = `*Tagihan Baru Tersedia*\n\n` +
            `Halo,\n` +
            `Tagihan internet #${invoice.invoiceNumber} telah terbit.\n\n` +
            `🔹 Total: *${amount}*\n` +
            `🔹 Jatuh Tempo: ${dueDate}\n\n` +
            `Mohon segera lakukan pembayaran melalui aplikasi.\n` +
            `Terima kasih.`;

        await this.sendMessage(to, message);
    }

    /**
     * Send Payment Reminder (H-3 or H-1)
     */
    static async sendPaymentReminder(to: string, invoice: any, daysLeft: number): Promise<void> {
        if (!to) return;

        const dueDate = new Date(invoice.dueDate).toLocaleDateString("id-ID", {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        });
        const amount = formatter.format(Number(invoice.totalAmount));

        const urgency = daysLeft <= 1 ? "⚠️ *PENGINGAT TERAKHIR*" : "🔔 *Pengingat Pembayaran*";

        const message = `${urgency}\n\n` +
            `Halo,\n` +
            `Tagihan internet #${invoice.invoiceNumber} akan jatuh tempo dalam *${daysLeft} hari*.\n\n` +
            `🔹 Total: *${amount}*\n` +
            `🔹 Jatuh Tempo: ${dueDate}\n\n` +
            `Segera lakukan pembayaran untuk menghindari gangguan layanan.\n` +
            `Terima kasih.`;

        await this.sendMessage(to, message);
    }

    /**
     * Send Overdue Alert (H+1 after due date)
     */
    static async sendOverdueAlert(to: string, invoice: any, daysOverdue: number): Promise<void> {
        if (!to) return;

        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        });
        const amount = formatter.format(Number(invoice.totalAmount));

        const message = `🚨 *TAGIHAN JATUH TEMPO*\n\n` +
            `Halo,\n` +
            `Tagihan internet #${invoice.invoiceNumber} sudah melewati jatuh tempo *${daysOverdue} hari*.\n\n` +
            `🔹 Total: *${amount}*\n` +
            `🔹 Status: *BELUM DIBAYAR*\n\n` +
            `⚠️ Layanan Anda akan diisolasi jika tidak segera melakukan pembayaran.\n\n` +
            `Abaikan pesan ini jika sudah melakukan pembayaran.\n` +
            `Terima kasih.`;

        await this.sendMessage(to, message);
    }

    /**
     * Send Isolation Notice (when service is isolated)
     */
    static async sendIsolationNotice(to: string, subscription: any, invoice: any): Promise<void> {
        if (!to) return;

        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        });
        const amount = formatter.format(Number(invoice.totalAmount));

        const message = `🔒 *LAYANAN DIISOLASI*\n\n` +
            `Halo,\n` +
            `Layanan internet Anda (${subscription.serviceId}) telah *diisolasi* karena tagihan yang belum dibayar.\n\n` +
            `🔹 No. Invoice: #${invoice.invoiceNumber}\n` +
            `🔹 Total: *${amount}*\n\n` +
            `Untuk mengaktifkan kembali layanan, segera lakukan pembayaran melalui aplikasi.\n\n` +
            `Hubungi customer service jika membutuhkan bantuan.\n` +
            `Terima kasih.`;

        await this.sendMessage(to, message);
    }

    /**
     * Send Payment Success Confirmation
     */
    static async sendPaymentSuccess(to: string, invoice: any, payment: any): Promise<void> {
        if (!to) return;

        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        });
        const amount = formatter.format(Number(payment.amount || invoice.totalAmount));

        const paymentDate = new Date(payment.paidAt || new Date()).toLocaleDateString("id-ID", {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const message = `✅ *PEMBAYARAN BERHASIL*\n\n` +
            `Halo,\n` +
            `Pembayaran tagihan internet Anda telah berhasil.\n\n` +
            `🔹 No. Invoice: #${invoice.invoiceNumber}\n` +
            `🔹 Jumlah: *${amount}*\n` +
            `🔹 Tanggal Bayar: ${paymentDate}\n\n` +
            `Terima kasih atas pembayaran Anda! 🙏`;

        await this.sendMessage(to, message);
    }

    /**
     * Send Reactivation Notice
     */
    static async sendReactivationNotice(to: string, subscription: any): Promise<void> {
        if (!to) return;

        const message = `🎉 *LAYANAN AKTIF KEMBALI*\n\n` +
            `Halo,\n` +
            `Selamat! Layanan internet Anda (${subscription.serviceId}) telah *aktif kembali*.\n\n` +
            `✅ Status: *ACTIVE*\n\n` +
            `Terima kasih telah melakukan pembayaran. Nikmati layanan internet Anda! 🚀`;

        await this.sendMessage(to, message);
    }

    /**
     * Send Technician Credentials
     * Sends login credentials to newly registered technician
     */
    static async sendTechnicianCredentials(
        to: string,
        fullName: string,
        email: string,
        password: string,
        employeeId: string
    ): Promise<void> {
        if (!to) return;

        const message = `*Selamat Datang di SwiftConnect* 🎉\n\n` +
            `Halo *${fullName}*,\n\n` +
            `Akun teknisi Anda telah berhasil dibuat!\n\n` +
            `📋 *Detail Akun:*\n` +
            `🔹 Employee ID: ${employeeId}\n` +
            `🔹 Email: ${email}\n` +
            `🔹 Password: ${password}\n\n` +
            `⚠️ *PENTING:*\n` +
            `• Jangan bagikan kredensial Anda kepada siapapun\n\n` +
            `Silakan login melalui aplikasi teknisi menggunakan email dan password di atas.\n\n` +
            `Jika ada pertanyaan, hubungi admin.\n` +
            `Terima kasih! 🚀`;

        await this.sendMessage(to, message);
    }
}


