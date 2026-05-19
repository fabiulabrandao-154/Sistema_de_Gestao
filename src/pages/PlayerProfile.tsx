import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Trophy, 
  Target, 
  Users, 
  Calendar,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Award
} from "lucide-react";
import api from "../services/api";
import DataService from "../services/dataService";
import { toast } from "react-hot-toast";
import { motion } from "motion/react";

const PlayerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayerData();
  }, [id]);

  const fetchPlayerData = async () => {
    try {
      // 1. Try API first
      try {
        const response = await api.get(`/players/${id}`);
        setPlayer(response.data);
        setLoading(false);
        return;
      } catch (apiError) {
        console.warn("API player fetch failed, trying local data", apiError);
      }

      // 2. Local Fallback
      if (id) {
        const localPlayer = DataService.getPlayers().find(p => p.id === id);
        if (localPlayer) {
          const s = DataService.getPlayerStats(id);
          const totalJogos = s.matchesPlayed || 0;
          const totalGols = s.goals || 0;
          
          setPlayer({
            ...localPlayer,
            estatisticas: {
              total_jogos: totalJogos,
              total_gols: totalGols,
              total_assistencias: s.assists || 0,
              total_vitorias: s.wins || 0,
              total_empates: s.draws || 0,
              total_derrotas: s.losses || 0,
              media_gols: totalJogos > 0 ? totalGols / totalJogos : 0
            },
            data_cadastro: (localPlayer as any).createdAt || new Date().toISOString()
          });
        } else {
           toast.error("Jogador não encontrado.");
           navigate("/players");
        }
      }
    } catch (error) {
      console.error("Error fetching player profile", error);
      toast.error("Erro ao carregar perfil do jogador.");
      navigate("/players");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!player) return null;

  const stats = player.estatisticas;
  const winRate = stats.total_jogos > 0 ? ((stats.total_vitorias / stats.total_jogos) * 100).toFixed(1) : "0";

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="bg-app-card p-2 rounded-xl text-app-text-muted flex items-center hover:text-green-500 transition font-bold border border-app-border shadow-sm group"
        >
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> Voltar
        </button>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black uppercase tracking-widest text-app-text-muted">Perfil do Atleta</span>
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      </div>

      {/* Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-app-card rounded-[2.5rem] p-8 border border-app-border shadow-xl mb-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Trophy className="w-40 h-40" />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white text-4xl font-black shadow-2xl">
              {player.nome.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white p-2 rounded-xl shadow-lg border-2 border-app-card">
              <Star className="w-5 h-5 fill-current" />
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-black text-app-text uppercase tracking-tighter mb-2">{player.nome}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className="flex items-center px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-black text-app-text-muted uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 mr-1.5 text-yellow-500 fill-current" /> {player.nivel_estrelas.toFixed(1)} Nível
              </div>
              <div className="flex items-center px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-black text-app-text-muted uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Desde {new Date(player.data_cadastro).toLocaleDateString()}
              </div>
              {player.ativo ? (
                <div className="flex items-center px-4 py-1.5 bg-green-500/10 rounded-full text-[10px] font-black text-green-500 uppercase tracking-widest">
                  Ativo
                </div>
              ) : (
                <div className="flex items-center px-4 py-1.5 bg-red-500/10 rounded-full text-[10px] font-black text-red-500 uppercase tracking-widest">
                  Inativo
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block bg-zinc-100 dark:bg-zinc-800/50 p-6 rounded-3xl border border-app-border">
             <div className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1">Win Rate</div>
             <div className="text-3xl font-black text-green-500 tracking-tighter">{winRate}%</div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={TrendingUp} label="Jogos" value={stats.total_jogos} color="blue" delay={0.1} />
        <StatCard icon={Target} label="Gols" value={stats.total_gols} color="green" delay={0.2} />
        <StatCard icon={Zap} label="Assist." value={stats.total_assistencias} color="orange" delay={0.3} />
        <StatCard icon={Award} label="Média Gols" value={stats.media_gols.toFixed(2)} color="purple" delay={0.4} />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-app-card rounded-[2.5rem] p-8 border border-app-border shadow-lg"
        >
          <h2 className="text-xl font-black text-app-text uppercase tracking-tighter mb-6 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" /> Histórico de Partidas
          </h2>
          
          <div className="space-y-6">
             <ResultBar label="Vitórias" count={stats.total_vitorias} total={stats.total_jogos} color="bg-green-500" />
             <ResultBar label="Empates" count={stats.total_empates} total={stats.total_jogos} color="bg-blue-500" />
             <ResultBar label="Derrotas" count={stats.total_derrotas} total={stats.total_jogos} color="bg-red-500" />
          </div>

          <div className="mt-8 pt-8 border-t border-app-border flex justify-between items-center">
             <div className="text-center">
                <div className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1">Aproveitamento</div>
                <div className="text-2xl font-black text-app-text tracking-tighter">{winRate}%</div>
             </div>
             <div className="h-10 w-px bg-app-border"></div>
             <div className="text-center">
                <div className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1">Participações</div>
                <div className="text-2xl font-black text-app-text tracking-tighter">{stats.total_gols + stats.total_assistencias}</div>
             </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-app-card rounded-[2.5rem] p-8 border border-app-border shadow-lg flex flex-col justify-center items-center text-center group"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <Shield className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-black text-app-text uppercase tracking-tighter mb-2">Pilar do Time</h3>
          <p className="text-app-text-muted text-sm max-w-[240px]">
            Este jogador participou de {stats.total_jogos} partidas oficiais, mantendo uma média de {stats.media_gols.toFixed(2)} gols por jogo.
          </p>
          <div className="mt-8 flex gap-2">
             <div className="w-3 h-3 rounded-full bg-green-500"></div>
             <div className="w-3 h-3 rounded-full bg-green-500/30"></div>
             <div className="w-3 h-3 rounded-full bg-green-500/30"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, delay }: any) => {
  const colors: any = {
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-green-500/10 text-green-500",
    orange: "bg-orange-500/10 text-orange-500",
    purple: "bg-purple-500/10 text-purple-500",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-app-card p-6 rounded-[2rem] border border-app-border shadow-md hover:shadow-xl transition-all"
    >
      <div className={`w-10 h-10 rounded-2xl ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.1em] mb-1">{label}</div>
      <div className="text-2xl font-black text-app-text tracking-tighter">{value}</div>
    </motion.div>
  );
};

const ResultBar = ({ label, count, total, color }: any) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="space-y-1.5">
       <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">{label}</span>
          <span className="text-sm font-black text-app-text">{count} ({percentage.toFixed(0)}%)</span>
       </div>
       <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${percentage}%` }}
             transition={{ duration: 1, ease: "easeOut" }}
             className={`h-full ${color} rounded-full`}
          />
       </div>
    </div>
  );
};

export default PlayerProfile;
