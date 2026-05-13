import Event from '../models/Event';

export class EventService {
  async getAll(peladaId: string) {
    return Event.find({ peladaId }).sort({ timestamp: 1 });
  }

  async getByPelada(peladaId: string) {
    return this.getAll(peladaId);
  }

  async create(data: any) {
    return Event.create(data);
  }

  async delete(id: string) {
    return Event.findByIdAndDelete(id);
  }
}
