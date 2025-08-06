import { ActionIcon, Button, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Copy } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { socket } from "../libs/socket";

const Navbar = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();

  const copyToClipboard = async (id) => {
    try {
      await navigator.clipboard.writeText(id);

      notifications.show({
        color: "blue.5",
        message: "Room Copied!",
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleLeaveRoom = (roomId) => {
    socket.emit("leave-room", { roomId }, (response) => {
      if (response.status) {
        notifications.show({
          color: "green",
          title: "Leave Room",
          message: response.message,
        });

        navigate("/");
      }
    });
  };

  return (
    <div className="flex justify-between items-center  py-2 gap-2 ">
      <div className="rounded-xl p-2  flex items-center justify-between bg-blue-200/30 w-1/3 md:w-1/2">
        <span className="text-blue-800">{roomId}</span>
        <Tooltip label="Copy">
          <ActionIcon
            variant="transparent"
            onClick={() => copyToClipboard(roomId)}
          >
            <Copy className="text-blue-500 h-5 w-5" />
          </ActionIcon>
        </Tooltip>
      </div>
      <Button
        onClick={() => handleLeaveRoom(roomId)}
        className="!rounded-lg !bg-gradient-to-r !from-blue-600 !to-violet-800"
      >
        Leave Room
      </Button>
    </div>
  );
};

export default Navbar;
