import mongoose from "mongoose";
import { Games } from "./gamestype";
const GameSchema = new mongoose.Schema<Games>({
  gameId: { type: Number, required: true },
  gameName: { type: String, required: true },
  gameThumbnailUrl: { type: String, required: true },
  gameHostLink: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  status: {
    type: Boolean,
    require: true,
    default: true,
  },
});


const Game = mongoose.model<Games>("casinoGames", GameSchema);

export default Game;
