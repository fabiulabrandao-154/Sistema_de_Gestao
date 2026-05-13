import mongoose, { Schema, Document } from 'mongoose';

export interface ITimePelada extends Document {
  name: string;
  order: number;
  color?: string;
  somaEstrelas: number;
  peladaId: string;
  jogadores: {
    playerId: string;
    playerName: string;
    playerStars: number;
  }[];
}

const TimePeladaSchema: Schema = new Schema({
  name: { type: String, required: true },
  order: { type: Number, required: true },
  color: { type: String },
  somaEstrelas: { type: Number, default: 0 },
  peladaId: { type: Schema.Types.ObjectId, ref: 'Pelada', required: true },
  jogadores: [{
    playerId: { type: String },
    playerName: { type: String },
    playerStars: { type: Number }
  }]
});

export default mongoose.model<ITimePelada>('TimePelada', TimePeladaSchema);
