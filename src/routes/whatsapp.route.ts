import { Elysia } from "elysia";
import { WhatsAppController } from "../controllers/whatsapp.controller";

const whatsappController = new WhatsAppController();

export const WhatsAppRoutes = new Elysia({ prefix: "/whatsapp" })
    .get("/status", whatsappController.getStatus)
    .post("/logout", whatsappController.logout);
