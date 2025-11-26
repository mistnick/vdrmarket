import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseServerIo = NextApiResponse & {
    socket: any & {
        server: NetServer & {
            io: ServerIO;
        };
    };
};

export const config = {
    api: {
        bodyParser: false,
    },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
    if (!res.socket.server.io) {
        const path = "/api/socket/io";
        const httpServer: NetServer = res.socket.server as any;
        const io = new ServerIO(httpServer, {
            path: path,
            addTrailingSlash: false,
        });

        io.on("connection", (socket) => {
            console.log("Socket connected:", socket.id);

            socket.on("join-room", (room: string) => {
                socket.join(room);
                console.log(`Socket ${socket.id} joined room ${room}`);
            });

            socket.on("leave-room", (room: string) => {
                socket.leave(room);
                console.log(`Socket ${socket.id} left room ${room}`);
            });

            socket.on("disconnect", () => {
                console.log("Socket disconnected:", socket.id);
            });
        });

        res.socket.server.io = io;
    }

    res.end();
};

export default ioHandler;
