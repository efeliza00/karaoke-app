import { useState, useRef } from "react";
import ReactPlayer from "react-player";
import { useDebouncedValue } from "@mantine/hooks";
import useSWR from "swr";
import {
  TextInput,
  Combobox,
  useCombobox,
  Button,
  Flex,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  Plus,
  TriangleAlert,
  Search,
  LoaderCircle,
  CircleArrowRight,
} from "lucide-react";
import { socket } from "../libs/socket";
import { Link, useParams } from "react-router";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";
import Lottie from "lottie-react";
import Navbar from "../components/navbar";
import playButton from "../../src/assets/lottie/play-button.json";
import Footer from "../components/landing-section/footer";
import {
  MediaController,
  MediaControlBar,
  MediaMuteButton,
  MediaFullscreenButton,
} from "media-chrome/react";
import GradientText from "../components/gradient-text";

const fetcher = async (...args) =>
  await fetch(...args).then((res) => res.json());

const SearchSongs = ({ roomId }) => {
  const [searchSong, setSearchSong] = useState("");
  const [debouncedSearchSong] = useDebouncedValue(searchSong, 200);
  const { data, isLoading, error } = useSWR(
    `${import.meta.env.VITE_SERVER_URL}/youtube?search=${debouncedSearchSong}`,
    fetcher
  );
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const handleAddSong = (roomId, song) => {
    socket.emit("add-song", { roomId, song }, (res) => {
      if (res.status) {
        notifications.show({
          color: "green",
          title: "Song added",
        });
      } else {
        notifications.show({
          color: "red",
          title: res.message,
        });
      }
    });
  };

  useEffect(() => {
    socket.on("joined-room", (message) => {
      notifications.show({
        color: "yellow",
        message: message,
      });
    });
    socket.on("song-added", (message) => {
      notifications.show({
        color: "indigo",
        message: message,
      });
    });

    return () => {
      socket.off("joined-room");
      socket.off("song-added");
    };
  }, []);

  const options =
    data?.items?.map((item) => (
      <Combobox.Option value={item.id} key={item.title}>
        <Flex className="gap-4 items-center">
          <Tooltip label="Add to Queue">
            <ActionIcon
              onClick={() => {
                handleAddSong(roomId, item);
                combobox.closeDropdown();
              }}
              variant="light"
            >
              <Plus size={16} />
            </ActionIcon>
          </Tooltip>
          <img
            radius="sm"
            height={48}
            width={80}
            src={item.thumbnail.thumbnails[0].url}
            className="shadow rounded-lg"
            alt={item.title}
          />
          <span>{item.title}</span>
        </Flex>
      </Combobox.Option>
    )) ?? [];

  return (
    <Combobox withinPortal={false} store={combobox}>
      <Combobox.Target>
        <TextInput
          label="Enter the title of the song"
          styles={{
            label: {
              fontSize: 20,
              fontWeight: "light",
            },
            input: {
              marginTop: 8,
              borderRadius: 10,
            },
          }}
          value={searchSong}
          maxLength={50}
          leftSection={<Search className="text-gray-500" />}
          rightSection={
            (isLoading && (
              <LoaderCircle className="animate-spin text-blue-500" />
            )) ||
            (error && <TriangleAlert className="text-red-500" />)
          }
          size="lg"
          onChange={(event) => {
            setSearchSong(event.currentTarget.value);
            combobox.openDropdown();
          }}
        />
      </Combobox.Target>
      <Combobox.Dropdown
        hidden={data?.items === null}
        className="max-h-[75%] overflow-auto !rounded-xl"
      >
        <Combobox.Options>
          {options}
          {options.length < 1 && (
            <Combobox.Empty>No results found</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

const RoomPage = () => {
  const [songs, setSongs] = useState([]);
  const playerRef = useRef(null);
  const [currentSong, setCurrentSong] = useState("");
  const [role, setRole] = useState("");
  const [hasJoined, setHasJoined] = useState("pending");
  const silentRef = useRef(false);
  const { id: roomId } = useParams();

  const handleNextSong = (roomId) => {
    socket.emit("next-song", { roomId });
  };
  useEffect(() => {
    const handleAssignedRole = (assignedRole) => {
      setRole(assignedRole);
    };

    socket.off("assigned-role", handleAssignedRole);
    socket.on("assigned-role", handleAssignedRole);

    if (roomId) {
      socket.emit("check-joined-user", { roomId }, (res) => {
        if (res.status) {
          setHasJoined("joined");
        } else {
          setHasJoined("not-joined");
        }
      });
    }

    return () => {
      socket.off("assigned-role", handleAssignedRole);
    };
  }, [roomId]);

  useEffect(() => {
    socket.emit("get-songlist", { roomId }, (songs) => {
      setSongs(songs);
      if (songs.length > 0) {
        setCurrentSong(songs[0]);
      }
    });

    socket.on("update-songlist", (updatedSongs) => {
      setSongs(updatedSongs);
      if (updatedSongs.length > 0) {
        setTimeout(() => setCurrentSong(updatedSongs[0]), 100);
      }
    });

    return () => {
      socket.off("update-songlist");
    };
  }, [roomId]);

  useEffect(() => {
    socket.on("video-status", ({ action, time }) => {
      const videoEl = playerRef.current;
      if (!videoEl) return;

      silentRef.current = true; // block outgoing emits
      const drift = Math.abs(videoEl.currentTime - time);
      if (drift > 0.3) videoEl.currentTime = time;

      if (action === "play") videoEl.play();
      if (action === "pause") videoEl.pause();
      if (action === "seeked") videoEl.currentTime = time;

      setTimeout(() => {
        silentRef.current = false;
      }, 100);
    });

    return () => socket.off("video-status");
  }, []);

  if (hasJoined === "pending")
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loader !bg-gradient-to-r  !from-blue-700 !to-purple-600 b" />
      </div>
    );
  if (hasJoined === "not-joined")
    return (
      <>
        <div className="container mx-auto h-screen px-4 md:px-0 flex items-center justify-center">
          <div className="w-full max-w-2xl border border-indigo-200 rounded-2xl shadow-md bg-indigo-200/30 p-8 md:p-12  backdrop-blur-md">
            <GradientText
              animationSpeed={10}
              colors={["#7241D5", "#ff7040", "#7241D5", "#ff7040", "#7241D5"]}
              className="text-3xl px-4 py-6 !rounded-none md:text-4xl font-bold uppercase text-center"
            >
              Unauthorized
            </GradientText>

            <h3 className="text-sm md:text-xl text-center mt-6 text-indigo-300  ">
              You're trying to access a room without authorization. To join a
              room, click{" "}
              <Link
                to="/"
                className="text-blue-400 hover:underline hover:text-indigo-400"
              >
                here
              </Link>
              .
            </h3>
          </div>
        </div>
        <Footer />
      </>
    );
  return (
    <>
      <div className="min-h-screen  h-screen  w-full font-poppins flex flex-col md:flex-row">
        <div className="w-full h-full md:w-4/6">
          <ReactPlayer
            ref={playerRef}
            src={
              currentSong
                ? `https://www.youtube.com/watch?v=${currentSong?.id}`
                : ""
            }
            config={{
              youtube: {
                origin: "*",
              },
            }}
            controls
            width="100%"
            height="100%"
            className="aspect-video md:h-full"
            style={{
              width: "100%",
              height: "100%",
              "--controls": "none",
            }}
            onPlay={() => {
              if (silentRef.current) return;
              socket.emit("video-sync", {
                roomId,
                videoState: {
                  action: "play",
                  time: playerRef.current.currentTime,
                  senderId: socket.id,
                },
              });
            }}
            onPause={() => {
              if (silentRef.current) return;
              socket.emit("video-sync", {
                roomId,
                videoState: {
                  action: "pause",
                  time: playerRef.current.currentTime,
                  senderId: socket.id,
                },
              });
            }}
            onSeeking={() => {
              if (silentRef.current) return;
              socket.emit("video-sync", {
                roomId,
                videoState: {
                  action: "seeking",
                  time: playerRef.current.currentTime,
                  senderId: socket.id,
                },
              });
            }}
            onSeeked={() => {
              if (silentRef.current) return;
              socket.emit("video-sync", {
                roomId,
                videoState: {
                  action: "seeked",
                  time: playerRef.current.currentTime,
                  senderId: socket.id,
                },
              });
            }}
            onEnded={() => {
              if (silentRef.current) return;
              socket.emit("video-sync", {
                roomId,
                videoState: {
                  action: "ended",
                  time: playerRef.current.currentTime,
                  senderId: socket.id,
                },
              });
              socket.emit("next-song", { roomId });
            }}
          />
        </div>
        <div className="w-full md:w-2/6 px-4 space-y-4 shadow-inner py-4">
          <Navbar />
          <SearchSongs roomId={roomId} />
          <Tooltip
            label={
              songs.length === 0 || !currentSong || role !== "host"
                ? "You are not the host."
                : "Next Song"
            }
          >
            <Button
              onClick={() => handleNextSong(roomId)}
              size="input-xl"
              className="!bg-gradient-to-r  !w-full !from-violet-600 !to-indigo-600"
              disabled={songs.length === 0 || !currentSong || role !== "host"}
            >
              <CircleArrowRight className="mr-4" />
              Next Song
            </Button>
          </Tooltip>

          <div
            className={`flex items-center p-3 border rounded-xl ${
              currentSong ? "border-blue-500/30" : "border-gray-500/30"
            } dark:bg-zinc-900`}
          >
            <Lottie
              className="h-20 w-20 shrink-0"
              animationData={playButton}
              loop={!!currentSong}
            />
            <div className="flex-1">
              {currentSong ? (
                <p className="text-base font-medium text-zinc-800 dark:text-zinc-100 line-clamp-2">
                  {currentSong.title}
                </p>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">
                  No Disc
                </span>
              )}
            </div>
          </div>

          <ul
            className={`flex flex-col divide-y divide-gray-200 dark:divide-zinc-700 rounded-lg ${
              songs.length > 2 && ` border border-blue-500/30`
            } bg-white dark:bg-zinc-900 max-h-[50vh] md:max-h-[80vh] overflow-auto`}
          >
            {songs
              .filter((s) => s.id !== currentSong?.id)
              .map((song, index) => (
                <li
                  key={song.id + song.title}
                  className={`hover:bg-gray-100 gap-4 ${
                    index === 0 ? "p-0" : "p-2"
                  } flex items-center relative overflow-hidden px-4 py-2 dark:hover:bg-zinc-800 transition-colors cursor-pointer`}
                >
                  {index === 0 && (
                    <div className="shadow-md absolute top-0 right-0 p-2 w-[120px] text-center text-md md:text-sm font-light bg-gradient-to-r from-blue-600 to-violet-800 text-white">
                      <span>Up Next!</span>
                    </div>
                  )}
                  <span className="text-zinc-800 dark:text-zinc-100 font-medium break-words">
                    {song.title}
                  </span>
                </li>
              ))}

            {songs.length === 1 && (
              <li className="text-center p-4 text-gray-300">
                No songs in queue.
              </li>
            )}
          </ul>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RoomPage;
