import prisma from '../lib/prisma';

export class ChampionshipService {
  async getAll(userId: string) {
    const champs = await prisma.championship.findMany({
      where: { userId },
      include: {
        teams: true,
        _count: {
          select: { games: true, teams: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return champs.map(c => ({
      ...c,
      nome: c.name,
      formato: c.format,
      data_inicio: c.createdAt.toISOString() // Placeholder or use real field if added
    }));
  }

  async getById(id: string) {
    const champ = await prisma.championship.findUnique({
      where: { id },
      include: {
        teams: true,
        games: {
          include: {
            homeTeam: true,
            awayTeam: true
          },
          orderBy: [
            { round: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!champ) return null;

    return {
      ...champ,
      nome: champ.name,
      formato: champ.format,
      data_inicio: champ.createdAt.toISOString(),
      times: champ.teams.map(t => ({ id: t.id, nome: t.name })),
      jogos: champ.games.map(g => ({
        id: g.id,
        time_casa: g.homeTeamId,
        time_visitante: g.awayTeamId,
        time_casa_nome: g.homeTeam.name,
        time_visitante_nome: g.awayTeam.name,
        gols_casa: g.homeScore,
        gols_visitante: g.awayScore,
        data_hora: g.createdAt.toISOString(),
        status: g.status === 'finalizado' ? 'realizado' : 'agendado'
      }))
    };
  }

  async create(data: { name: string; format?: string }, userId: string) {
    return prisma.championship.create({
      data: {
        name: data.name,
        format: data.format || 'liga',
        userId
      }
    });
  }

  async generateTable(championshipId: string) {
    const teams = await prisma.championshipTeam.findMany({
      where: { championshipId }
    });

    if (teams.length < 2) throw new Error('Need at least 2 teams');

    const numTeams = teams.length;
    const isOdd = numTeams % 2 !== 0;
    const teamList = [...teams];
    if (isOdd) teamList.push({ id: 'BYE', name: 'Folga' } as any);

    const tournamentNumTeams = teamList.length;
    const rounds = tournamentNumTeams - 1;
    const half = tournamentNumTeams / 2;

    const gamesData = [];

    for (let round = 1; round <= rounds; round++) {
      for (let i = 0; i < half; i++) {
        const home = teamList[i];
        const away = teamList[tournamentNumTeams - 1 - i];

        if (home.id !== 'BYE' && away.id !== 'BYE') {
          gamesData.push({
            championshipId,
            homeTeamId: home.id,
            awayTeamId: away.id,
            round,
            status: 'agendado'
          });
        }
      }
      // Rotate list
      teamList.splice(1, 0, teamList.pop()!);
    }

    await prisma.championshipGame.deleteMany({ where: { championshipId } });
    await prisma.championshipGame.createMany({ data: gamesData });

    return { message: `${gamesData.length} games generated for ${rounds} rounds` };
  }

  async getStandings(championshipId: string) {
    const teams = await prisma.championshipTeam.findMany({
      where: { championshipId },
      include: {
        gamesHome: { where: { status: 'finalizado' } },
        gamesAway: { where: { status: 'finalizado' } }
      }
    });

    const standings = teams.map(team => {
      let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0, points = 0;

      const processGame = (isHome: boolean, game: any) => {
        played++;
        const teamScore = isHome ? game.homeScore : game.awayScore;
        const opponentScore = isHome ? game.awayScore : game.homeScore;
        gf += teamScore;
        ga += opponentScore;

        if (teamScore > opponentScore) {
          won++;
          points += 3;
        } else if (teamScore === opponentScore) {
          drawn++;
          points += 1;
        } else {
          lost++;
        }
      };

      team.gamesHome.forEach(g => processGame(true, g));
      team.gamesAway.forEach(g => processGame(false, g));

      return {
        id: team.id,
        nome: team.name, // Use 'nome'
        pj: played,      // Partidas Jogadas
        v: won,         // Vitórias
        e: drawn,       // Empates
        d: lost,        // Derrotas
        gp: gf,         // Gols Pró
        gc: ga,         // Gols Contra
        sg: gf - ga,    // Saldo de Gols
        pts: points     // Pontos
      };
    });

    return standings.sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp);
  }

  async getScorers(championshipId: string) {
    // This probably needs to aggregate goals from games or events
    // For now returning mock based on players if any, or empty
    return [];
  }

  async getCards(championshipId: string) {
    return [];
  }

  async addTeam(championshipId: string, name: string) {
    return prisma.championshipTeam.create({
      data: {
        name,
        championshipId
      }
    });
  }

  async recordResult(championshipId: string, gameId: string, data: any) {
    const { gols_casa, gols_visitante, eventos } = data;
    // Update game score and status
    return prisma.championshipGame.update({
      where: { id: gameId },
      data: {
        homeScore: gols_casa,
        awayScore: gols_visitante,
        status: 'finalizado'
      }
    });
  }
}
