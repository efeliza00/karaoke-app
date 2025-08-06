import { useState, useRef } from "react";
import ReactPlayer from "react-player";
import { useDebouncedValue } from "@mantine/hooks";
import useSWR from "swr";
import {
  TextInput,
  Combobox,
  useCombobox,
  ActionIcon,
  Flex,
  ActionIconGroup,
  Tooltip,
  Divider,
} from "@mantine/core";
import {
  Plus,
  TriangleAlert,
  Search,
  LoaderCircle,
  Play,
  Pause,
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
  const [playing, setPlaying] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [currentSong, setCurrentSong] = useState("");
  const [role, setRole] = useState("");
  const [hasJoined, setHasJoined] = useState("pending");
  const { id: roomId } = useParams();

  const handlePause = () => {
    if (!seeking && role === "host") {
      socket.emit("pause", { roomId });
    }
    setPlaying(false);
  };

  const handlePlay = () => {
    if (!seeking && role === "host") {
      socket.emit("play", { roomId });
    }
    setPlaying(true);
  };

  const handleSeek = (seconds) => {
    if (role === "host") {
      socket.emit("seek", { roomId, time: seconds });
    }
  };

  const handleNextSong = (roomId) => {
    socket.emit("next-song", { roomId });
  };
  useEffect(() => {
    const handleAssignedRole = (assignedRole) => {
      console.log("Assigned role:", assignedRole);
      setRole(assignedRole);
    };

    socket.off("assigned-role", handleAssignedRole); // cleanup
    socket.on("assigned-role", handleAssignedRole); // register

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
    socket.on("play", () => setPlaying(true));

    socket.on("pause", () => setPlaying(false));

    socket.on("seek", (time) => {
      setSeeking(true);
      playerRef.current.seekTo(time, "seconds");
      setTimeout(() => setSeeking(false), 200);
    });

    return () => {
      socket.off("play");
      socket.off("pause");
      socket.off("seek");
    };
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
          <div className="w-full max-w-2xl border rounded-2xl shadow-xl border-red-300 p-8 md:p-12 bg-white/10 backdrop-blur-md">
            <GradientText
              animationSpeed={10}
              colors={["#ff4040", "#ff7040", "#ff4040", "#ff7040", "#ff4040"]}
              className="text-3xl md:text-4xl drop-shadow-8xl font-bold uppercase text-center"
            >
              Unauthorized
            </GradientText>

            <h3 className="text-sm md:text-lg text-gray-400 text-center mt-6  italic">
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
      <div className="min-h-screen w-full font-poppins flex flex-col md:flex-row">
        <div className="w-full h-full md:w-4/6">
          <MediaController
            style={{
              width: "100%",
            }}
            className="aspect-video md:h-screen"
          >
            <ReactPlayer
              slot="media"
              src={
                currentSong
                  ? `https://www.youtube.com/watch?v=${currentSong.id}`
                  : ""
              }
              muted
              playing={playing}
              onSeeking={handleSeek}
              controls={false}
              width="100%"
              height="100%"
              style={{
                width: "100%",
                height: "100%",
                "--controls": "none",
              }}
              onPlaying={(e) => {
                setPlaying(e.returnValue);
              }}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeeked={handleSeek}
              onEnded={() => {
                socket.emit("video-ended", { roomId });
                const currentIndex = songs.findIndex(
                  (s) => s.id === currentSong.id
                );
                if (currentIndex !== -1 && currentIndex + 1 < songs.length) {
                  setCurrentSong(songs[currentIndex + 1]);
                } else {
                  setCurrentSong("");
                }
              }}
            />
            <MediaControlBar>
              <MediaMuteButton />
              <MediaFullscreenButton />
            </MediaControlBar>
          </MediaController>
        </div>
        <div className="w-full md:w-2/6 px-4 space-y-4 shadow-inner py-4">
          <Navbar />
          <SearchSongs roomId={roomId} />

          <ActionIconGroup className="justify-center">
            {playing ? (
              <Tooltip label="Pause">
                <ActionIcon
                  onClick={() => handlePause()}
                  className="!bg-gradient-to-r !from-violet-600 !to-indigo-600"
                  size="input-xl"
                  disabled={role !== "host"}
                >
                  <Pause />
                </ActionIcon>
              </Tooltip>
            ) : (
              <Tooltip label="Play">
                <ActionIcon
                  onClick={() => handlePlay()}
                  className="!bg-gradient-to-r !from-violet-600 !to-indigo-600"
                  size="input-xl"
                  disabled={
                    songs.length === 0 || !currentSong || role !== "host"
                  }
                >
                  <Play />
                </ActionIcon>
              </Tooltip>
            )}

            <Tooltip label="Next Song">
              <ActionIcon
                onClick={() => handleNextSong(roomId)}
                size="input-xl"
                className="!bg-gradient-to-r !from-violet-600 !to-indigo-600"
                disabled={songs.length === 0 || !currentSong || role !== "host"}
              >
                <CircleArrowRight />
              </ActionIcon>
            </Tooltip>
          </ActionIconGroup>

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
