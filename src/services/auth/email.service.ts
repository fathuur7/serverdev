import nodemailer from "nodemailer";

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
  },
});

/**
 * Email Service - Sends emails using Gmail SMTP
 */
export class EmailService {
  private static readonly FROM_EMAIL = process.env.GMAIL_USER || "";

  /**
   * Send OTP verification email
   */
  static async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    console.log("📧 Attempting to send OTP email to:", to);
    console.log("📧 FROM:", this.FROM_EMAIL);
    try {
      await transporter.sendMail({
        from: `"ISP App" <${this.FROM_EMAIL}>`,
        to,
        subject: "Verifikasi Email - Kode OTP Anda",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verifikasi Email Anda</h2>
            <p>Gunakan kode OTP berikut untuk memverifikasi email Anda:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold;">
              ${otp}
            </div>
            <p style="color: #666; margin-top: 20px;">
              Kode ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun.
            </p>
          </div>
        `,
      });

      console.log("✅ OTP Email sent successfully to:", to);
      return true;
    } catch (error) {
      console.error("Email service error:", error);
      return false;
    }
  }

  /**
   * Send Invoice Notification Email
   */
  static async sendInvoiceEmail(to: string, invoice: any): Promise<boolean> {
    console.log("📧 Attempting to send Invoice email to:", to);
    try {
      const dueDate = new Date(invoice.dueDate).toLocaleDateString("id-ID", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      });
      const amount = formatter.format(Number(invoice.totalAmount));

      await transporter.sendMail({
        from: `"ISP App Billing" <${this.FROM_EMAIL}>`,
        to,
        subject: `Tagihan Internet #${invoice.invoiceNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #3b82f6; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">Tagihan Baru Tersedia</h2>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
                <p>Halo,</p>
                <p>Tagihan internet Anda untuk periode ini telah terbit dengan rincian:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">No. Invoice</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">${invoice.invoiceNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">Total Tagihan</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right; color: #3b82f6; font-size: 18px;">${amount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">Jatuh Tempo</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">${dueDate}</td>
                    </tr>
                </table>

                <p>Status saat ini: <strong style="color: #d97706; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">UNPAID</strong></p>

                <div style="text-align: center; margin-top: 30px;">
                    <p>Silakan lakukan pembayaran melalui aplikasi sebelum tanggal jatuh tempo.</p>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
            </div>
          </div>
        `,
      });

      console.log("✅ Invoice Email sent successfully to:", to);
      return true;
    } catch (error) {
      console.error("Email service error:", error);
      return false;
    }
  }
}
