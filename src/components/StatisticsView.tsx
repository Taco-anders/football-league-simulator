import React, { useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Award, Target, BarChart3, Calendar, Medal, Crown, AlertTriangle, Users, Star } from 'lucide-react';
import { League, MarathonEntry, ChampionshipEntry, LastPlaceEntry, PositionPointsEntry, PromotionRelegationEntry, SeasonsPerDivisionEntry, AllDivisionsPositionMarathonEntry } from '../types';

interface StatisticsViewProps {
  league: League;
}

interface BestDivision1Entry {
  teamId: string;
  teamName: string;
  points: number;
  season: number;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface WorstLowestDivisionEntry {
  teamId: string;
  teamName: string;
  points: number;
  season: number;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ league }) => {
  const [activeTab, setActiveTab] = useState<'marathon' | 'championships' | 'lastplace' | 'position' | 'promrel' | 'bestdiv1' | 'worstlowest' | 'seasonsperdiv' | 'alldivsmarathon'>('marathon');

  const tabs = [
    { id: 'marathon' as const, label: 'Division 1 Marathon', icon: BarChart3, description: 'Sammanlagd tabell för alla säsonger i division 1' },
    { id: 'championships' as const, label: 'Mästerskap', icon: Trophy, description: 'Antal vunna mästerskap (vinnare av division 1)' },
    { id: 'lastplace' as const, label: 'Jumboplatser', icon: TrendingDown, description: 'Antal gånger sist i lägsta divisionen' },
    { id: 'position' as const, label: 'Positionspoäng', icon: Target, description: 'Division 1: 1:a=6p, 2:a=4p, 3:a=2p, 4:a=1p' },
    { id: 'promrel' as const, label: 'Upp/Nedflyttningar', icon: TrendingUp, description: 'Antal uppflyttningar och nedflyttningar' },
    { id: 'bestdiv1' as const, label: 'Bäst i Div 1', icon: Crown, description: 'Tre bästa enskilda säsonger i division 1 (flest poäng)' },
    { id: 'worstlowest' as const, label: 'Sämst i Lägsta', icon: AlertTriangle, description: 'Tre sämsta enskilda säsonger i lägsta divisionen (minst poäng)' },
    { id: 'seasonsperdiv' as const, label: 'Säsonger per Division', icon: Users, description: 'Antal säsonger varje lag har spelat i varje division' },
    { id: 'alldivsmarathon' as const, label: 'Alla Divisioner Marathon', icon: Star, description: 'Maratontabell baserad på faktiska säsongspoäng × divisionsbonus (högre division = fördel)' }
  ];

  const hasData = league.seasonHistory.length > 0;

  // Calculate best single seasons in Division 1
  const getBestDivision1Seasons = (): BestDivision1Entry[] => {
    const allSeasons: BestDivision1Entry[] = [];

    league.seasonHistory.forEach(season => {
      const div1Result = season.divisions.find(d => d.divisionLevel === 1);
      if (div1Result) {
        div1Result.finalStandings.forEach(standing => {
          allSeasons.push({
            teamId: standing.teamId,
            teamName: standing.teamName,
            points: standing.points,
            season: season.season,
            position: standing.position,
            played: standing.played,
            won: standing.won,
            drawn: standing.drawn,
            lost: standing.lost,
            goalsFor: standing.goalsFor,
            goalsAgainst: standing.goalsAgainst,
            goalDifference: standing.goalDifference
          });
        });
      }
    });

    // Sort by points (highest first), then by goal difference, then by goals for
    return allSeasons
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      })
      .slice(0, 3);
  };

  // Calculate worst single seasons in lowest division
  const getWorstLowestDivisionSeasons = (): WorstLowestDivisionEntry[] => {
    const lowestDivisionLevel = league.divisions.length;
    const allSeasons: WorstLowestDivisionEntry[] = [];

    league.seasonHistory.forEach(season => {
      const lowestDivResult = season.divisions.find(d => d.divisionLevel === lowestDivisionLevel);
      if (lowestDivResult) {
        lowestDivResult.finalStandings.forEach(standing => {
          allSeasons.push({
            teamId: standing.teamId,
            teamName: standing.teamName,
            points: standing.points,
            season: season.season,
            position: standing.position,
            played: standing.played,
            won: standing.won,
            drawn: standing.drawn,
            lost: standing.lost,
            goalsFor: standing.goalsFor,
            goalsAgainst: standing.goalsAgainst,
            goalDifference: standing.goalDifference
          });
        });
      }
    });

    // Sort by points (lowest first), then by goal difference (worst first), then by goals for (fewest first)
    return allSeasons
      .sort((a, b) => {
        if (a.points !== b.points) return a.points - b.points;
        if (a.goalDifference !== b.goalDifference) return a.goalDifference - b.goalDifference;
        return a.goalsFor - b.goalsFor;
      })
      .slice(0, 3);
  };

  const bestDivision1Seasons = getBestDivision1Seasons();
  const worstLowestSeasons = getWorstLowestDivisionSeasons();

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
          {activeTab === 'bestdiv1' && <BestDivision1Table data={bestDivision1Seasons} />}
          {activeTab === 'worstlowest' && <WorstLowestTable data={worstLowestSeasons} lowestDivisionLevel={league.divisions.length} />}
          {activeTab === 'seasonsperdiv' && <SeasonsPerDivisionTable data={league.allTimeStats.seasonsPerDivision} totalDivisions={league.divisions.length} />}
          {activeTab === 'alldivsmarathon' && <AllDivisionsPositionMarathonTable data={league.allTimeStats.allDivisionsPositionMarathon} totalDivisions={league.divisions.length} />}
        </div>
      </div>
    </div>
  );
};

