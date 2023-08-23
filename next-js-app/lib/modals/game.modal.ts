import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    gameMap: {
      type: Array,
      required: true,
    },
    gameStatus: {
      type: String,
      required: true,
    },
    winningSet: {
      type: Array,
      required: true,
    },
    activePlayer: {
      type: String,
      required: true,
    },
    resetRaised: {
      type: String,
    },
    O: {
      type: String,
    },
    X: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Game = mongoose.models.Game || mongoose.model("Game", gameSchema);

export default Game;
