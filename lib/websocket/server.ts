// lib/websocket/server.ts
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

/**
 * Initialize a Socket.IO server.
 * In production you would integrate this with your custom server (e.g., Next.js custom server).
 */
export function initWebSocketServer(httpServer: HttpServer) {
    const io = new SocketIOServer(httpServer, {
        // Options can be customized as needed
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("🔌 WebSocket client connected", socket.id);
        // Example event listeners
        socket.on("ping", () => socket.emit("pong"));
        // Add more real-time notification handlers here
    });

    return io;
}
