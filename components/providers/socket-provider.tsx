"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import ClientIO from "socket.io-client";

type SocketContextType = {
    socket: any | null;
    isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Check if we're in the browser and have the URL
        if (typeof window === "undefined") return;

        const socketUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        
        if (!socketUrl) {
            console.error("Socket URL not configured");
            return;
        }

        const socketInstance = new (ClientIO as any)(socketUrl, {
            path: "/api/socket/io",
            addTrailingSlash: false,
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
