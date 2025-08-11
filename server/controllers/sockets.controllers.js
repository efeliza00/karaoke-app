import random from "random-string-generator";
const rooms = new Map();

export const roomControls = (socket) => {
  socket.on("create-room", (callback) => {
    const room = random(6);

    if (rooms.has(room)) {
      return callback({
        status: false,
        message: "Failed to create the room. Try again",
      });
    }

    socket.join(room);

    rooms.set(room, {
      host: socket.id,
      members: [socket.id],
      songs: [],
    });
    socket.emit("assigned-role", "host");
    console.log("Room created:", room);
    callback({
      status: true,
      message: `You have created the room ${room}`,
      roomId: room,
    });
  });

  socket.on("join-room", ({ roomId }, callback) => {
    if (!rooms.has(roomId)) {
      return callback({
        status: false,
        message: "Room does not exist.",
      });
    }

    const room = rooms.get(roomId);
    room.members.push(socket.id);

    rooms.set(roomId, room);

    socket.join(roomId);
    socket.emit("assigned-role", "viewer");
    socket.to(roomId).emit("joined-room", `${socket.id} has joined the room`);

    callback({
      status: true,
      message: "You have joined the room!",
      roomId,
    });
  });

  socket.on("leave-room", ({ roomId }, callback) => {
    const room = rooms.get(roomId);

    if (!room) {
      return callback?.({
        status: false,
        message: "Room not found.",
      });
    }

    room.members = room.members.filter((id) => id !== socket.id);
    socket.leave(roomId);

    socket.to(roomId).emit("left-room", `${socket.id} has left the room`);

    if (room.members.length === 0) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} deleted because it became empty.`);
    } else {
      rooms.set(roomId, room);
    }

    callback?.({
      status: true,
      message: `You left the room ${roomId}`,
    });
  });

  socket.on("check-joined-user", ({ roomId }, callback) => {
    const room = rooms.get(roomId);

    if (!room) {
      return callback({
        status: false,
        message: "Room does not exist.",
      });
    }

    if (!room.members || !room.members.includes(socket.id)) {
      return callback({
        status: false,
        message: "User is not a member of this room.",
      });
    }
    const role = socket.id === room.host ? "host" : "viewer";
    socket.emit("assigned-role", role);

    return callback({
      status: true,
      message: "User is a member of the room.",
    });
  });
};

export const mediaControls = (socket, io) => {
  socket.on("add-song", ({ roomId, song }, callback) => {
    const room = rooms.get(roomId);

    if (!room) {
      return callback({
        status: false,
        message: "Room not found.",
      });
    }

    room.songs.push(song);
    io.to(roomId).emit("update-songlist", room.songs);
    socket
      .to(roomId)
      .emit("song-added", `${song.title} has been added to the list.`);
    if (room.songs.length === 1) {
      const firstSong = room.songs[0];
      socket.to(roomId).emit("play-next-song", { songId: firstSong.id });
    }
    callback({
      status: true,
      message: "Song added.",
    });
  });

  socket.on("get-songlist", ({ roomId }, callback) => {
    const room = rooms.get(roomId);
    const songs = room?.songs || [];
    callback(songs);
  });

  socket.on("video-ended", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room?.songs.length > 0) {
      room.songs.shift();
      rooms.set(roomId, room);
      io.to(roomId).emit("update-songlist", room.songs);
    }
  });

  socket.on("video-sync", ({ videoState, roomId }) => {
    io.to(roomId).emit("video-status", videoState);
  });

  socket.on("next-song", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room?.songs.length > 0) {
      room.songs.shift();
      rooms.set(roomId, room);
      io.to(roomId).emit("update-songlist", room.songs);
    }
  });
};
