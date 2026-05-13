import Championship from '../models/Championship';

export class ChampionshipService {
  async getAll(userId: string) {
    return Championship.find({ userId }).sort({ startDate: -1 });
  }

  async getById(id: string) {
    return Championship.findById(id);
  }

  async create(data: any, userId: string) {
    return Championship.create({
      ...data,
      userId
    });
  }

  async update(id: string, data: any) {
    return Championship.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string) {
    return Championship.findByIdAndDelete(id);
  }

  async generateTable(id: string) {
    const c = await Championship.findById(id);
    return { championship: c, games: [] };
  }

  async getStandings(id: string) {
    return [];
  }

  async getScorers(id: string) {
    return [];
  }

  async getCards(id: string) {
    return [];
  }

  async addTeam(id: string, nome: string) {
    return { success: true };
  }

  async recordResult(id: string, gameId: string, data: any) {
    return { success: true };
  }
}
