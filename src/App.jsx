import React, { useState, useEffect } from 'react';
import Setup from './components/Setup';
import Board from './components/Board';
import Ledger from './components/Ledger';
import { Award, ArrowLeftRight, Check, X, ShieldAlert, Sparkles, LogOut, ChevronRight } from 'lucide-react';
import { calculateSettlements, getRoundedDistribution } from './utils/settlement';

export default function App() {
  const [sessionActive, setSessionActive] = useState(false);
  const [ticketPrice, setTicketPrice] = useState(0);
  const [players, setPlayers] = useState([]);
  const [activePlayers, setActivePlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [cumulativeLedger, setCumulativeLedger] = useState({});
  const [appMode, setAppMode] = useState('setup'); // 'setup' | 'board' | 'ledger' | 'final' | 'round-setup-prompt' | 'round-setup-custom'
  const [savedPlayers, setSavedPlayers] = useState([]);

  // Game specific configs for the active game
  const [currentTickets, setCurrentTickets] = useState({});
  const [currentPrizes, setCurrentPrizes] = useState([]);
  const [gameIndex, setGameIndex] = useState(1);

  // Load saved players and session state on mount
  useEffect(() => {
    try {
      const storedPlayers = localStorage.getItem('housie_players');
      if (storedPlayers) {
        setSavedPlayers(JSON.parse(storedPlayers));
      }

      const storedSession = localStorage.getItem('housie_session_state');
      if (storedSession) {
        const data = JSON.parse(storedSession);
        setTicketPrice(data.ticketPrice);
        setPlayers(data.players);
        setActivePlayers(data.activePlayers);
        setGames(data.games);
        setCumulativeLedger(data.cumulativeLedger);
        setAppMode(data.appMode);
        setCurrentTickets(data.currentTickets);
        setCurrentPrizes(data.currentPrizes);
        setGameIndex(data.gameIndex);
        setSessionActive(true);
      }
    } catch (e) {
      console.error("Error reading from localStorage:", e);
    }
  }, []);

  // Save session state to localStorage whenever it changes
  useEffect(() => {
    if (sessionActive) {
      const sessionData = {
        ticketPrice,
        players,
        activePlayers,
        games,
        cumulativeLedger,
        appMode,
        currentTickets,
        currentPrizes,
        gameIndex
      };
      localStorage.setItem('housie_session_state', JSON.stringify(sessionData));
    } else {
      localStorage.removeItem('housie_session_state');
    }
  }, [sessionActive, ticketPrice, players, activePlayers, games, cumulativeLedger, appMode, currentTickets, currentPrizes, gameIndex]);

  const handleSetupComplete = (setupData) => {
    setTicketPrice(setupData.ticketPrice);
    setPlayers(setupData.players);
    setActivePlayers(setupData.players); // all players active initially
    setCurrentTickets(setupData.tickets);
    setCurrentPrizes(setupData.prizes);
    setGameIndex(1);
    
    // Save to known players dictionary
    const newSaved = Array.from(new Set([...savedPlayers, ...setupData.players])).sort();
    setSavedPlayers(newSaved);
    localStorage.setItem('housie_players', JSON.stringify(newSaved));
    
    // Initialize cumulative ledger
    const ledger = {};
    setupData.players.forEach(p => ledger[p] = 0);
    setCumulativeLedger(ledger);
    
    setSessionActive(true);
    setAppMode('board');
  };

  const handleDeleteSavedPlayer = (playerToDelete) => {
    const updatedSaved = savedPlayers.filter(p => p !== playerToDelete);
    setSavedPlayers(updatedSaved);
    localStorage.setItem('housie_players', JSON.stringify(updatedSaved));
  };

  const handleClaimPrize = (prizeId, winners, winningNumber) => {
    setCurrentPrizes(prevPrizes => 
      prevPrizes.map(p => 
        p.id === prizeId ? { ...p, winners, winningNumber } : p
      )
    );
  };

  const handleEndGame = () => {
    const totalBuyIn = Object.values(currentTickets).reduce((sum, count) => sum + count * ticketPrice, 0);
    const completedGame = {
      gameIndex,
      activePlayers,
      tickets: currentTickets,
      prizes: currentPrizes,
      totalBuyIn
    };

    const newGames = [...games, completedGame];
    setGames(newGames);

    // Update cumulative ledger
    const newLedger = { ...cumulativeLedger };
    activePlayers.forEach(p => {
      // Subtract buy-in
      const buyIn = (currentTickets[p] || 0) * ticketPrice;
      newLedger[p] -= buyIn;
    });

    currentPrizes.forEach(p => {
      if (p.winners && p.winners.length > 0) {
        const splitAmount = p.value / p.winners.length;
        p.winners.forEach(winner => {
          if (newLedger[winner] !== undefined) {
            newLedger[winner] += splitAmount;
          }
        });
      }
    });

    setCumulativeLedger(newLedger);
    setAppMode('ledger');
  };

  const handleUpdateLineup = (newActivePlayers) => {
    setActivePlayers(newActivePlayers);
  };

  const handleAddPlayerMidSession = (newPlayer) => {
    setPlayers([...players, newPlayer]);
    setActivePlayers([...activePlayers, newPlayer]);
    
    setCumulativeLedger(prev => ({
      ...prev,
      [newPlayer]: 0
    }));

    const newSaved = Array.from(new Set([...savedPlayers, newPlayer])).sort();
    setSavedPlayers(newSaved);
    localStorage.setItem('housie_players', JSON.stringify(newSaved));
  };

  const handleNextRound = () => {
    setAppMode('round-setup-prompt');
  };

  const handleQuickStart = () => {
    // Retain previous tickets and prizes, but filter tickets for active players
    const nextTickets = {};
    activePlayers.forEach(p => {
      nextTickets[p] = currentTickets[p] || 0;
    });
    
    // Reset prize winners
    const nextPrizes = currentPrizes.map(p => ({
      ...p,
      winners: [],
      winningNumber: null
    }));

    setCurrentTickets(nextTickets);
    setCurrentPrizes(nextPrizes);
    setGameIndex(gameIndex + 1);
    setAppMode('board');
  };

  const handleCustomSetupStart = (setupData) => {
    setCurrentTickets(setupData.tickets);
    setCurrentPrizes(setupData.prizes);
    setGameIndex(gameIndex + 1);
    setAppMode('board');
  };

  const handleEndSession = () => {
    setAppMode('final');
  };

  const handleExitSession = () => {
    if (confirm("Are you sure you want to end this session? Data will be lost if not exported.")) {
      setSessionActive(false);
      setAppMode('setup');
      setGames([]);
      setCumulativeLedger({});
      setCurrentTickets({});
      setCurrentPrizes([]);
      localStorage.removeItem('housie_session_state');
    }
  };

  const exportSessionJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      ticketPrice,
      players,
      games,
      cumulativeLedger,
      settlements: calculateSettlements(cumulativeLedger)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `housie_session_${data.timestamp.slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportSessionCSV = () => {
    let csvContent = "Player,Games Played,Total Tickets,Total Buy-In (INR),Total Winnings (INR),Net Balance (INR)\n";
    players.forEach(player => {
      let totalTickets = 0;
      let totalWon = 0;
      games.forEach(g => {
        totalTickets += g.tickets[player] || 0;
        g.prizes.forEach(p => {
          if (p.winners.includes(player)) {
            totalWon += p.value / p.winners.length;
          }
        });
      });
      const buyIn = totalTickets * ticketPrice;
      const net = cumulativeLedger[player] || 0;
      csvContent += `"${player}",${games.length},${totalTickets},${buyIn},${totalWon.toFixed(2)},${net.toFixed(2)}\n`;
    });

    csvContent += "\nRecommended Settlements\nFrom,Action,To,Amount (INR)\n";
    const settlements = calculateSettlements(cumulativeLedger);
    settlements.forEach(t => {
      csvContent += `"${t.from}","PAYS","${t.to}",${t.amount.toFixed(2)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `housie_session_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const finalSettlements = calculateSettlements(cumulativeLedger);

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/80 via-purple-950/20 to-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-cyan-500/30">
      
      {/* Background ambient auroras */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px] mix-blend-screen" />
      </div>

      {/* Main Container - Z-index elevates it above auroras */}
      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-6 z-10 relative">
        {/* Inline Navigation Card - Aurora Glass Style */}
        {sessionActive && appMode !== 'final' && (
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-3 flex justify-between items-center shadow-2xl">
            <div className="flex bg-black/40 rounded-2xl p-1 text-[11px] font-bold shadow-inner">
              <button
                onClick={() => setAppMode('board')}
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${appMode === 'board' ? 'bg-white/15 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-1 ring-white/20' : 'text-white/50 hover:text-white/90 hover:bg-white/5'}`}
              >
                Caller Board
              </button>
              <button
                disabled={games.length === 0}
                onClick={() => setAppMode('ledger')}
                className={`px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-30 ${appMode === 'ledger' ? 'bg-white/15 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-1 ring-white/20' : 'text-white/50 hover:text-white/90 hover:bg-white/5'}`}
              >
                Ledger Standings
              </button>
            </div>
            
            <button
              onClick={handleExitSession}
              className="p-2.5 bg-black/40 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 rounded-xl text-white/50 hover:text-rose-400 transition-all duration-200 shadow-inner"
              title="Quit Session"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}

        {appMode === 'setup' && (
          <Setup onComplete={handleSetupComplete} savedPlayers={savedPlayers} onDeleteSavedPlayer={handleDeleteSavedPlayer} />
        )}

        {appMode === 'board' && (
          <Board
            gameIndex={gameIndex}
            ticketPrice={ticketPrice}
            activePlayers={activePlayers}
            tickets={currentTickets}
            prizes={currentPrizes}
            onClaimPrize={handleClaimPrize}
            onEndGame={handleEndGame}
          />
        )}

        {appMode === 'ledger' && (
          <Ledger
            players={players}
            activePlayers={activePlayers}
            tickets={currentTickets}
            ticketPrice={ticketPrice}
            games={games}
            cumulativeLedger={cumulativeLedger}
            onUpdateLineup={handleUpdateLineup}
            onAddPlayerMidSession={handleAddPlayerMidSession}
            onNextRound={handleNextRound}
            onEndSession={handleEndSession}
          />
        )}

        {appMode === 'round-setup-prompt' && (
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8 text-center">
            <div>
              <span className="text-[11px] font-black text-cyan-400 tracking-widest uppercase shadow-cyan-400/20 drop-shadow-md">Setup Round #{gameIndex + 1}</span>
              <h2 className="text-2xl font-black mt-2 tracking-wide text-white">Configure Settings</h2>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed font-medium px-2">
              Choose to copy the previous ticket numbers & prize distributions or configure them manually.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleQuickStart}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black py-4 rounded-2xl transition-all duration-200 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.3)] tracking-wide"
              >
                ⚡ Quick Start: Use Same Settings
              </button>
              <button
                onClick={() => setAppMode('round-setup-custom')}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-bold py-4 rounded-2xl transition-all duration-200 active:scale-95 tracking-wide"
              >
                ⚙️ Custom Setup: Configure Tickets
              </button>
            </div>
          </div>
        )}

        {appMode === 'round-setup-custom' && (
          <Setup
            initialStep={2}
            initialPlayers={activePlayers}
            initialTicketPrice={ticketPrice}
            initialTickets={currentTickets}
            onComplete={handleCustomSetupStart}
          />
        )}

        {appMode === 'final' && (
          <div className="space-y-6 pb-12">
            <div className="text-center bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-3">
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              <h2 className="text-2xl font-black text-white uppercase tracking-widest">Session Complete</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                P2P settlements have been calculated. Verify payout transactions below.
              </p>
            </div>

            {/* Financial Standings Summary */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-5">
              <h3 className="text-sm font-black text-slate-300 tracking-widest uppercase flex items-center gap-2 border-b border-white/10 pb-4">
                <Award className="w-5 h-5 text-cyan-400" />
                Final Session Ledgers
              </h3>
              
              <div className="space-y-3">
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

                    return (
                      <div key={player} className="flex justify-between items-center p-4 bg-black/40 border border-white/5 rounded-2xl shadow-inner">
                        <div>
                          <span className="text-lg font-extrabold text-white block tracking-wide">{player}</span>
                          <span className="text-xs text-slate-400 font-medium mt-1 block">
                            Total Buy-in: ₹{buyIn} | Winnings: ₹{won.toFixed(0)}
                          </span>
                        </div>
                        <span className={`text-xl font-black drop-shadow-md ${net > 0 ? 'text-emerald-400' : net < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {net > 0 ? '+' : ''}₹{net.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Recommended payout directions */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-5">
              <h3 className="text-sm font-black text-slate-300 tracking-widest uppercase flex items-center gap-2 border-b border-white/10 pb-4">
                <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
                Recommended Settlements
              </h3>
              
              <div className="bg-black/40 border border-white/5 rounded-[2rem] p-5 space-y-3 shadow-inner">
                {finalSettlements.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-4 font-medium">
                    No transactions required. All net payouts equal zero.
                  </p>
                ) : (
                  finalSettlements.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/10 p-5 rounded-2xl shadow-sm hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3 text-base">
                        <span className="font-extrabold text-slate-100">{t.from}</span>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30">
                          <ChevronRight className="w-5 h-5 text-rose-400" />
                        </div>
                        <span className="font-extrabold text-slate-100">{t.to}</span>
                      </div>
                      <span className="font-black text-emerald-400 text-xl drop-shadow-md">
                        ₹{t.amount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Export Options */}
            <div className="flex gap-4">
              <button
                onClick={exportSessionCSV}
                className="flex-1 bg-white/10 border border-white/10 hover:bg-white/20 text-slate-200 font-bold py-4 rounded-2xl transition-all duration-200 text-sm flex items-center justify-center cursor-pointer active:scale-95 tracking-wide"
              >
                ⬇️ Export CSV Ledger
              </button>
              <button
                onClick={exportSessionJSON}
                className="flex-1 bg-white/10 border border-white/10 hover:bg-white/20 text-slate-200 font-bold py-4 rounded-2xl transition-all duration-200 text-sm flex items-center justify-center cursor-pointer active:scale-95 tracking-wide"
              >
                ⬇️ Export JSON State
              </button>
            </div>

            {/* Start New Session */}
            <button
              onClick={handleExitSession}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black py-5 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-200 active:scale-95 tracking-widest uppercase text-sm mt-4"
            >
              Start New Session
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 bg-black/40 backdrop-blur-xl border-t border-white/5 relative z-10">
        <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
          Housy CLI to Mobile Engine • 2026
        </p>
      </footer>
    </div>
  );
}
