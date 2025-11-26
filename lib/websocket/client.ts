// lib/websocket/client.ts
import io from "socket.io-client";

/**
 * Initialize a Socket.IO client connection.
 * Usage: const socket = initWebSocketClient();
 */
export function initWebSocketClient() {
    const socket = io("http://localhost:3000", {
        transports: ["websocket"],
    });

    socket.on("connect", () => {
        console.log("🔌 WebSocket client connected", socket.id);
    });

    // Example listener for notifications
    socket.on("notification", (payload: any) => {
        console.log("🔔 Notification received", payload);
        // TODO: integrate with UI notification system
    });

    return socket;
}
