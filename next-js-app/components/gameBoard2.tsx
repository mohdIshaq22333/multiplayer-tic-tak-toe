"use client";
import { useState, useEffect } from "react";
import axios from "axios";
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

export default function GameBoard() {
  const [blocks, setBlocks] = useState<Block[]>(
    Array.from({ length: 9 }, () => "")
  );
  const [activePlayer, setActivePlayer] = useState<"X" | "O">("X");
  const [gameStatus, setGameStatus] = useState<Status>("Game is on");
  const [winningSet, setWinningSet] = useState<number[]>([]);
  const [correction, setCorrection] = useState<boolean>(true);
  const [user1, setUser1] = useState<any[]>([]);
  const [user2, setUser2] = useState<any[]>([]);

  interface HandleMove {
    num: number;
    secondPlayer?: object | boolean;
  }
  const handleMove = ({ num, secondPlayer = false }: HandleMove): void => {
    if (blocks[num] || gameStatus !== "Game is on") return;
    let tempBlocks = [...blocks];
    makingData({ blocks: tempBlocks, num });
    if (correction) {
      handleWinningSet({
        customSet: [
          {
            input: {
              ...arryToObj2(tempBlocks),
            },
            output: { move: (num + 1) / 10 },
          },
        ],
      });
      setCorrection(false);
    }
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
        // handleWinningSet();
        return;
      }
      if (
        tie &&
        (!tempBlocks[winningPatterns[i][0]] ||
          !tempBlocks[winningPatterns[i][1]] ||
          !tempBlocks[winningPatterns[i][2]])
      ) {
        tie = false;
      }
    }
    if (tie) {
      setGameStatus("Draw");
      return;
    }
    // if (activePlayer === "X") {
    //   handleComputerMove({ currentBlocks: tempBlocks });
    // }
    setActivePlayer(activePlayer === "O" ? "X" : "O");
  };
  const handleReset = (props: { hardReset?: boolean }) => {
    setBlocks((prev) => prev.map(() => ""));
    setGameStatus("Game is on");
    setActivePlayer("X");
    setWinningSet([]);
  };

  console.log("Correction", correction);
  type Block = "" | "X" | "O";
  const arryToObj2 = (arr: Block[]) => {
    let obj: any = {};
    arr.forEach((val: Block, index: number) => {
      if (val) {
        obj["block" + index] = val === activePlayer ? 1 : 0;
      } else {
        obj["block" + index] = (index + 1) / 10;
      }
    });
    return obj;
  };
  const makingData = async ({ blocks, num }: any) => {
    // if (activePlayer === "O") return;
    let temp = [...(activePlayer === "X" ? user1 : user2)];
    temp.push({
      input: {
        ...arryToObj2(blocks),
      },
      output: { move: (num + 1) / 10 },
    });
    if (activePlayer === "X") {
      setUser1(temp);
    } else setUser2(temp);
  };
  const reviewComputerMove = async (approve: boolean) => {
    if (approve) {
    } else {
    }
  };
  const moveChecker = (num: number) => {
    let winningOpt = false;
    let couldPreventUserMove = false;
    let preventedMove = false;
    const withMoveBlocks: string[] = [...blocks];
    const opponent = activePlayer === "X" ? "O" : "X";
    withMoveBlocks[num] = activePlayer;
    for (let i = 0; i < winningPatterns.length; i++) {
      if (
        withMoveBlocks[winningPatterns[i][0]] === activePlayer &&
        withMoveBlocks[winningPatterns[i][1]] === activePlayer &&
        withMoveBlocks[winningPatterns[i][2]] === activePlayer
      ) {
        return false;
      }
      let winningProbablity = 0;
      let opponentWinningProbablity = 0;
      for (let y = 0; y < winningPatterns[i].length; y++) {
        if (
          winningProbablity !== -1 &&
          blocks[winningPatterns[i][y]] === activePlayer
        ) {
          winningProbablity++;
        } else if (blocks[winningPatterns[i][y]] === opponent) {
          winningProbablity = -1;
        }
        if (
          opponentWinningProbablity !== -1 &&
          blocks[winningPatterns[i][y]] === opponent
        ) {
          opponentWinningProbablity++;
        } else if (blocks[winningPatterns[i][y]] === activePlayer) {
          opponentWinningProbablity = -1;
        }
      }
      if (winningProbablity === 2) {
        winningOpt = true;
      }
      if (opponentWinningProbablity === 2) {
        couldPreventUserMove = true;
        if (winningPatterns[i].includes(num)) {
          preventedMove = true;
        }
      }
    }
    return winningOpt || (couldPreventUserMove && !preventedMove);
  };
  console.log("userNum1111", user1);
  console.log("userNum222", user2);
  const handleWinningSet = ({
    customSet = false,
  }: {
    customSet?: boolean | object[];
  }) => {
    console.log("customSet", customSet);
    axios.post("http://localhost:3001/winnerset", {
      data: customSet || (activePlayer === "X" ? user1 : user2),
    });
  };
  useEffect(() => {
    console.log("anfe", gameStatus?.includes("won") && winningSet[0]);
    console.log("anfe", gameStatus?.includes("won"));
    if (gameStatus?.includes("won") && user1[0]) {
      handleWinningSet({});
      setUser1([]);
      setUser2([]);
    }
  }, [user1, user2, gameStatus]);
  const handleComputerMove = async ({
    currentBlocks,
  }: {
    currentBlocks: Block[];
  }) => {
    const response = await axios
      .post(`http://localhost:3001/computer-move`, {
        board: { ...arryToObj2(currentBlocks) },
      })
      .catch((err) => console.log("errrrrr", err));
    const wrongMove: boolean = moveChecker(response?.data?.move - 1);
    if (
      wrongMove ||
      (response?.data?.move &&
        (blocks?.[response?.data?.move - 1] ||
          response?.data?.move === 0 ||
          response?.data?.move === 10))
    ) {
      setCorrection(true);
      console.log("Correction+++", correction);
    } else if (response?.data?.move) {
      handleMove({ num: response?.data?.move - 1 });
    }
  };
  useEffect(() => {
    // if (activePlayer === "O") {
    handleComputerMove({ currentBlocks: blocks });
    // }
  }, [activePlayer]);

  //   useEffect(() => {
  //     if (gameData?.gameMap) {
  //       socket.emit("client-ready");
  //       socket.emit("join-room", gameData?.id);
  //       socket.on("move", (values: { num: number }) => {
  //         handleMove({ num: values?.num, secondPlayer: true });
  //       });
  //       socket.on("reset", (values: { name: string; resolved: boolean }) => {
  //         console.log("name", values?.name);
  //         setResetRaised({
  //           name: values?.name,
  //           resolved: values?.resolved,
  //         });
  //         if (values?.resolved) {
  //           handleReset({ hardReset: true });
  //         }
  //       });
  //     }

  //     return () => {
  //       socket.off("move");
  //       socket.off("reset");
  //     };
  //   }, [gameData, blocks]);

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
      <CustomBtn title="Reset" handleClick={handleReset} />
    </>
  );
}
