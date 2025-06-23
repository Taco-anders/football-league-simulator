import React, { useState } from 'react';
import { Calendar, Search, Trophy, Users, Target, ArrowLeft, ArrowRight } from 'lucide-react';
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

export const HistoryView: React.FC<HistoryViewProps> = ({ league }) => {
  const [activeView, setActiveView] = useState<'seasons' | 'matches'>('seasons');
  const [selectedSeason, setSelectedSeason] = useState<number>(league.seasonHistory.length > 0 ? league.seasonHistory[league.seasonHistory.length - 1].season : 1);
  const [homeTeamSearch, setHomeTeamSearch] = useState('');
  const [awayTeamSearch, setAwayTeamSearch] = useState('');
  const [matchResults, setMatchResults] = useState<MatchSearchResult[]>([]);

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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Historik</h2>
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
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveView('seasons')}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors ${
                activeView === 'seasons'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy className="w-5 h-5 mr-2" />
              Säsongstabeller
            </button>
            <button
              onClick={() => setActiveView('matches')}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors ${
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

        <div className="p-6">
          {activeView === 'seasons' ? (
            <div>
              {/* Season Selector */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Säsong {selectedSeason} - Sluttabeller
                </h3>
                <div className="flex items-center space-x-2">
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
                    Tidigare
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
                    Senare
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
                      <div key={division.divisionId} className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Users className="w-5 h-5 mr-2 text-green-600" />
                          Division {division.divisionLevel}
                        </h4>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-white">
                              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3 rounded-l-lg">Pos</th>
                                <th className="px-4 py-3">Lag</th>
                                <th className="px-4 py-3 text-center">S</th>
                                <th className="px-4 py-3 text-center">V</th>
                                <th className="px-4 py-3 text-center">O</th>
                                <th className="px-4 py-3 text-center">F</th>
                                <th className="px-4 py-3 text-center">GM</th>
                                <th className="px-4 py-3 text-center">IM</th>
                                <th className="px-4 py-3 text-center">MS</th>
                                <th className="px-4 py-3 text-center rounded-r-lg">P</th>
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
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900">{standing.position}</span>
                                        {isChampion && <Trophy className="w-4 h-4 text-yellow-500" />}
                                        {isPromoted && <Target className="w-4 h-4 text-green-500" />}
                                        {isRelegated && <Target className="w-4 h-4 text-red-500 transform rotate-180" />}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{standing.teamName}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                                      {standing.played}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                                      {standing.won}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                                      {standing.drawn}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                                      {standing.lost}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                                      {standing.goalsFor}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                                      {standing.goalsAgainst}
                                    </td>
                                    <td className={`px-4 py-3 whitespace-nowrap text-center text-sm font-medium ${
                                      standing.goalDifference > 0 ? 'text-green-600' : 
                                      standing.goalDifference < 0 ? 'text-red-600' : 'text-gray-900'
                                    }`}>
                                      {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900">
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
          ) : (
            /* Match Search View */
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Sök matcher mellan lag</h3>
              
              {/* Search Form */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="grid gap-4 md:grid-cols-3">
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">
                              Säsong {result.season} • Omgång {result.round}
                            </div>
                            <div className="text-sm text-gray-500">
                              {result.divisionName}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center space-x-4">
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