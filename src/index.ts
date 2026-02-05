// BigInt serialization fix (standard for Prisma + JSON)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";
import { logger } from "@bogeychan/elysia-logger";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";

// plugins
import { requestContextPlugin } from "./plugins/context.plugin";

// routes
import { AuthRoutes } from "./routes/auth.route";
import { adminAuthRoute } from "./routes/admin-auth.route";
import { PackageRoutes } from "./routes/package.route";
import { SubscriptionRoutes } from "./routes/subscription.route";
import { PaymentRoutes } from "./routes/payment.route";
import { InvoiceRoutes } from "./routes/invoice.route";
import { technicianRoutes } from "./routes/technician.routes";
import { workOrderRoutes } from "./routes/workorder.routes";
import { ticketRoutes } from "./routes/ticket.routes";
import { WhatsAppRoutes } from "./routes/whatsapp.route";
import { attendanceRoute } from "./routes/attendance.route";
import { inventoryRoutes } from "./routes/inventory.route";
import { activityLogRoutes } from "./routes/activitylog.route";
import { profileRoutes } from "./routes/profile.route";


const app = new Elysia()
  .use(helmet())
  .use(cors())
  .use(logger())
  .use(requestContextPlugin)
  .use(swagger())
  .get("/", () => "Hello World")
  .group("/api", (app) =>
    app
      .use(adminAuthRoute)
      .use(AuthRoutes)
      .use(PackageRoutes)
      .use(SubscriptionRoutes)
      .use(PaymentRoutes)
      .use(InvoiceRoutes)
      .use(technicianRoutes)
      .use(workOrderRoutes)
      .use(ticketRoutes)
      .use(WhatsAppRoutes)
      .use(attendanceRoute)
      .use(inventoryRoutes)
      .use(activityLogRoutes)
      .use(profileRoutes)
  )
  .listen({ port: 3000, hostname: '0.0.0.0' });

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);