"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import MainHeading from "@/components/common/mainHeading";
import CustomBtn from "@/components/common/customBtn";
import OptBtn from "@/components/common/optBtn";
import {
  resetGame,
  addGame,
  enterRoom,
  updateGame,
} from "@/lib/actions/game.actions";

const enterRoomText = "Enter Room Id";
const selectedText = "Selected";
const selectGameText = "Select Game";
const GameBoard = dynamic(() => import("@/components/gameBoard"), {
  loading: () => <p>Loading...</p>,
});
type Status = "Game is on" | "X won the game" | "O won the game" | "Draw";
interface GameData {
  id?: string;
  userName?: string;
  error?: string;
  resetRaised?: "X" | "O";
  activePlayer?: "X" | "O";
  X?: string;
  O?: string;
  gameMap?: string[];
  gameStatus?: Status;
  winningSet?: number[];
}
interface DataError {
  error: string;
}
function LocalGame() {
  const [selectedGame, setSelectedGame] = useState(selectGameText);
  const [id, setId] = useState<string>("");
  const [isCopy, setIsCopied] = useState<boolean>(false);
  const [gameData, setGameData] = useState<GameData | undefined>(undefined);

  const getRoomData = async () => {
    const tempGameData: GameData | DataError | undefined = await enterRoom({
      id: id,
    });
    if (tempGameData && !tempGameData?.error) {
      setGameData(tempGameData);
      setSelectedGame(selectedText);
    }
  };
  const makeNewGame = async () => {
    const tempGameData: { error?: string } | undefined = await addGame();
    if (tempGameData && !tempGameData?.error) {
      setGameData(tempGameData);
      setSelectedGame(selectedText);
    }
  };
  const handleUpdate = async ({ num }: { num: number }) => {
    const tempGameData = await updateGame({ num: num, id: gameData?.id || "" });
    if (tempGameData && !tempGameData?.error) {
      setGameData(tempGameData);
    } else {
      setGameData({ ...gameData });
    }
  };
  const handleReset = async () => {
    const tempGameData = await resetGame({ id: gameData?.id || "" });
    if (tempGameData && !tempGameData?.error) {
      setGameData(tempGameData);
    } else {
      setGameData({ ...gameData });
    }
  };
  const gameTypes = [
    {
      title: "New Game",
      handleClick: () => makeNewGame(),
    },
    {
      title: "Enter a room",
      handleClick: () => setSelectedGame(enterRoomText),
    },
  ];
  const handleCopyClick = () => {
    const textField = document.createElement("textarea");
    textField.innerText = gameData?.id || "";
    document.body.appendChild(textField);
    textField.select();
    document.execCommand("copy");
    textField.remove();
    setIsCopied(true);
  };
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      {selectedGame === selectGameText && (
        <Link className="absolute top-10 left-10" href={"/"}>
          <OptBtn text={"Back"} />
        </Link>
      )}
      {(selectedGame === selectedText || selectedGame === enterRoomText) && (
        <div className="absolute top-10 left-[5%] max-w-[90%] flex justify-between w-[100%] text-blue-500 font-bold h-auto m-auto">
          <OptBtn
            onClick={() => {
              setSelectedGame(selectGameText);
              setIsCopied(false);
            }}
            text={"Back"}
          />

          {selectedGame === selectedText && (
            <OptBtn
              onClick={handleCopyClick}
              text={!isCopy ? "Copy RoomId" : "Copied"}
            />
          )}
        </div>
      )}

      <div>
        {selectedGame === selectGameText && (
          <>
            <MainHeading text={selectedGame} />
            {gameTypes.map((val, index) => (
              <OptBtn key={index} text={val?.title} onClick={val.handleClick} />
            ))}
          </>
        )}
        {selectedGame === enterRoomText && (
          <div>
            <input
              onChange={(e) => setId(e.target.value)}
              value={id}
              type="text"
              className="border border-blue-500 px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300 w-full"
            />
            <div className="flex justify-center">
              <CustomBtn title="Submt" handleClick={getRoomData} />
            </div>
          </div>
        )}
      </div>
      {selectedGame === selectedText && (
        <GameBoard
          multiplayer
          updateGame={handleUpdate}
          gameData={gameData || {}}
          resetHandler={handleReset}
          getRoomData={getRoomData}
        />
      )}
    </main>
  );
}

export default LocalGame;

// zod
//remove 1 week old game
//rate limit
//room id  and know when someone entered
