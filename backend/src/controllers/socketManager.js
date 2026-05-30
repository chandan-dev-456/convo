import { Server } from "socket.io";

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    });
    const users = new Map();
    io.on("connection", (socket) => {

        socket.on("join-room", ({ roomId, name }) => {
            users.set(socket.id, {
                id: socket.id,
                name,
                roomId
            });
            socket.join(roomId);
            const room = io.sockets.adapter.rooms.get(roomId);
            const userList = room
                ? [...room].map((id) => users.get(id)).filter(Boolean)
                : [];

            io.to(roomId).emit("existing-users", userList);

            socket.to(roomId).emit("user-joined", {
                userId: socket.id
            });
        });

        socket.on("offer", ({ targetId, offer, fromId }) => {
            socket.to(targetId).emit("offer", { offer, fromId });
        });

        socket.on("answer", ({ targetId, answer, fromId }) => {
            socket.to(targetId).emit("answer", { answer, fromId });
        });

        socket.on("ice-candidate", ({ targetId, candidate, fromId }) => {
            socket.to(targetId).emit("ice-candidate", { candidate, fromId });
        });

        socket.on("media-update", ({ targetId, type, value, fromId }) => {
            socket.to(targetId).emit("media-update", { type, value, fromId });
        });

        socket.on("disconnect", () => {
            const user = users.get(socket.id);
            if (!user) return;
            const { roomId } = user;
            users.delete(socket.id);
            const room = io.sockets.adapter.rooms.get(roomId);
            const userList = room
                ? [...room].map((id) => users.get(id)).filter(Boolean)
                : [];
            io.to(roomId).emit("existing-users", userList);
            socket.to(roomId).emit("user-left", {
                userId: socket.id
            });
        });
    });

    return io;
};
