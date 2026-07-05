import React, { useState } from 'react';
import { ArrowLeftRight, Users, ChevronRight, Ban, Plus, Sparkles, Trophy, ListCollapse, Award } from 'lucide-react';
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
    <div className="max-w-md mx-auto space-y-6 pb-12">
      {/* Switcher Tab between Current Round & Cumulative */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-1.5 flex justify-between items-center shadow-lg w-full">
        <button
          onClick={() => setActiveTab('round')}
          className={`flex-1 text-center py-3 rounded-2xl text-xs font-black transition duration-150 uppercase tracking-widest ${
            activeTab === 'round' 
              ? 'bg-zinc-100 text-zinc-950 shadow-md' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Round Recap
        </button>
        <button
          onClick={() => setActiveTab('session')}
          className={`flex-1 text-center py-3 rounded-2xl text-xs font-black transition duration-150 uppercase tracking-widest ${
            activeTab === 'session' 
              ? 'bg-zinc-100 text-zinc-950 shadow-md' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Session Ledger
        </button>
      </div>

      {activeTab === 'round' && lastGame ? (
        <div className="space-y-6">
          {/* Detailed Prize Winners for last game */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-zinc-450 tracking-widest uppercase flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Trophy className="w-5 h-5 text-zinc-400" />
              Round #{lastGame.gameIndex} Winners
            </h3>
            
            <div className="space-y-3">
              {lastGame.prizes.map((p) => {
                const hasWinners = p.winners && p.winners.length > 0;
                return (
                  <div 
                    key={p.id}
                    className="p-4 bg-zinc-950 border border-zinc-850/60 rounded-2xl flex flex-col gap-2 shadow-inner"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-zinc-100">{p.name}</span>
                      <span className="text-xs font-black bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded text-emerald-400">
                        ₹{p.value}
                      </span>
                    </div>
                    {hasWinners ? (
                      <div className="flex flex-col gap-1 mt-0.5">
                        <span className="text-xs text-zinc-400 font-bold">
                          Claimed by: <span className="text-zinc-50 font-black">{p.winners.join(', ')}</span>
                        </span>
                        <span className="text-xxs text-zinc-500 font-bold uppercase tracking-wider">
                          Drawn on Number {p.winningNumber} {p.winners.length > 1 && `(₹${(p.value / p.winners.length).toFixed(0)} each)`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600 italic font-semibold">Unclaimed</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Round Individual Balances */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4 text-zinc-100">
            <h3 className="text-sm font-black text-zinc-450 tracking-widest uppercase flex items-center gap-2 border-b border-zinc-800 pb-3">
              <ListCollapse className="w-5 h-5 text-zinc-400" />
              Round Balances
            </h3>
            
            <div className="space-y-2.5">
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
                    className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-850/60 rounded-2xl"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-zinc-200">{player}</span>
                        {!isActive && (
                          <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-650 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                            Spectator
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500 font-semibold mt-0.5 block">
                        Buy-in: ₹{buyIn} | Winnings: ₹{roundWinnings.toFixed(0)}
                      </span>
                    </div>

                    <span className={`text-base font-black ${
                      net > 0 ? 'text-emerald-450' : net < 0 ? 'text-rose-450' : 'text-zinc-500'
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4 text-zinc-100">
            <h3 className="text-sm font-black text-zinc-450 tracking-widest uppercase flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Award className="w-5 h-5 text-zinc-400" />
              Session Rankings
            </h3>
            
            <div className="space-y-2.5">
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
                      className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-850/60 rounded-2xl"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-zinc-200">{player}</span>
                          {!isActive && (
                            <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              Excluded
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500 font-semibold mt-0.5 block">
                          Total Buy-in: ₹{buyIn} | Winnings: ₹{won.toFixed(0)}
                        </span>
                      </div>

                      <span className={`text-base font-black ${
                        net > 0 ? 'text-emerald-450' : net < 0 ? 'text-rose-450' : 'text-zinc-500'
                      }`}>
                        {net > 0 ? '+' : ''}₹{net.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Settlements */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-zinc-450 tracking-widest uppercase flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-zinc-400" />
              Recommended Settlements
            </h3>
            
            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 space-y-2.5">
              {settlements.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-2 font-medium italic">
                  No transactions required. All net payouts equal zero.
                </p>
              ) : (
                settlements.map((t, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-zinc-900 border border-zinc-800/80 p-4 rounded-xl text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-zinc-200 text-sm">{t.from}</span>
                      <ChevronRight className="w-4.5 h-4.5 text-rose-400" />
                      <span className="font-extrabold text-zinc-200 text-sm">{t.to}</span>
                    </div>
                    <span className="font-black text-emerald-450 text-base">
                      ₹{t.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lineup Management */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-zinc-400 tracking-widest uppercase flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-500" />
            Manage Next Round Lineup
          </h3>
          <button 
            onClick={() => setShowAddPlayer(!showAddPlayer)}
            className="text-[10px] font-black text-zinc-400 hover:text-zinc-200 transition duration-150 flex items-center gap-1 uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            Add Player
          </button>
        </div>

        {showAddPlayer && (
          <div className="flex gap-2 bg-zinc-950 border border-zinc-850 rounded-xl p-2.5">
            <input 
              type="text" 
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Name..."
              className="flex-1 bg-zinc-900 border border-zinc-805 focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none"
            />
            <button 
              onClick={handleAddPlayer}
              className="bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg px-4 py-2 text-xs font-bold transition"
            >
              Add
            </button>
          </div>
        )}

        <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4">
          <p className="text-[10px] text-zinc-500 mb-3 font-bold uppercase tracking-widest">
            Exclusions (Check/Uncheck players for the next round)
          </p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
            {players.map((p) => {
              const isActive = activePlayers.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlayerExclusion(p)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-zinc-900 border-zinc-500 text-zinc-100 shadow-sm' 
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-500 hover:border-zinc-800'
                  }`}
                >
                  <Ban className={`w-3.5 h-3.5 ${isActive ? 'opacity-20' : 'text-rose-500 opacity-100'}`} />
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex gap-3">
        <button
          onClick={onEndSession}
          className="flex-1 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 font-semibold py-4 px-4 rounded-2xl transition duration-150 active:scale-95 text-xs uppercase tracking-wider"
        >
          End Session
        </button>
        <button
          onClick={onNextRound}
          className="flex-[2] bg-zinc-100 hover:bg-white text-zinc-950 font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-2 transition duration-150 active:scale-95 shadow-md text-xs uppercase tracking-wider"
        >
          <Sparkles className="w-4 h-4 fill-current text-zinc-950 animate-spin" style={{ animationDuration: '3s' }} />
          Start Next Round
        </button>
      </div>
    </div>
  );
}
