"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import OptBtn from "@/components/common/optBtn";

const GameBoard = dynamic(() => import("@/components/gameBoard2"), {
  loading: () => <p>Loading...</p>,
});

function LocalGame() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Link className="absolute top-10 left-10" href={"/"}>
        <OptBtn text={"Back"} />
      </Link>
      <GameBoard />
    </main>
  );
}

export default LocalGame;
