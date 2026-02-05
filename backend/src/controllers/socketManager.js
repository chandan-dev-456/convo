import { Server } from "socket.io";

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true
        }
    });

    io.on("connection", (socket) => {

        socket.on("join-room", ({ roomId }) => {
            const room = io.sockets.adapter.rooms.get(roomId);
            const users = room ? [...room] : [];

            socket.join(roomId);

            socket.emit("existing-users", users);

            socket.to(roomId).emit("user-joined", {
                userId: socket.id
            });
        });

        socket.on("offer", ({ roomId, offer, fromId }) => {
            socket.to(roomId).emit("offer", { offer, fromId });
        });

        socket.on("answer", ({ roomId, answer, fromId }) => {
            socket.to(roomId).emit("answer", { answer, fromId });
        });

        socket.on("ice-candidate", ({ roomId, candidate, fromId }) => {
            socket.to(roomId).emit("ice-candidate", { candidate, fromId });
        });

        socket.on("media-update", ({ roomId, type, value, fromId }) => {
            socket.to(roomId).emit("media-update", { type, value, fromId });
        });

        socket.on("disconnect", () => {
            socket.rooms.forEach(roomId => {
                if (roomId !== socket.id) {
                    socket.to(roomId).emit("user-left", {
                        userId: socket.id
                    });
                }
            });
        });
    });

    return io;
};
