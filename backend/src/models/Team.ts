import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  city?: string;
  players: string[]; // List of player IDs
  createdAt: Date;
}

const TeamSchema: Schema = new Schema({
  name: { type: String, required: true },
  city: { type: String },
  players: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ITeam>('Team', TeamSchema);
