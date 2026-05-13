import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  peladaId: string;
  gameId?: string;
  timeId?: string;
  type: 'gol' | 'assistencia' | 'cartao_amarelo' | 'cartao_vermelho';
  playerId: string;
  jogadorNome?: string;
  assistPlayerId?: string;
  minuto?: number;
  timestamp: Date;
}

const EventSchema: Schema = new Schema({
  peladaId: { type: String, required: true },
  gameId: { type: String },
  timeId: { type: String },
  type: { type: String, enum: ['gol', 'assistencia', 'cartao_amarelo', 'cartao_vermelho'], required: true },
  playerId: { type: String, required: true },
  jogadorNome: { type: String },
  assistPlayerId: { type: String },
  minuto: { type: Number },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<IEvent>('Event', EventSchema);
