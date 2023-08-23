"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const gameSchema = new mongoose_1.default.Schema({
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
}, {
    timestamps: true,
});
const Game = mongoose_1.default.models.Game || mongoose_1.default.model("Game", gameSchema);
exports.default = Game;
