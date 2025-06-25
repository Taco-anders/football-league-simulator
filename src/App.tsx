import React, { useState, useEffect } from 'react';
import { Users, Play, Trophy, BarChart3, Shuffle, Award, ArrowRight, History } from 'lucide-react';
import { League, LeagueSettings, Team, Division, Match } from './types';
import { LeagueSelector } from './components/LeagueSelector';
import { LeagueCreator } from './components/LeagueCreator';
import { TeamManager } from './components/TeamManager';
import { DivisionSimulator } from './components/DivisionSimulator';
import { StatisticsView } from './components/StatisticsView';
import { HistoryView } from './components/HistoryView';
import { saveLeagues, loadLeagues, saveCurrentLeagueId, loadCurrentLeagueId } from './utils/storage';
import { generateSchedule } from './utils/schedule';
import { generateSwedishTeams } from './utils/teamGenerator';
import { applySeasonStartAdjustments } from './utils/simulation';
import { isSeasonComplete, completeSeason, startNextSeason } from './utils/statistics';

function App() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [activeTab, setActiveTab] = useState<'teams' | 'divisions' | 'statistics' | 'history'>('teams');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    const savedLeagues = loadLeagues();
    setLeagues(savedLeagues);
    
    const currentLeagueId = loadCurrentLeagueId();
    if (currentLeagueId && savedLeagues.length > 0) {
      const league = savedLeagues.find(l => l.id === currentLeagueId);
      if (league) {
        setCurrentLeague(league);
        // Set first division as default
        if (league.divisions.length > 0) {
          setSelectedDivisionId(league.divisions[0].id);
        }
      }
    }
  }, []);

  useEffect(() => {
    saveLeagues(leagues);
  }, [leagues]);

  useEffect(() => {
    saveCurrentLeagueId(currentLeague?.id || null);
  }, [currentLeague]);

  const createLeague = (name: string, settings: LeagueSettings) => {
    const divisions: Division[] = [];
    
    for (let i = 0; i < settings.divisionsCount; i++) {
      divisions.push({
        id: `div-${Date.now()}-${i}`,
        name: `Division ${i + 1}`,
        level: i + 1,
        teams: []
      });
    }

    const league: League = {
      id: `league-${Date.now()}`,
      name,
      divisions,
      settings,
      currentSeason: 1,
      matches: [],
      standings: {},
      // Initialize historical statistics
      seasonHistory: [],
      allTimeStats: {
        division1Marathon: [],
        championships: [],
        lastPlaceInLowest: [],
        positionPoints: [],
        promotionsRelegations: []
      }
    };

    setLeagues(prev => [...prev, league]);
    setCurrentLeague(league);
    setSelectedDivisionId(divisions[0]?.id || '');
    setShowCreator(false);
  };

  // Create Swedish league with generated teams
  const createSwedishLeague = (name: string, settings: LeagueSettings) => {
    console.log(`🇸🇪 Creating Swedish league: ${name}`);
    
    const divisions: Division[] = [];
    const totalTeams = settings.divisionsCount * settings.teamsPerDivision;
    
    // Generate all Swedish teams at once
    const generatedTeams = generateSwedishTeams(totalTeams);
    let teamIndex = 0;
    
    // Create divisions and distribute teams
    for (let i = 0; i < settings.divisionsCount; i++) {
      const divisionTeams: Team[] = [];
      
      // Add teams to this division
      for (let j = 0; j < settings.teamsPerDivision; j++) {
        if (teamIndex < generatedTeams.length) {
          const generatedTeam = generatedTeams[teamIndex];
          const team: Team = {
            id: `team-${Date.now()}-${teamIndex}`,
            name: generatedTeam.name,
            attackStrength: generatedTeam.attackStrength,
            defenseStrength: generatedTeam.defenseStrength,
            divisionId: `div-${Date.now()}-${i}`
          };
          divisionTeams.push(team);
          teamIndex++;
        }
      }
      
      divisions.push({
        id: `div-${Date.now()}-${i}`,
        name: `Division ${i + 1}`,
        level: i + 1,
        teams: divisionTeams
      });
    }

    const league: League = {
      id: `league-${Date.now()}`,
      name,
      divisions,
      settings,
      currentSeason: 1,
      matches: [],
      standings: {},
      // Initialize historical statistics
      seasonHistory: [],
      allTimeStats: {
        division1Marathon: [],
        championships: [],
        lastPlaceInLowest: [],
        positionPoints: [],
        promotionsRelegations: []
      }
    };

    // Generate schedules for all divisions
    const allMatches: Match[] = [];
    divisions.forEach(division => {
      if (division.teams.length >= 2) {
        const divisionMatches = generateSchedule(division);
        allMatches.push(...divisionMatches);
      }
    });
    
    league.matches = allMatches;

    setLeagues(prev => [...prev, league]);
    setCurrentLeague(league);
    setSelectedDivisionId(divisions[0]?.id || '');
    
    console.log(`✅ Swedish league created with ${totalTeams} teams and ${allMatches.length} matches`);
  };

  const deleteLeague = (leagueId: string) => {
    setLeagues(prev => prev.filter(l => l.id !== leagueId));
    if (currentLeague?.id === leagueId) {
      setCurrentLeague(null);
    }
  };

  const addTeam = (teamData: Omit<Team, 'id'>) => {
    if (!currentLeague) return;

    // Check if target division is full, find next available
    let targetDivisionId = teamData.divisionId;
    const targetDivision = currentLeague.divisions.find(d => d.id === targetDivisionId);
    
    if (targetDivision && targetDivision.teams.length >= currentLeague.settings.teamsPerDivision) {
      const nextAvailable = currentLeague.divisions.find(d => d.teams.length < currentLeague.settings.teamsPerDivision);
      if (nextAvailable) {
        targetDivisionId = nextAvailable.id;
      } else {
        return;
      }
    }

    const team: Team = {
      ...teamData,
      divisionId: targetDivisionId,
      id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const updatedLeague = {
      ...currentLeague,
      divisions: currentLeague.divisions.map(div =>
        div.id === targetDivisionId
          ? { ...div, teams: [...div.teams, team] }
          : div
      )
    };

    setCurrentLeague(updatedLeague);
    setLeagues(prev => prev.map(l => l.id === updatedLeague.id ? updatedLeague : l));
    
    // Regenerate schedule for the affected division
    regenerateSchedule(updatedLeague, targetDivisionId);
  };

  // NEW: Function to update team name in all historical data
  const updateTeamNameInHistory = (league: League, teamId: string, newName: string): League => {
    console.log(`📝 Updating team name in historical data: ${teamId} → ${newName}`);
    
    // Update season history
    const updatedSeasonHistory = league.seasonHistory.map(season => ({
      ...season,
      divisions: season.divisions.map(division => ({
        ...division,
        finalStandings: division.finalStandings.map(standing => 
          standing.teamId === teamId 
            ? { ...standing, teamName: newName }
            : standing
        )
      })),
      matches: season.matches.map(match => ({
        ...match,
        homeTeamName: match.homeTeamId === teamId ? newName : match.homeTeamName,
        awayTeamName: match.awayTeamId === teamId ? newName : match.awayTeamName
      }))
    }));

    // Update all-time statistics
    const updatedAllTimeStats = {
      division1Marathon: league.allTimeStats.division1Marathon.map(entry =>
        entry.teamId === teamId ? { ...entry, teamName: newName } : entry
      ),
      championships: league.allTimeStats.championships.map(entry =>
        entry.teamId === teamId ? { ...entry, teamName: newName } : entry
      ),
      lastPlaceInLowest: league.allTimeStats.lastPlaceInLowest.map(entry =>
        entry.teamId === teamId ? { ...entry, teamName: newName } : entry
      ),
      positionPoints: league.allTimeStats.positionPoints.map(entry =>
        entry.teamId === teamId ? { ...entry, teamName: newName } : entry
      ),
      promotionsRelegations: league.allTimeStats.promotionsRelegations.map(entry =>
        entry.teamId === teamId ? { ...entry, teamName: newName } : entry
      )
    };

    console.log(`✅ Updated team name in all historical data for ${newName}`);

    return {
      ...league,
      seasonHistory: updatedSeasonHistory,
      allTimeStats: updatedAllTimeStats
    };
  };

  const updateTeam = (updatedTeam: Team) => {
    if (!currentLeague) return;

    console.log(`🔄 Updating team: ${updatedTeam.name}`);

    // Find the old team to check if name changed
    let oldTeamName = '';
    currentLeague.divisions.forEach(div => {
      const oldTeam = div.teams.find(team => team.id === updatedTeam.id);
      if (oldTeam) {
        oldTeamName = oldTeam.name;
      }
    });

    const updatedLeague = {
      ...currentLeague,
      divisions: currentLeague.divisions.map(div => ({
        ...div,
        teams: div.teams.map(team => team.id === updatedTeam.id ? updatedTeam : team)
      }))
    };

    // If team name changed, update historical data
    if (oldTeamName && oldTeamName !== updatedTeam.name) {
      console.log(`📝 Team name changed: ${oldTeamName} → ${updatedTeam.name}`);
      const leagueWithUpdatedHistory = updateTeamNameInHistory(updatedLeague, updatedTeam.id, updatedTeam.name);
      
      setCurrentLeague(leagueWithUpdatedHistory);
      setLeagues(prev => prev.map(l => l.id === leagueWithUpdatedHistory.id ? leagueWithUpdatedHistory : l));
    } else {
      setCurrentLeague(updatedLeague);
      setLeagues(prev => prev.map(l => l.id === updatedLeague.id ? updatedLeague : l));
    }
  };

  const deleteTeam = (teamId: string) => {
    if (!currentLeague) return;

    let affectedDivisionId = '';
    const updatedLeague = {
      ...currentLeague,
      divisions: currentLeague.divisions.map(div => {
        const hasTeam = div.teams.some(team => team.id === teamId);
        if (hasTeam) {
          affectedDivisionId = div.id;
          return { ...div, teams: div.teams.filter(team => team.id !== teamId) };
        }
        return div;
      }),
      matches: currentLeague.matches.filter(match => 
        match.homeTeamId !== teamId && match.awayTeamId !== teamId
      )
    };

    setCurrentLeague(updatedLeague);
    setLeagues(prev => prev.map(l => l.id === updatedLeague.id ? updatedLeague : l));
    
    // Regenerate schedule for the affected division
    if (affectedDivisionId) {
      regenerateSchedule(updatedLeague, affectedDivisionId);
    }
  };

  const regenerateSchedule = (league: League, divisionId: string) => {
    const division = league.divisions.find(d => d.id === divisionId);
    if (!division || division.teams.length < 2) return;

    const newMatches = generateSchedule(division);
    const otherMatches = league.matches.filter(m => m.divisionId !== divisionId);
    
    const updatedLeague = {
      ...league,
      matches: [...otherMatches, ...newMatches]
    };

    setCurrentLeague(updatedLeague);
    setLeagues(prev => prev.map(l => l.id === updatedLeague.id ? updatedLeague : l));
  };

  const updateMatch = (updatedMatch: Match) => {
    if (!currentLeague) return;

    const updatedLeague = {
      ...currentLeague,
      matches: currentLeague.matches.map(match =>
        match.id === updatedMatch.id ? updatedMatch : match
      )
    };

    // Check if season is complete after this update
    const finalLeague = checkAndCompleteSeason(updatedLeague);
    
    setCurrentLeague(finalLeague);
    setLeagues(prev => prev.map(l => l.id === finalLeague.id ? finalLeague : l));
  };

  // Function to update multiple matches at once
  const updateMultipleMatches = (updatedMatches: Match[]) => {
    if (!currentLeague) return;

    console.log(`🔄 Updating ${updatedMatches.length} matches at once`);
    
    const updatedLeague = {
      ...currentLeague,
      matches: currentLeague.matches.map(match => {
        const updatedMatch = updatedMatches.find(um => um.id === match.id);
        return updatedMatch || match;
      })
    };

    // Check if season is complete after this update
    const finalLeague = checkAndCompleteSeason(updatedLeague);

    setCurrentLeague(finalLeague);
    setLeagues(prev => prev.map(l => l.id === finalLeague.id ? finalLeague : l));
    
    console.log(`✅ Successfully updated ${updatedMatches.length} matches`);
  };

  // Check if season is complete and update statistics
  const checkAndCompleteSeason = (league: League): League => {
    if (isSeasonComplete(league)) {
      console.log(`🏁 Season ${league.currentSeason} is complete! Updating statistics...`);
      return completeSeason(league);
    }
    return league;
  };

  // Apply season start adjustments to all teams
  const applySeasonAdjustments = () => {
    if (!currentLeague) return;
    
    console.log(`🎲 Applying season start adjustments to all teams`);
    
    const updatedLeague = {
      ...currentLeague,
      divisions: currentLeague.divisions.map(division => ({
        ...division,
        teams: applySeasonStartAdjustments(division.teams)
      }))
    };

    setCurrentLeague(updatedLeague);
    setLeagues(prev => prev.map(l => l.id === updatedLeague.id ? updatedLeague : l));
  };

  // Start next season
  const handleStartNextSeason = () => {
    if (!currentLeague) return;
    
    console.log(`🚀 Starting next season for ${currentLeague.name}`);
    
    const nextSeasonLeague = startNextSeason(currentLeague);
    
    setCurrentLeague(nextSeasonLeague);
    setLeagues(prev => prev.map(l => l.id === nextSeasonLeague.id ? nextSeasonLeague : l));
    
    // Reset to first division
    if (nextSeasonLeague.divisions.length > 0) {
      setSelectedDivisionId(nextSeasonLeague.divisions[0].id);
    }
    
    // Switch to divisions tab to see the new season
    setActiveTab('divisions');
  };

  if (!currentLeague) {
    return showCreator ? (
      <LeagueCreator
        onCreateLeague={createLeague}
        onBack={() => setShowCreator(false)}
      />
    ) : (
      <LeagueSelector
        leagues={leagues}
        onSelectLeague={setCurrentLeague}
        onCreateLeague={() => setShowCreator(true)}
        onDeleteLeague={deleteLeague}
        onCreateSwedishLeague={createSwedishLeague}
      />
    );
  }

  const selectedDivision = currentLeague.divisions.find(d => d.id === selectedDivisionId);
  const seasonComplete = isSeasonComplete(currentLeague);

  const tabs = [
    { id: 'teams' as const, label: 'Teams', icon: Users },
    { id: 'divisions' as const, label: 'Divisions', icon: Play },
    { id: 'statistics' as const, label: 'Statistik', icon: Award },
    { id: 'history' as const, label: 'Historik', icon: History }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:h-16">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-xl font-semibold text-gray-900">{currentLeague.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                <p className="text-sm text-gray-500">Säsong {currentLeague.currentSeason}</p>
                {seasonComplete && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full w-fit">
                    Säsong slutförd!
                  </span>
                )}
                {currentLeague.seasonHistory.length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full w-fit">
                    {currentLeague.seasonHistory.length} slutförda säsonger
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              {seasonComplete && (
                <button
                  onClick={handleStartNextSeason}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold w-full sm:w-auto justify-center"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Starta Säsong {currentLeague.currentSeason + 1}
                </button>
              )}
              <button
                onClick={applySeasonAdjustments}
                className="inline-flex items-center px-3 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors w-full sm:w-auto justify-center"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Season Adjustments
              </button>
              <button
                onClick={() => setCurrentLeague(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto text-center"
              >
                Back to Leagues
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'teams' && (
          <TeamManager
            divisions={currentLeague.divisions}
            onAddTeam={addTeam}
            onUpdateTeam={updateTeam}
            onDeleteTeam={deleteTeam}
          />
        )}
        {activeTab === 'divisions' && (
          <div className="space-y-6">
            {/* Division Selector */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Select Division</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {currentLeague.divisions.map((division) => {
                  const divisionMatches = currentLeague.matches.filter(m => m.divisionId === division.id);
                  const playedMatches = divisionMatches.filter(m => m.played).length;
                  const totalMatches = divisionMatches.length;
                  const progress = totalMatches > 0 ? (playedMatches / totalMatches) * 100 : 0;
                  
                  return (
                    <button
                      key={division.id}
                      onClick={() => setSelectedDivisionId(division.id)}
                      className={`p-4 text-left rounded-lg border-2 transition-all ${
                        selectedDivisionId === division.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{division.name}</h3>
                        <span className="text-sm text-gray-500">Level {division.level}</span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Teams:</span>
                          <span className="font-medium">{division.teams.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Matches:</span>
                          <span className="font-medium">{playedMatches}/{totalMatches}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          {Math.round(progress)}% complete
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Division Simulator */}
            {selectedDivision && (
              <DivisionSimulator
                league={currentLeague}
                division={selectedDivision}
                onUpdateMatch={updateMatch}
                onUpdateMultipleMatches={updateMultipleMatches}
                onUpdateTeam={updateTeam}
              />
            )}
          </div>
        )}
        {activeTab === 'statistics' && (
          <StatisticsView league={currentLeague} />
        )}
        {activeTab === 'history' && (
          <HistoryView league={currentLeague} />
        )}
      </main>
    </div>
  );
}

export default App;