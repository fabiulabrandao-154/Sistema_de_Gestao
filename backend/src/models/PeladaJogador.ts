import mongoose, { Schema, Document } from 'mongoose';

export interface IPeladaJogador extends Document {
  peladaId: string;
  playerId: string;
  checkinOrder: number;
  presenceConfirmed: boolean;
  paymentConfirmed: boolean;
}

const PeladaJogadorSchema: Schema = new Schema({
  peladaId: { type: Schema.Types.ObjectId, ref: 'Pelada', required: true },
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  checkinOrder: { type: Number, required: true },
  presenceConfirmed: { type: Boolean, default: false },
  paymentConfirmed: { type: Boolean, default: false },
});

export default mongoose.model<IPeladaJogador>('PeladaJogador', PeladaJogadorSchema);
