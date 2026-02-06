import { EmailService } from "../auth/email.service";
import { WhatsAppService } from "./whatsapp.service";
import prisma from "../../utils/prisma";

/**
 * Unified Notification Service
 * Sends notifications via both WhatsApp and Email
 */
export class NotificationService {
    /**
     * Get customer contact info from subscription
     */
    private static async getContactInfo(subscriptionId: string) {
        const subscription = await prisma.subscriptions.findUnique({
            where: { id: subscriptionId },
            include: {
                customer: {
                    include: { user: true }
                }
            }
        });

        return {
            email: subscription?.customer?.user?.email,
            phone: subscription?.customer?.phoneNumber,
            subscription
        };
    }

    /**
     * Send Payment Reminder (H-3 or H-1)
     */
    static async sendPaymentReminder(invoice: any, daysLeft: number): Promise<void> {
        const { email, phone } = await this.getContactInfo(invoice.subscriptionId);

        // Fire and forget both channels
        if (email) {
            EmailService.sendPaymentReminderEmail(email, invoice, daysLeft).catch(err => {
                console.error("Failed to send reminder email:", err);
            });
        }

        if (phone) {
            WhatsAppService.sendPaymentReminder(phone, invoice, daysLeft).catch(err => {
                console.error("Failed to send reminder WhatsApp:", err);
            });
        }
    }

    /**
     * Send Overdue Alert (H+1 after due date)
     */
    static async sendOverdueAlert(invoice: any, daysOverdue: number): Promise<void> {
        const { email, phone } = await this.getContactInfo(invoice.subscriptionId);

        if (email) {
            EmailService.sendOverdueAlertEmail(email, invoice, daysOverdue).catch(err => {
                console.error("Failed to send overdue email:", err);
            });
        }

        if (phone) {
            WhatsAppService.sendOverdueAlert(phone, invoice, daysOverdue).catch(err => {
                console.error("Failed to send overdue WhatsApp:", err);
            });
        }
    }

    /**
     * Send Isolation Notice
     */
    static async sendIsolationNotice(subscriptionId: string, invoice: any): Promise<void> {
        const { email, phone, subscription } = await this.getContactInfo(subscriptionId);

        if (email && subscription) {
            EmailService.sendIsolationEmail(email, subscription, invoice).catch(err => {
                console.error("Failed to send isolation email:", err);
            });
        }

        if (phone && subscription) {
            WhatsAppService.sendIsolationNotice(phone, subscription, invoice).catch(err => {
                console.error("Failed to send isolation WhatsApp:", err);
            });
        }
    }

    /**
     * Send Payment Success Confirmation
     */
    static async sendPaymentSuccess(invoice: any, payment: any): Promise<void> {
        const { email, phone } = await this.getContactInfo(invoice.subscriptionId);

        if (email) {
            EmailService.sendPaymentSuccessEmail(email, invoice, payment).catch(err => {
                console.error("Failed to send payment success email:", err);
            });
        }

        if (phone) {
            WhatsAppService.sendPaymentSuccess(phone, invoice, payment).catch(err => {
                console.error("Failed to send payment success WhatsApp:", err);
            });
        }
    }

    /**
     * Send Reactivation Notice
     */
    static async sendReactivationNotice(subscriptionId: string): Promise<void> {
        const { email, phone, subscription } = await this.getContactInfo(subscriptionId);

        if (email && subscription) {
            EmailService.sendReactivationEmail(email, subscription).catch(err => {
                console.error("Failed to send reactivation email:", err);
            });
        }

        if (phone && subscription) {
            WhatsAppService.sendReactivationNotice(phone, subscription).catch(err => {
                console.error("Failed to send reactivation WhatsApp:", err);
            });
        }
    }
}
