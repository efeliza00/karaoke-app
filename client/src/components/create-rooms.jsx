import { Button, Divider, Flex, Paper, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { socket } from "../libs/socket.js";
import { useNavigate } from "react-router";
import { useState } from "react";
import backgroundImage from "../assets/background.jpg"; // Vite will bundle this correctly

export function CreateRooms() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");

  const handleCreateRoom = () => {
    socket.emit("create-room", (res) => {
      if (res.status) {
        notifications.show({
          color: "green",
          message: res.message,
        });
        navigate(`/rooms/${res.roomId}`);
      } else {
        notifications.show({
          color: "red",
          message: res.message,
        });
      }
    });
  };

  const handleJoinRoom = () => {
    socket.emit("join-room", { roomId }, (res) => {
      if (res.status) {
        notifications.show({
          color: "green",
          message: res.message,
        });
        navigate(`/rooms/${res.roomId}`);
      } else {
        notifications.show({
          color: "red",
          message: res.message,
        });
      }
    });
  };

  return (
    <div className="flex md:h-[75vh] bg-gray-200/20  max-w-full md:max-w-2/3 mx-auto my-28 overflow-hidden shadow-none md:shadow-2xl">
      <div
        className="w-1/2 max-h-full bg-cover hidden md:block blur-xs"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      <div className="w-full md:w-1/2 flex items-center justify-center">
        <div className="w-full max-w-md p-10">
          <h3 className="text-center text-2xl md:text-4xl font-bold mb-4">
            Welcome to YouOke
          </h3>

          <Flex direction="column" gap="sm">
            <TextInput
              label="Room ID"
              size="xl"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />

            <Button
              fullWidth
              size="xl"
              variant="outline"
              onClick={handleJoinRoom}
            >
              Join a Room
            </Button>

            <Divider label="or" labelPosition="center" my="sm" />

            <Button
              size="xl"
              className="!bg-gradient-to-r  !from-blue-700 !to-purple-600"
              fullWidth
              onClick={handleCreateRoom}
            >
              Create a Room
            </Button>
          </Flex>
        </div>
      </div>
    </div>
  );
}
