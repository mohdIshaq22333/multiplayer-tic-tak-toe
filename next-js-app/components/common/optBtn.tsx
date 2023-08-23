"use client";
import React from "react";

interface props {
  onClick?: Function;
  text: string;
}

function OptBtn({ onClick, text }: props) {
  return (
    <div
      className="cursor-pointer border border-blue-500 text-blue-500 px-4 py-2 rounded-md shadow-md hover:bg-blue-100 focus:outline-none focus:ring focus:ring-blue-300 mb-4"
      onClick={() => {
        onClick?.();
      }}
    >
      {text}
    </div>
  );
}

export default OptBtn;
