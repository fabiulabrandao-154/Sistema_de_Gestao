import mongoose, { Schema, Document } from 'mongoose';

export interface IChampionship extends Document {
  name: string;
  startDate: Date;
  endDate?: Date;
  format: string;
  status: 'planejado' | 'em_andamento' | 'finalizado';
  userId: string;
  createdAt: Date;
}

const ChampionshipSchema: Schema = new Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  format: { type: String, default: 'pontos_corridos' },
  status: { type: String, enum: ['planejado', 'em_andamento', 'finalizada'], default: 'planejado' },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IChampionship>('Championship', ChampionshipSchema);