// NEW: Seasons Per Division Table Component
const SeasonsPerDivisionTable: React.FC<{ data: SeasonsPerDivisionEntry[]; totalDivisions: number }> = ({ data, totalDivisions }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>Inga lag har spelat några säsonger än</p>
      </div>
    );
  }

  return (
    <div>
      {/* Info box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center">
          <Users className="w-5 h-5 text-blue-600 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Säsonger per Division</h4>
            <p className="text-sm text-blue-700 mt-1">
              Visar hur många säsonger varje lag har spelat i varje division. Sorterat efter flest säsonger i Division 1, sedan Division 2, osv.
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
              {Array.from({ length: totalDivisions }, (_, i) => (
                <th key={i + 1} className="px-2 py-2 sm:px-4 sm:py-3 text-center">
                  Div {i + 1}
                </th>
              ))}
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
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                  <span className="text-lg font-bold text-blue-600">{entry.totalSeasons}</span>
                </td>
                {Array.from({ length: totalDivisions }, (_, i) => {
                  const divLevel = i + 1;
                  const seasons = entry.divisionBreakdown[divLevel] || 0;
                  return (
                    <td key={divLevel} className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${
                        seasons > 0 ? (
                          divLevel === 1 ? 'text-green-600' :
                          divLevel === 2 ? 'text-blue-600' :
                          divLevel === 3 ? 'text-purple-600' :
                          'text-gray-600'
                        ) : 'text-gray-300'
                      }`}>
                        {seasons || '-'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// NEW: All Divisions Position Marathon Table Component - UPDATED
const AllDivisionsPositionMarathonTable: React.FC<{ data: AllDivisionsPositionMarathonEntry[]; totalDivisions: number }> = ({ data, totalDivisions }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>Inga lag har spelat några säsonger än</p>
      </div>
    );
  }

  return (
    <div>
      {/* Info box */}
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center">
          <Star className="w-5 h-5 text-purple-600 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-purple-900">Maratontabell för Alla Divisioner</h4>
            <p className="text-sm text-purple-700 mt-1">
              <strong>Poängsystem:</strong> Faktiska säsongspoäng × divisionsbonus. <br/>
              <strong>Divisionsbonus:</strong> Division 1 = x{totalDivisions}, Division 2 = x{totalDivisions - 1}, osv. <br/>
              <strong>Exempel:</strong> 50 poäng i Division 1 = 50 × {totalDivisions} = {50 * totalDivisions} poäng, 48 poäng i Division 2 = 48 × {totalDivisions - 1} = {48 * (totalDivisions - 1)} poäng.
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
              <th className="px-2 py-2 sm:px-4 sm:py-3">Divisionsfördelning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((entry, index) => (
              <tr key={entry.teamId} className="hover:bg-gray-50">
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                    {index < 3 && (
                      <Star className={`w-4 h-4 ${
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
                  <span className="text-lg font-bold text-purple-600">{entry.totalPositionPoints}</span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.totalSeasons}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.averagePositionPoints}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                  <div className="text-xs text-gray-600 space-y-1">
                    {entry.divisionBreakdown.map(breakdown => {
                      const multiplier = totalDivisions - breakdown.divisionLevel + 1;
                      return (
                        <div key={breakdown.divisionLevel} className="flex justify-between">
                          <span>Div {breakdown.divisionLevel} (x{multiplier}):</span>
                          <span className="font-medium">{breakdown.seasons}s ({breakdown.points}p)</span>
                        </div>
                      );
                    })}
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

// Best Division 1 Single Season Table Component
const BestDivision1Table: React.FC<{ data: BestDivision1Entry[] }> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Crown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>Inga säsonger har spelats i division 1 än</p>
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
            <h4 className="text-sm font-medium text-yellow-900">Bästa enskilda säsonger i Division 1</h4>
            <p className="text-sm text-yellow-700 mt-1">
              De tre bästa enskilda säsongsprestationerna i division 1 genom alla tider. Sorterat efter flest poäng, sedan målskillnad, sedan gjorda mål.
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
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Säsong</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Poäng</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Placering</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">S</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">V</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">O</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">F</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">GM</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">IM</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">MS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((entry, index) => (
              <tr key={`${entry.teamId}-${entry.season}`} className="hover:bg-gray-50">
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
                  <span className="text-sm font-medium text-blue-600">{entry.season}</span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                  <span className="text-lg font-bold text-green-600">{entry.points}</span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                  <span className={`text-sm font-medium ${
                    entry.position === 1 ? 'text-yellow-600' : 
                    entry.position <= 3 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {entry.position}:a
                  </span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.played}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.won}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.drawn}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.lost}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.goalsFor}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.goalsAgainst}
                </td>
                <td className={`px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm font-medium ${
                  entry.goalDifference > 0 ? 'text-green-600' : 
                  entry.goalDifference < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Worst Lowest Division Single Season Table Component
const WorstLowestTable: React.FC<{ data: WorstLowestDivisionEntry[]; lowestDivisionLevel: number }> = ({ data, lowestDivisionLevel }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>Inga säsonger har spelats i lägsta divisionen än</p>
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
            <h4 className="text-sm font-medium text-red-900">Sämsta enskilda säsonger i Division {lowestDivisionLevel}</h4>
            <p className="text-sm text-red-700 mt-1">
              De tre sämsta enskilda säsongsprestationerna i lägsta divisionen genom alla tider. Sorterat efter minst poäng, sedan sämsta målskillnad, sedan minst gjorda mål.
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
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Säsong</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Poäng</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">Placering</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">S</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">V</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">O</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">F</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">GM</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">IM</th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center">MS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((entry, index) => (
              <tr key={`${entry.teamId}-${entry.season}`} className="hover:bg-gray-50">
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
                  <span className="text-sm font-medium text-blue-600">{entry.season}</span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                  <span className="text-lg font-bold text-red-600">{entry.points}</span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-red-600">{entry.position}:a</span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.played}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.won}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.drawn}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.lost}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.goalsFor}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.goalsAgainst}
                </td>
                <td className={`px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-center text-sm font-medium ${
                  entry.goalDifference > 0 ? 'text-green-600' : 
                  entry.goalDifference < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}
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