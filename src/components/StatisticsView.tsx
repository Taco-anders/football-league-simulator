import React, { useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Award, Target, BarChart3, Calendar, Medal } from 'lucide-react';
import { League, MarathonEntry, ChampionshipEntry, LastPlaceEntry, PositionPointsEntry, PromotionRelegationEntry } from '../types';

interface StatisticsViewProps {
  league: League;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ league }) => {
  const [activeTab, setActiveTab] = useState<'marathon' | 'championships' | 'lastplace' | 'position' | 'promrel'>('marathon');

  const tabs = [
    { id: 'marathon' as const, label: 'Division 1 Marathon', icon: BarChart3, description: 'Sammanlagd tabell för alla säsonger i division 1' },
    { id: 'championships' as const, label: 'Mästerskap', icon: Trophy, description: 'Antal vunna mästerskap (vinnare av division 1)' },
    { id: 'lastplace' as const, label: 'Jumboplatser', icon: TrendingDown, description: 'Antal gånger sist i lägsta divisionen' },
    { id: 'position' as const, label: 'Positionspoäng', icon: Target, description: 'Division 1: 1:a=6p, 2:a=4p, 3:a=2p, 4:a=1p' },
    { id: 'promrel' as const, label: 'Upp/Nedflyttningar', icon: TrendingUp, description: 'Antal uppflyttningar och nedflyttningar' }
  ];

  const hasData = league.seasonHistory.length > 0;

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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Historisk Statistik</h2>
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
          <nav className="flex space-x-8 px-6 overflow-x-auto">
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
          </nav>
        </div>

        <div className="p-6">
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
        </div>
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
            <th className="px-4 py-3">Pos</th>
            <th className="px-4 py-3">Lag</th>
            <th className="px-4 py-3 text-center">Säsonger</th>
            <th className="px-4 py-3 text-center">S</th>
            <th className="px-4 py-3 text-center">V</th>
            <th className="px-4 py-3 text-center">O</th>
            <th className="px-4 py-3 text-center">F</th>
            <th className="px-4 py-3 text-center">GM</th>
            <th className="px-4 py-3 text-center">IM</th>
            <th className="px-4 py-3 text-center">MS</th>
            <th className="px-4 py-3 text-center">P</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((entry, index) => (
            <tr key={entry.teamId} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
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
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{entry.teamName}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.seasonsInDiv1}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.totalPlayed}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.totalWon}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.totalDrawn}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.totalLost}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.totalGoalsFor}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                {entry.totalGoalsAgainst}
              </td>
              <td className={`px-4 py-3 whitespace-nowrap text-center text-sm font-medium ${
                entry.totalGoalDifference > 0 ? 'text-green-600' : 
                entry.totalGoalDifference < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {entry.totalGoalDifference > 0 ? '+' : ''}{entry.totalGoalDifference}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900">
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
            <th className="px-4 py-3">Pos</th>
            <th className="px-4 py-3">Lag</th>
            <th className="px-4 py-3 text-center">Mästerskap</th>
            <th className="px-4 py-3">Säsonger</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((entry, index) => (
            <tr key={entry.teamId} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
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
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{entry.teamName}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center">
                <span className="text-lg font-bold text-green-600">{entry.championships}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
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
            <th className="px-4 py-3">Pos</th>
            <th className="px-4 py-3">Lag</th>
            <th className="px-4 py-3 text-center">Jumboplatser</th>
            <th className="px-4 py-3">Säsonger</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((entry, index) => (
            <tr key={entry.teamId} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">{index + 1}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{entry.teamName}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center">
                <span className="text-lg font-bold text-red-600">{entry.lastPlaceCount}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
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
              <th className="px-4 py-3">Pos</th>
              <th className="px-4 py-3">Lag</th>
              <th className="px-4 py-3 text-center">Totalt</th>
              <th className="px-4 py-3 text-center">1:a (6p)</th>
              <th className="px-4 py-3 text-center">2:a (4p)</th>
              <th className="px-4 py-3 text-center">3:a (2p)</th>
              <th className="px-4 py-3 text-center">4:a (1p)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((entry, index) => (
              <tr key={entry.teamId} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
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
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{entry.teamName}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className="text-lg font-bold text-blue-600">{entry.totalPositionPoints}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.breakdown.first}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.breakdown.second}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                  {entry.breakdown.third}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
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
            <th className="px-4 py-3">Pos</th>
            <th className="px-4 py-3">Lag</th>
            <th className="px-4 py-3 text-center">Netto</th>
            <th className="px-4 py-3 text-center">Uppflyttningar</th>
            <th className="px-4 py-3 text-center">Nedflyttningar</th>
            <th className="px-4 py-3">Uppflyttningssäsonger</th>
            <th className="px-4 py-3">Nedflyttningssäsonger</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((entry, index) => {
            const netMovement = entry.promotions - entry.relegations;
            return (
              <tr key={entry.teamId} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{entry.teamName}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className={`text-lg font-bold ${
                    netMovement > 0 ? 'text-green-600' : 
                    netMovement < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {netMovement > 0 ? '+' : ''}{netMovement}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-green-600">{entry.promotions}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-red-600">{entry.relegations}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {entry.promotionSeasons.length > 0 ? entry.promotionSeasons.join(', ') : '-'}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
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