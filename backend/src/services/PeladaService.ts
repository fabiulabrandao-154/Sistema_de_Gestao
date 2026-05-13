import Event from '../models/Event';
import Pelada from '../models/Pelada';
import PeladaJogador from '../models/PeladaJogador';
import Player from '../models/Player';
import PlayerStats from '../models/PlayerStats';
import TimePelada from '../models/TimePelada';

export class PeladaService {
  async getAll(userId: string) {
    const peladas = await Pelada.find({ userId }).sort({ date: -1 });

    const results = [];
    for (const p of peladas) {
      const pId = (p._id as any).toString();
      const inscritos = await PeladaJogador.find({ peladaId: pId }).populate('playerId');
      results.push({
        ...p.toObject(),
        id: p._id,
        titulo: p.title,
        data_hora: p.date.toISOString(),
        local: p.location,
        jogadores_por_time: p.playersPerTeam,
        inscritos: inscritos.map(pj => ({
          ...pj.toObject(),
          id: pj._id
        }))
      });
    }
    return results;
  }

  async getById(id: string) {
    const pelada = await Pelada.findById(id);
    if (!pelada) return null;

    const inscritos = await PeladaJogador.find({ peladaId: id }).populate('playerId').sort({ checkinOrder: 1 });
    const times = await TimePelada.find({ peladaId: id }).sort({ order: 1 });

    // Map to frontend snake_case format
    return {
      ...pelada.toObject(),
      id: pelada._id,
      titulo: pelada.title,
      data_hora: pelada.date.toISOString(),
      local: pelada.location,
      jogadores_por_time: pelada.playersPerTeam,
      valor_total: pelada.valorTotal,
      config_pagamento_visivel: pelada.configPagamentoVisivel,
      times_jogando: pelada.timesJogando || [],
      placar_casa: pelada.placarCasa,
      placar_visitante: pelada.placarVisitante,
      cronometro_segundos: pelada.cronometroSegundos,
      cronometro_ativo: pelada.cronometroAtivo,
      inscritos: inscritos.map(pj => {
        const p = pj.playerId as any;
        return {
          id: pj._id,
          jogador: p ? p._id : null,
          jogador_nome: p ? p.name : 'Unknown',
          jogador_nivel: p ? p.stars : 0,
          ordem_chegada: pj.checkinOrder,
          presenca_confirmada: pj.presenceConfirmed,
          pagamento_confirmado: pj.paymentConfirmed
        };
      }),
      times: times.map(t => ({
        id: t._id,
        nome_time: t.name,
        cor: t.color,
        order: t.order,
        soma_estrelas: t.somaEstrelas,
        jogadores: t.jogadores.map(tj => ({
          id: tj.playerId,
          jogador: tj.playerId,
          jogador_nome: tj.playerName,
          jogador_nivel: tj.playerStars
        }))
      }))
    };
  }
// ... [keeping existing methods] ...
  async removeFromTeam(peladaId: string, playerId: string) {
    const time = await TimePelada.findOne({ peladaId, 'jogadores.playerId': playerId });
    if (time) {
      await TimePelada.findByIdAndUpdate(time._id, {
        $pull: { jogadores: { playerId } }
      });
      
      const updatedTime = await TimePelada.findById(time._id);
      if (updatedTime) {
        const soma = updatedTime.jogadores.reduce((sum, j) => sum + (j.playerStars || 0), 0);
        await TimePelada.findByIdAndUpdate(time._id, { somaEstrelas: soma });
      }
    }
    return this.getById(peladaId);
  }

