import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  ArrowUp, 
  ArrowDown,
  Users,
  Search,
  Loader2,
  X,
  Play,
  RotateCcw,
  DollarSign,
  Info,
  GripVertical,
  Palette
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "react-hot-toast";
import api from "../services/api";
import { cn } from "../lib/utils";
import DataService, { Pelada, Player } from "../services/dataService";
import io from "../services/socket";
import { useAuth } from "../context/AuthContext";
const socket = io;

const PeladaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inscritos' | 'pagamentos' | 'config'>('inscritos');
  const [searchTerm, setSearchTerm] = useState("");

    const isOrganizador = true; // Full local mode priority
    const canSeeFinance = true;

    useEffect(() => {
      fetchData();

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "peladas" || e.key === "jogadores") {
          fetchData();
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pelada?.cronometro_ativo) {
      interval = setInterval(() => {
        setPelada(prev => prev ? ({
          ...prev,
          cronometro_segundos: (prev.cronometro_segundos || 0) + 1
        }) : null);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pelada?.cronometro_ativo]);

  const fetchData = () => {
    if (!id) return;
    setIsFetching(true);
    try {
      const localPelada = DataService.getPeladaById(id);
      const localPlayers = DataService.getPlayers();
      
      if (localPelada) {
        localPelada.inscritos?.sort((a, b) => (a.ordem_chegada || 0) - (b.ordem_chegada || 0));
        setPelada(localPelada);
      }
      
      const activePlayers = localPlayers.filter(p => p.ativo);
      activePlayers.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
      setAvailablePlayers(activePlayers);
    } catch (error) {
      console.error("Fatal error in fetchData:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddPlayer = (jogadorId: string) => {
    if (!id) return;
    const player = availablePlayers.find(p => p.id === jogadorId);
    if (!player) return;

    // Local Update
    const updated = DataService.addPlayerToPelada(id, jogadorId);
    if (updated) {
       setPelada(updated);
       toast.success("Jogador adicionado!");
       setIsAddModalOpen(false);
       setSearchTerm("");
    }
  };

  const handleRemovePlayer = (peladaJogadorId: string) => {
    if (!id) return;
    const updated = DataService.removePlayerFromPelada(id, peladaJogadorId);
    if (updated) {
      setPelada(updated);
      toast.success("Jogador removido.");
    }
  };

  const handleTogglePresence = (peladaJogadorId: string, current: boolean) => {
    if (!id) return;
    const updated = DataService.togglePresence(id, peladaJogadorId);
    if (updated) {
      setPelada(updated);
      toast.success(!current ? "Presença confirmada!" : "Presença removida");
    }
  };

  const handleTogglePayment = (peladaJogadorId: string, current: boolean) => {
    if (!id) return;
    const updated = DataService.togglePayment(id, peladaJogadorId);
    if (updated) {
      setPelada(updated);
      toast.success(!current ? "Pagamento confirmado!" : "Pagamento cancelado");
    }
  };

  const handleDeletePelada = async () => {
    if (!id) return;
    if (window.confirm("ATENÇÃO: Isso excluirá permanentemente esta pelada e todos os seus dados (times, gols, etc). Deseja continuar?")) {
      try {
        DataService.deletePelada(id);
        toast.success("Pelada excluída com sucesso.");
        navigate("/peladas");
      } catch (error) {
        toast.error("Erro ao excluir pelada.");
      }
    }
  };

  const movePlayer = async (index: number, direction: 'up' | 'down') => {
    if (!pelada || !id) return;
    const items = Array.from(pelada.inscritos || []);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= items.length) return;
    
    const [movedItem] = items.splice(index, 1);
    items.splice(targetIndex, 0, movedItem);
    
    const playerIds = items.map(i => i.jogador);
    const updated = DataService.reorderPlayers(id, playerIds);
    if (updated) {
      setPelada(updated);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !pelada || !id) return;
    
    const items = Array.from(pelada.inscritos || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const playerIds = items.map(i => i.jogador);
    const updated = DataService.reorderPlayers(id, playerIds);
    if (updated) {
      setPelada(updated);
    }
  };

  const filteredAvailable = availablePlayers.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !pelada?.inscritos.some(i => i.jogador === p.id)
  );

  if (!pelada && !isFetching) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="text-app-text-muted text-lg italic text-center">
          Pelada não encontrada ou erro ao carregar.<br/>
          <span className="text-xs opacity-50 block mt-2">ID: {id}</span>
          <span className="text-xs opacity-50 block">API: {import.meta.env.VITE_API_URL || "/api"}</span>
        </div>
        <button 
          onClick={fetchData}
          className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition"
        >
          Tentar Novamente
        </button>
        <button 
          onClick={() => navigate("/peladas")}
          className="text-app-text-muted hover:text-app-text transition"
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  if (isFetching && !pelada) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!pelada) return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="text-app-text-muted text-lg italic uppercase tracking-widest font-black">Pelada não encontrada</div>
      <button 
        onClick={() => navigate("/peladas")}
        className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition"
      >
        Voltar para Peladas
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate("/peladas")}
        className="flex items-center text-app-text-muted hover:text-green-500 transition"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar para Peladas
      </button>

      <div className="bg-app-card rounded-2xl border border-app-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-app-text uppercase tracking-tighter">{pelada.titulo || 'Pelada'}</h1>
            <p className="text-app-text-muted font-medium italic flex items-center mt-1">
              {pelada.local || 'Local não definido'} • {pelada.data_hora ? new Date(pelada.data_hora).toLocaleString() : 'Data não informada'}
            </p>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={() => navigate(`/peladas/${id}/sorteio`)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 px-6 py-2.5 rounded-xl flex items-center hover:bg-zinc-800 transition font-black uppercase tracking-widest text-[10px] shadow-lg"
            >
              <Users className="w-3.5 h-3.5 mr-2" />
              Sorteio Automático
            </button>
            <button 
              onClick={() => navigate(`/peladas/${id}/live`)}
              className={cn(
                "px-6 py-2.5 rounded-xl flex items-center transition font-black uppercase tracking-widest text-[10px] shadow-lg",
                pelada.status === 'encerrada' || pelada.status === 'finalizada'
                  ? "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-green-900/20"
              )}
            >
              <Play className="w-3.5 h-3.5 mr-2 fill-current" />
              {pelada.status === 'encerrada' || pelada.status === 'finalizada' ? 'Ver Resumo/Súmula' : 'Jogo ao Vivo'}
            </button>
          </div>
        </div>
      </div>

      {pelada.status === 'em_andamento' && (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Partida em Andamento</span>
              </div>
              <div className="text-4xl font-black text-white font-mono tracking-tighter">
                {pelada.placar_casa || 0} <span className="text-zinc-700 mx-2">VS</span> {pelada.placar_visitante || 0}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center">
               <div className="text-xs font-black text-zinc-400 mb-1 uppercase tracking-widest">Tempo Decorrido</div>
               <div className="text-2xl font-black text-white font-mono">{Math.floor((pelada.cronometro_segundos || 0) / 60).toString().padStart(2, '0')}:{((pelada.cronometro_segundos || 0) % 60).toString().padStart(2, '0')}</div>
            </div>

            <button 
              onClick={() => navigate(`/peladas/${id}/live`)}
              className="group flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 px-6 py-3 rounded-xl transition-all"
            >
              <span className="text-xs font-black text-white uppercase tracking-widest">Ver Painel Completo</span>
              <Play className="w-4 h-4 text-green-500 fill-current group-hover:scale-125 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('inscritos')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'inscritos' ? "bg-white dark:bg-zinc-900 shadow-sm text-app-text" : "text-app-text-muted hover:text-app-text"
          )}
        >
          Inscritos
        </button>
        {canSeeFinance && (
          <button 
            onClick={() => setActiveTab('pagamentos')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'pagamentos' ? "bg-white dark:bg-zinc-900 shadow-sm text-app-text" : "text-app-text-muted hover:text-app-text"
            )}
          >
            Pagamentos
          </button>
        )}
        <button 
          onClick={() => setActiveTab('config')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'config' ? "bg-white dark:bg-zinc-900 shadow-sm text-app-text" : "text-app-text-muted hover:text-app-text"
          )}
        >
          Configurações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'inscritos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-app-text flex items-center uppercase tracking-tighter">
                  <Users className="w-6 h-6 mr-3 text-green-500" />
                  Lista de Presença ({pelada.inscritos?.length || 0})
                </h2>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-green-600/10 text-green-600 text-xs font-black px-4 py-2 rounded-xl hover:bg-green-600 hover:text-white transition uppercase tracking-widest border border-green-500/20"
                >
                  <Plus className="w-4 h-4 mr-1 inline" />
                  Adicionar Jogador
                </button>
              </div>

              <div className="bg-app-card rounded-[2rem] border border-app-border overflow-hidden shadow-xl">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="players">
                    {(provided) => (
                      <table className="min-w-full divide-y divide-app-border" {...provided.droppableProps} ref={provided.innerRef}>
                        <thead className="bg-zinc-50 dark:bg-zinc-900">
                          <tr>
                            <th className="px-8 py-5 text-left font-black text-app-text-muted uppercase tracking-widest text-[10px]">#</th>
                            <th className="px-8 py-5 text-left font-black text-app-text-muted uppercase tracking-widest text-[10px]">Jogador</th>
                            <th className="px-8 py-5 text-center font-black text-app-text-muted uppercase tracking-widest text-[10px]">Confirmado</th>
                            {isOrganizador && <th className="px-8 py-5 text-right font-black text-app-text-muted uppercase tracking-widest text-[10px]">Ações</th>}
                          </tr>
                        </thead>
                        <tbody className="bg-app-card divide-y divide-app-border/40">
                          {(pelada.inscritos || []).map((pj, index) => (
                            <Draggable key={pj.id} draggableId={pj.id} index={index}>
                              {(provided, snapshot) => (
                                <tr 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={cn(
                                    "hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors", 
                                    !pj.presenca_confirmada && "opacity-40 grayscale-[0.5]",
                                    snapshot.isDragging && "bg-zinc-100 dark:bg-zinc-800 shadow-2xl z-50 rounded-xl"
                                  )}
                                >
                                  <td className="px-8 py-5 whitespace-nowrap">
                                    <div className="flex items-center gap-4">
                                      <div {...provided.dragHandleProps} className="text-zinc-400 hover:text-zinc-600">
                                        <GripVertical className="w-4 h-4" />
                                      </div>
                                      <span className="text-xs font-black text-app-text-muted font-mono">{index + 1}º</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-5 whitespace-nowrap">
                                    <div className="font-black text-app-text uppercase tracking-tight text-sm">{pj.jogador_nome}</div>
                                    <div className="text-[10px] text-yellow-500 font-black tracking-widest uppercase">NÍVEL {(pj.jogador_nivel || 0).toFixed(1)} ★</div>
                                  </td>
                                  <td className="px-8 py-5 whitespace-nowrap text-center">
                                    <button 
                                      onClick={() => isOrganizador && handleTogglePresence(pj.id, pj.presenca_confirmada)} 
                                      disabled={!isOrganizador}
                                      className={cn(
                                        "mx-auto w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm",
                                        pj.presenca_confirmada 
                                          ? "bg-green-500 border-green-600 text-white shadow-green-500/20" 
                                          : "border-app-border bg-app-bg text-transparent"
                                      )}
                                    >
                                      <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                  </td>
                                  {isOrganizador && (
                                    <td className="px-8 py-5 whitespace-nowrap text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <div className="flex flex-col gap-1 mr-2">
                                          <button onClick={() => movePlayer(index, 'up')} className="p-1 text-app-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"><ArrowUp className="w-3 h-3" /></button>
                                          <button onClick={() => movePlayer(index, 'down')} className="p-1 text-app-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"><ArrowDown className="w-3 h-3" /></button>
                                        </div>
                                        <button 
                                          onClick={() => handleRemovePlayer(pj.id)}
                                          className="p-2.5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 shadow-sm"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {(pelada.inscritos?.length || 0) === 0 && (
                            <tr>
                              <td colSpan={5} className="px-8 py-20 text-center">
                                <div className="text-app-text-muted italic font-serif opacity-40">Nenhum jogador na lista.</div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>
          )}

          {activeTab === 'pagamentos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-app-text flex items-center uppercase tracking-tighter">
                  <DollarSign className="w-6 h-6 mr-3 text-blue-500" />
                  Controle de Pagamentos
                </h2>
                {isOrganizador && (
                  <div className="bg-blue-600/10 px-4 py-2 rounded-2xl border border-blue-500/20 flex items-center gap-3">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest whitespace-nowrap">Visível para visitantes</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={pelada.config_pagamento_visivel}
                        onChange={() => {
                          const newVal = !pelada.config_pagamento_visivel;
                          setPelada({...pelada, config_pagamento_visivel: newVal});
                          DataService.updatePelada(id!, { config_pagamento_visivel: newVal });
                        }}
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 shadow-inner"></div>
                    </label>
                  </div>
                )}
              </div>

              <div className="bg-app-card rounded-[2rem] border border-app-border overflow-hidden shadow-xl">
                 <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-app-border">
                     <thead className="bg-zinc-50 dark:bg-zinc-900">
                       <tr>
                         <th className="px-8 py-5 text-left font-black text-app-text-muted uppercase tracking-widest text-[10px]">Jogador</th>
                         <th className="px-8 py-5 text-center font-black text-app-text-muted uppercase tracking-widest text-[10px]">Status</th>
                         <th className="px-8 py-5 text-center font-black text-app-text-muted uppercase tracking-widest text-[10px]">Rateio</th>
                         {isOrganizador && <th className="px-8 py-5 text-right font-black text-app-text-muted uppercase tracking-widest text-[10px]">Confirmar</th>}
                       </tr>
                     </thead>
                     <tbody className="bg-app-card divide-y divide-app-border/40">
                       {(pelada.inscritos || [])
                         .filter(pj => pj.presenca_confirmada)
                         .sort((a, b) => (a.jogador_nome || "").localeCompare(b.jogador_nome || ""))
                         .map(pj => (
                         <tr key={pj.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="px-8 py-5 whitespace-nowrap">
                              <div className="font-black text-app-text uppercase tracking-tight text-sm">{pj.jogador_nome}</div>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-center">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                pj.pagamento_confirmado 
                                  ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                                  : "bg-red-500/10 text-red-500 border border-red-500/20"
                              )}>
                                {pj.pagamento_confirmado ? "Pago" : "Pendente"}
                              </span>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-center font-mono font-black text-xs text-app-text-muted">
                              R$ {(Number(pelada.valor_total || 0) / Math.max(1, (pelada.inscritos || []).filter(i => i.presenca_confirmada).length)).toFixed(2)}
                            </td>
                            {isOrganizador && (
                              <td className="px-8 py-5 whitespace-nowrap text-right">
                                <button 
                                  onClick={() => handleTogglePayment(pj.id, pj.pagamento_confirmado)}
                                  className={cn(
                                    "p-2.5 rounded-xl transition-all border shadow-sm",
                                    pj.pagamento_confirmado 
                                      ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
                                      : "bg-green-600 text-white border-green-700 hover:bg-green-700"
                                  )}
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                         </tr>
                       ))}
                       {(pelada.inscritos || []).filter(pj => pj.presenca_confirmada).length === 0 && (
                         <tr>
                            <td colSpan={4} className="px-8 py-20 text-center italic text-app-text-muted opacity-40 font-serif">Aguardando confirmações de presença para ratear o custo.</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
               <h2 className="text-xl font-black text-app-text flex items-center uppercase tracking-tighter px-2">
                <RotateCcw className="w-6 h-6 mr-3 text-orange-500" />
                Configurações da Partida
              </h2>
              <div className="bg-app-card rounded-[2rem] border border-app-border p-8 shadow-xl space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1">Título da Pelada</label>
                       <input 
                         type="text" 
                         className="w-full bg-app-bg border border-app-border rounded-2xl px-5 py-3 text-sm font-bold text-app-text focus:border-green-500 transition-all outline-none"
                         defaultValue={pelada.titulo}
                         onBlur={(e) => {
                           const newVal = e.target.value;
                           DataService.updatePelada(id!, { titulo: newVal });
                         }}
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1">Local / Endereço</label>
                       <input 
                         type="text" 
                         className="w-full bg-app-bg border border-app-border rounded-2xl px-5 py-3 text-sm font-bold text-app-text focus:border-green-500 transition-all outline-none"
                         defaultValue={pelada.local}
                         onBlur={(e) => {
                           const newVal = e.target.value;
                           DataService.updatePelada(id!, { local: newVal });
                         }}
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1">Jogadores p/ Time</label>
                      <input 
                        type="number"
                        className="w-full bg-app-bg border border-app-border rounded-2xl px-5 py-3 text-sm font-bold text-app-text focus:border-green-500 transition-all outline-none"
                        defaultValue={pelada.jogadores_por_time}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          DataService.updatePelada(id!, { jogadores_por_time: val });
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1">Times Simultâneos</label>
                      <input 
                        type="number"
                        className="w-full bg-app-bg border border-app-border rounded-2xl px-5 py-3 text-sm font-bold text-app-text focus:border-green-500 transition-all outline-none"
                        defaultValue={pelada.times_simultaneos}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          DataService.updatePelada(id!, { times_simultaneos: val });
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1">Duração (min)</label>
                      <input 
                        type="number"
                        className="w-full bg-app-bg border border-app-border rounded-2xl px-5 py-3 text-sm font-bold text-app-text focus:border-green-500 transition-all outline-none"
                        defaultValue={pelada.duracao_minutos}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          DataService.updatePelada(id!, { duracao_minutos: val });
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-app-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                       <Palette className="w-4 h-4" />
                       Cores dos Coletes (Sorteio)
                    </label>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-4">
                         <input 
                           type="color" 
                           className="w-12 h-12 rounded-xl border-none cursor-pointer"
                           defaultValue={pelada.coletes?.[0] || "#FF0000"}
                           onBlur={(e) => {
                             const newColetes = [...(pelada.coletes || ["#FF0000", "#0000FF"])];
                             newColetes[0] = e.target.value;
                             DataService.updatePelada(id!, { coletes: newColetes });
                           }}
                         />
                         <span className="text-xs font-bold text-app-text uppercase">Time A</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <input 
                           type="color" 
                           className="w-12 h-12 rounded-xl border-none cursor-pointer"
                           defaultValue={pelada.coletes?.[1] || "#0000FF"}
                           onBlur={(e) => {
                             const newColetes = [...(pelada.coletes || ["#FF0000", "#0000FF"])];
                             newColetes[1] = e.target.value;
                             DataService.updatePelada(id!, { coletes: newColetes });
                           }}
                         />
                         <span className="text-xs font-bold text-app-text uppercase">Time B</span>
                      </div>
                    </div>
                  </div>

                 <div className="pt-4 border-t border-app-border">
                   <h3 className="font-black text-app-text uppercase tracking-tight mb-4">Ações Perigosas</h3>
                   <div className="flex flex-wrap gap-4">
                     <button 
                       onClick={handleDeletePelada}
                       className="bg-red-500/10 text-red-500 border border-red-500/30 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                     >
                       Excluir Pelada
                     </button>
                     {pelada.status !== 'encerrada' && pelada.status !== 'finalizada' && (
                       <button 
                         onClick={() => {
                           if (window.confirm("Confirmar encerramento? Estatísticas serão salvas.")) {
                             try {
                               DataService.finalizePelada(id!);
                               toast.success("Pelada finalizada com sucesso!");
                               fetchData();
                             } catch (error) {
                               toast.error("Erro ao finalizar pelada.");
                             }
                           }
                         }}
                         className="bg-zinc-900 border border-zinc-800 text-zinc-100 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl"
                       >
                         Finalizar Partida
                       </button>
                     )}
                   </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-zinc-950 rounded-[2.5rem] border border-zinc-900 p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] -mr-16 -mt-16"></div>
             <div className="relative z-10 space-y-6">
                <div>
                   <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 text-center">Resumo Financeiro</div>
                   <div className="flex flex-col items-center gap-2">
                       <span className="text-[10px] font-black text-zinc-400">VALOR TOTAL</span>
                       <div className="flex items-center text-4xl font-black text-white tracking-tighter">
                         <span className="text-zinc-600 text-lg mr-1 font-mono">R$</span>
                         {isOrganizador ? (
                            <input 
                              type="number" 
                              className="bg-transparent border-none outline-none w-32 focus:ring-0 text-center"
                              defaultValue={pelada.valor_total || 0}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                DataService.updatePelada(id!, { valor_total: val });
                              }}
                            />
                         ) : (
                           Number(pelada.valor_total || 0).toFixed(2)
                         )}
                       </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-800/50">
                   <div className="text-center">
                      <div className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Confirmados</div>
                      <div className="text-2xl font-black text-white font-mono">{(pelada.inscritos || []).filter(i => i.presenca_confirmada).length}</div>
                   </div>
                   <div className="text-center">
                      <div className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Por Pessoa</div>
                      <div className="text-2xl font-black text-blue-500 font-mono tracking-tight leading-none pt-1">
                        <span className="text-[10px] font-black block text-zinc-600 mb-1">R$</span>
                        {(Number(pelada.valor_total || 0) / Math.max(1, (pelada.inscritos || []).filter(i => i.presenca_confirmada).length)).toFixed(2)}
                      </div>
                   </div>
                </div>

                <div className="pt-2">
                   <div className="h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 shadow-inner">
                      <div 
                        style={{ width: `${((pelada.inscritos || []).filter(i => i.pagamento_confirmado).length / Math.max(1, (pelada.inscritos || []).filter(i => i.presenca_confirmada).length)) * 100}%` }}
                        className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      ></div>
                   </div>
                   <div className="flex justify-between mt-3">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Já pagaram</span>
                      <span className="text-[10px] font-black text-white bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-700">
                        {(pelada.inscritos || []).filter(i => i.pagamento_confirmado).length} de {(pelada.inscritos || []).filter(i => i.presenca_confirmada).length}
                      </span>
                   </div>
                   <div className="text-center mt-6">
                      <div className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-1">TOTAL ARRECADADO</div>
                      <div className="text-3xl font-black text-green-500 font-mono tracking-tighter">
                         R$ {((Number(pelada.valor_total || 0) / Math.max(1, (pelada.inscritos || []).filter(i => i.presenca_confirmada).length)) * (pelada.inscritos || []).filter(i => i.pagamento_confirmado).length).toFixed(2)}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-app-card p-6 rounded-3xl border border-app-border shadow-md space-y-4">
             <h3 className="font-black text-app-text uppercase tracking-tight flex items-center gap-2">
               <Info className="w-4 h-4 text-app-text-muted" />
               Dica Pro
             </h3>
             <p className="text-xs text-app-text-muted italic leading-relaxed">
               Use o botão <span className="font-bold text-green-600">Sorteio Automático</span> no topo para equilibrar as estrelas e gerar times justos. 
               O rateio é calculado apenas com base nos jogadores que confirmaram presença.
             </p>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-app-card rounded-2xl w-full max-w-md border border-app-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-app-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-app-text">Adicionar à Lista</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-app-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800/50 border-b border-app-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-3 py-2 border border-app-border bg-app-bg rounded-lg text-sm text-app-text" 
                  placeholder="Buscar jogador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredAvailable.map(player => (
                <div key={player.id} className="flex items-center justify-between p-3 rounded-xl border border-app-border hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                  <div>
                    <div className="font-bold text-app-text">{player.nome}</div>
                    <div className="text-xs text-yellow-500 font-medium">{player.nivel_estrelas.toFixed(1)} ★</div>
                  </div>
                  <button 
                    onClick={() => handleAddPlayer(player.id)}
                    className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {filteredAvailable.length === 0 && (
                <div className="text-center py-8 space-y-4">
                  <div className="text-app-text-muted text-sm font-serif italic">Nenhum jogador disponível.</div>
                  <button 
                    onClick={() => navigate("/players")}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition"
                  >
                    Criar Novo Jogador
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeladaDetail;
