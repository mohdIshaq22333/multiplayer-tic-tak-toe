import React from "react";

interface props {
  handleClick: Function;
  title: string;
}

function customBtn({ handleClick, title }: props) {
  return (
    <button
      className="mt-6 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      onClick={() => handleClick()}
    >
      {title}
    </button>
  );
}

export default customBtn;
