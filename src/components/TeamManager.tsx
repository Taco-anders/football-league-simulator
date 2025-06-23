import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Users, Zap, Shield } from 'lucide-react';
import { Team, Division } from '../types';

interface TeamManagerProps {
  divisions: Division[];
  onAddTeam: (team: Omit<Team, 'id'>) => void;
  onUpdateTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
}

export const TeamManager: React.FC<TeamManagerProps> = ({
  divisions,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam
}) => {
  const [selectedDivision, setSelectedDivision] = useState(divisions[0]?.id || '');
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    attackStrength: 0.7,
    defenseStrength: 0.7,
    divisionId: selectedDivision
  });

  const currentDivision = divisions.find(d => d.id === selectedDivision);
  
  // Get the league settings from the first division's context
  // We need to determine max teams per division from the league structure
  // For now, we'll get it from the current league's settings or use a reasonable default
  const getMaxTeamsPerDivision = () => {
    // This should ideally come from the league settings passed down
    // For now, we'll infer it from the existing structure or use a default
    if (divisions.length > 0) {
      // Try to get the setting from the parent component context
      // Since we don't have direct access, we'll use a reasonable approach
      const maxTeamsFound = Math.max(...divisions.map(d => d.teams.length));
      // If all divisions have the same number of teams, that might be the limit
      // Otherwise, use a reasonable default based on common league sizes
      return maxTeamsFound > 0 ? Math.max(maxTeamsFound, 4) : 10;
    }
    return 10; // Default fallback
  };

  const maxTeamsPerDivision = getMaxTeamsPerDivision();
  
  // Check if current division is full
  const isCurrentDivisionFull = currentDivision && currentDivision.teams.length >= maxTeamsPerDivision;
  
  // Check if all divisions are full
  const allDivisionsFull = divisions.every(div => div.teams.length >= maxTeamsPerDivision);
  
  // Find next available division
  const getNextAvailableDivision = () => {
    return divisions.find(div => div.teams.length < maxTeamsPerDivision);
  };

  const canAddTeam = !allDivisionsFull;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && canAddTeam) {
      // Check if current division is full, if so, switch to next available
      let targetDivisionId = formData.divisionId;
      const targetDivision = divisions.find(d => d.id === targetDivisionId);
      
      if (targetDivision && targetDivision.teams.length >= maxTeamsPerDivision) {
        const nextAvailable = getNextAvailableDivision();
        if (nextAvailable) {
          targetDivisionId = nextAvailable.id;
        }
      }

      if (editingTeam) {
        onUpdateTeam({
          ...editingTeam,
          ...formData,
          divisionId: targetDivisionId
        });
      } else {
        onAddTeam({
          ...formData,
          divisionId: targetDivisionId
        });
        
        // Auto-switch to next available division after adding
        const updatedDivision = divisions.find(d => d.id === targetDivisionId);
        if (updatedDivision && updatedDivision.teams.length + 1 >= maxTeamsPerDivision) {
          const nextAvailable = getNextAvailableDivision();
          if (nextAvailable && nextAvailable.id !== targetDivisionId) {
            setSelectedDivision(nextAvailable.id);
            setFormData(prev => ({ ...prev, divisionId: nextAvailable.id }));
          }
        }
      }
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      attackStrength: 0.7,
      defenseStrength: 0.7,
      divisionId: selectedDivision
    });
    setShowForm(false);
    setEditingTeam(null);
  };

  const startEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      attackStrength: team.attackStrength,
      defenseStrength: team.defenseStrength,
      divisionId: team.divisionId
    });
    setShowForm(true);
  };

  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivision(divisionId);
    setFormData(prev => ({ ...prev, divisionId }));
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'text-green-600';
    if (strength >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrengthBg = (strength: number) => {
    if (strength >= 0.8) return 'bg-green-100';
    if (strength >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getDivisionStatus = (division: Division) => {
    const isFull = division.teams.length >= maxTeamsPerDivision;
    const percentage = (division.teams.length / maxTeamsPerDivision) * 100;
    
    return {
      isFull,
      percentage,
      color: isFull ? 'text-red-600' : percentage > 75 ? 'text-yellow-600' : 'text-green-600',
      bgColor: isFull ? 'bg-red-50' : percentage > 75 ? 'bg-yellow-50' : 'bg-green-50'
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-semibold text-gray-900">Team Management</h2>
          <select
            value={selectedDivision}
            onChange={(e) => handleDivisionChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {divisions.map(division => {
              const status = getDivisionStatus(division);
              return (
                <option key={division.id} value={division.id}>
                  {division.name} ({division.teams.length}/{maxTeamsPerDivision})
                  {status.isFull ? ' - FULL' : ''}
                </option>
              );
            })}
          </select>
        </div>
        {canAddTeam && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Team
          </button>
        )}
      </div>

      {/* Division Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {divisions.map(division => {
          const status = getDivisionStatus(division);
          return (
            <div
              key={division.id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                division.id === selectedDivision
                  ? 'border-green-500 bg-green-50'
                  : `border-gray-200 ${status.bgColor} hover:border-gray-300`
              }`}
              onClick={() => handleDivisionChange(division.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{division.name}</h3>
                <span className={`text-sm font-medium ${status.color}`}>
                  {division.teams.length}/{maxTeamsPerDivision}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    status.isFull ? 'bg-red-500' : status.percentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(status.percentage, 100)}%` }}
                />
              </div>
              {status.isFull && (
                <p className="text-xs text-red-600 mt-1 font-medium">Division Full</p>
              )}
            </div>
          );
        })}
      </div>

      {allDivisionsFull && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">All Divisions Full</h3>
              <p className="text-sm text-red-700 mt-1">
                All divisions have reached their maximum capacity of {maxTeamsPerDivision} teams each. 
                Remove teams or create a new league to add more teams.
              </p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingTeam ? 'Edit Team' : 'Add New Team'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                Team Name
              </label>
              <input
                type="text"
                id="teamName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter team name..."
                required
              />
            </div>

            {!editingTeam && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Division
                </label>
                <select
                  value={formData.divisionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, divisionId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {divisions.map(division => {
                    const status = getDivisionStatus(division);
                    return (
                      <option 
                        key={division.id} 
                        value={division.id}
                        disabled={status.isFull}
                      >
                        {division.name} ({division.teams.length}/{maxTeamsPerDivision})
                        {status.isFull ? ' - FULL' : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Team will be added to the next available division if the selected one is full.
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="flex items-center mb-2">
                  <Zap className="w-5 h-5 text-orange-600 mr-2" />
                  <label className="block text-sm font-medium text-gray-700">
                    Attack Strength: {formData.attackStrength.toFixed(1)}
                  </label>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.0"
                  step="0.1"
                  value={formData.attackStrength}
                  onChange={(e) => setFormData(prev => ({ ...prev, attackStrength: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.4</span>
                  <span>1.0</span>
                </div>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <Shield className="w-5 h-5 text-blue-600 mr-2" />
                  <label className="block text-sm font-medium text-gray-700">
                    Defense Strength: {formData.defenseStrength.toFixed(1)}
                  </label>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.0"
                  step="0.1"
                  value={formData.defenseStrength}
                  onChange={(e) => setFormData(prev => ({ ...prev, defenseStrength: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.4</span>
                  <span>1.0</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={!canAddTeam}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {editingTeam ? 'Update Team' : 'Add Team'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {currentDivision && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{currentDivision.name}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {currentDivision.teams.length}/{maxTeamsPerDivision} teams
                </span>
                {getDivisionStatus(currentDivision).isFull && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    FULL
                  </span>
                )}
              </div>
            </div>
          </div>

          {currentDivision.teams.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-500 mb-2">No teams yet</h4>
              <p className="text-gray-400 mb-4">Add teams to this division to get started</p>
              {canAddTeam && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add First Team
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {currentDivision.teams.map((team) => (
                <div key={team.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{team.name}</h4>
                      <div className="flex items-center space-x-6 mt-2">
                        <div className="flex items-center">
                          <Zap className="w-4 h-4 text-orange-600 mr-1" />
                          <span className="text-sm text-gray-600 mr-2">Attack:</span>
                          <span className={`text-sm font-semibold px-2 py-1 rounded ${getStrengthBg(team.attackStrength)} ${getStrengthColor(team.attackStrength)}`}>
                            {team.attackStrength.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 text-blue-600 mr-1" />
                          <span className="text-sm text-gray-600 mr-2">Defense:</span>
                          <span className={`text-sm font-semibold px-2 py-1 rounded ${getStrengthBg(team.defenseStrength)} ${getStrengthColor(team.defenseStrength)}`}>
                            {team.defenseStrength.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(team)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTeam(team.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};