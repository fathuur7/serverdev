import { redis, QUEUES } from "../utils/redis";
import { EmailService } from "../services/auth/email.service";
import type { EmailOtpJob } from "../events/email.publisher";

export class EmailWorker {
    private isRunning = false;

    /**
     * Start the email worker
     */
    async start(): Promise<void> {
        console.log("Email Worker started, listening for jobs...");
        this.isRunning = true;

        while (this.isRunning) {
            try {
                // BRPOP blocks until a job is available (timeout 5 seconds)
                const result = await redis.brpop(QUEUES.EMAIL_OTP, 5);

                if (result) {
                    const [, jobData] = result;
                    const job: EmailOtpJob = JSON.parse(jobData);

                    console.log(`📥 Processing email job for: ${job.to}`);

                    const success = await EmailService.sendOtpEmail(job.to, job.otp);

                    if (success) {
                        console.log(`✅ Email sent to: ${job.to}`);
                    } else {
                        console.error(`❌ Failed to send email to: ${job.to}`);
                        // Optionally re-queue failed jobs
                    }
                }
            } catch (error) {
                console.error("❌ Worker error:", error);
                // Wait a bit before retrying
                await new Promise((r) => setTimeout(r, 1000));
            }
        }
    }

    /**
     * Stop the worker
     */
    stop(): void {
        this.isRunning = false;
        console.log("🛑 Email Worker stopped");
    }
}

// Start worker if this file is run directly
const worker = new EmailWorker();
worker.start();
