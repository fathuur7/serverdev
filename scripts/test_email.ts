import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

async function testEmail() {
    console.log("Testing Gmail SMTP...");
    console.log("GMAIL_USER:", process.env.GMAIL_USER);
    console.log("GMAIL_APP_PASSWORD:", process.env.GMAIL_APP_PASSWORD ? "SET" : "NOT SET");

    try {
        const info = await transporter.sendMail({
            from: `"Test" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER, // Send to yourself
            subject: "Test OTP Email",
            text: "Kode OTP: 123456",
        });
        console.log("✅ Email sent!", info.messageId);
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

testEmail();
