import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Trophy, 
  Users, 
  Calendar, 
  Settings, 
  Plus, 
  Loader2,
  Table as TableIcon,
  Play,
  ClipboardCheck,
  Award,
  X
} from "lucide-react";
import api from "../services/api";
import { toast } from "react-hot-toast";
import DataService from "../services/dataService";
import { getLocalData } from "../lib/localData";
import { cn } from "../lib/utils";

interface Team {
  id: string;
  nome: string;
}

interface Game {
  id: string;
  time_casa: string;
  time_visitante: string;
  time_casa_nome: string;
  time_visitante_nome: string;
  gols_casa: number;
  gols_visitante: number;
  data_hora: string;
  status: string;
}

interface Championship {
  id: string;
  nome: string;
  formato: string;
  data_inicio: string;
  times: Team[];
  jogos: Game[];
}

const ChampionshipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [champ, setChamp] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tabela' | 'jogos' | 'times' | 'artilharia' | 'cartoes'>('tabela');
  const [standings, setStandings] = useState<any[]>([]);
  const [scorers, setScorers] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    fetchChamp();
    if (activeTab === 'tabela') fetchStandings();
    else if (activeTab === 'artilharia') fetchScorers();
    else if (activeTab === 'cartoes') fetchCards();
  }, [id, activeTab]);

  const fetchCards = async () => {
    try {
      const resp = await api.get(`/championships/${id}/cartoes`);
      setCards(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      setCards([]);
    }
  };
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [gameEvents, setGameEvents] = useState<any[]>([]);

  const fetchStandings = async () => {
    try {
      const resp = await api.get(`/championships/${id}/classificacao`);
      setStandings(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      setStandings([]);
    }
  };

  const fetchScorers = async () => {
    try {
      const resp = await api.get(`/championships/${id}/artilharia`);
      setScorers(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      setScorers([]);
    }
  };

  const fetchChamp = async () => {
    try {
      const response = await api.get(`/championships/${id}`);
      const data = response.data;
      if (data) {
        if (!data.times) data.times = [];
        if (!data.jogos) data.jogos = [];
      }
      setChamp(data);
    } catch (error) {
      console.warn("Fetch failed, searching local championship");
      const locals = getLocalData("championships");
      const found = locals.find((c: any) => c.id === id);
      if (found) {
        if (!found.times) found.times = [];
        if (!found.jogos) found.jogos = [];
        setChamp(found);
      } else {
        toast.error("Erro ao carregar campeonato.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTable = async () => {
    try {
      await api.post(`/championships/${id}/gerar_tabela`);
      toast.success("Tabela gerada com sucesso!");
      fetchChamp();
    } catch (error) {
      toast.error("Erro ao gerar tabela.");
    }
  };

  const handleAddTeam = async () => {
    const nome = prompt("Nome do Time:");
    if (!nome) return;
    try {
      // Small hack for demo: we can't easily add to a list in mock without a specific endpoint
      // but Champ model has 'times' relation. In Django it's a separate model.
      await api.post(`/championships/${id}/times`, { nome });
      toast.success("Time adicionado!");
      fetchChamp();
    } catch (error) {
      toast.error("Erro ao adicionar time.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 bg-app-bg min-h-screen space-y-4">
      <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      <span className="text-app-text-muted">Carregando campeonato...</span>
    </div>
  );
  
  if (!champ) return (
    <div className="p-12 text-center bg-app-bg min-h-screen space-y-4">
      <div className="text-app-text-muted text-xl italic font-bold">Campeonato não encontrado.</div>
      <button 
        onClick={() => navigate("/championships")}
        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition"
      >
        Voltar para Campeonatos
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
       <button 
        onClick={() => navigate("/championships")}
        className="flex items-center text-app-text-muted hover:text-green-500 transition font-bold"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Voltar para Campeonatos
      </button>

      <div className="bg-app-card rounded-3xl border border-app-border p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Trophy className="w-40 h-40 text-app-text" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-app-text uppercase tracking-tighter">{champ.nome}</h1>
          <div className="flex flex-wrap gap-4 mt-3">
            <span className="text-[10px] text-app-text-muted font-black uppercase tracking-widest flex items-center bg-zinc-100 dark:bg-zinc-800/50 border border-app-border px-3 py-1.5 rounded-full shadow-inner">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
              Início: {champ.data_inicio ? new Date(champ.data_inicio).toLocaleDateString() : 'Não informada'}
            </span>
            <span className="text-[10px] text-app-text-muted font-black uppercase tracking-widest flex items-center bg-zinc-100 dark:bg-zinc-800/50 border border-app-border px-3 py-1.5 rounded-full shadow-inner">
              <Settings className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
              {champ.formato?.replace('_', ' ') || 'Simples'}
            </span>
          </div>

          <div className="mt-8 flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {[
              { id: 'tabela', icon: TableIcon, label: 'Classificação' },
              { id: 'jogos', icon: Play, label: 'Tabela de Jogos' },
              { id: 'artilharia', icon: Award, label: 'Artilharia' },
              { id: 'cartoes', icon: ClipboardCheck, label: 'Cartões' },
              { id: 'times', icon: Users, label: 'Times' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-app-text-muted border border-app-border hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-app-text'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-app-card rounded-3xl border border-app-border p-8 shadow-sm">
        {activeTab === 'tabela' && (
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-black text-app-text uppercase tracking-tight">Classificação Atual</h2>
                {champ.jogos?.length === 0 && (
                   <button 
                     onClick={handleGenerateTable}
                     className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center shadow-lg shadow-green-900/20 hover:bg-green-700 transition active:scale-95"
                   >
                     <Play className="w-3.5 h-3.5 mr-2 fill-current" />
                     Gerar Todos os Jogos
                   </button>
                )}
             </div>
             <div className="overflow-x-auto rounded-2xl border border-app-border bg-app-bg/20">
               <table className="w-full text-sm">
                  <thead className="bg-zinc-100 dark:bg-zinc-800/50 font-black text-app-text-muted uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="px-4 py-5 text-left">POS</th>
                      <th className="px-4 py-5 text-left">TIME</th>
                      <th className="px-4 py-5 text-center">PTS</th>
                      <th className="px-4 py-5 text-center">PJ</th>
                      <th className="px-4 py-5 text-center">V</th>
                      <th className="px-4 py-5 text-center">E</th>
                      <th className="px-4 py-5 text-center">D</th>
                      <th className="px-4 py-5 text-center">GP</th>
                      <th className="px-4 py-5 text-center">GC</th>
                      <th className="px-4 py-5 text-center">SG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {(standings && Array.isArray(standings) && standings.length > 0 ? standings : (champ.times || [])).map((team, idx) => (
                      <tr key={team.id || idx} className="hover:bg-app-bg/30 transition-colors group">
                        <td className="px-4 py-5 font-black text-app-text-muted">{idx + 1}º</td>
                        <td className="px-4 py-5 font-black text-app-text group-hover:text-blue-500 transition-colors uppercase tracking-tight">{team.nome || 'Time'}</td>
                        <td className="px-4 py-5 text-center font-black text-blue-500 text-lg">{team.pts || 0}</td>
                        <td className="px-4 py-5 text-center font-bold text-app-text-muted">{team.pj || 0}</td>
                        <td className="px-4 py-5 text-center font-bold text-green-500">{team.v || 0}</td>
                        <td className="px-4 py-5 text-center font-bold text-app-text-muted">{team.e || 0}</td>
                        <td className="px-4 py-5 text-center font-bold text-red-500">{team.d || 0}</td>
                        <td className="px-4 py-5 text-center font-bold text-app-text-muted">{team.gp || 0}</td>
                        <td className="px-4 py-5 text-center font-bold text-app-text-muted">{team.gc || 0}</td>
                        <td className={`px-4 py-5 text-center font-black ${Number(team.sg || 0) > 0 ? 'text-green-500' : Number(team.sg || 0) < 0 ? 'text-red-500' : 'text-app-text-muted'}`}>
                          {team.sg || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'jogos' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-app-text uppercase tracking-tight">Calendário e Resultados</h2>
             </div>
             {champ.jogos?.length === 0 ? (
                <div className="text-center py-20 text-app-text-muted bg-app-bg/30 rounded-3xl border-2 border-dashed border-app-border italic font-medium">Nenhum jogo gerado. Vá para a aba "Classificação" para gerar.</div>
             ) : (
                <div className="grid grid-cols-1 gap-4">
                   {champ.jogos?.map(game => (
                      <div key={game.id} className="bg-app-bg/30 border border-app-border rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all gap-6 group shadow-sm">
                          <div className="flex-1 text-center md:text-right font-black text-app-text text-lg uppercase tracking-tight group-hover:text-blue-500 transition-colors">{game.time_casa_nome}</div>
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-5 bg-app-bg/50 p-3 rounded-[2rem] border border-app-border shadow-inner">
                               <span className={`text-4xl font-black w-14 h-14 flex items-center justify-center rounded-2xl ${game.status === 'realizado' ? 'bg-white dark:bg-zinc-800 text-app-text shadow-lg' : 'bg-app-bg text-app-text-muted'}`}>
                                 {game.gols_casa ?? 0}
                               </span>
                               <span className="text-app-text-muted font-black text-xl italic tracking-tighter uppercase px-1">VS</span>
                               <span className={`text-4xl font-black w-14 h-14 flex items-center justify-center rounded-2xl ${game.status === 'realizado' ? 'bg-white dark:bg-zinc-800 text-app-text shadow-lg' : 'bg-app-bg text-app-text-muted'}`}>
                                 {game.gols_visitante ?? 0}
                               </span>
                            </div>
                            <div className="text-[10px] font-black text-app-text-muted uppercase tracking-widest flex items-center gap-2">
                               {game.data_hora ? new Date(game.data_hora).toLocaleDateString() : 'Agendado'} 
                               <span className="w-1 h-1 bg-app-border rounded-full"></span>
                               {game.status === 'realizado' ? <span className="text-green-500">Finalizado</span> : <span className="text-app-text-muted">Aguardando</span>}
                            </div>
                         </div>
                         <div className="flex-1 items-center flex justify-between w-full md:w-auto">
                            <div className="flex-1 text-center md:text-left font-black text-app-text text-lg uppercase tracking-tight group-hover:text-blue-500 transition-colors">{game.time_visitante_nome}</div>
                            {game.status !== 'realizado' && (
                               <button 
                                 onClick={() => {
                                   setSelectedGame(game);
                                   setHomeGoals(0);
                                   setAwayGoals(0);
                                   setGameEvents([]);
                                   setShowResultModal(true);
                                 }}
                                 className="ml-4 p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-900/20 hover:scale-110 active:scale-95 transition-all"
                                 title="Registrar Resultado"
                               >
                                 <ClipboardCheck className="w-5 h-5" />
                               </button>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        )}

        {activeTab === 'artilharia' && (
            <div className="space-y-6">
                <h2 className="text-xl font-black text-app-text uppercase tracking-tight">Mesa de Artilheiros</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.isArray(scorers) && scorers.map((scorer, idx) => (
                        <div key={scorer.id || idx} className="bg-app-bg/30 border border-app-border rounded-[2.5rem] p-6 flex items-center gap-6 relative shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group overflow-hidden">
                            <div className="absolute -top-2 -right-4 text-7xl font-black text-app-text/5 group-hover:text-amber-500/10 transition-colors italic">{idx + 1}º</div>
                            <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/20 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-inner shrink-0 scale-90 group-hover:scale-100 transition-transform">
                                <Award className="w-10 h-10 text-amber-500" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-lg font-black text-app-text uppercase tracking-tighter truncate">{scorer.nome || 'Jogador'}</div>
                                <div className="text-4xl font-black text-amber-500 mt-1 flex items-baseline gap-2">
                                    {scorer.gols || 0} <span className="text-[10px] text-app-text-muted uppercase tracking-widest font-black italic">Gols</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {scorers.length === 0 && <div className="col-span-full py-20 text-center text-app-text-muted italic font-medium">Nenhum gol registrado até o momento.</div>}
                </div>
            </div>
        )}

        {activeTab === 'cartoes' && (
            <div className="space-y-6">
                <h2 className="text-xl font-black text-app-text uppercase tracking-tight">Resumo de Cartões</h2>
                <div className="overflow-x-auto rounded-3xl border border-app-border bg-app-bg/20">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-100 dark:bg-zinc-800/50 text-app-text-muted font-black uppercase text-[10px] tracking-widest">
                            <tr>
                                <th className="px-6 py-5 text-left">Jogador</th>
                                <th className="px-6 py-5 text-center">Amarelos</th>
                                <th className="px-6 py-5 text-center">Vermelhos</th>
                                <th className="px-6 py-5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-border">
                            {Array.isArray(cards) && cards.map((c, idx) => (
                                <tr key={c.id || idx} className="hover:bg-app-bg/30 transition-colors">
                                    <td className="px-6 py-5 font-black text-app-text uppercase tracking-tight">{c.nome || 'Jogador'}</td>
                                    <td className="px-6 py-5 text-center"><span className="bg-yellow-500 w-8 h-10 inline-block rounded shadow-lg shadow-yellow-900/50 text-black flex items-center justify-center font-black text-lg">{c.amarelos || 0}</span></td>
                                    <td className="px-6 py-5 text-center"><span className="bg-red-600 w-8 h-10 inline-block rounded shadow-lg shadow-red-900/50 text-white flex items-center justify-center font-black text-lg">{c.vermelhos || 0}</span></td>
                                    <td className="px-6 py-5 text-center">
                                        {c.suspenso ? (
                                            <span className="bg-red-500/10 text-red-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">Suspenso</span>
                                        ) : (
                                            <span className="bg-green-500/10 text-green-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">Liberado</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {(Array.isArray(cards) ? cards.length : 0) === 0 && <tr><td colSpan={4} className="py-20 text-center text-app-text-muted italic font-medium uppercase tracking-widest">Nenhum cartão registrado.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        {activeTab === 'times' && (
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-black text-app-text uppercase tracking-tight">Times Participantes</h2>
                <button 
                  onClick={handleAddTeam}
                  className="text-blue-500 text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-blue-500/10 px-4 py-2 rounded-xl transition-all border border-blue-500/20"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar Time
                </button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {(champ.times || []).map(team => (
                 <div key={team.id} className="p-5 bg-app-bg/30 border border-app-border rounded-[2rem] flex items-center gap-5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all shadow-sm group">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 font-black text-2xl shadow-inner group-hover:scale-110 transition-transform">
                       {team.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-black text-app-text uppercase tracking-tighter text-lg">{team.nome}</div>
                 </div>
               ))}
               {(champ.times || []).length === 0 && (
                 <div className="col-span-full py-20 text-center text-app-text-muted italic font-medium">Nenhum time cadastrado.</div>
               )}
             </div>
          </div>
        )}
      </div>

      {/* Result Modal */}
      {showResultModal && selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-app-card rounded-[3rem] w-full max-w-2xl border border-app-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-8 border-b border-app-border flex items-center justify-between bg-app-bg/50">
                <h2 className="text-2xl font-black text-app-text uppercase tracking-tighter italic">Súmula do Jogo</h2>
                <button onClick={() => setShowResultModal(false)} className="p-3 text-app-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-app-text rounded-2xl transition-all shadow-inner border border-app-border"><X className="h-6 w-6" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="bg-black p-10 rounded-[2.5rem] text-white shadow-2xl border border-zinc-800">
                    <div className="grid grid-cols-3 items-center gap-8">
                       <div className="text-center space-y-3">
                          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 py-1 bg-zinc-900 inline-block rounded-md border border-zinc-800">CASA</div>
                          <div className="text-2xl font-black truncate uppercase tracking-tighter italic text-blue-400">{selectedGame.time_casa_nome}</div>
                       </div>
                       <div className="flex items-center justify-center gap-6">
                          <input 
                            type="number" 
                            value={homeGoals}
                            onChange={(e) => setHomeGoals(parseInt(e.target.value) || 0)}
                            className="w-20 h-24 bg-zinc-900 border-2 border-zinc-800 rounded-3xl text-center text-5xl font-black focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all text-white shadow-inner"
                          />
                          <span className="text-3xl font-black text-zinc-800 italic select-none">VS</span>
                          <input 
                            type="number" 
                            value={awayGoals}
                            onChange={(e) => setAwayGoals(parseInt(e.target.value) || 0)}
                            className="w-20 h-24 bg-zinc-900 border-2 border-zinc-800 rounded-3xl text-center text-5xl font-black focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all text-white shadow-inner"
                          />
                       </div>
                       <div className="text-center space-y-3">
                          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 py-1 bg-zinc-900 inline-block rounded-md border border-zinc-800">FORA</div>
                          <div className="text-2xl font-black truncate uppercase tracking-tighter italic text-red-400">{selectedGame.time_visitante_nome}</div>
                       </div>
                    </div>
                </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={async () => {
                           const nome = prompt("Nome do Jogador:");
                           if (!nome) return;
                           try {
                             const allPlayers = await api.get('/jogadores');
                             const p = (allPlayers.data as any[]).find(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
                             if (p) {
                                 const tipo = confirm("OK para Amarelo, Cancelar para Vermelho") ? 'ca' : 'cv';
                                 setGameEvents([...gameEvents, { tipo: tipo === 'ca' ? 'cartao_amarelo' : 'cartao_vermelho', jogadorId: p.id, jogadorNome: p.nome, timeId: selectedGame.time_casa }]);
                             } else {
                               toast.error("Jogador não encontrado.");
                             }
                           } catch (e) {
                             // Fallback to local
                             const locals = DataService.getPlayers();
                             const p = locals.find(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
                             if (p) {
                               const tipo = confirm("OK para Amarelo, Cancelar para Vermelho") ? 'ca' : 'cv';
                               setGameEvents([...gameEvents, { tipo: tipo === 'ca' ? 'cartao_amarelo' : 'cartao_vermelho', jogadorId: p.id, jogadorNome: p.nome, timeId: selectedGame.time_casa }]);
                             } else {
                               toast.error("Jogador não encontrado.");
                             }
                           }
                        }}
                        className="p-5 rounded-2xl border border-app-border bg-app-bg/30 text-app-text-muted font-black uppercase tracking-widest text-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-app-text transition-all flex items-center justify-center gap-2"
                      >
                         <Plus className="w-3.5 h-3.5" /> Cartão {selectedGame.time_casa_nome}
                      </button>
                      <button 
                        onClick={async () => {
                            const nome = prompt("Nome do Jogador:");
                            if (!nome) return;
                            try {
                              const allPlayers = await api.get('/jogadores');
                              const p = (allPlayers.data as any[]).find(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
                              if (p) {
                                  const tipo = confirm("OK para Amarelo, Cancelar para Vermelho") ? 'ca' : 'cv';
                                  setGameEvents([...gameEvents, { tipo: tipo === 'ca' ? 'cartao_amarelo' : 'cartao_vermelho', jogadorId: p.id, jogadorNome: p.nome, timeId: selectedGame.time_visitante }]);
                              } else {
                                toast.error("Jogador não encontrado.");
                              }
                            } catch (e) {
                               const locals = DataService.getPlayers();
                               const p = locals.find(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
                               if (p) {
                                  const tipo = confirm("OK para Amarelo, Cancelar para Vermelho") ? 'ca' : 'cv';
                                  setGameEvents([...gameEvents, { tipo: tipo === 'ca' ? 'cartao_amarelo' : 'cartao_vermelho', jogadorId: p.id, jogadorNome: p.nome, timeId: selectedGame.time_visitante }]);
                               } else {
                                 toast.error("Jogador não encontrado.");
                               }
                            }
                        }}
                        className="p-5 rounded-2xl border border-app-border bg-app-bg/30 text-app-text-muted font-black uppercase tracking-widest text-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-app-text transition-all flex items-center justify-center gap-2"
                      >
                         <Plus className="w-3.5 h-3.5" /> Cartão {selectedGame.time_visitante_nome}
                      </button>
                   </div>
                   
                   <div className="space-y-6">
                      <h3 className="text-xs font-black text-app-text-muted uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                        <Award className="w-4 h-4 text-amber-500" /> Registrar Gols
                      </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <button 
                         onClick={async () => {
                            const nome = prompt("Nome do artilheiro (ou ID):");
                            if (!nome) return;
                            try {
                              const allPlayers = await api.get('/jogadores');
                              const p = (allPlayers.data as any[]).find(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
                              if (p) {
                                  setGameEvents([...gameEvents, { tipo: 'gol', jogadorId: p.id, jogadorNome: p.nome, timeId: selectedGame.time_casa }]);
                                  setHomeGoals(prev => prev + 1);
                              } else { toast.error("Jogador não encontrado."); }
                            } catch (e) {
                               const locals = DataService.getPlayers();
                               const p = locals.find(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
                               if (p) {
                                  setGameEvents([...gameEvents, { tipo: 'gol', jogadorId: p.id, jogadorNome: p.nome, timeId: selectedGame.time_casa }]);
                                  setHomeGoals(prev => prev + 1);
                               } else { toast.error("Jogador não encontrado."); }
                            }
                         }}
                         className="p-5 rounded-2xl border border-app-border bg-app-bg/50 text-green-500 font-black uppercase tracking-widest text-[10px] hover:bg-green-500/10 transition-all flex items-center justify-center gap-2 shadow-sm"
                       >
                          <Plus className="w-3.5 h-3.5" /> Gol {selectedGame.time_casa_nome}
                       </button>
                       <button 
                         onClick={async () => {
                             const nome = prompt("Nome do artilheiro (ou ID):");
                             if (!nome) return;
                             try {
                               const allPlayers = await api.get('/jogadores');
                               const p = (allPlayers.data as any[]).find(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
                               if (p) {
                                   setGameEvents([...gameEvents, { tipo: 'gol', jogadorId: p.id, jogadorNome: p.nome, timeId: selectedGame.time_visitante }]);
                                   setAwayGoals(prev => prev + 1);
                               } else { toast.error("Jogador não encontrado."); }
                             } catch (e) {
                                const locals = DataService.getPlayers();
                                const p = locals.find(p => p.nome.toLowerCase().includes(nome.toLowerCase()));
                                if (p) {
                                   setGameEvents([...gameEvents, { tipo: 'gol', jogadorId: p.id, jogadorNome: p.nome, timeId: selectedGame.time_visitante }]);
                                   setAwayGoals(prev => prev + 1);
                                } else { toast.error("Jogador não encontrado."); }
                             }
                         }}
                         className="p-5 rounded-2xl border border-app-border bg-app-bg/50 text-green-500 font-black uppercase tracking-widest text-[10px] hover:bg-green-500/10 transition-all flex items-center justify-center gap-2 shadow-sm"
                       >
                          <Plus className="w-3.5 h-3.5" /> Gol {selectedGame.time_visitante_nome}
                       </button>
                    </div>
                    
                    <div className="space-y-3 pt-4">
                       {gameEvents.map((e, idx) => (
                         <div key={idx} className="group flex items-center justify-between bg-zinc-100 dark:bg-zinc-950 px-6 py-4 rounded-2xl border border-app-border shadow-inner font-black">
                            <div className="flex items-center gap-4">
                               <span className={cn(
                                 "p-2 rounded-xl flex items-center justify-center",
                                 e.tipo === 'gol' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                               )}>
                                 {e.tipo === 'gol' ? <Trophy className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
                               </span>
                               <span className="font-black text-app-text uppercase tracking-tighter text-base italic">{e.jogadorNome}</span>
                            </div>
                            <button onClick={() => {
                              setGameEvents(prev => prev.filter((_, i) => i !== idx));
                              if (e.tipo === 'gol') {
                                if (e.timeId === selectedGame.time_casa) setHomeGoals(prev => Math.max(0, prev - 1));
                                else setAwayGoals(prev => Math.max(0, prev - 1));
                              }
                            }} className="p-2 text-app-text-muted hover:text-red-500 transition-all transform hover:rotate-90 group-hover:opacity-100"><X className="w-5 h-5" /></button>
                         </div>
                       ))}
                    </div>
                 </div>
             </div>
             <div className="p-8 bg-zinc-100 dark:bg-zinc-950/80 border-t border-app-border backdrop-blur-sm">
                <button 
                  onClick={async () => {
                     try {
                        await api.post(`/championships/${id}/jogos/${selectedGame.id}/registrar`, {
                           gols_casa: homeGoals,
                           gols_visitante: awayGoals,
                           eventos: gameEvents
                        });
                        toast.success("Resultado finalizado!");
                        setShowResultModal(false);
                        fetchChamp();
                        fetchStandings();
                        fetchScorers();
                     } catch (e) {
                        toast.error("Erro ao salvar resultado.");
                     }
                  }}
                  className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-900/40 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest border-t border-blue-400/20"
                >
                   SALVAR RESULTADO
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChampionshipDetail;
