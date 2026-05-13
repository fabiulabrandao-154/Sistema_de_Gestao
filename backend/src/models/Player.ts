import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  stars: number;
  active: boolean;
  userId: string;
  createdAt: Date;
}

const PlayerSchema: Schema = new Schema({
  name: { type: String, required: true },
  stars: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPlayer>('Player', PlayerSchema);
