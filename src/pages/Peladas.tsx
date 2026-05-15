import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ChevronRight,
  PlusCircle,
  Loader2,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import DataService, { Pelada } from "../services/dataService";
import api from "../services/api";
import { cn } from "../lib/utils";

const Peladas = () => {
  const [peladas, setPeladas] = useState<Pelada[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [titulo, setTitulo] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [local, setLocal] = useState("");
  const [jogadoresPorTime, setJogadoresPorTime] = useState(5);
  const [timesSimultaneos, setTimesSimultaneos] = useState(2);
  const [duracaoMinutos, setDuracaoMinutos] = useState(10);
  const [valorPorJogador, setValorPorJogador] = useState("");
  const [colete1, setColete1] = useState("#FF0000");
  const [colete2, setColete2] = useState("#0000FF");

  useEffect(() => {
    fetchPeladas();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "peladas") {
        fetchPeladas();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchPeladas = () => {
    setIsFetching(true);
    try {
      const locals = DataService.getPeladas();
      setPeladas(locals);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCreatePelada = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const newPelada: Partial<Pelada> = {
      titulo,
      data_hora: dataHora,
      local,
      jogadores_por_time: jogadoresPorTime,
      times_simultaneos: timesSimultaneos,
      duracao_minutos: duracaoMinutos,
      valor_por_jogador: valorPorJogador ? parseFloat(valorPorJogador) : undefined,
      coletes: [colete1, colete2],
    };

    try {
      DataService.savePelada(newPelada);
      toast.success("Pelada criada com sucesso!");
      fetchPeladas();
      setIsModalOpen(false);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitulo("");
    setDataHora("");
    setLocal("");
    setJogadoresPorTime(5);
    setTimesSimultaneos(2);
    setDuracaoMinutos(10);
    setValorPorJogador("");
    setColete1("#FF0000");
    setColete2("#0000FF");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendada': return <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-xs font-medium border border-blue-500/20">Agendada</span>;
      case 'em_andamento': return <span className="bg-green-600/20 text-green-400 px-2 py-0.5 rounded text-xs font-medium border border-green-500/20">Em Andamento</span>;
      case 'encerrada': return <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-xs font-medium border border-zinc-700">Encerrada</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-text">Minhas Peladas</h1>
          <p className="text-app-text-muted">Organize seus confrontos e listas de presença.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition shadow-sm shadow-green-900/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Pelada
        </button>
      </div>

      {isFetching ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : peladas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {peladas.map(pelada => (
            <Link 
              key={pelada.id} 
              to={`/peladas/${pelada.id}`}
              className="bg-app-card rounded-xl border border-app-border p-6 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-app-text group-hover:text-green-500 transition truncate pr-2">
                  {pelada.titulo}
                </h3>
                {getStatusBadge(pelada.status)}
              </div>
              
              <div className="space-y-2 text-sm text-app-text-muted mb-6">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 opacity-50" />
                  {pelada.data_hora ? new Date(pelada.data_hora).toLocaleString() : 'Não informada'}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 opacity-50" />
                  {pelada.local}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 opacity-50" />
                  {pelada.jogadores_por_time} vs {pelada.jogadores_por_time}
                </div>
              </div>

              <div className="flex items-center text-green-500 text-sm font-semibold">
                Ver Detalhes
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-app-card rounded-2xl border-2 border-dashed border-app-border p-12 text-center">
          <div className="bg-zinc-100 dark:bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-app-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-app-text mb-1">Nenhuma pelada marcada</h3>
          <p className="text-app-text-muted mb-6 font-serif italic text-sm">Clique no botão acima para agendar seu primeiro jogo.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-green-500 font-semibold hover:underline"
          >
            Agendar agora
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-app-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-app-border">
            <div className="p-6 border-b border-app-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-app-text">Nova Pelada</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-app-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreatePelada} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-app-text-muted mb-1">Título</label>
                <input type="text" required className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Pelada dos Amigos" />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-muted mb-1">Data e Hora</label>
                <input type="datetime-local" required className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-muted mb-1">Local</label>
                <input type="text" required className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Arena Soccer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-app-text-muted mb-1">Jogadores por Time</label>
                  <select className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={jogadoresPorTime} onChange={(e) => setJogadoresPorTime(parseInt(e.target.value))}>
                    <option value={5}>5 x 5</option>
                    <option value={6}>6 x 6</option>
                    <option value={7}>7 x 7</option>
                    <option value={11}>11 x 11</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-muted mb-1">Times Simultâneos</label>
                  <select className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={timesSimultaneos} onChange={(e) => setTimesSimultaneos(parseInt(e.target.value))}>
                    <option value={2}>2 times</option>
                    <option value={3}>3 times</option>
                    <option value={4}>4 times</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-app-text-muted mb-1">Duração (m)</label>
                  <input type="number" className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={duracaoMinutos} onChange={(e) => setDuracaoMinutos(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-muted mb-1">Valor p/ Jogador (R$)</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 border border-app-border bg-app-bg rounded-lg text-app-text focus:ring-2 focus:ring-green-500" value={valorPorJogador} onChange={(e) => setValorPorJogador(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-muted mb-1">Cores dos Coletes</label>
                <div className="flex gap-4">
                  <div className="flex-1 flex items-center gap-2">
                    <input type="color" className="w-8 h-8 rounded border-none cursor-pointer p-0" value={colete1} onChange={(e) => setColete1(e.target.value)} />
                    <span className="text-xs text-app-text-muted">Time A</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <input type="color" className="w-8 h-8 rounded border-none cursor-pointer p-0" value={colete2} onChange={(e) => setColete2(e.target.value)} />
                    <span className="text-xs text-app-text-muted">Time B</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-app-border rounded-lg text-sm font-medium text-app-text-muted hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {isLoading ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : "Criar Pelada"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Peladas;
