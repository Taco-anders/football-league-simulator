import React, { useState } from 'react';
import { Calendar, Search, Trophy, Users, Target, ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';
import { League, SeasonHistory, DivisionSeasonResult, TeamSeasonResult, HistoricalMatch } from '../types';

interface HistoryViewProps {
  league: League;
}

interface MatchSearchResult {
  season: number;
  round: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  divisionName: string;
  divisionLevel: number;
}

interface TeamPerformanceData {
  teamId: string;
  teamName: string;
  seasonData: Array<{
    season: number;
    position: number;
    divisionLevel: number;
  }>;
  color: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ league }) => {
  const [activeView, setActiveView] = useState<'seasons' | 'matches' | 'performance'>('seasons');
  const [selectedSeason, setSelectedSeason] = useState<number>(league.seasonHistory.length > 0 ? league.seasonHistory[league.seasonHistory.length - 1].season : 1);
  const [homeTeamSearch, setHomeTeamSearch] = useState('');
  const [awayTeamSearch, setAwayTeamSearch] = useState('');
  const [matchResults, setMatchResults] = useState<MatchSearchResult[]>([]);
  
  // Performance chart state
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // Team colors for the chart (excluding red which is used for division lines)
  const teamColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
  ];

  // Get all unique team names for search suggestions
  const getAllTeamNames = (): string[] => {
    const teamNames = new Set<string>();
    
    // From current league
    league.divisions.forEach(division => {
      division.teams.forEach(team => {
        teamNames.add(team.name);
      });
    });
    
    // From season history
    league.seasonHistory.forEach(season => {
      season.divisions.forEach(division => {
        division.finalStandings.forEach(standing => {
          teamNames.add(standing.teamName);
        });
      });
    });
    
    return Array.from(teamNames).sort();
  };

  const allTeamNames = getAllTeamNames();

  // Get all teams that have played in any season
  const getAllTeamsWithHistory = (): Array<{id: string, name: string}> => {
    const teams = new Map<string, string>();
    
    // From season history
    league.seasonHistory.forEach(season => {
      season.divisions.forEach(division => {
        division.finalStandings.forEach(standing => {
          teams.set(standing.teamId, standing.teamName);
        });
      });
    });
    
    // From current league
    league.divisions.forEach(division => {
      division.teams.forEach(team => {
        teams.set(team.id, team.name);
      });
    });
    
    return Array.from(teams.entries()).map(([id, name]) => ({id, name})).sort((a, b) => a.name.localeCompare(b.name));
  };

  const teamsWithHistory = getAllTeamsWithHistory();

  // Generate performance data for selected teams
  const generatePerformanceData = (): TeamPerformanceData[] => {
    return selectedTeams.map((teamId, index) => {
      const team = teamsWithHistory.find(t => t.id === teamId);
      if (!team) return null;

      const seasonData: Array<{season: number, position: number, divisionLevel: number}> = [];

      // Get data from completed seasons
      league.seasonHistory.forEach(season => {
        season.divisions.forEach(division => {
          const standing = division.finalStandings.find(s => s.teamId === teamId);
          if (standing) {
            seasonData.push({
              season: season.season,
              position: standing.position,
              divisionLevel: division.divisionLevel
            });
          }
        });
      });

      return {
        teamId,
        teamName: team.name,
        seasonData: seasonData.sort((a, b) => a.season - b.season),
        color: teamColors[index % teamColors.length]
      };
    }).filter(Boolean) as TeamPerformanceData[];
  };

  const performanceData = generatePerformanceData();

  // Calculate chart dimensions and scales
  const getChartData = () => {
    if (performanceData.length === 0 || league.seasonHistory.length === 0) {
      return null;
    }

    const allSeasons = league.seasonHistory.map(s => s.season).sort((a, b) => a - b);
    const minSeason = Math.min(...allSeasons);
    const maxSeason = Math.max(...allSeasons);
    
    // Calculate max position across all divisions
    const maxTeamsPerDivision = Math.max(...league.divisions.map(d => d.teams.length));
    const maxPosition = maxTeamsPerDivision;
    
    return {
      minSeason,
      maxSeason,
      maxPosition,
      seasons: allSeasons,
      totalDivisions: league.divisions.length
    };
  };

  const chartData = getChartData();

  // Handle team selection
  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams(prev => {
      if (prev.includes(teamId)) {
        return prev.filter(id => id !== teamId);
      } else if (prev.length < 4) {
        return [...prev, teamId];
      }
      return prev;
    });
  };

  // Search for matches between specific teams
  const searchMatches = () => {
    if (!homeTeamSearch.trim() || !awayTeamSearch.trim()) {
      setMatchResults([]);
      return;
    }

    console.log(`🔍 Searching for matches: ${homeTeamSearch} vs ${awayTeamSearch}`);
    
    const results: MatchSearchResult[] = [];
    
    // Search through historical matches
    league.seasonHistory.forEach(season => {
      season.matches.forEach(match => {
        // Check if this match matches our search criteria (exact match for home team, away team)
        const homeMatches = match.homeTeamName.toLowerCase().includes(homeTeamSearch.toLowerCase());
        const awayMatches = match.awayTeamName.toLowerCase().includes(awayTeamSearch.toLowerCase());
        
        if (homeMatches && awayMatches) {
          results.push({
            season: season.season,
            round: match.round,
            homeTeam: match.homeTeamName,
            awayTeam: match.awayTeamName,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            divisionName: match.divisionName,
            divisionLevel: match.divisionLevel
          });
        }
      });
    });
    
    // Also search current season matches (if played)
    league.matches.filter(m => m.played).forEach(match => {
      // Find team names
      let homeTeamName = '';
      let awayTeamName = '';
      let divisionName = '';
      let divisionLevel = 0;
      
      league.divisions.forEach(division => {
        const homeTeam = division.teams.find(t => t.id === match.homeTeamId);
        const awayTeam = division.teams.find(t => t.id === match.awayTeamId);
        
        if (homeTeam && awayTeam) {
          homeTeamName = homeTeam.name;
          awayTeamName = awayTeam.name;
          divisionName = division.name;
          divisionLevel = division.level;
        }
      });
      
      // Check if this match matches our search criteria
      const homeMatches = homeTeamName.toLowerCase().includes(homeTeamSearch.toLowerCase());
      const awayMatches = awayTeamName.toLowerCase().includes(awayTeamSearch.toLowerCase());
      
      if (homeMatches && awayMatches && match.homeScore !== undefined && match.awayScore !== undefined) {
        results.push({
          season: league.currentSeason,
          round: match.round,
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          divisionName,
          divisionLevel
        });
      }
    });
    
    // Sort results by season and round (newest first)
    results.sort((a, b) => {
      if (a.season !== b.season) return b.season - a.season; // Newest season first
      return a.round - b.round; // Earlier rounds first within same season
    });
    
    setMatchResults(results);
    console.log(`✅ Found ${results.length} matches between ${homeTeamSearch} and ${awayTeamSearch}`);
  };

  // Get season data
  const getSeasonData = (season: number): SeasonHistory | null => {
    return league.seasonHistory.find(s => s.season === season) || null;
  };

  const selectedSeasonData = getSeasonData(selectedSeason);
  const availableSeasons = league.seasonHistory.map(s => s.season).sort((a, b) => b - a);

  const hasHistoryData = league.seasonHistory.length > 0;

  if (!hasHistoryData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">Ingen historisk data</h3>
          <p className="text-gray-400">
            Slutför minst en säsong för att se historik. Spela alla matcher i alla divisioner för att slutföra en säsong.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Historik</h2>
            <p className="text-gray-600">
              {league.seasonHistory.length} slutförda säsonger • Nuvarande säsong: {league.currentSeason}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Säsongshistorik</span>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
            <button
              onClick={() => setActiveView('seasons')}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeView === 'seasons'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy className="w-5 h-5 mr-2" />
              Säsongstabeller
            </button>
            <button
              onClick={() => setActiveView('performance')}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeView === 'performance'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Prestationsdiagram
            </button>
            <button
              onClick={() => setActiveView('matches')}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeView === 'matches'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Search className="w-5 h-5 mr-2" />
              Matchsökning
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeView === 'seasons' && (
            <div>
              {/* Season Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  Säsong {selectedSeason} - Sluttabeller
                </h3>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => {
                      const currentIndex = availableSeasons.indexOf(selectedSeason);
                      if (currentIndex < availableSeasons.length - 1) {
                        setSelectedSeason(availableSeasons[currentIndex + 1]);
                      }
                    }}
                    disabled={availableSeasons.indexOf(selectedSeason) >= availableSeasons.length - 1}
                    className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Tidigare</span>
                  </button>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {availableSeasons.map(season => (
                      <option key={season} value={season}>
                        Säsong {season}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const currentIndex = availableSeasons.indexOf(selectedSeason);
                      if (currentIndex > 0) {
                        setSelectedSeason(availableSeasons[currentIndex - 1]);
                      }
                    }}
                    disabled={availableSeasons.indexOf(selectedSeason) <= 0}
                    className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="hidden sm:inline">Senare</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>

              {/* Season Tables */}
              {selectedSeasonData ? (
                <div className="space-y-8">
                  {selectedSeasonData.divisions
                    .sort((a, b) => a.divisionLevel - b.divisionLevel)
                    .map((division) => (
                      <div key={division.divisionId} className="bg-gray-50 rounded-lg p-4 sm:p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Users className="w-5 h-5 mr-2 text-green-600" />
                          Division {division.divisionLevel}
                        </h4>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-white">
                              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-2 py-2 sm:px-4 sm:py-3 rounded-l-lg">Pos</th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3">Lag</th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">S</th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">V</th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">O</th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">F</th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">GM</th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">IM</th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">MS</th>
                                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center rounded-r-lg">P</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {division.finalStandings.map((standing) => {
                                const isChampion = division.divisionLevel === 1 && standing.position === 1;
                                const isPromoted = standing.position <= league.settings.promotionCount && division.divisionLevel > 1;
                                const isRelegated = standing.position > division.finalStandings.length - league.settings.relegationCount && division.divisionLevel < league.divisions.length;
                                
                                return (
                                  <tr 
                                    key={standing.teamId} 
                                    className={`hover:bg-gray-50 ${
                                      isChampion ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                                      isPromoted ? 'bg-green-50 border-l-4 border-green-500' :
                                      isRelegated ? 'bg-red-50 border-l-4 border-red-500' : ''
                                    }`}
                                  >
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900">{standing.position}</span>
                                        {isChampion && <Trophy className="w-4 h-4 text-yellow-500" />}
                                        {isPromoted && <Target className="w-4 h-4 text-green-500" />}
                                        {isRelegated && <Target className="w-4 h-4 text-red-500 transform rotate-180" />}
                                      </div>
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{standing.teamName}</div>
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                                      {standing.played}
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                                      {standing.won}
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                                      {standing.drawn}
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                                      {standing.lost}
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                                      {standing.goalsFor}
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                                      {standing.goalsAgainst}
                                    </td>
                                    <td className={`px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm font-medium ${
                                      standing.goalDifference > 0 ? 'text-green-600' : 
                                      standing.goalDifference < 0 ? 'text-red-600' : 'text-gray-900'
                                    }`}>
                                      {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                                      {standing.points}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>Ingen data för säsong {selectedSeason}</p>
                </div>
              )}
            </div>
          )}

          {activeView === 'performance' && (
            /* Performance Chart View */
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Prestationsdiagram över säsonger</h3>
              
              {/* Team Selection */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">
                  Välj lag att visa (max 4)
                </h4>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {teamsWithHistory.map(team => (
                    <label
                      key={team.id}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTeams.includes(team.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes(team.id)}
                        onChange={() => handleTeamToggle(team.id)}
                        disabled={!selectedTeams.includes(team.id) && selectedTeams.length >= 4}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-2 w-full">
                        {selectedTeams.includes(team.id) && (
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ 
                              backgroundColor: teamColors[selectedTeams.indexOf(team.id) % teamColors.length] 
                            }}
                          />
                        )}
                        <span className={`text-sm font-medium truncate ${
                          selectedTeams.includes(team.id) ? 'text-green-900' : 'text-gray-700'
                        }`}>
                          {team.name}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Välj 1-4 lag för att se deras prestationer över alla säsonger. Varje lag får en unik färg.
                </p>
              </div>

              {/* Chart */}
              {selectedTeams.length > 0 && chartData ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                  <div className="mb-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">
                      Placering över säsonger
                    </h4>
                    <p className="text-sm text-gray-600">
                      Y-axel: Placering (1 = bäst, högst upp), X-axel: Säsong. Röda linjer markerar divisionsbrytningar.
                    </p>
                  </div>
                  
                  {/* Chart Container */}
                  <div className="relative">
                    <svg 
                      viewBox="0 0 800 500" 
                      className="w-full h-auto border border-gray-200 rounded"
                      style={{ minHeight: '300px' }}
                    >
                      {/* Chart background */}
                      <rect x="80" y="40" width="680" height="400" fill="#fafafa" stroke="#e5e7eb" />
                      
                      {/* Division separator lines (horizontal red lines) */}
                      {Array.from({ length: chartData.totalDivisions - 1 }, (_, i) => {
                        const divisionBreak = (i + 1) * chartData.maxPosition;
                        // INVERTED: Start from top (40) and go down
                        const y = 40 + ((divisionBreak / (chartData.totalDivisions * chartData.maxPosition)) * 400);
                        return (
                          <line
                            key={i}
                            x1="80"
                            y1={y}
                            x2="760"
                            y2={y}
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                        );
                      })}
                      
                      {/* Y-axis labels (positions) */}
                      {Array.from({ length: chartData.totalDivisions }, (_, divIndex) => {
                        return Array.from({ length: chartData.maxPosition }, (_, posIndex) => {
                          const position = posIndex + 1;
                          const absolutePosition = divIndex * chartData.maxPosition + position;
                          // INVERTED: Start from top (40) and go down
                          const y = 40 + ((absolutePosition / (chartData.totalDivisions * chartData.maxPosition)) * 400);
                          
                          // Only show every 2nd position to avoid clutter
                          if (position % 2 === 1) {
                            return (
                              <g key={`${divIndex}-${posIndex}`}>
                                <line x1="75" y1={y} x2="80" y2={y} stroke="#6b7280" strokeWidth="1" />
                                <text x="70" y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
                                  {position}
                                </text>
                              </g>
                            );
                          }
                          return null;
                        });
                      })}
                      
                      {/* Division labels on Y-axis */}
                      {Array.from({ length: chartData.totalDivisions }, (_, divIndex) => {
                        // INVERTED: Start from top (40) and go down
                        const midY = 40 + (((divIndex + 0.5) * chartData.maxPosition) / (chartData.totalDivisions * chartData.maxPosition)) * 400;
                        return (
                          <text
                            key={divIndex}
                            x="25"
                            y={midY + 4}
                            textAnchor="middle"
                            fontSize="12"
                            fill="#374151"
                            fontWeight="bold"
                          >
                            Div {divIndex + 1}
                          </text>
                        );
                      })}
                      
                      {/* X-axis labels (seasons) */}
                      {chartData.seasons.map((season, index) => {
                        const x = 80 + ((index / (chartData.seasons.length - 1)) * 680);
                        return (
                          <g key={season}>
                            <line x1={x} y1="440" x2={x} y2="445" stroke="#6b7280" strokeWidth="1" />
                            <text x={x} y="460" textAnchor="middle" fontSize="10" fill="#6b7280">
                              S{season}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Team performance lines */}
                      {performanceData.map((teamData) => {
                        if (teamData.seasonData.length === 0) return null;
                        
                        const points = teamData.seasonData.map(data => {
                          const seasonIndex = chartData.seasons.indexOf(data.season);
                          const x = 80 + ((seasonIndex / (chartData.seasons.length - 1)) * 680);
                          
                          // Calculate absolute position (position within division + division offset)
                          const absolutePosition = (data.divisionLevel - 1) * chartData.maxPosition + data.position;
                          // INVERTED: Start from top (40) and go down
                          const y = 40 + ((absolutePosition / (chartData.totalDivisions * chartData.maxPosition)) * 400);
                          
                          return { x, y, season: data.season, position: data.position, division: data.divisionLevel };
                        });
                        
                        // Create path for line
                        const pathData = points.map((point, index) => 
                          `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                        ).join(' ');
                        
                        return (
                          <g key={teamData.teamId}>
                            {/* Line */}
                            <path
                              d={pathData}
                              fill="none"
                              stroke={teamData.color}
                              strokeWidth="3"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                            
                            {/* Points */}
                            {points.map((point, index) => (
                              <circle
                                key={index}
                                cx={point.x}
                                cy={point.y}
                                r="4"
                                fill={teamData.color}
                                stroke="white"
                                strokeWidth="2"
                              >
                                <title>
                                  {teamData.teamName} - Säsong {point.season}: {point.position}:a i Division {point.division}
                                </title>
                              </circle>
                            ))}
                          </g>
                        );
                      })}
                      
                      {/* Axis labels */}
                      <text x="420" y="490" textAnchor="middle" fontSize="14" fill="#374151" fontWeight="bold">
                        Säsong
                      </text>
                      <text x="20" y="240" textAnchor="middle" fontSize="14" fill="#374151" fontWeight="bold" transform="rotate(-90 20 240)">
                        Placering (1 = bäst)
                      </text>
                    </svg>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-4">
                    {performanceData.map((teamData) => (
                      <div key={teamData.teamId} className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: teamData.color }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {teamData.teamName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>Välj minst ett lag för att visa prestationsdiagram</p>
                </div>
              )}
            </div>
          )}

          {activeView === 'matches' && (
            /* Match Search View */
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Sök matcher mellan lag</h3>
              
              {/* Search Form */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hemmalag
                    </label>
                    <input
                      type="text"
                      value={homeTeamSearch}
                      onChange={(e) => setHomeTeamSearch(e.target.value)}
                      placeholder="t.ex. Nacka FF"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      list="home-teams"
                    />
                    <datalist id="home-teams">
                      {allTeamNames.map(name => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bortalag
                    </label>
                    <input
                      type="text"
                      value={awayTeamSearch}
                      onChange={(e) => setAwayTeamSearch(e.target.value)}
                      placeholder="t.ex. Inter SK"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      list="away-teams"
                    />
                    <datalist id="away-teams">
                      {allTeamNames.map(name => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={searchMatches}
                      disabled={!homeTeamSearch.trim() || !awayTeamSearch.trim()}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Sök matcher
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-3">
                  Sök efter alla matcher där det första laget spelar hemma mot det andra laget.
                </p>
              </div>

              {/* Search Results */}
              {matchResults.length > 0 ? (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    Hittade {matchResults.length} matcher: {homeTeamSearch} (hemma) vs {awayTeamSearch} (borta)
                  </h4>
                  
                  <div className="space-y-3">
                    {matchResults.map((result, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border bg-white border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                            <div className="text-sm text-gray-500">
                              Säsong {result.season} • Omgång {result.round}
                            </div>
                            <div className="text-sm text-gray-500">
                              {result.divisionName}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                              <div className="text-right">
                                <div className="font-medium text-gray-900">{result.homeTeam}</div>
                              </div>
                              <div className="text-center min-w-[80px]">
                                <div className="text-xl font-bold text-gray-900">
                                  {result.homeScore} - {result.awayScore}
                                </div>
                              </div>
                              <div className="text-left">
                                <div className="font-medium text-gray-900">{result.awayTeam}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : homeTeamSearch && awayTeamSearch ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>Inga matcher hittades mellan {homeTeamSearch} och {awayTeamSearch}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Kontrollera att lagnamnen är korrekta och att de har spelat mot varandra.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};