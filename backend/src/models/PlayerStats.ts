import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerStats extends Document {
  playerId: string;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
}

const PlayerStatsSchema: Schema = new Schema({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, unique: true },
  wins: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  goals: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards: { type: Number, default: 0 },
  matchesPlayed: { type: Number, default: 0 },
});

export default mongoose.model<IPlayerStats>('PlayerStats', PlayerStatsSchema);
