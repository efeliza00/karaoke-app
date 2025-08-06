import { useEffect } from "react";
import { socket } from "../src/libs/socket.js";
import { BrowserRouter, Routes, Route } from "react-router";
import HomePage from "./pages/homepage.jsx";
import RoomPage from "./pages/roompage.jsx";

function App() {
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Connected to server:", socket.id);
    };

    const handleDisconnect = (reason) => {
      console.warn("⚠️ Disconnected:", reason);
    };

    const handleError = (err) => {
      console.error("❌ Connection error:", err.message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError); // optional but very useful

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
    };
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rooms/:id" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
