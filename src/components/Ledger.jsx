import React, { useState } from 'react';
import { ArrowLeftRight, Users, ChevronRight, Ban, Plus, Sparkles, Trophy, ListCollapse, Award, History } from 'lucide-react';
import { calculateSettlements } from '../utils/settlement';

export default function Ledger({ 
  players, 
  activePlayers, 
  tickets, 
  ticketPrice, 
  games, 
  cumulativeLedger, 
  onUpdateLineup, 
  onAddPlayerMidSession, 
  onNextRound, 
  onEndSession 
}) {
  const [activeTab, setActiveTab] = useState('round'); // 'round' | 'session'
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  const settlements = calculateSettlements(cumulativeLedger);
  const lastGame = games[games.length - 1];

  const togglePlayerExclusion = (player) => {
    let updated;
    if (activePlayers.includes(player)) {
      updated = activePlayers.filter(p => p !== player);
    } else {
      updated = [...activePlayers, player];
    }
    
    if (updated.length < 2) {
      alert("You must have at least 2 active players to play a round!");
      return;
    }
    
    onUpdateLineup(updated);
  };

  const handleAddPlayer = () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    if (players.includes(trimmed)) {
      alert("Player already exists in the session!");
      return;
    }
    onAddPlayerMidSession(trimmed);
    setNewPlayerName('');
    setShowAddPlayer(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12 relative z-10">
      {/* Switcher Tab between Current Round & Cumulative */}
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-2 flex justify-between items-center shadow-2xl w-full">
        <button
          onClick={() => setActiveTab('round')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] text-xs font-black transition-all duration-200 uppercase tracking-widest ${
            activeTab === 'round' 
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 shadow-[inset_0_0_15px_rgba(6,182,212,0.2)]' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="w-4 h-4" />
          Round Recap
        </button>
        <button
          onClick={() => setActiveTab('session')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] text-xs font-black transition-all duration-200 uppercase tracking-widest ${
            activeTab === 'session' 
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 shadow-[inset_0_0_15px_rgba(6,182,212,0.2)]' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Award className="w-4 h-4" />
          Session Ledger
        </button>
      </div>

      {activeTab === 'round' && lastGame ? (
        <div className="space-y-6">
          {/* Detailed Prize Winners for last game */}
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-5">
            <h3 className="text-xs font-black text-slate-300 tracking-[0.2em] uppercase flex items-center gap-2 border-b border-white/10 pb-4">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Round #{lastGame.gameIndex} Winners
            </h3>
            
            <div className="space-y-3">
              {lastGame.prizes.map((p) => {
                const hasWinners = p.winners && p.winners.length > 0;
                return (
                  <div 
                    key={p.id}
                    className="p-5 bg-black/40 border border-white/5 rounded-[1.5rem] flex flex-col gap-3 shadow-inner"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-white tracking-wide">{p.name}</span>
                      <span className="text-xs font-black bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 rounded-xl text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        ₹{p.value}
                      </span>
                    </div>
                    {hasWinners ? (
                      <div className="flex flex-col gap-1.5 mt-1">
                        <span className="text-xs text-slate-400 font-bold bg-white/5 p-2 rounded-xl">
                          Claimed by: <span className="text-white font-black">{p.winners.join(', ')}</span>
                        </span>
                        <span className="text-[10px] text-cyan-400/80 font-black uppercase tracking-[0.2em]">
                          Drawn on Number {p.winningNumber} {p.winners.length > 1 && `(₹${(p.value / p.winners.length).toFixed(0)} each)`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic font-semibold">Unclaimed</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Round Individual Balances */}
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-5 text-slate-100 relative overflow-hidden">
            <div className="absolute top-[-40px] right-[-40px] w-24 h-24 bg-rose-500/20 blur-[50px] rounded-full pointer-events-none" />
            <h3 className="text-xs font-black text-slate-300 tracking-[0.2em] uppercase flex items-center gap-2 border-b border-white/10 pb-4 relative z-10">
              <ListCollapse className="w-4 h-4 text-cyan-400" />
              Round Balances
            </h3>
            
            <div className="space-y-3 relative z-10">
              {players.map(player => {
                const isActive = lastGame.activePlayers.includes(player);
                const roundTickets = isActive ? (lastGame.tickets[player] || 0) : 0;
                const buyIn = roundTickets * ticketPrice;
                
                let roundWinnings = 0;
                lastGame.prizes.forEach(p => {
                  if (p.winners.includes(player)) {
                    roundWinnings += p.value / p.winners.length;
                  }
                });
                const net = roundWinnings - buyIn;

                return (
                  <div 
                    key={player}
                    className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl shadow-inner hover:bg-black/60 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-extrabold text-white tracking-wide">{player}</span>
                        {!isActive && (
                          <span className="text-[9px] bg-white/5 border border-white/10 text-slate-400 font-black px-2 py-0.5 rounded-md uppercase tracking-[0.2em]">
                            Spectator
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-bold mt-1 block">
                        Buy-in: ₹{buyIn} | Winnings: ₹{roundWinnings.toFixed(0)}
                      </span>
                    </div>

                    <span className={`text-lg font-black drop-shadow-md ${
                      net > 0 ? 'text-emerald-400' : net < 0 ? 'text-rose-400' : 'text-slate-500'
                    }`}>
                      {net > 0 ? '+' : ''}₹{net.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cumulative Standings */}
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-5 text-slate-100 relative overflow-hidden">
            <div className="absolute top-[-40px] left-[-40px] w-24 h-24 bg-emerald-500/20 blur-[50px] rounded-full pointer-events-none" />
            <h3 className="text-xs font-black text-slate-300 tracking-[0.2em] uppercase flex items-center gap-2 border-b border-white/10 pb-4 relative z-10">
              <Award className="w-4 h-4 text-emerald-400" />
              Session Rankings
            </h3>
            
            <div className="space-y-3 relative z-10">
              {Object.entries(cumulativeLedger)
                .sort((a, b) => b[1] - a[1])
                .map(([player, net]) => {
                  const buyIn = games.reduce((sum, g) => sum + ((g.tickets[player] || 0) * ticketPrice), 0);
                  const won = games.reduce((sum, g) => {
                    let roundWinnings = 0;
                    g.prizes.forEach(p => {
                      if (p.winners.includes(player)) {
                        roundWinnings += p.value / p.winners.length;
                      }
                    });
                    return sum + roundWinnings;
                  }, 0);

                  const isActive = activePlayers.includes(player);

                  return (
                    <div 
                      key={player}
                      className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl shadow-inner hover:bg-black/60 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-extrabold text-white tracking-wide">{player}</span>
                          {!isActive && (
                            <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded-md uppercase tracking-[0.2em]">
                              Excluded
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold mt-1 block">
                          Total Buy-in: ₹{buyIn} | Winnings: ₹{won.toFixed(0)}
                        </span>
                      </div>

                      <span className={`text-lg font-black drop-shadow-md ${
                        net > 0 ? 'text-emerald-400' : net < 0 ? 'text-rose-400' : 'text-slate-500'
                      }`}>
                        {net > 0 ? '+' : ''}₹{net.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Settlements - Premium Transaction Style */}
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <h3 className="text-xs font-black text-slate-300 tracking-[0.2em] uppercase flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
              Recommended Settlements
            </h3>
            
            <div className="bg-black/40 border border-white/5 rounded-3xl p-5 space-y-3 shadow-inner">
              {settlements.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 font-bold italic">
                  No transactions required. All net payouts equal zero.
                </p>
              ) : (
                settlements.map((t, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-white/5 border border-white/10 p-5 rounded-2xl shadow-sm hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-extrabold text-white text-base">{t.from}</span>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30">
                        <ChevronRight className="w-4 h-4 text-rose-400" />
                      </div>
                      <span className="font-extrabold text-white text-base">{t.to}</span>
                    </div>
                    <span className="font-black text-emerald-400 text-lg drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                      ₹{t.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lineup Management Bento */}
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-5">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h3 className="text-xs font-black text-slate-300 tracking-[0.2em] uppercase flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Next Round Lineup
          </h3>
          <button 
            onClick={() => setShowAddPlayer(!showAddPlayer)}
            className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 transition duration-150 flex items-center gap-1 uppercase tracking-[0.2em] bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Player
          </button>
        </div>

        {showAddPlayer && (
          <div className="flex gap-3 bg-black/40 border border-white/5 rounded-2xl p-4 shadow-inner">
            <input 
              type="text" 
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Name..."
              className="flex-1 bg-white/5 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200"
            />
            <button 
              onClick={handleAddPlayer}
              className="bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 active:scale-95 shadow-sm"
            >
              Add
            </button>
          </div>
        )}

        <div className="bg-black/40 border border-white/5 rounded-[1.5rem] p-5 shadow-inner">
          <p className="text-[10px] text-slate-500 mb-4 font-black uppercase tracking-[0.2em]">
            Exclusions (Toggle for the next round)
          </p>
          <div className="flex flex-wrap gap-2.5 max-h-40 overflow-y-auto pr-1">
            {players.map((p) => {
              const isActive = activePlayers.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlayerExclusion(p)}
                  className={`px-4 py-2 rounded-xl border text-[11px] font-bold transition-all duration-200 flex items-center gap-2 ${
                    isActive 
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                      : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Ban className={`w-3.5 h-3.5 transition-all duration-200 ${isActive ? 'opacity-0 w-0 h-0 hidden' : 'text-rose-500 opacity-100'}`} />
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex gap-4">
        <button
          onClick={onEndSession}
          className="flex-1 bg-black/40 border border-white/10 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-400 text-slate-400 font-bold py-5 px-4 rounded-2xl transition-all duration-200 active:scale-95 text-[11px] uppercase tracking-[0.2em] shadow-inner"
        >
          End Session
        </button>
        <button
          onClick={onNextRound}
          className="flex-[2] bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black py-5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-[11px] uppercase tracking-[0.2em]"
        >
          <Sparkles className="w-4 h-4 fill-current text-white animate-spin drop-shadow-md" style={{ animationDuration: '3s' }} />
          Start Next Round
        </button>
      </div>
    </div>
  );
}
