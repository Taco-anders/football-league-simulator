import React, { useState } from 'react';
import { Plus, Trash2, Play, Settings, MapPin } from 'lucide-react';
import { League, LeagueSettings } from '../types';
import { generateSwedishTeams, swedishLeaguePresets } from '../utils/teamGenerator';

interface LeagueSelectorProps {
  leagues: League[];
  onSelectLeague: (league: League) => void;
  onCreateLeague: () => void;
  onDeleteLeague: (leagueId: string) => void;
  onCreateSwedishLeague: (name: string, settings: LeagueSettings) => void;
}

export const LeagueSelector: React.FC<LeagueSelectorProps> = ({
  leagues,
  onSelectLeague,
  onCreateLeague,
  onDeleteLeague,
  onCreateSwedishLeague
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showSwedishPresets, setShowSwedishPresets] = useState(false);

  const handleDelete = (leagueId: string) => {
    if (deleteConfirm === leagueId) {
      onDeleteLeague(leagueId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(leagueId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleSwedishLeagueCreate = (presetKey: string) => {
    const preset = swedishLeaguePresets[presetKey as keyof typeof swedishLeaguePresets];
    if (preset) {
      onCreateSwedishLeague(preset.name, {
        divisionsCount: preset.divisionsCount,
        teamsPerDivision: preset.teamsPerDivision,
        promotionCount: preset.promotionCount,
        relegationCount: preset.relegationCount,
        simulationTime: preset.simulationTime
      });
      setShowSwedishPresets(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Football League Simulator</h1>
          <p className="text-lg text-gray-600">Manage your football leagues and simulate seasons</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Select League</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSwedishPresets(!showSwedishPresets)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MapPin className="w-5 h-5 mr-2" />
                🇸🇪 Swedish League
              </button>
              <button
                onClick={onCreateLeague}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Custom League
              </button>
            </div>
          </div>

          {showSwedishPresets && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                🇸🇪 Create Swedish League with Generated Teams
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose a preset to automatically create a league with Swedish teams like IFK Blåmyren, Snutholmens IF, Gräsängen BK, etc.
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {Object.entries(swedishLeaguePresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handleSwedishLeagueCreate(key)}
                    className="p-4 text-left border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="font-semibold text-blue-900">{key}</div>
                    <div className="text-sm text-blue-700 mt-1">
                      {preset.divisionsCount} divisions, {preset.teamsPerDivision} teams each
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Total: {preset.divisionsCount * preset.teamsPerDivision} teams
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowSwedishPresets(false)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Cancel
              </button>
            </div>
          )}

          {leagues.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-500 mb-2">No leagues found</h3>
              <p className="text-gray-400 mb-6">Create your first league to get started</p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowSwedishPresets(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  🇸🇪 Swedish League
                </button>
                <button
                  onClick={onCreateLeague}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Custom League
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {leagues.map((league) => (
                <div
                  key={league.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => onSelectLeague(league)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                        {league.name}
                      </h3>
                      <p className="text-sm text-gray-500">Season {league.currentSeason}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(league.id);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        deleteConfirm === league.id
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={deleteConfirm === league.id ? 'Click again to confirm' : 'Delete league'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Divisions:</span>
                      <span className="font-medium">{league.divisions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Teams per division:</span>
                      <span className="font-medium">{league.settings.teamsPerDivision}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total teams:</span>
                      <span className="font-medium">
                        {league.divisions.reduce((sum, div) => sum + div.teams.length, 0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-green-600 group-hover:text-green-700 transition-colors">
                      <Play className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Continue Season</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};