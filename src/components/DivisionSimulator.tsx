import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Activity, ChevronLeft, ChevronRight, Trophy, BarChart3, Zap } from 'lucide-react';
import { League, Match, Team, Division } from '../types';
import { simulateMatch, adjustTeamCoefficients, calculateStandings, sortStandings } from '../utils/simulation';

interface DivisionSimulatorProps {
  league: League;
  division: Division;
  onUpdateMatch: (match: Match) => void;
  onUpdateMultipleMatches: (matches: Match[]) => void;
  onUpdateTeam: (team: Team) => void;
}

interface LiveMatch extends Match {
  currentHomeScore: number;
  currentAwayScore: number;
  isLive: boolean;
  currentMinute: number;
  finalHomeScore: number;
  finalAwayScore: number;
  homeGoalTimes: number[];
  awayGoalTimes: number[];
}

export const DivisionSimulator: React.FC<DivisionSimulatorProps> = ({
  league,
  division,
  onUpdateMatch,
  onUpdateMultipleMatches,
  onUpdateTeam
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [activeView, setActiveView] = useState<'matches' | 'standings'>('matches');

  // Get matches for this division only
  const divisionMatches = league.matches.filter(match => match.divisionId === division.id);
  const unplayedMatches = divisionMatches.filter(match => !match.played);
  const totalMatches = divisionMatches.length;
  const playedMatches = totalMatches - unplayedMatches.length;

  const getTeamById = (teamId: string): Team | undefined => {
    return division.teams.find(t => t.id === teamId);
  };

  // Generate random goal times for a match
  const generateGoalTimes = (goalCount: number): number[] => {
    if (goalCount === 0) return [];
    
    const goalTimes: number[] = [];
    for (let i = 0; i < goalCount; i++) {
      const randomMinute = Math.floor(Math.random() * 89) + 1;
      goalTimes.push(randomMinute);
    }
    
    return goalTimes.sort((a, b) => a - b);
  };

  const simulateRoundLive = async () => {
    const roundMatches = unplayedMatches.filter(match => match.round === currentRound);
    
    if (roundMatches.length === 0) {
      return;
    }

    setIsSimulating(true);
    console.log(`🎮 Starting simulation of ${division.name} round ${currentRound} with ${roundMatches.length} matches`);
    
    // Calculate final results first
    const finalResults: Array<{match: Match, homeScore: number, awayScore: number}> = [];
    
    roundMatches.forEach(match => {
      const homeTeam = getTeamById(match.homeTeamId);
      const awayTeam = getTeamById(match.awayTeamId);
      
      if (homeTeam && awayTeam) {
        const result = simulateMatch(homeTeam, awayTeam);
        finalResults.push({
          match,
          homeScore: result.homeScore,
          awayScore: result.awayScore
        });
      }
    });

    // Initialize live matches
    const initialLiveMatches: LiveMatch[] = finalResults.map(result => ({
      ...result.match,
      currentHomeScore: 0,
      currentAwayScore: 0,
      isLive: true,
      currentMinute: 0,
      finalHomeScore: result.homeScore,
      finalAwayScore: result.awayScore,
      homeGoalTimes: generateGoalTimes(result.homeScore),
      awayGoalTimes: generateGoalTimes(result.awayScore)
    }));
    
    setLiveMatches(initialLiveMatches);

    // Animate the simulation
    const simulationTime = league.settings.simulationTime * 1000;
    const updateInterval = 150;
    const totalUpdates = simulationTime / updateInterval;
    
    let currentUpdate = 0;

    const intervalId = setInterval(() => {
      currentUpdate++;
      const progress = (currentUpdate / totalUpdates) * 100;
      const currentMinute = Math.floor((progress / 100) * 90);
      
      setSimulationProgress(progress);
      
      // Update live scores based on goal times
      setLiveMatches(prevLiveMatches => 
        prevLiveMatches.map(liveMatch => {
          const currentHomeScore = liveMatch.homeGoalTimes.filter(goalTime => goalTime <= currentMinute).length;
          const currentAwayScore = liveMatch.awayGoalTimes.filter(goalTime => goalTime <= currentMinute).length;
          
          return {
            ...liveMatch,
            currentHomeScore,
            currentAwayScore,
            currentMinute
          };
        })
      );

      // Complete simulation
      if (currentUpdate >= totalUpdates) {
        clearInterval(intervalId);
        
        // Show final scores
        setLiveMatches(prevLiveMatches => 
          prevLiveMatches.map(liveMatch => ({
            ...liveMatch,
            currentMinute: 90,
            currentHomeScore: liveMatch.finalHomeScore,
            currentAwayScore: liveMatch.finalAwayScore
          }))
        );

        // Apply results and coefficient adjustments
        setTimeout(() => {
          const updatedMatches = finalResults.map(result => ({
            ...result.match,
            homeScore: result.homeScore,
            awayScore: result.awayScore,
            played: true
          }));

          // Apply coefficient adjustments
          finalResults.forEach(result => {
            const homeTeam = getTeamById(result.match.homeTeamId);
            const awayTeam = getTeamById(result.match.awayTeamId);
            
            if (homeTeam && awayTeam) {
              const { updatedHomeTeam, updatedAwayTeam } = adjustTeamCoefficients(
                homeTeam, 
                awayTeam, 
                result.homeScore, 
                result.awayScore
              );
              
              if (updatedHomeTeam.attackStrength !== homeTeam.attackStrength || 
                  updatedHomeTeam.defenseStrength !== homeTeam.defenseStrength) {
                onUpdateTeam(updatedHomeTeam);
              }
              
              if (updatedAwayTeam.attackStrength !== awayTeam.attackStrength || 
                  updatedAwayTeam.defenseStrength !== awayTeam.defenseStrength) {
                onUpdateTeam(updatedAwayTeam);
              }
            }
          });

          onUpdateMultipleMatches(updatedMatches);

          setTimeout(() => {
            setLiveMatches([]);
            setIsSimulating(false);
            setSimulationProgress(0);
            console.log(`✅ ${division.name} round ${currentRound} completed`);
          }, 1000);
        }, 1000);
      }
    }, updateInterval);
  };

  // NEW: Instant simulation of all remaining matches
  const simulateAllInstant = () => {
    if (unplayedMatches.length === 0) return;
    
    setIsSimulating(true);
    console.log(`⚡ Instantly simulating all ${unplayedMatches.length} remaining matches in ${division.name}`);
    
    const updatedMatches: Match[] = [];
    
    // Simulate all unplayed matches instantly
    unplayedMatches.forEach(match => {
      const homeTeam = getTeamById(match.homeTeamId);
      const awayTeam = getTeamById(match.awayTeamId);
      
      if (homeTeam && awayTeam) {
        const result = simulateMatch(homeTeam, awayTeam);
        const updatedMatch: Match = {
          ...match,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          played: true
        };
        
        updatedMatches.push(updatedMatch);
        
        // Apply coefficient adjustments
        const { updatedHomeTeam, updatedAwayTeam } = adjustTeamCoefficients(
          homeTeam, 
          awayTeam, 
          result.homeScore, 
          result.awayScore
        );
        
        if (updatedHomeTeam.attackStrength !== homeTeam.attackStrength || 
            updatedHomeTeam.defenseStrength !== homeTeam.defenseStrength) {
          onUpdateTeam(updatedHomeTeam);
        }
        
        if (updatedAwayTeam.attackStrength !== awayTeam.attackStrength || 
            updatedAwayTeam.defenseStrength !== awayTeam.defenseStrength) {
          onUpdateTeam(updatedAwayTeam);
        }
      }
    });
    
    // Update all matches at once
    if (updatedMatches.length > 0) {
      onUpdateMultipleMatches(updatedMatches);
    }
    
    setIsSimulating(false);
    console.log(`✅ Instantly completed all matches in ${division.name}`);
  };

  const resetDivision = () => {
    const matchesToReset = divisionMatches.filter(match => match.played).map(match => ({
      ...match,
      homeScore: undefined,
      awayScore: undefined,
      played: false
    }));
    
    if (matchesToReset.length > 0) {
      onUpdateMultipleMatches(matchesToReset);
    }
    
    setCurrentRound(1);
    setLiveMatches([]);
  };

  const currentRoundMatches = divisionMatches.filter(match => match.round === currentRound);
  const maxRound = Math.max(...divisionMatches.map(m => m.round), 1);

  // Calculate standings for this division
  const standings = calculateStandings(divisionMatches, division.teams);
  const sortedStandings = sortStandings(Object.values(standings));

  const getPositionIcon = (position: number) => {
    if (position <= league.settings.promotionCount && division.level > 1) {
      return <div className="w-2 h-2 bg-green-500 rounded-full" title="Promotion" />;
    }
    if (position > division.teams.length - league.settings.relegationCount && division.level < league.divisions.length) {
      return <div className="w-2 h-2 bg-red-500 rounded-full" title="Relegation" />;
    }
    return <div className="w-2 h-2 bg-gray-300 rounded-full" />;
  };

  const getPositionBg = (position: number) => {
    if (position <= league.settings.promotionCount && division.level > 1) {
      return 'bg-green-50 border-l-4 border-green-500';
    }
    if (position > division.teams.length - league.settings.relegationCount && division.level < league.divisions.length) {
      return 'bg-red-50 border-l-4 border-red-500';
    }
    return 'bg-white';
  };

  return (
    <div className="space-y-6">
      {/* Division Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{division.name}</h2>
            <p className="text-gray-600">Level {division.level} • {division.teams.length} teams</p>
          </div>
          <div className="flex items-center space-x-4">
            {isSimulating && liveMatches.length > 0 && (
              <div className="flex items-center space-x-2 text-red-600">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">LIVE</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{league.settings.simulationTime}s</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className="bg-green-50 rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{playedMatches}</div>
            <div className="text-xs sm:text-sm text-gray-600">Matches Played</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{unplayedMatches.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Remaining</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{currentRound}</div>
            <div className="text-xs sm:text-sm text-gray-600">Current Round</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{maxRound}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Rounds</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Division Progress</span>
            <span className="text-sm text-gray-600">{Math.round((playedMatches / totalMatches) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(playedMatches / totalMatches) * 100}%` }}
            />
          </div>
        </div>

        {/* Live Simulation Progress */}
        {isSimulating && liveMatches.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Simulating Round {currentRound}...</span>
              <span className="text-sm text-gray-600">
                {liveMatches.length > 0 ? `${liveMatches[0].currentMinute}'` : '0\''}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${simulationProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={simulateRoundLive}
            disabled={isSimulating || unplayedMatches.length === 0}
            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSimulating ? (
              <Pause className="w-5 h-5 mr-2" />
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            Simulate Round {currentRound}
          </button>
          
          <button
            onClick={simulateAllInstant}
            disabled={isSimulating || unplayedMatches.length === 0}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Zap className="w-5 h-5 mr-2" />
            Visa Alla Resultat
          </button>
          
          <button
            onClick={resetDivision}
            disabled={isSimulating || playedMatches === 0}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset Division
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
            <button
              onClick={() => setActiveView('matches')}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeView === 'matches'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Play className="w-5 h-5 mr-2" />
              Matches
            </button>
            <button
              onClick={() => setActiveView('standings')}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeView === 'standings'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy className="w-5 h-5 mr-2" />
              Standings
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeView === 'matches' ? (
            <div>
              {/* Round Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  Round {currentRound} Matches
                  {isSimulating && liveMatches.length > 0 && (
                    <span className="ml-2 text-red-600 text-sm font-normal animate-pulse">● LIVE</span>
                  )}
                </h3>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => setCurrentRound(Math.max(1, currentRound - 1))}
                    disabled={currentRound <= 1 || isSimulating}
                    className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  <span className="text-sm text-gray-500 px-3">
                    {currentRound} / {maxRound}
                  </span>
                  <button
                    onClick={() => setCurrentRound(Math.min(maxRound, currentRound + 1))}
                    disabled={currentRound >= maxRound || isSimulating}
                    className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>

              {/* Matches */}
              {currentRoundMatches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No matches in round {currentRound}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {currentRoundMatches.map((match) => {
                    const homeTeam = getTeamById(match.homeTeamId);
                    const awayTeam = getTeamById(match.awayTeamId);
                    const liveMatch = liveMatches.find(lm => lm.id === match.id);
                    
                    if (!homeTeam || !awayTeam) return null;
                    
                    const isLive = liveMatch?.isLive && isSimulating;
                    const displayHomeScore = isLive ? liveMatch.currentHomeScore : match.homeScore;
                    const displayAwayScore = isLive ? liveMatch.currentAwayScore : match.awayScore;
                    
                    return (
                      <div
                        key={match.id}
                        className={`p-4 rounded-lg border transition-all ${
                          isLive
                            ? 'bg-red-50 border-red-300 shadow-md'
                            : match.played 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-right flex-1 min-w-0">
                            <div className="font-medium truncate">{homeTeam.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              AK:{homeTeam.attackStrength.toFixed(2)} FK:{homeTeam.defenseStrength.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-center min-w-[80px] sm:min-w-[100px] mx-2 sm:mx-4">
                            {match.played || isLive ? (
                              <div className={`text-lg sm:text-xl font-bold ${isLive ? 'text-red-600' : 'text-gray-900'}`}>
                                {displayHomeScore} - {displayAwayScore}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-lg">vs</div>
                            )}
                            {isLive && (
                              <div className="text-xs text-red-600 font-medium mt-1">
                                {liveMatch.currentMinute}'
                              </div>
                            )}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-medium truncate">{awayTeam.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              AK:{awayTeam.attackStrength.toFixed(2)} FK:{awayTeam.defenseStrength.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Standings View */
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Division Standings</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-2 py-2 sm:px-4 sm:py-3">Pos</th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3">Team</th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">P</th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">W</th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">D</th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">L</th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">GF</th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">GA</th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">GD</th>
                      <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedStandings.map((stats, index) => {
                      const team = getTeamById(stats.teamId);
                      const position = index + 1;
                      
                      if (!team) return null;
                      
                      return (
                        <tr 
                          key={stats.teamId} 
                          className={`hover:bg-gray-50 ${getPositionBg(position)}`}
                        >
                          <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{position}</span>
                              {getPositionIcon(position)}
                            </div>
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{team.name}</div>
                              <div className="text-xs text-gray-500 hidden sm:block">
                                AK:{team.attackStrength.toFixed(2)} FK:{team.defenseStrength.toFixed(2)}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                            {stats.played}
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                            {stats.won}
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                            {stats.drawn}
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                            {stats.lost}
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                            {stats.goalsFor}
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                            {stats.goalsAgainst}
                          </td>
                          <td className={`px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm font-medium ${
                            stats.goalDifference > 0 ? 'text-green-600' : 
                            stats.goalDifference < 0 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {stats.goalDifference > 0 ? '+' : ''}{stats.goalDifference}
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                            {stats.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs text-gray-600">
                {league.settings.promotionCount > 0 && division.level > 1 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Promotion ({league.settings.promotionCount} teams)</span>
                  </div>
                )}
                {league.settings.relegationCount > 0 && division.level < league.divisions.length && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Relegation ({league.settings.relegationCount} teams)</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};