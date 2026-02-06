import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import Redis from "ioredis";
import pino from "pino";
import { Boom } from "@hapi/boom";
import fs from "fs";

// Setup Redis - separate clients for subscriber and publisher
const redisSubscriber = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const redisPublisher = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const number_test = "6285815245639"; // Test number untuk verifikasi

console.log("🚀 WhatsApp Worker Starting (Baileys)...");

// Setup Baileys connection
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("baileys_auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        printQRInTerminal: false, // We handle QR ourselves
        logger: pino({ level: "silent" }), // Suppress Baileys logs
        generateHighQualityLinkPreview: true,
    });

    // Handle connection updates (QR, auth, ready, disconnected)
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // QR Code received
        if (qr) {
            console.log("📱 QR Code received! Scan this with your WhatsApp:");
            qrcode.generate(qr, { small: true });

            // Store QR in Redis with 60s TTL
            await redisPublisher.setex("whatsapp:qr", 60, qr);
            await redisPublisher.set("whatsapp:status", "qr");
            await redisPublisher.set("whatsapp:timestamp", Date.now().toString());
            console.log("💾 QR code stored in Redis");
        }

        // Connection opened (authenticated & ready)
        if (connection === "open") {
            console.log("✅ WhatsApp Connected!");

            // Update status to ready
            await redisPublisher.del("whatsapp:qr");
            await redisPublisher.set("whatsapp:status", "ready");
            await redisPublisher.set("whatsapp:timestamp", Date.now().toString());

            // Send test message
            try {
                console.log("📤 Test message sent successfully!");
            } catch (error) {
                console.error("⚠️ Could not send test message:", error);
            }
        }

        // Connection closed
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("❌ Connection closed. Reconnect:", shouldReconnect);

            if (shouldReconnect) {
                // Auto-reconnect
                setTimeout(() => connectToWhatsApp(), 3000);
            } else {
                // Logged out - clear session and generate new QR
                console.log("🚪 Logged out. Clearing session...");
                await redisPublisher.del("whatsapp:qr");
                await redisPublisher.set("whatsapp:status", "disconnected");
                await redisPublisher.set("whatsapp:timestamp", Date.now().toString());

                // Delete session folder to force fresh start
                console.log("🗑️ Deleting baileys_auth folder...");
                try {
                    if (fs.existsSync("baileys_auth")) {
                        fs.rmSync("baileys_auth", { recursive: true, force: true });
                        console.log("✅ Session folder deleted");
                    }
                } catch (error) {
                    console.error("⚠️ Could not delete session folder:", error);
                }

                // Reconnect to generate new QR code
                console.log("🔄 Reconnecting to generate new QR code...");
                setTimeout(() => connectToWhatsApp(), 2000);
            }
        }

        // Connecting state
        if (connection === "connecting") {
            console.log("🔄 Connecting to WhatsApp...");
            await redisPublisher.set("whatsapp:status", "authenticated");
            await redisPublisher.set("whatsapp:timestamp", Date.now().toString());
        }
    });

    // Save credentials when updated
    sock.ev.on("creds.update", saveCreds);

    // Handle incoming messages (for future chat features)
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") return;

        for (const msg of messages) {
            if (!msg.message) continue;
            console.log("📨 Received message:", msg);
        }
    });

    return sock;
}

// Redis subscriber for outgoing messages
redisSubscriber.subscribe("whatsapp:send", (err) => {
    if (err) {
        console.error("❌ Failed to subscribe to Redis:", err);
    } else {
        console.log("📡 Subscribed to 'whatsapp:send' channel");
    }
});

// Redis subscriber for logout
redisSubscriber.subscribe("whatsapp:logout", (err) => {
    if (err) {
        console.error("❌ Failed to subscribe to logout channel:", err);
    } else {
        console.log("📡 Subscribed to 'whatsapp:logout' channel");
    }
});

// Handle Redis messages
let socket: any = null;

redisSubscriber.on("message", async (channel, message) => {
    if (channel === "whatsapp:send") {
        try {
            const data = JSON.parse(message);
            const { to, text } = data;

            if (!to || !text) {
                console.error("⚠️ Invalid message format. Need 'to' and 'text'");
                return;
            }

            // Format number correctly
            const formattedTo = to.includes("@") ? to : `${to}@s.whatsapp.net`;

            console.log(`📤 Sending message to ${formattedTo}: ${text}`);
            await socket.sendMessage(formattedTo, { text });
            console.log("✅ Message sent!");
        } catch (error) {
            console.error("❌ Error processing WhatsApp message:", error);
        }
    } else if (channel === "whatsapp:logout") {
        try {
            console.log("🚪 Logout requested, destroying session...");

            // Logout
            if (socket) {
                await socket.logout();
            }

            console.log("✅ WhatsApp session cleared!");

            // Delete session folder to force fresh start
            console.log("🗑️ Deleting baileys_auth folder...");
            try {
                if (fs.existsSync("baileys_auth")) {
                    fs.rmSync("baileys_auth", { recursive: true, force: true });
                    console.log("✅ Session folder deleted");
                }
            } catch (error) {
                console.error("⚠️ Could not delete session folder:", error);
            }

            console.log("🔄 Reconnecting to generate new QR code...");

            // Reconnect to generate new QR code
            setTimeout(async () => {
                socket = await connectToWhatsApp();
                console.log("🔗 WhatsApp socket reinitialized");
            }, 2000); // Wait 2s before reconnecting
        } catch (error) {
            console.error("❌ Error during logout:", error);
        }
    }
});

// Initialize connection
connectToWhatsApp().then((sock) => {
    socket = sock;
    console.log("🔗 WhatsApp socket initialized");
}).catch((error) => {
    console.error("❌ Failed to initialize WhatsApp:", error);
    process.exit(1);
});
