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

  // Helper for common styling
  private static readonly baseStyle = `
    font-family: Arial, sans-serif; 
    max-width: 600px; 
    margin: 0 auto; 
    color: #333;
  `;

  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  private static formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("id-ID", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Send OTP verification email
   */
  static async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    console.log("📧 Attempting to send OTP email to:", to);
    try {
      await transporter.sendMail({
        from: `"ISP App" <${this.FROM_EMAIL}>`,
        to,
        subject: "Verifikasi Email - Kode OTP Anda",
        html: `
          <div style="${this.baseStyle}">
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
      const dueDate = this.formatDate(invoice.dueDate);
      const amount = this.formatCurrency(Number(invoice.totalAmount));

      await transporter.sendMail({
        from: `"ISP App Billing" <${this.FROM_EMAIL}>`,
        to,
        subject: `Tagihan Internet #${invoice.invoiceNumber}`,
        html: `
          <div style="${this.baseStyle}">
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

                <p>Status: <strong style="color: #d97706; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">UNPAID</strong></p>
                <p style="text-align: center;">Silakan lakukan pembayaran melalui aplikasi sebelum tanggal jatuh tempo.</p>
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

  /**
   * Send Payment Reminder Email (H-3 or H-1)
   */
  static async sendPaymentReminderEmail(to: string, invoice: any, daysLeft: number): Promise<boolean> {
    console.log("📧 Sending Payment Reminder to:", to);
    try {
      const dueDate = this.formatDate(invoice.dueDate);
      const amount = this.formatCurrency(Number(invoice.totalAmount));
      const isUrgent = daysLeft <= 1;
      const headerColor = isUrgent ? "#dc2626" : "#f59e0b";
      const title = isUrgent ? "⚠️ Pengingat Terakhir" : "🔔 Pengingat Pembayaran";

      await transporter.sendMail({
        from: `"ISP App Billing" <${this.FROM_EMAIL}>`,
        to,
        subject: `${isUrgent ? "⚠️ URGENT: " : ""}Pengingat Tagihan #${invoice.invoiceNumber} - H-${daysLeft}`,
        html: `
          <div style="${this.baseStyle}">
            <div style="background-color: ${headerColor}; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">${title}</h2>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
                <p>Halo,</p>
                <p>Tagihan internet Anda akan <strong>jatuh tempo dalam ${daysLeft} hari</strong>.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">No. Invoice</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">${invoice.invoiceNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">Total Tagihan</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right; color: ${headerColor}; font-size: 18px;">${amount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">Jatuh Tempo</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">${dueDate}</td>
                    </tr>
                </table>

                <p style="text-align: center; background: #fef3c7; padding: 15px; border-radius: 8px;">
                    ⚠️ Segera lakukan pembayaran untuk menghindari gangguan layanan.
                </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>Email ini dikirim secara otomatis.</p>
            </div>
          </div>
        `,
      });
      console.log("✅ Payment Reminder sent to:", to);
      return true;
    } catch (error) {
      console.error("Email service error:", error);
      return false;
    }
  }

  /**
   * Send Overdue Alert Email
   */
  static async sendOverdueAlertEmail(to: string, invoice: any, daysOverdue: number): Promise<boolean> {
    console.log("📧 Sending Overdue Alert to:", to);
    try {
      const amount = this.formatCurrency(Number(invoice.totalAmount));

      await transporter.sendMail({
        from: `"ISP App Billing" <${this.FROM_EMAIL}>`,
        to,
        subject: `🚨 TAGIHAN JATUH TEMPO #${invoice.invoiceNumber}`,
        html: `
          <div style="${this.baseStyle}">
            <div style="background-color: #dc2626; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">🚨 Tagihan Jatuh Tempo</h2>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
                <p>Halo,</p>
                <p>Tagihan internet Anda sudah <strong style="color: #dc2626;">melewati jatuh tempo ${daysOverdue} hari</strong>.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">No. Invoice</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">${invoice.invoiceNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">Total Tagihan</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right; color: #dc2626; font-size: 18px;">${amount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">Status</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">
                            <span style="color: #dc2626; background: #fef2f2; padding: 2px 8px; border-radius: 4px;">OVERDUE</span>
                        </td>
                    </tr>
                </table>

                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
                    <strong>⚠️ Peringatan:</strong> Layanan Anda akan diisolasi jika tidak segera melakukan pembayaran.
                </div>
                
                <p style="text-align: center; margin-top: 20px; color: #666;">
                    Abaikan pesan ini jika sudah melakukan pembayaran.
                </p>
            </div>
          </div>
        `,
      });
      console.log("✅ Overdue Alert sent to:", to);
      return true;
    } catch (error) {
      console.error("Email service error:", error);
      return false;
    }
  }

  /**
   * Send Isolation Notice Email
   */
  static async sendIsolationEmail(to: string, subscription: any, invoice: any): Promise<boolean> {
    console.log("📧 Sending Isolation Notice to:", to);
    try {
      const amount = this.formatCurrency(Number(invoice.totalAmount));

      await transporter.sendMail({
        from: `"ISP App Billing" <${this.FROM_EMAIL}>`,
        to,
        subject: `🔒 Layanan Diisolasi - ${subscription.serviceId}`,
        html: `
          <div style="${this.baseStyle}">
            <div style="background-color: #7c3aed; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">🔒 Layanan Diisolasi</h2>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
                <p>Halo,</p>
                <p>Layanan internet Anda (<strong>${subscription.serviceId}</strong>) telah <strong style="color: #7c3aed;">diisolasi</strong> karena tagihan yang belum dibayar.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc;">
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #eee;">No. Invoice</td>
                        <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">${invoice.invoiceNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #eee;">Total Tagihan</td>
                        <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; text-align: right; color: #7c3aed; font-size: 18px;">${amount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px;">Status Layanan</td>
                        <td style="padding: 12px; font-weight: bold; text-align: right;">
                            <span style="color: #7c3aed; background: #ede9fe; padding: 4px 10px; border-radius: 4px;">ISOLATED</span>
                        </td>
                    </tr>
                </table>

                <div style="text-align: center; margin: 25px 0;">
                    <p>Untuk mengaktifkan kembali layanan, segera lakukan pembayaran melalui aplikasi.</p>
                </div>
                
                <p style="text-align: center; color: #666; font-size: 13px;">
                    Hubungi customer service jika membutuhkan bantuan.
                </p>
            </div>
          </div>
        `,
      });
      console.log("✅ Isolation Notice sent to:", to);
      return true;
    } catch (error) {
      console.error("Email service error:", error);
      return false;
    }
  }

  /**
   * Send Payment Success Email
   */
  static async sendPaymentSuccessEmail(to: string, invoice: any, payment: any): Promise<boolean> {
    console.log("📧 Sending Payment Success to:", to);
    try {
      const amount = this.formatCurrency(Number(payment.amount || invoice.totalAmount));
      const paymentDate = new Date(payment.paidAt || new Date()).toLocaleDateString("id-ID", {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      await transporter.sendMail({
        from: `"ISP App Billing" <${this.FROM_EMAIL}>`,
        to,
        subject: `✅ Pembayaran Berhasil #${invoice.invoiceNumber}`,
        html: `
          <div style="${this.baseStyle}">
            <div style="background-color: #10b981; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">✅ Pembayaran Berhasil</h2>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
                <p>Halo,</p>
                <p>Pembayaran tagihan internet Anda telah <strong style="color: #10b981;">berhasil</strong>.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f0fdf4;">
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #dcfce7;">No. Invoice</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dcfce7; font-weight: bold; text-align: right;">${invoice.invoiceNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #dcfce7;">Jumlah Dibayar</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dcfce7; font-weight: bold; text-align: right; color: #10b981; font-size: 18px;">${amount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #dcfce7;">Tanggal Pembayaran</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dcfce7; font-weight: bold; text-align: right;">${paymentDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px;">Status</td>
                        <td style="padding: 12px; font-weight: bold; text-align: right;">
                            <span style="color: #10b981; background: #dcfce7; padding: 4px 10px; border-radius: 4px;">PAID ✓</span>
                        </td>
                    </tr>
                </table>

                <p style="text-align: center; font-size: 16px;">
                    Terima kasih atas pembayaran Anda! 🙏
                </p>
            </div>
          </div>
        `,
      });
      console.log("✅ Payment Success sent to:", to);
      return true;
    } catch (error) {
      console.error("Email service error:", error);
      return false;
    }
  }

  /**
   * Send Reactivation Notice Email
   */
  static async sendReactivationEmail(to: string, subscription: any): Promise<boolean> {
    console.log("📧 Sending Reactivation Notice to:", to);
    try {
      await transporter.sendMail({
        from: `"ISP App" <${this.FROM_EMAIL}>`,
        to,
        subject: `🎉 Layanan Aktif Kembali - ${subscription.serviceId}`,
        html: `
          <div style="${this.baseStyle}">
            <div style="background-color: #10b981; padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0; font-size: 24px;">🎉 Layanan Aktif Kembali!</h2>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 25px; border-radius: 0 0 8px 8px; text-align: center;">
                <p style="font-size: 16px;">Halo,</p>
                <p style="font-size: 16px;">
                    Selamat! Layanan internet Anda (<strong>${subscription.serviceId}</strong>) telah <strong style="color: #10b981;">aktif kembali</strong>.
                </p>
                
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <p style="margin: 0; font-size: 18px;">
                        Status: <strong style="color: #10b981;">✅ ACTIVE</strong>
                    </p>
                </div>

                <p style="font-size: 15px; color: #666;">
                    Terima kasih telah melakukan pembayaran.<br>
                    Nikmati layanan internet Anda! 🚀
                </p>
            </div>
          </div>
        `,
      });
      console.log("✅ Reactivation Notice sent to:", to);
      return true;
    } catch (error) {
      console.error("Email service error:", error);
      return false;
    }
  }
}

