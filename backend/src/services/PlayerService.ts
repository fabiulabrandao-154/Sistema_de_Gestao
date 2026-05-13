import Player from '../models/Player';
import PlayerStats from '../models/PlayerStats';
import PeladaJogador from '../models/PeladaJogador';

export class PlayerService {
  async getAll(userId: string) {
    const players = await Player.find({ userId }).sort({ name: 1 });
    return players.map(p => ({
      id: p._id,
      nome: p.name,
      nivel_estrelas: p.stars,
      ativo: p.active,
      data_cadastro: p.createdAt.toISOString()
    }));
  }

  async getById(id: string) {
    const p = await Player.findById(id);
    if (!p) return null;
    
    const peladaJogadores = await PeladaJogador.find({ playerId: id }).populate('peladaId');
    const stats = await PlayerStats.findOne({ playerId: id });

    return {
      id: p._id,
      nome: p.name,
      nivel_estrelas: p.stars,
      ativo: p.active,
      data_cadastro: p.createdAt.toISOString(),
      estatisticas: stats ? {
        total_jogos: stats.matchesPlayed,
        total_gols: stats.goals,
        total_assistencias: stats.assists,
        total_vitorias: stats.wins,
        total_empates: stats.draws,
        total_derrotas: stats.losses,
        media_gols: stats.matchesPlayed > 0 ? stats.goals / stats.matchesPlayed : 0
      } : {
        total_jogos: 0,
        total_gols: 0,
        total_assistencias: 0,
        total_vitorias: 0,
        total_empates: 0,
        total_derrotas: 0,
        media_gols: 0
      },
      peladaJogadores: peladaJogadores
    };
  }

  async create(data: any, userId: string) {
    return Player.create({
      name: data.nome || data.name,
      stars: Number(data.nivel_estrelas || data.stars || 0),
      active: data.ativo !== undefined ? data.ativo : true,
      userId
    });
  }

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.nome) updateData.name = data.nome;
    if (data.nivel_estrelas !== undefined) updateData.stars = Number(data.nivel_estrelas);
    if (data.ativo !== undefined) updateData.active = data.ativo;

    return Player.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string) {
    return Player.findByIdAndUpdate(id, { active: false }, { new: true });
  }
}
