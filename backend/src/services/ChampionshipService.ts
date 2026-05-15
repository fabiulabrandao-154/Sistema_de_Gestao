import prisma from '../lib/prisma';

export class ChampionshipService {
  async getAll(userId: string) {
    return prisma.championship.findMany({ 
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { times: true, jogos: true }
        }
      }
    });
  }

  async getById(id: string) {
    return prisma.championship.findUnique({ 
      where: { id },
      include: {
        times: {
          include: {
            jogadores: {
              include: { player: true }
            }
          }
        },
        jogos: {
          include: {
            homeTeam: true,
            awayTeam: true
          },
          orderBy: [{ round: 'asc' }, { date: 'asc' }]
        }
      }
    });
  }

  async create(data: any, userId: string) {
    return prisma.championship.create({
      data: {
        name: data.name || data.titulo,
        description: data.description || data.descricao,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        format: data.format || "pontos_corridos",
        isHomeAndAway: data.isHomeAndAway || false,
        status: "rascunho",
        userId
      }
    });
  }

  async update(id: string, data: any) {
    return prisma.championship.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        format: data.format,
        isHomeAndAway: data.isHomeAndAway,
        status: data.status
      }
    });
  }

  async delete(id: string) {
    await prisma.jogoCampeonato.deleteMany({ where: { championshipId: id } });
    const times = await prisma.timeCampeonato.findMany({ where: { championshipId: id } });
    for (const t of times) {
      await prisma.jogadorTime.deleteMany({ where: { timeId: t.id } });
    }
    await prisma.timeCampeonato.deleteMany({ where: { championshipId: id } });
    return prisma.championship.delete({ where: { id } });
  }

  async addTeam(championshipId: string, data: any) {
    return prisma.timeCampeonato.create({
      data: {
        name: data.name,
        color: data.color,
        logoUrl: data.logoUrl,
        championshipId
      }
    });
  }

  async removeTeam(teamId: string) {
    await prisma.jogadorTime.deleteMany({ where: { timeId: teamId } });
    return prisma.timeCampeonato.delete({ where: { id: teamId } });
  }

  async addPlayerToTeam(teamId: string, playerId: string) {
    const existing = await prisma.jogadorTime.findFirst({
      where: { timeId: teamId, playerId }
    });
    if (existing) return existing;

    return prisma.jogadorTime.create({
      data: { timeId: teamId, playerId }
    });
  }

  async removePlayerFromTeam(jogadorTimeId: string) {
    return prisma.jogadorTime.delete({ where: { id: jogadorTimeId } });
  }

  async generateTable(id: string) {
    const championship = await prisma.championship.findUnique({
      where: { id },
      include: { times: true }
    });

    if (!championship) throw new Error('Championship not found');
    if (championship.times.length < 2) throw new Error('At least 2 teams required to generate table');

    await prisma.jogoCampeonato.deleteMany({ where: { championshipId: id } });

    const teams = [...championship.times];
    if (teams.length % 2 !== 0) {
      teams.push({ id: 'BYE' } as any);
    }

    const numTeams = teams.length;
    const numRounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;

    const roundRobinGames: { home: any, away: any, round: number }[] = [];

    for (let round = 0; round < numRounds; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        const home = teams[match];
        const away = teams[numTeams - 1 - match];

        if (home.id !== 'BYE' && away.id !== 'BYE') {
          if (round % 2 === 0) {
            roundRobinGames.push({ home, away, round: round + 1 });
          } else {
            roundRobinGames.push({ home: away, away: home, round: round + 1 });
          }
        }
      }
      teams.splice(1, 0, teams.pop()!);
    }

    if (championship.isHomeAndAway) {
      const returnGames: any[] = [];
      roundRobinGames.forEach(g => {
        returnGames.push({
          home: g.away,
          away: g.home,
          round: g.round + numRounds
        });
      });
      roundRobinGames.push(...returnGames);
    }

    for (const g of roundRobinGames) {
      await prisma.jogoCampeonato.create({
        data: {
          championshipId: id,
          homeTeamId: g.home.id,
          awayTeamId: g.away.id,
          round: g.round,
          status: 'agendado'
        }
      });
    }

    return this.getById(id);
  }

  async updateMatch(id: string, data: any) {
    if (data.events && Array.isArray(data.events)) {
      await prisma.eventoCampeonato.deleteMany({ where: { jogoId: id } });
      for (const e of data.events) {
        await prisma.eventoCampeonato.create({
          data: {
            jogoId: id,
            type: e.type,
            playerId: e.playerId,
            teamId: e.teamId,
            minute: e.minute || 0
          }
        });
      }
    }

    return prisma.jogoCampeonato.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        location: data.location,
        homeScore: data.homeScore !== undefined ? Number(data.homeScore) : undefined,
        awayScore: data.awayScore !== undefined ? Number(data.awayScore) : undefined,
        status: data.status
      }
    });
  }

  async getStandings(id: string) {
    const championship = await prisma.championship.findUnique({
      where: { id },
      include: { 
        times: true,
        jogos: { where: { status: 'finalizado' } }
      }
    });

    if (!championship) return [];

    const standings = championship.times.map(team => ({
      id: team.id,
      nome: team.name,
      pts: 0,
      pj: 0,
      v: 0,
      e: 0,
      d: 0,
      gp: 0,
      gc: 0,
      sg: 0
    }));

    championship.jogos.forEach(game => {
      const home = standings.find(s => s.id === game.homeTeamId);
      const away = standings.find(s => s.id === game.awayTeamId);

      if (home && away) {
        home.pj++;
        away.pj++;
        home.gp += game.homeScore;
        home.gc += game.awayScore;
        away.gp += game.awayScore;
        away.gc += game.homeScore;

        if (game.homeScore > game.awayScore) {
          home.pts += 3;
          home.v++;
          away.d++;
        } else if (game.homeScore < game.awayScore) {
          away.pts += 3;
          away.v++;
          home.d++;
        } else {
          home.pts += 1;
          away.pts += 1;
          home.e++;
          away.e++;
        }
      }
    });

    standings.forEach(s => {
      s.sg = s.gp - s.gc;
    });

    return standings.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.v !== a.v) return b.v - a.v;
      if (b.sg !== a.sg) return b.sg - a.sg;
      return b.gp - a.gp;
    });
  }

  async getScorers(id: string) {
    const events = await prisma.eventoCampeonato.findMany({
      where: {
        jogo: { championshipId: id },
        type: 'gol'
      },
      include: {
        player: true,
        team: true
      }
    });

    const scorers: any = {};
    events.forEach(e => {
      if (!scorers[e.playerId]) {
        scorers[e.playerId] = {
          id: e.playerId,
          nome: e.player.name,
          time: e.team.name,
          gols: 0
        };
      }
      scorers[e.playerId].gols++;
    });

    return Object.values(scorers).sort((a: any, b: any) => b.gols - a.gols);
  }

  async getCards(id: string) {
    const events = await prisma.eventoCampeonato.findMany({
      where: {
        jogo: { championshipId: id },
        type: { in: ['cartao_amarelo', 'cartao_vermelho'] }
      },
      include: {
        player: true,
        team: true
      }
    });

    const cardStats: any = {};
    events.forEach(e => {
      if (!cardStats[e.playerId]) {
        cardStats[e.playerId] = {
          id: e.playerId,
          nome: e.player.name,
          time: e.team.name,
          amarelos: 0,
          vermelhos: 0,
          suspenso: false
        };
      }
      if (e.type === 'cartao_amarelo') cardStats[e.playerId].amarelos++;
      if (e.type === 'cartao_vermelho') cardStats[e.playerId].vermelhos++;
      
      // Suspension logic: 2 yellows or 1 red in total for this championship (simplified)
      if (cardStats[e.playerId].amarelos >= 2 || cardStats[e.playerId].vermelhos >= 1) {
        cardStats[e.playerId].suspenso = true;
      }
    });

    return Object.values(cardStats);
  }
}
