import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export class WhatsAppService {
    /**
     * Send WhatsApp Message via Worker
     * @param to Phone number (e.g. 08123456789)
     * @param text Message text
     */
    static async sendMessage(to: string, text: string): Promise<void> {
        try {
            const payload = JSON.stringify({ to, text });
            await redis.publish("whatsapp:send", payload);
            console.log(`📨 Queued WhatsApp message to ${to}`);
        } catch (error) {
            console.error("❌ Failed to queue WhatsApp message:", error);
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
}