  async create(data: { title: string; date: string; location?: string; playersPerTeam?: number }, userId: string) {
    return Pelada.create({
      title: data.title,
      date: new Date(data.date),
      location: data.location,
      playersPerTeam: data.playersPerTeam || 5,
      userId
    });
  }

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.titulo) updateData.title = data.titulo;
    if (data.data_hora) updateData.date = new Date(data.data_hora);
    if (data.local) updateData.location = data.local;
    if (data.valor_total !== undefined) updateData.valorTotal = data.valor_total;
    if (data.config_pagamento_visivel !== undefined) updateData.configPagamentoVisivel = data.config_pagamento_visivel;
    
    return Pelada.findByIdAndUpdate(id, updateData, { new: true });
  }

  async addPlayer(peladaId: string, playerId: string) {
    const pelada = await Pelada.findById(peladaId);
    if (!pelada) throw new Error('Pelada não encontrada');

    const player = await Player.findById(playerId);
    if (!player) throw new Error('Jogador não encontrado');

    const existing = await PeladaJogador.findOne({ peladaId, playerId });
    if (existing) throw new Error('Jogador já está na lista desta pelada');

    const lastPlayer = await PeladaJogador.findOne({ peladaId }).sort({ checkinOrder: -1 });
    const order = (lastPlayer?.checkinOrder || 0) + 1;

    return PeladaJogador.create({
      peladaId,
      playerId,
      checkinOrder: order,
      presenceConfirmed: true
    });
  }

  async removePlayer(peladaJogadorId: string) {
    return PeladaJogador.findByIdAndDelete(peladaJogadorId);
  }

  async updatePlayer(peladaJogadorId: string, data: any) {
    const updateData: any = {};
    if (data.presenca_confirmada !== undefined) updateData.presenceConfirmed = data.presenca_confirmada;
    if (data.pagamento_confirmado !== undefined) updateData.paymentConfirmed = data.pagamento_confirmado;
    
    return PeladaJogador.findByIdAndUpdate(peladaJogadorId, updateData, { new: true });
  }

  async reorderPlayers(peladaId: string, playerIds: string[]) {
    for (let i = 0; i < playerIds.length; i++) {
      await PeladaJogador.updateOne(
        { peladaId, playerId: playerIds[i] },
        { checkinOrder: i + 1 }
      );
    }
    return this.getById(peladaId);
  }

  async sortTeams(peladaId: string, type: 'aleatorio' | 'balanceado') {
    const pelada = await Pelada.findById(peladaId);
    if (!pelada) throw new Error('Pelada not found');

    let playersPerTeam = pelada.playersPerTeam || 5;
    if (playersPerTeam < 1) playersPerTeam = 5;

    let confirmedPresences = await PeladaJogador.find({ peladaId, presenceConfirmed: true }).populate('playerId');

    if (confirmedPresences.length === 0) {
      confirmedPresences = await PeladaJogador.find({ peladaId }).populate('playerId');
    }

    if (confirmedPresences.length < 2) {
      throw new Error('Necessário pelo menos 2 jogadores na pelada para o sorteio.');
    }

    const players = confirmedPresences.map(pj => pj.playerId as any);
    let sortedGroups: any[][] = [];

    if (type === 'aleatorio') {
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length; i += playersPerTeam) {
        sortedGroups.push(shuffled.slice(i, i + playersPerTeam));
      }
    } else {
      const sortedByStars = [...players].sort((a, b) => b.stars - a.stars);
      const numTeams = Math.ceil(players.length / playersPerTeam);
      const teams: { stars: number, players: any[] }[] = Array.from({ length: numTeams }, () => ({ stars: 0, players: [] }));

      sortedByStars.forEach(player => {
        const availableTeams = teams.filter(t => t.players.length < playersPerTeam);
        if (availableTeams.length > 0) {
          availableTeams.sort((a, b) => a.stars - b.stars);
          const targetTeam = availableTeams[0];
          targetTeam.players.push(player);
          targetTeam.stars += player.stars;
        }
      });
      
      sortedGroups = teams.filter(t => t.players.length > 0).map(t => t.players);
    }

    await TimePelada.deleteMany({ peladaId });
    
    for (let i = 0; i < sortedGroups.length; i++) {
      const somaEstrelas = sortedGroups[i].reduce((sum, p) => sum + p.stars, 0);
      await TimePelada.create({
        name: `Time ${String.fromCharCode(65 + i)}`,
        order: i + 1,
        somaEstrelas,
        peladaId,
        jogadores: sortedGroups[i].map(p => ({
          playerId: p._id,
          playerName: p.name,
          playerStars: p.stars
        }))
      });
    }

    return this.getById(peladaId);
  }

  async getTeams(peladaId: string) {
    const times = await TimePelada.find({ peladaId }).sort({ order: 1 });
    return times.map(t => ({
      id: t._id,
      nome_time: t.name,
      cor: t.color,
      order: t.order,
      soma_estrelas: t.somaEstrelas,
      jogadores: t.jogadores.map(tj => ({
        id: tj.playerId,
        jogador: tj.playerId,
        jogador_nome: tj.playerName,
        jogador_nivel: tj.playerStars
      }))
    }));
  }

  async adjustTeams(peladaId: string, times: any[]) {
    await TimePelada.deleteMany({ peladaId });
    
    for (const t of times) {
      const somaEstrelas = t.jogadores.reduce((sum: number, p: any) => sum + (p.jogador_nivel || p.stars || 0), 0);
      await TimePelada.create({
        name: t.nome_time || t.name,
        order: t.order,
        somaEstrelas,
        peladaId,
        jogadores: t.jogadores.map((p: any) => ({
          playerId: p.jogador || p.id,
          playerName: p.jogador_nome || p.name,
          playerStars: p.jogador_nivel || p.stars
        }))
      });
    }
    return this.getById(peladaId);
  }

  async confirmTeams(peladaId: string) {
    return Pelada.findByIdAndUpdate(peladaId, { status: 'em_andamento' }, { new: true });
  }

  async updateMatchState(peladaId: string, data: any) {
    const updateData: any = {};
    if (data.placar_casa !== undefined) updateData.placarCasa = data.placar_casa;
    if (data.placar_visitante !== undefined) updateData.placarVisitante = data.placar_visitante;
    if (data.cronometro_segundos !== undefined) updateData.cronometroSegundos = data.cronometro_segundos;
    if (data.cronometro_ativo !== undefined) updateData.cronometroAtivo = data.cronometro_ativo;
    if (data.times_jogando !== undefined) updateData.timesJogando = data.times_jogando;

    return Pelada.findByIdAndUpdate(peladaId, updateData, { new: true });
  }

  async rotateTeams(peladaId: string, timeId?: string) {
    const peladaFull = await Pelada.findById(peladaId);
    if (!peladaFull) return null;

    const times = await TimePelada.find({ peladaId }).sort({ order: 1 });
    if (times.length < 2) return this.getById(peladaId);

    const homeTeam = times[0];
    const awayTeam = times[1];
    const scoreCasa = peladaFull.placarCasa;
    const scoreVisitante = peladaFull.placarVisitante;

    const recordResult = async (playerId: string, result: 'win' | 'draw' | 'loss') => {
      await PlayerStats.findOneAndUpdate(
        { playerId },
        {
          $inc: {
            wins: result === 'win' ? 1 : 0,
            draws: result === 'draw' ? 1 : 0,
            losses: result === 'loss' ? 1 : 0,
            matchesPlayed: 1
          }
        },
        { upsert: true, new: true }
      );
    };

    if (scoreCasa > scoreVisitante) {
      for (const j of homeTeam.jogadores) await recordResult(j.playerId, 'win');
      for (const j of awayTeam.jogadores) await recordResult(j.playerId, 'loss');
    } else if (scoreVisitante > scoreCasa) {
      for (const j of homeTeam.jogadores) await recordResult(j.playerId, 'loss');
      for (const j of awayTeam.jogadores) await recordResult(j.playerId, 'win');
    } else if (scoreCasa === scoreVisitante) {
      for (const j of homeTeam.jogadores) await recordResult(j.playerId, 'draw');
      for (const j of awayTeam.jogadores) await recordResult(j.playerId, 'draw');
    }

    let teamToMove = times[0];
    if (timeId) {
      const found = times.find(t => t._id.toString() === timeId);
      if (found) teamToMove = found;
    }

    const otherTimes = times.filter(t => t._id.toString() !== teamToMove._id.toString());

    for (let i = 0; i < otherTimes.length; i++) {
      await TimePelada.findByIdAndUpdate(otherTimes[i]._id, { order: i + 1 });
    }

    await TimePelada.findByIdAndUpdate(teamToMove._id, { order: times.length });

    await Pelada.findByIdAndUpdate(peladaId, { 
      placarCasa: 0, 
      placarVisitante: 0,
      cronometroSegundos: 0,
      cronometroAtivo: false
    });

    return this.getById(peladaId);
  }

  async substitutePlayer(peladaId: string, saiId: string, entraId: string) {
    const timeWithSai = await TimePelada.findOne({ 
      peladaId, 
      'jogadores.playerId': saiId 
    });

    if (!timeWithSai) throw new Error('Player to leave not found in any team');

    const entraPlayer = await Player.findById(entraId);
    if (!entraPlayer) throw new Error('Player to enter not found');

    // Remove saiId from team
    await TimePelada.findByIdAndUpdate(timeWithSai._id, {
      $pull: { jogadores: { playerId: saiId } }
    });

    // Add entraId to the same team
    await TimePelada.findByIdAndUpdate(timeWithSai._id, {
      $push: { 
        jogadores: { 
          playerId: entraId, 
          playerName: entraPlayer.name, 
          playerStars: entraPlayer.stars 
        } 
      }
    });

    // Handle swap if entraId was in another team
    const timeWithEntra = await TimePelada.findOne({
      peladaId,
      'jogadores.playerId': entraId,
      _id: { $ne: timeWithSai._id }
    });

    if (timeWithEntra) {
      await TimePelada.findByIdAndUpdate(timeWithEntra._id, {
        $pull: { jogadores: { playerId: entraId } }
      });
      
      const saiPlayer = await Player.findById(saiId);
      if (saiPlayer) {
        await TimePelada.findByIdAndUpdate(timeWithEntra._id, {
          $push: {
            jogadores: {
              playerId: saiId,
              playerName: saiPlayer.name,
              playerStars: saiPlayer.stars
            }
          }
        });
      }
    }

    return this.getById(peladaId);
  }

  async finalizePelada(peladaId: string) {
    const pelada = await Pelada.findById(peladaId);
    if (!pelada) throw new Error('Pelada not found');
    if (pelada.status === 'finalizada') return { message: 'Already finalized' };

    const events = await Event.find({ peladaId });
    const inscritos = await PeladaJogador.find({ peladaId });

    for (const pj of inscritos) {
      const playerEvents = events.filter(e => e.playerId === pj.playerId.toString());
      const assists = events.filter(e => e.assistPlayerId === pj.playerId.toString());

      const goalsCount = playerEvents.filter(e => e.type === 'gol').length;
      const assistCount = assists.length;
      const yellowCount = playerEvents.filter(e => e.type === 'cartao_amarelo').length;
      const redCount = playerEvents.filter(e => e.type === 'cartao_vermelho').length;

      if (goalsCount > 0 || assistCount > 0 || yellowCount > 0 || redCount > 0) {
        await PlayerStats.findOneAndUpdate(
          { playerId: pj.playerId },
          {
            $inc: {
              goals: goalsCount,
              assists: assistCount,
              yellowCards: yellowCount,
              redCards: redCount
            }
          },
          { upsert: true }
        );
      }
    }

    await Pelada.findByIdAndUpdate(peladaId, { status: 'finalizada' });
    return { message: 'Pelada finalized and stats updated' };
  }

  async delete(id: string) {
    await Event.deleteMany({ peladaId: id });
    await PeladaJogador.deleteMany({ peladaId: id });
    await TimePelada.deleteMany({ peladaId: id });
    return Pelada.findByIdAndDelete(id);
  }

  async togglePayment(peladaId: string, peladaJogadorId: string) {
    const pj = await PeladaJogador.findById(peladaJogadorId);
    if (!pj) throw new Error('Inscrição não encontrada');
    return PeladaJogador.findByIdAndUpdate(peladaJogadorId, { paymentConfirmed: !pj.paymentConfirmed }, { new: true });
  }

  async getRateio(peladaId: string) {
    const pelada = await Pelada.findById(peladaId);
    if (!pelada) throw new Error('Pelada não encontrada');

    const numPagantes = await PeladaJogador.countDocuments({ peladaId, presenceConfirmed: true });
    const total = pelada.valorTotal || 0;
    const valorPorPessoa = numPagantes > 0 ? total / numPagantes : 0;

    return {
      total,
      num_pagantes: numPagantes,
      valor_por_pessoa: valorPorPessoa
    };
  }
}
