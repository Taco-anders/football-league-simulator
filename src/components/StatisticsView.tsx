import React, { useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Award, Target, BarChart3, Calendar, Medal, Crown, AlertTriangle } from 'lucide-react';
import { League, MarathonEntry, ChampionshipEntry, LastPlaceEntry, PositionPointsEntry, PromotionRelegationEntry } from '../types';

interface StatisticsViewProps {
  league: League;
}

interface TopDivision1Entry {
  teamId: string;
  teamName: string;
  totalPoints: number;
  seasonsPlayed: number;
  averagePoints: number;
  bestSeason: {
    season: number;
    points: number;
    position: number;
  };
}

interface WorstLowestDivisionEntry {
  teamId: string;
  teamName: string;
  totalPoints: number;
  seasonsPlayed: number;
  averagePoints: number;
  worstSeason: {
    season: number;
    points: number;
    position: number;
  };
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ league }) => {
  const [activeTab, setActiveTab] = useState<'marathon' | 'championships' | 'lastplace' | 'position' | 'promrel' | 'bestdiv1' | 'worstlowest'>('marathon');

  const tabs = [
    { id: 'marathon' as const, label: 'Division 1 Marathon', icon: BarChart3, description: 'Sammanlagd tabell för alla säsonger i division 1' },
    { id: 'championships' as const, label: 'Mästerskap', icon: Trophy, description: 'Antal vunna mästerskap (vinnare av division 1)' },
    { id: 'lastplace' as const, label: 'Jumboplatser', icon: TrendingDown, description: 'Antal gånger sist i lägsta divisionen' },
    { id: 'position' as const, label: 'Positionspoäng', icon: Target, description: 'Division 1: 1:a=6p, 2:a=4p, 3:a=2p, 4:a=1p' },
    { id: 'promrel' as const, label: 'Upp/Nedflyttningar', icon: TrendingUp, description: 'Antal uppflyttningar och nedflyttningar' },
    { id: 'bestdiv1' as const, label: 'Bäst i Div 1', icon: Crown, description: 'Tre lag med mest poäng i division 1 genom tiderna' },
    { id: 'worstlowest' as const, label: 'Sämst i Lägsta', icon: AlertTriangle, description: 'Tre lag med minst poäng i lägsta divisionen genom tiderna' }
  ];

  const hasData = league.seasonHistory.length > 0;

  // Calculate top 3 teams in Division 1
  const getTopDivision1Teams = (): TopDivision1Entry[] => {
    const teamStats = new Map<string, {
      teamId: string;
      teamName: string;
      totalPoints: number;
      seasonsPlayed: number;
      seasons: Array<{ season: number; points: number; position: number; }>
    }>();

    league.seasonHistory.forEach(season => {
      const div1Result = season.divisions.find(d => d.divisionLevel === 1);
      if (div1Result) {
        div1Result.finalStandings.forEach(standing => {
          const existing = teamStats.get(standing.teamId);
          if (existing) {
            existing.totalPoints += standing.points;
            existing.seasonsPlayed++;
            existing.seasons.push({
              season: season.season,
              points: standing.points,
              position: standing.position
            });
          } else {
            teamStats.set(standing.teamId, {
              teamId: standing.teamId,
              teamName: standing.teamName,
              totalPoints: standing.points,
              seasonsPlayed: 1,
              seasons: [{
                season: season.season,
                points: standing.points,
                position: standing.position
              }]
            });
          }
        });
      }
    });

    const topTeams: TopDivision1Entry[] = Array.from(teamStats.values())
      .map(stats => {
        const bestSeason = stats.seasons.reduce((best, current) => 
          current.points > best.points ? current : best
        );
        
        return {
          teamId: stats.teamId,
          teamName: stats.teamName,
          totalPoints: stats.totalPoints,
          seasonsPlayed: stats.seasonsPlayed,
          averagePoints: Math.round((stats.totalPoints / stats.seasonsPlayed) * 10) / 10,
          bestSeason
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 3);

    return topTeams;
  };

  // Calculate worst 3 teams in lowest division
  const getWorstLowestDivisionTeams = (): WorstLowestDivisionEntry[] => {
    const lowestDivisionLevel = league.divisions.length;
    const teamStats = new Map<string, {
      teamId: string;
      teamName: string;
      totalPoints: number;
      seasonsPlayed: number;
      seasons: Array<{ season: number; points: number; position: number; }>
    }>();

    league.seasonHistory.forEach(season => {
      const lowestDivResult = season.divisions.find(d => d.divisionLevel === lowestDivisionLevel);
      if (lowestDivResult) {
        lowestDivResult.finalStandings.forEach(standing => {
          const existing = teamStats.get(standing.teamId);
          if (existing) {
            existing.totalPoints += standing.points;
            existing.seasonsPlayed++;
            existing.seasons.push({
              season: season.season,
              points: standing.points,
              position: standing.position
            });
          } else {
            teamStats.set(standing.teamId, {
              teamId: standing.teamId,
              teamName: standing.teamName,
              totalPoints: standing.points,
              seasonsPlayed: 1,
              seasons: [{
                season: season.season,
                points: standing.points,
                position: standing.position
              }]
            });
          }
        });
      }
    });

    const worstTeams: WorstLowestDivisionEntry[] = Array.from(teamStats.values())
      .map(stats => {
        const worstSeason = stats.seasons.reduce((worst, current) => 
          current.points < worst.points ? current : worst
        );
        
        return {
          teamId: stats.teamId,
          teamName: stats.teamName,
          totalPoints: stats.totalPoints,
          seasonsPlayed: stats.seasonsPlayed,
          averagePoints: Math.round((stats.totalPoints / stats.seasonsPlayed) * 10) / 10,
          worstSeason
        };
      })
      .sort((a, b) => a.totalPoints - b.totalPoints)
      .slice(0, 3);

    return worstTeams;
  };

  const topDivision1Teams = getTopDivision1Teams();
  const worstLowestTeams = getWorstLowestDivisionTeams();

  if (!hasData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">Ingen historisk data</h3>
          <p className="text-gray-400">
            Slutför minst en säsong för att se statistik. Spela alla matcher i alla divisioner för att slutföra en säsong.
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
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Historisk Statistik</h2>
            <p className="text-gray-600">
              {league.seasonHistory.length} slutförda säsonger • Nuvarande säsong: {league.currentSeason}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Award className="w-4 h-4" />
            <span>All-time statistik</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 sm:space-x-4 px-4 sm:px-6 overflow-x-auto">
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
                  <Icon className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* Tab Description */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              {tabs.find(t => t.id === activeTab)?.description}
            </p>
          </div>

          {/* Tab Content */}
          {activeTab === 'marathon' && <MarathonTable data={league.allTimeStats.division1Marathon} />}
          {activeTab === 'championships' && <ChampionshipsTable data={league.allTimeStats.championships} />}
          {activeTab === 'lastplace' && <LastPlaceTable data={league.allTimeStats.lastPlaceInLowest} />}
          {activeTab === 'position' && <PositionPointsTable data={league.allTimeStats.positionPoints} />}
          {activeTab === 'promrel' && <PromotionRelegationTable data={league.allTimeStats.promotionsRelegations} />}
          {activeTab === 'bestdiv1' && <TopDivision1Table data={topDivision1Teams} />}
          {activeTab === 'worstlowest' && <WorstLowestTable data={worstLowestTeams} lowestDivisionLevel={league.divisions.length} />}
        </div>
      </div>
    </div>
  );
};

// Top Division 1 Table Component
const TopDivision1Table: React.FC<{ data: TopDivision1Entry[] }> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Crown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>Inga lag har spelat i division 1 än</p>
      </div>
    );
  }

  return (
    <div>
      {/* Info box */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center">
          <Crown className="w-5 h-5 text-yellow-600 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-yellow-900">Bästa lagen i Division 1</h4>
            <p className="text-sm text-yellow-700 mt-1">
              De tre lag som tagit mest poäng totalt i division 1 genom alla säsonger. Visar total poäng, antal säsonger och bästa säsong.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-2 py-2 sm:px-4 sm:py-3">Pos</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3">Lag</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Totalt P</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Säsonger</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Snitt P</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3">Bästa säsong</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((entry, index) => (
              <tr key={entry.teamId} className="hover:bg-gray-50">
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                    {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                    {index === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                    {index === 2 && <Medal className="w-4 h-4 text-amber-600" />}
                  </div>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{entry.teamName}</div>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                  <span className="text-lg font-bold text-green-600">{entry.totalPoints}</span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.seasonsPlayed}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.averagePoints}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">S{entry.bestSeason.season}:</span> {entry.bestSeason.points}p ({entry.bestSeason.position}:a)
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Worst Lowest Division Table Component
const WorstLowestTable: React.FC<{ data: WorstLowestDivisionEntry[]; lowestDivisionLevel: number }> = ({ data, lowestDivisionLevel }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>Inga lag har spelat i lägsta divisionen än</p>
      </div>
    );
  }

  return (
    <div>
      {/* Info box */}
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-red-900">Sämsta lagen i Division {lowestDivisionLevel}</h4>
            <p className="text-sm text-red-700 mt-1">
              De tre lag som tagit minst poäng totalt i lägsta divisionen (Division {lowestDivisionLevel}) genom alla säsonger. Visar total poäng, antal säsonger och sämsta säsong.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-2 py-2 sm:px-4 sm:py-3">Pos</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3">Lag</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Totalt P</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Säsonger</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Snitt P</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3">Sämsta säsong</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((entry, index) => (
              <tr key={entry.teamId} className="hover:bg-gray-50">
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                    <AlertTriangle className={`w-4 h-4 ${
                      index === 0 ? 'text-red-600' : 
                      index === 1 ? 'text-red-500' : 'text-red-400'
                    }`} />
                  </div>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{entry.teamName}</div>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                  <span className="text-lg font-bold text-red-600">{entry.totalPoints}</span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.seasonsPlayed}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.averagePoints}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">S{entry.worstSeason.season}:</span> {entry.worstSeason.points}p ({entry.worstSeason.position}:a)
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Marathon Table Component
const MarathonTable: React.FC<{ data: MarathonEntry[] }> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>Inga lag har spelat i division 1 än</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th className="px-2 py-2 sm:px-4 sm:py-3">Pos</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3">Lag</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Säsonger</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">S</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">V</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">O</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">F</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">GM</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">IM</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">MS</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">P</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((entry, index) => (
            <tr key={entry.teamId} className="hover:bg-gray-50">
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                  {index < 3 && (
                    <Medal className={`w-4 h-4 ${
                      index === 0 ? 'text-yellow-500' : 
                      index === 1 ? 'text-gray-400' : 'text-amber-600'
                    }`} />
                  )}
                </div>
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{entry.teamName}</div>
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.seasonsInDiv1}
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.totalPlayed}
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.totalWon}
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.totalDrawn}
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.totalLost}
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.totalGoalsFor}
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.totalGoalsAgainst}
              </td>
              <td className={`px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm font-medium ${
                entry.totalGoalDifference > 0 ? 'text-green-600' : 
                entry.totalGoalDifference < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {entry.totalGoalDifference > 0 ? '+' : ''}{entry.totalGoalDifference}
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                {entry.totalPoints}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Championships Table Component
const ChampionshipsTable: React.FC<{ data: ChampionshipEntry[] }> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>Inga mästerskap har delats ut än</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th className="px-2 py-2 sm:px-4 sm:py-3">Pos</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3">Lag</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Mästerskap</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3">Säsonger</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((entry, index) => (
            <tr key={entry.teamId} className="hover:bg-gray-50">
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                  {index < 3 && (
                    <Trophy className={`w-4 h-4 ${
                      index === 0 ? 'text-yellow-500' : 
                      index === 1 ? 'text-gray-400' : 'text-amber-600'
                    }`} />
                  )}
                </div>
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{entry.teamName}</div>
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                <span className="text-lg font-bold text-green-600">{entry.championships}</span>
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                <div className="text-sm text-gray-600">
                  {entry.championshipSeasons.join(', ')}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Last Place Table Component
const LastPlaceTable: React.FC<{ data: LastPlaceEntry[] }> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>Inga lag har varit sist i lägsta divisionen än</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th className="px-2 py-2 sm:px-4 sm:py-3">Pos</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3">Lag</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Jumboplatser</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3">Säsonger</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((entry, index) => (
            <tr key={entry.teamId} className="hover:bg-gray-50">
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">{index + 1}</span>
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{entry.teamName}</div>
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                <span className="text-lg font-bold text-red-600">{entry.lastPlaceCount}</span>
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                <div className="text-sm text-gray-600">
                  {entry.lastPlaceSeasons.join(', ')}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Position Points Table Component
const PositionPointsTable: React.FC<{ data: PositionPointsEntry[] }> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <div>
          <p className="text-gray-500 mb-2">Inga positionspoäng har delats ut än</p>
          <p className="text-sm text-gray-400">
            Positionspoäng delas endast ut för slutplaceringar i <strong>Division 1</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Info box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center">
          <Target className="w-5 h-5 text-blue-600 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Positionspoäng - Endast Division 1</h4>
            <p className="text-sm text-blue-700 mt-1">
              Poäng delas endast ut för slutplaceringar i Division 1: 1:a plats = 6p, 2:a plats = 4p, 3:a plats = 2p, 4:a plats = 1p
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-2 py-2 sm:px-4 sm:py-3">Pos</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3">Lag</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Totalt</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">1:a (6p)</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">2:a (4p)</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">3:a (2p)</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">4:a (1p)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((entry, index) => (
              <tr key={entry.teamId} className="hover:bg-gray-50">
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                    {index < 3 && (
                      <Target className={`w-4 h-4 ${
                        index === 0 ? 'text-yellow-500' : 
                        index === 1 ? 'text-gray-400' : 'text-amber-600'
                      }`} />
                    )}
                  </div>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{entry.teamName}</div>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                  <span className="text-lg font-bold text-blue-600">{entry.totalPositionPoints}</span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.breakdown.first}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.breakdown.second}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.breakdown.third}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.breakdown.fourth}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Promotion/Relegation Table Component
const PromotionRelegationTable: React.FC<{ data: PromotionRelegationEntry[] }> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>Inga upp- eller nedflyttningar har skett än</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th className="px-2 py-2 sm:px-4 sm:py-3">Pos</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3">Lag</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Netto</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Upp</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Ned</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 hidden sm:table-cell">Uppflyttningssäsonger</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 hidden sm:table-cell">Nedflyttningssäsonger</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((entry, index) => {
            const netMovement = entry.promotions - entry.relegations;
            return (
              <tr key={entry.teamId} className="hover:bg-gray-50">
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{entry.teamName}</div>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                  <span className={`text-lg font-bold ${
                    netMovement > 0 ? 'text-green-600' : 
                    netMovement < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {netMovement > 0 ? '+' : ''}{netMovement}
                  </span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-green-600">{entry.promotions}</span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-red-600">{entry.relegations}</span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap hidden sm:table-cell">
                  <div className="text-sm text-gray-600">
                    {entry.promotionSeasons.length > 0 ? entry.promotionSeasons.join(', ') : '-'}
                  </div>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap hidden sm:table-cell">
                  <div className="text-sm text-gray-600">
                    {entry.relegationSeasons.length > 0 ? entry.relegationSeasons.join(', ') : '-'}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};