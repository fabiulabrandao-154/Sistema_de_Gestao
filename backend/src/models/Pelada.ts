import mongoose, { Schema, Document } from 'mongoose';

export interface IPelada extends Document {
  title: string;
  date: Date;
  location?: string;
  playersPerTeam: number;
  valorTotal: number;
  configPagamentoVisivel: boolean;
  status: 'agendada' | 'em_andamento' | 'finalizada';
  placarCasa: number;
  placarVisitante: number;
  cronometroSegundos: number;
  cronometroAtivo: boolean;
  timesJogando: string[];
  userId: string;
  createdAt: Date;
}

const PeladaSchema: Schema = new Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String },
  playersPerTeam: { type: Number, default: 5 },
  valorTotal: { type: Number, default: 0 },
  configPagamentoVisivel: { type: Boolean, default: true },
  status: { type: String, enum: ['agendada', 'em_andamento', 'finalizada'], default: 'agendada' },
  placarCasa: { type: Number, default: 0 },
  placarVisitante: { type: Number, default: 0 },
  cronometroSegundos: { type: Number, default: 0 },
  cronometroAtivo: { type: Boolean, default: false },
  timesJogando: [{ type: String }],
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPelada>('Pelada', PeladaSchema);
