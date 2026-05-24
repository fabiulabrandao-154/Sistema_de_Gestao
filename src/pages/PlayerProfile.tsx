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

  const totalJogos = stats.total_jogos || 0;
  
  // Tactical ratings (0 to 1)
  const tecnicRating = Math.min(player.nivel_estrelas / 5, 1);
  const attackRating = totalJogos > 0 ? Math.min((stats.total_gols / totalJogos) / 1.5, 1) : 0;
  const playmakeRating = totalJogos > 0 ? Math.min((stats.total_assistencias / totalJogos) / 1.0, 1) : 0;
  const decisionRating = totalJogos > 0 ? (stats.total_vitorias / totalJogos) : 0;
  const experienceRating = Math.min(totalJogos / 20, 1);

  const ratings = [
    { label: "Técnica", value: tecnicRating },       // Axis 0
    { label: "Pontaria", value: attackRating },       // Axis 1
    { label: "Coletividade", value: playmakeRating }, // Axis 2
    { label: "Decisão", value: decisionRating },     // Axis 3
    { label: "Resistência", value: experienceRating } // Axis 4
  ];

  // Radar points calculation
  const cx = 100;
  const cy = 100;
  const r = 70;
  
  const getCoordinates = (index: number, scale: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 5;
    const x = cx + r * scale * Math.cos(angle);
    const y = cy + r * scale * Math.sin(angle);
    return { x, y };
  };

  // Outer web grids
  const webs = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getArchetype = () => {
    if (totalJogos === 0) return { title: "Recruta", desc: "Ainda não estreou nas peladas oficiais. Adicione-o a uma pelada para começar!" };
    if (attackRating >= 0.7 && attackRating >= playmakeRating) return { title: "Artilheiro Clínico", desc: "Um verdadeiro perigo na área. Finaliza com precisão e foca no gol." };
    if (playmakeRating >= 0.7 && playmakeRating >= attackRating) return { title: "Arquiteto do Jogo", desc: "Visão de jogo extraordinária. Prefere um passe açucarado a brilhar sozinho nas estatísticas." };
    if (decisionRating >= 0.7) return { title: "Amuleto da Vitória", desc: "Espírito decisivo e vencedor. Onde joga, as chances de vitória do time disparam." };
    if (experienceRating >= 0.8) return { title: "Lenda das Quadras", desc: "Experiente, consistente e indispensável em qualquer escalação." };
    return { title: "Jogador Equilibrado", desc: "Polivalente e tático. Atua bem em todas as fases do jogo com alto espírito de equipe." };
  };
  const archetype = getArchetype();

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
          className="bg-app-card rounded-[2.5rem] p-8 border border-app-border shadow-lg flex flex-col md:flex-row items-center gap-6"
        >
          <div className="relative w-44 h-44 flex items-center justify-center mx-auto md:mx-0">
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
              {/* webs */}
              {webs.map((w, index) => {
                const points = Array.from({ length: 5 }, (_, i) => getCoordinates(i, w));
                const pointsStr = points.map(p => `${p.x},${p.y}`).join(" ");
                return (
                  <polygon
                    key={index}
                    points={pointsStr}
                    fill="none"
                    stroke="currentColor"
                    className="text-app-border"
                    strokeWidth="1"
                    strokeDasharray={index === 4 ? "0" : "2"}
                  />
                );
              })}
              {/* axis lines */}
              {Array.from({ length: 5 }).map((_, i) => {
                const { x, y } = getCoordinates(i, 1);
                return (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={x}
                    y2={y}
                    stroke="currentColor"
                    className="text-app-border/40"
                    strokeWidth="1"
                  />
                );
              })}
              {/* value area polygon */}
              {(() => {
                const points = ratings.map((r, i) => getCoordinates(i, r.value));
                const pointsStr = points.map(p => `${p.x},${p.y}`).join(" ");
                return (
                  <polygon
                    points={pointsStr}
                    fill="rgba(34, 197, 94, 0.2)"
                    stroke="#22c55e"
                    strokeWidth="2"
                  />
                );
              })()}
              {/* axis labels */}
              {ratings.map((r, i) => {
                const { x, y } = getCoordinates(i, 1.22);
                let textAnchor: "end" | "middle" | "start" = "middle";
                if (x < cx - 10) textAnchor = "end";
                if (x > cx + 10) textAnchor = "start";
                return (
                  <text
                    key={i}
                    x={x}
                    y={y + 4}
                    textAnchor={textAnchor}
                    className="text-[10px] font-black uppercase fill-current text-app-text-muted select-none"
                  >
                    {r.label}
                  </text>
                );
              })}
            </svg>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full text-[10px] font-black text-green-500 uppercase tracking-widest mb-3">
              <Shield className="w-3.5 h-3.5" /> Archetipo: {archetype.title}
            </div>
            <h3 className="text-xl font-black text-app-text uppercase tracking-tighter mb-2">Características</h3>
            <p className="text-app-text-muted text-xs leading-relaxed max-w-sm">
              {archetype.desc}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Recent Matches */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-app-card rounded-[2.5rem] p-8 border border-app-border shadow-lg mt-8"
      >
        <h2 className="text-xl font-black text-app-text uppercase tracking-tighter mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-green-500" /> Presenças e Partidas Recentes
        </h2>
        <div className="space-y-4">
          {player.peladaJogadores && player.peladaJogadores.length > 0 ? (
            [...player.peladaJogadores]
              .sort((a: any, b: any) => new Date(b.pelada.date).getTime() - new Date(a.pelada.date).getTime())
              .slice(0, 5)
              .map((pj: any) => (
                <div key={pj.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-app-border rounded-2xl gap-4 hover:border-green-500/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center font-black">
                      ⚽
                    </div>
                    <div>
                      <h4 className="font-bold text-app-text text-sm uppercase tracking-tight">{pj.pelada.title}</h4>
                      <p className="text-[10px] text-app-text-muted font-bold uppercase tracking-wider">{new Date(pj.pelada.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Presença */}
                    {pj.presenceConfirmed ? (
                      <span className="px-2.5 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-lg">Confirmado</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-zinc-200 dark:bg-zinc-800 text-app-text-muted text-[10px] font-black uppercase tracking-widest rounded-lg">Falta</span>
                    )}

                    {/* Pagamento */}
                    {pj.paymentConfirmed ? (
                      <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-lg">Pago</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-zinc-200 dark:bg-zinc-800 text-app-text-muted text-[10px] font-black uppercase tracking-widest rounded-lg">Pendente</span>
                    )}

                    {/* Placar se finalizado */}
                    {(pj.pelada.status === 'finalizada' || pj.pelada.status === 'encerrada') && (
                      <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-xl text-xs font-mono font-black text-app-text">
                        {pj.pelada.placarCasa} - {pj.pelada.placarVisitante}
                      </div>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-8 text-app-text-muted text-xs uppercase font-black tracking-widest">
              Nenhuma participação registrada nesta plataforma ainda.
            </div>
          )}
        </div>
      </motion.div>
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
