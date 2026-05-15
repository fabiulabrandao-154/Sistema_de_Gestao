import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { 
  ChevronLeft, 
  Loader2, 
  Trophy, 
  Target, 
  Handshake, 
  Percent,
  Star,
  Award,
  Zap,
  TrendingUp
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import DataService, { Player, PlayerStats } from "../services/dataService";

const PlayerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayer();
  }, [id]);

  const fetchPlayer = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Try fetching from server first
      const response = await api.get(`/jogadores/${id}`);
      if (response.data) {
        setPlayer({
          id: response.data.id,
          nome: response.data.nome,
          nivel_estrelas: response.data.nivel_estrelas,
          ativo: response.data.ativo,
          data_cadastro: response.data.data_cadastro
        });
        
        const s = response.data.estatisticas;
        setStats({
          id: id,
          playerId: id,
          goals: s.total_gols,
          assists: s.total_assistencias,
          wins: s.total_vitorias,
          draws: s.total_empates,
          losses: s.total_derrotas,
          matchesPlayed: s.total_jogos,
          yellowCards: 0, // Server might not return these yet or they are in a different format
          redCards: 0
        });
        return;
      }
    } catch (error) {
      console.warn("Server profile fetch failed, trying local data...", error);
    }

    // Fallback to local data
    try {
      const p = DataService.getPlayerById(id);
      const s = DataService.getPlayerStats(id);
      if (p) {
        setPlayer(p);
        setStats(s);
      } else {
        toast.error("Jogador não encontrado.");
      }
    } catch (error) {
      toast.error("Erro ao carregar perfil do jogador.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-64 space-y-4">
      <Loader2 className="animate-spin text-green-500 h-8 w-8" />
      <p className="text-app-text-muted italic">Carregando perfil...</p>
    </div>
  );

  if (!player) return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="text-app-text-muted text-lg italic">Jogador não encontrado.</div>
      <button 
        onClick={() => navigate("/players")}
        className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition"
      >
        Voltar para Jogadores
      </button>
    </div>
  );

  const displayStats = stats || {
    matchesPlayed: 0,
    goals: 0,
    assists: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    yellowCards: 0,
    redCards: 0
  };

  const winRate = displayStats.matchesPlayed > 0 ? ((displayStats.wins / displayStats.matchesPlayed) * 100).toFixed(0) : 0;
  const mediaGols = displayStats.matchesPlayed > 0 ? (displayStats.goals / displayStats.matchesPlayed).toFixed(2) : "0.00";

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-app-text-muted hover:text-green-500 transition font-bold"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
      </button>

      {/* Header Profile */}
      <div className="bg-app-card rounded-3xl p-8 shadow-sm border border-app-border flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
           <Trophy className="w-32 h-32 text-app-text" />
        </div>
        
        <div className="w-32 h-32 bg-app-bg rounded-full flex items-center justify-center text-blue-400 text-4xl font-black border-4 border-app-card shadow-2xl">
          {player.nome.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-black text-app-text mb-1 uppercase tracking-tight">{player.nome}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
            <span className="flex items-center bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-yellow-500/20">
              <Star className="w-4 h-4 mr-1 fill-current" />
              Nível {player.nivel_estrelas.toFixed(1)}
            </span>
            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-blue-500/20">
              {displayStats.matchesPlayed} Jogos
            </span>
          </div>
        </div>

        <div className="bg-green-500/10 p-6 rounded-2xl text-center min-w-[140px] border border-green-500/20 shadow-inner">
          <div className="text-3xl font-black text-green-500">{winRate}%</div>
          <div className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1">Vitórias</div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Gols", value: displayStats.goals, icon: Target, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Assis.", value: displayStats.assists, icon: Handshake, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Média", value: mediaGols, icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10" },
          { label: "Cartões", value: displayStats.yellowCards + displayStats.redCards, icon: Award, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((item, idx) => (
          <div key={idx} className="bg-app-card p-6 rounded-2xl border border-app-border text-center group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <div className={cn("w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-3 shadow-inner", item.bg, item.color)}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-app-text group-hover:scale-110 transition-transform">{item.value}</div>
            <div className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Wins/Losses */}
      <div className="bg-app-card rounded-3xl p-8 border border-app-border shadow-sm relative overflow-hidden">
        <h2 className="text-xl font-bold text-app-text mb-6 flex items-center uppercase tracking-tight">
          <Zap className="w-5 h-5 mr-2 text-blue-400 fill-current" />
          Retrospecto
        </h2>
        
        <div className="flex gap-1 h-3 w-full bg-app-bg rounded-full overflow-hidden mb-8 shadow-inner border border-app-border">
          <div style={{ width: `${(displayStats.wins / Math.max(1, displayStats.matchesPlayed)) * 100}%` }} className="bg-green-500 shadow-lg shadow-green-500/50"></div>
          <div style={{ width: `${(displayStats.draws / Math.max(1, displayStats.matchesPlayed)) * 100}%` }} className="bg-app-border"></div>
          <div style={{ width: `${(displayStats.losses / Math.max(1, displayStats.matchesPlayed)) * 100}%` }} className="bg-red-500 shadow-lg shadow-red-500/50"></div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-2xl font-black text-green-500">{displayStats.wins}</div>
            <div className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mt-1">Vitórias</div>
          </div>
          <div className="text-center border-x border-app-border">
            <div className="text-2xl font-black text-app-text">{displayStats.draws}</div>
            <div className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mt-1">Empates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-red-500">{displayStats.losses}</div>
            <div className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mt-1">Derrotas</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
