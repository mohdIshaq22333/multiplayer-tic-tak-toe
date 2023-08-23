"use client";
import { useState, useEffect } from "react";
import { socket } from "@/lib/socket";
import CustomBtn from "./common/customBtn";
import MainHeading from "./common/mainHeading";
const winningPatterns = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 4, 8],
  [2, 4, 6],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
];
type Status = "Game is on" | "X won the game" | "O won the game" | "Draw";
type GameData = {
  userName?: string;
  id?: string;
  activePlayer?: "X" | "O";
  gameMap?: string[];
  gameStatus?: Status;
  winningSet?: number[];
  resetRaised?: "X" | "O";
};
interface props {
  multiplayer?: boolean;
  updateGame?: Function;
  gameData?: GameData | null;
  resetHandler?: Function;
  getRoomData?: Function;
}
export default function GameBoard({
  multiplayer = false,
  updateGame,
  gameData = null,
  resetHandler,
  getRoomData,
}: props) {
  const [blocks, setBlocks] = useState<string[]>(
    Array.from({ length: 9 }, () => "")
  );
  const [activePlayer, setActivePlayer] = useState<"X" | "O">("X");
  const [gameStatus, setGameStatus] = useState<Status>("Game is on");
  const [winningSet, setWinningSet] = useState<number[]>([]);
  const [resetRaised, setResetRaised] = useState<{
    name?: string;
    resolved?: boolean;
  } | null>(null);

  interface HandleMove {
    num: number;
    secondPlayer?: object | boolean;
  }
  const handleMove = ({ num, secondPlayer = false }: HandleMove): void => {
    if (blocks[num] || gameStatus !== "Game is on") return;
    const userName = (gameData as GameData)?.userName ?? "";
    if (multiplayer && userName !== activePlayer && !secondPlayer) return;
    if (multiplayer && updateGame && !secondPlayer) {
      updateGame({ num: num });
      socket.emit("move", { num: num });
    }
    let tempBlocks = [...blocks];
    tempBlocks[num] = activePlayer;
    setBlocks(tempBlocks);
    let tie = true;
    for (let i = 0; i < winningPatterns.length; i++) {
      if (
        tempBlocks[winningPatterns[i][0]] === activePlayer &&
        tempBlocks[winningPatterns[i][1]] === activePlayer &&
        tempBlocks[winningPatterns[i][2]] === activePlayer
      ) {
        setGameStatus(`${activePlayer} won the game`);
        setWinningSet(winningPatterns[i]);
        return;
      }
      if (
        (!tie && !tempBlocks[winningPatterns[i][0]]) ||
        !tempBlocks[winningPatterns[i][1]] ||
        !tempBlocks[winningPatterns[i][2]]
      ) {
        tie = false;
      }
    }
    if (tie) {
      setGameStatus("Draw");
      return;
    }
    setActivePlayer(activePlayer === "O" ? "X" : "O");
  };
  const handleReset = (props: { hardReset?: boolean }) => {
    console.log("iafsdn--+=");
    if (
      multiplayer &&
      gameData?.userName === gameData?.resetRaised &&
      (!resetRaised?.name || resetRaised?.name === gameData?.userName) &&
      !props?.hardReset
    )
      return;
    if (resetHandler && !props?.hardReset) {
      console.log("iafsdn--");

      resetHandler();
      if (gameData?.resetRaised || resetRaised?.name) {
        socket.emit("reset", { resolved: true });
      } else {
        socket.emit("reset", { name: gameData?.userName });
      }
      // setResetRaised(null);
      return;
    }
    // if (props?.hardReset && getRoomData) {
    //   getRoomData();
    //   return;
    // }
    console.log("iafsdn");
    setBlocks((prev) => prev.map(() => ""));
    setGameStatus("Game is on");
    setActivePlayer("X");
    setWinningSet([]);
  };
  useEffect(() => {
    if (gameData?.gameMap) {
      socket.emit("client-ready");
      socket.emit("join-room", gameData?.id);
      socket.on("move", (values: { num: number }) => {
        handleMove({ num: values?.num, secondPlayer: true });
      });
      socket.on("reset", (values: { name: string; resolved: boolean }) => {
        console.log("name", values?.name);
        setResetRaised({
          name: values?.name,
          resolved: values?.resolved,
        });
        if (values?.resolved) {
          handleReset({ hardReset: true });
        }
      });
    }

    return () => {
      socket.off("move");
      socket.off("reset");
    };
  }, [gameData, blocks]);
  useEffect(() => {
    if (gameData?.gameMap) {
      setActivePlayer(gameData?.activePlayer || "X");
      setGameStatus(gameData?.gameStatus || "Game is on");
      setWinningSet(gameData?.winningSet || []);
      setResetRaised({ name: gameData?.resetRaised } || null);
      setBlocks(gameData?.gameMap || Array.from({ length: 9 }, () => ""));
    }
  }, [gameData]);

  return (
    <>
      <MainHeading text={gameStatus} />
      <div className=" max-w-[90%] w-[500px] aspect-square bg-white rounded-sm flex flex-wrap">
        {blocks.map((val, index) => (
          <div
            className={`${
              winningSet.includes(index)
                ? "bg-emerald-700 text-white"
                : "bg-white-500 text-black"
            } w-1/3 aspect-square border border-black-600 flex justify-center items-center text-lg font-semibold cursor-pointer`}
            onClick={() => handleMove({ num: index })}
            key={index}
          >
            {val}
          </div>
        ))}
      </div>
      {resetRaised?.name && !resetRaised?.resolved && (
        <p className="font-semibold mt-6 text-center text-sm">
          {resetRaised?.name && gameData?.userName !== resetRaised?.name
            ? `${resetRaised?.name} wants to reset`
            : "Waiting for opponent to reset"}
        </p>
      )}
      <CustomBtn title="Reset" handleClick={handleReset} />
    </>
  );
}
