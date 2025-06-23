import React, { useState } from 'react';
import { ArrowLeft, Settings, Users, TrendingUp } from 'lucide-react';
import { LeagueSettings } from '../types';

interface LeagueCreatorProps {
  onCreateLeague: (name: string, settings: LeagueSettings) => void;
  onBack: () => void;
}

export const LeagueCreator: React.FC<LeagueCreatorProps> = ({ onCreateLeague, onBack }) => {
  const [leagueName, setLeagueName] = useState('');
  const [settings, setSettings] = useState<LeagueSettings>({
    divisionsCount: 3,
    teamsPerDivision: 10,
    promotionCount: 2,
    relegationCount: 2,
    simulationTime: 30
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leagueName.trim()) {
      onCreateLeague(leagueName.trim(), settings);
    }
  };

  const updateSettings = (key: keyof LeagueSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to League Selection
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New League</h1>
            <p className="text-gray-600">Configure your football league settings</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="leagueName" className="block text-sm font-medium text-gray-700 mb-2">
                League Name
              </label>
              <input
                type="text"
                id="leagueName"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="Enter league name..."
                required
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center mb-2">
                    <Users className="w-5 h-5 text-green-600 mr-2" />
                    <label className="block text-sm font-medium text-gray-700">
                      Number of Divisions
                    </label>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={settings.divisionsCount}
                    onChange={(e) => updateSettings('divisionsCount', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>1</span>
                    <span className="font-semibold text-green-600">{settings.divisionsCount}</span>
                    <span>5</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <Users className="w-5 h-5 text-green-600 mr-2" />
                    <label className="block text-sm font-medium text-gray-700">
                      Teams per Division
                    </label>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="20"
                    step="2"
                    value={settings.teamsPerDivision}
                    onChange={(e) => updateSettings('teamsPerDivision', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>4</span>
                    <span className="font-semibold text-green-600">{settings.teamsPerDivision}</span>
                    <span>20</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                    <label className="block text-sm font-medium text-gray-700">
                      Promotion/Relegation Count
                    </label>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={Math.floor(settings.teamsPerDivision / 3)}
                    value={settings.promotionCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      updateSettings('promotionCount', value);
                      updateSettings('relegationCount', value);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>1</span>
                    <span className="font-semibold text-green-600">{settings.promotionCount}</span>
                    <span>{Math.floor(settings.teamsPerDivision / 3)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <Settings className="w-5 h-5 text-green-600 mr-2" />
                    <label className="block text-sm font-medium text-gray-700">
                      Simulation Speed (seconds)
                    </label>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={settings.simulationTime}
                    onChange={(e) => updateSettings('simulationTime', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>10s</span>
                    <span className="font-semibold text-green-600">{settings.simulationTime}s</span>
                    <span>60s</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">League Summary</h3>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total divisions:</span>
                  <span className="font-semibold">{settings.divisionsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Teams per division:</span>
                  <span className="font-semibold">{settings.teamsPerDivision}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total teams:</span>
                  <span className="font-semibold">{settings.divisionsCount * settings.teamsPerDivision}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Matches per season:</span>
                  <span className="font-semibold">
                    {settings.divisionsCount * settings.teamsPerDivision * (settings.teamsPerDivision - 1)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Create League
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};