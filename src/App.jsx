import React, { useState, useEffect } from 'react';
import Setup from './components/Setup';
import Board from './components/Board';
import Ledger from './components/Ledger';
import { Award, ArrowLeftRight, Check, X, ShieldAlert, Sparkles, LogOut } from 'lucide-react';
import { calculateSettlements, getRoundedDistribution } from './utils/settlement';

export default function App() {
  const [sessionActive, setSessionActive] = useState(false);
  const [ticketPrice, setTicketPrice] = useState(0);
  const [players, setPlayers] = useState([]);
  const [activePlayers, setActivePlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [cumulativeLedger, setCumulativeLedger] = useState({});
  const [appMode, setAppMode] = useState('setup'); // 'setup' | 'board' | 'ledger' | 'final'
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
    setActivePlayers(setupData.players);
    setCurrentTickets(setupData.tickets);
    setCurrentPrizes(setupData.prizes);
    setGameIndex(1);
    setAppMode('board');
    setSessionActive(true);

    // Initialize cumulative ledger
    const initialLedger = {};
    setupData.players.forEach(p => {
      initialLedger[p] = 0;
    });
    setCumulativeLedger(initialLedger);

    // Save players globally
    const updatedSaved = Array.from(new Set([...savedPlayers, ...setupData.players]));
    setSavedPlayers(updatedSaved);
    localStorage.setItem('housie_players', JSON.stringify(updatedSaved));
  };

  const handleClaimPrize = (prizeId, winners, winningNumber) => {
    const updatedPrizes = currentPrizes.map(p => {
      if (p.id === prizeId) {
        return { ...p, winners, winningNumber };
      }
      return p;
    });
    setCurrentPrizes(updatedPrizes);
  };

  const handleEndGame = () => {
    if (!window.confirm("Are you sure you want to end this game round and see standings?")) return;

    // Calculate this game's ledger changes
    const newLedger = { ...cumulativeLedger };

    players.forEach(player => {
      const isPlayerActive = activePlayers.includes(player);
      const buyIn = isPlayerActive ? (currentTickets[player] || 0) * ticketPrice : 0;
      
      // Calculate winnings
      let winnings = 0;
      currentPrizes.forEach(prize => {
        if (prize.winners.includes(player)) {
          winnings += prize.value / prize.winners.length;
        }
      });

      const net = winnings - buyIn;
      newLedger[player] = (newLedger[player] || 0) + net;
    });

    setCumulativeLedger(newLedger);

    // Store completed game in history
    const completedGame = {
      gameIndex,
      tickets: currentTickets,
      prizes: currentPrizes,
      activePlayers
    };

    setGames([...games, completedGame]);
    setAppMode('ledger');
  };

  const handleUpdateLineup = (newLineup) => {
    setActivePlayers(newLineup);
  };

  const handleAddPlayerMidSession = (name) => {
    setPlayers([...players, name]);
    setActivePlayers([...activePlayers, name]);
    setCumulativeLedger({ ...cumulativeLedger, [name]: 0 });

    const updatedSaved = Array.from(new Set([...savedPlayers, name]));
    setSavedPlayers(updatedSaved);
    localStorage.setItem('housie_players', JSON.stringify(updatedSaved));
  };

  const handleNextRound = () => {
    setAppMode('round-setup-prompt');
  };

  const handleQuickStart = () => {
    const nextIdx = gameIndex + 1;
    setGameIndex(nextIdx);

    // Setup next tickets default based on last game active players
    const defaultTickets = {};
    activePlayers.forEach(p => {
      defaultTickets[p] = currentTickets[p] !== undefined ? currentTickets[p] : 1;
    });
    
    // Recalculate total tickets and pool
    const totalTickets = Object.values(defaultTickets).reduce((a, b) => a + b, 0);
    const totalPool = totalTickets * ticketPrice;

    // Copy prize presets with updated pool value
    const lastGame = games[games.length - 1];
    const pct = lastGame ? lastGame.prizes.map(p => p.pct) : [15, 15, 15, 15, 40];
    
    const finalValues = getRoundedDistribution(totalPool, pct);
    const defaultPrizes = [
      { id: 'jaldi5', name: 'Jaldi 5 (Early 5)', pct: pct[0], value: finalValues[0], winners: [], winningNumber: null },
      { id: 'line1', name: '1st Line (Top)', pct: pct[1], value: finalValues[1], winners: [], winningNumber: null },
      { id: 'line2', name: '2nd Line (Middle)', pct: pct[2], value: finalValues[2], winners: [], winningNumber: null },
      { id: 'line3', name: '3rd Line (Bottom)', pct: pct[3], value: finalValues[3], winners: [], winningNumber: null },
      { id: 'fullhousie', name: 'Full Housie', pct: pct[4], value: finalValues[4], winners: [], winningNumber: null }
    ];

    setCurrentTickets(defaultTickets);
    setCurrentPrizes(defaultPrizes);
    setAppMode('board');
  };

  const handleCustomSetupStart = (setupData) => {
    const nextIdx = gameIndex + 1;
    setGameIndex(nextIdx);
    setCurrentTickets(setupData.tickets);
    setCurrentPrizes(setupData.prizes);
    setAppMode('board');
  };

  const handleEndSession = () => {
    if (!window.confirm("Are you sure you want to end the session? This will lock current scores and show final payouts.")) return;
    setAppMode('final');
  };

  const handleDeleteSavedPlayer = (name) => {
    const updated = savedPlayers.filter(p => p !== name);
    setSavedPlayers(updated);
    localStorage.setItem('housie_players', JSON.stringify(updated));
  };

  const handleExitSession = () => {
    if (!window.confirm("Are you sure you want to quit this session and reset everything? This action cannot be undone.")) return;
    setSessionActive(false);
    setTicketPrice(0);
    setPlayers([]);
    setActivePlayers([]);
    setGames([]);
    setCumulativeLedger({});
    setAppMode('setup');
    setCurrentTickets({});
    setCurrentPrizes([]);
    setGameIndex(1);
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
    link.download = `housie_session_${new Date().toISOString().slice(0,10)}.json`;
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      {/* Universal header if active */}
      {sessionActive && (
        <header className="bg-slate-900/60 border-b border-slate-850 px-4 py-3 flex justify-between items-center sticky top-0 backdrop-blur-md z-30">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-slate-300 tracking-wider uppercase">Active Ledger Session</span>
          </div>
          
          <div className="flex gap-2">
            {appMode !== 'final' && (
              <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xxs font-bold">
                <button
                  onClick={() => setAppMode('board')}
                  className={`px-3 py-1.5 rounded-lg transition ${appMode === 'board' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Caller Board
                </button>
                <button
                  disabled={games.length === 0}
                  onClick={() => setAppMode('ledger')}
                  className={`px-3 py-1.5 rounded-lg transition disabled:opacity-30 ${appMode === 'ledger' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Ledger Standing
                </button>
              </div>
            )}
            
            <button
              onClick={handleExitSession}
              className="p-1.5 bg-slate-950 border border-slate-850 hover:bg-rose-950/20 hover:border-rose-900 rounded-xl text-slate-400 hover:text-rose-400 transition"
              title="Reset Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="flex-1 px-4 py-2">
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
          <div className="max-w-md mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100 my-4 text-center">
            <div>
              <span className="text-xxs font-extrabold text-violet-400 tracking-wider uppercase">Setup Round #{gameIndex + 1}</span>
              <h2 className="text-xl font-black mt-1">Configure Game Settings</h2>
            </div>
            
            <p className="text-xs text-slate-400">
              Choose to copy the previous ticket numbers & prize distributions or configure them manually.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleQuickStart}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-violet-950/40"
              >
                ⚡ Quick Start: Use Same Settings
              </button>
              <button
                onClick={() => setAppMode('round-setup-custom')}
                className="w-full bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 font-bold py-3.5 rounded-xl transition"
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
          <div className="max-w-md mx-auto space-y-6 pb-12 my-4">
            <div className="text-center bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-3">
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto animate-bounce" />
              <h2 className="text-2xl font-black text-slate-100">Session Complete!</h2>
              <p className="text-xs text-slate-400">
                P2P settlements have been calculated. Verify payout transactions below.
              </p>
            </div>

            {/* Financial Standings Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 tracking-widest uppercase flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <Award className="w-4 h-4 text-violet-400" />
                Final Session Ledgers
              </h3>
              
              <div className="space-y-2">
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
                      <div key={player} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-850/60 rounded-xl">
                        <div>
                          <span className="text-sm font-extrabold text-slate-200 block">{player}</span>
                          <span className="text-xxs text-slate-500 font-semibold uppercase tracking-wider">
                            Total Buy-in: ₹{buyIn} | Winnings: ₹{won.toFixed(0)}
                          </span>
                        </div>
                        <span className={`text-sm font-black ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {net >= 0 ? '+' : ''}₹{net.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Recommended payout directions */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 tracking-widest uppercase flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <ArrowLeftRight className="w-4 h-4 text-violet-400" />
                Recommended Settlements Matrix
              </h3>
              
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-2">
                {finalSettlements.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-2">
                    No transactions required. All net payouts equal zero.
                  </p>
                ) : (
                  finalSettlements.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-extrabold text-slate-300">{t.from}</span>
                        <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest px-1 py-0.5 bg-slate-950 border border-slate-850 rounded">PAYS</span>
                        <span className="font-extrabold text-slate-300">{t.to}</span>
                      </div>
                      <span className="font-black text-emerald-400 text-sm">
                        ₹{t.amount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Export Options */}
            <div className="flex gap-3">
              <button
                onClick={exportSessionCSV}
                className="flex-1 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-300 font-semibold py-3 rounded-2xl transition text-xs flex items-center justify-center"
              >
                ⬇️ Export CSV Ledger
              </button>
              <button
                onClick={exportSessionJSON}
                className="flex-1 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-300 font-semibold py-3 rounded-2xl transition text-xs flex items-center justify-center"
              >
                ⬇️ Export JSON State
              </button>
            </div>

            {/* Start New Session */}
            <button
              onClick={handleExitSession}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-2xl shadow-lg transition"
            >
              Start A New Session
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 bg-slate-950 border-t border-slate-900/60">
        <p className="text-xxs font-semibold text-slate-600 tracking-widest uppercase">
          Housy CLI to Mobile Engine • 2026
        </p>
      </footer>
    </div>
  );
}
