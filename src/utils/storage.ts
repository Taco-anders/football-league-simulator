import { League } from '../types';

const STORAGE_KEY = 'football_leagues';

export const saveLeagues = (leagues: League[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leagues));
  } catch (error) {
    console.error('Failed to save leagues:', error);
  }
};

export const loadLeagues = (): League[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load leagues:', error);
    return [];
  }
};

export const saveCurrentLeagueId = (leagueId: string | null): void => {
  try {
    if (leagueId) {
      localStorage.setItem('current_league_id', leagueId);
    } else {
      localStorage.removeItem('current_league_id');
    }
  } catch (error) {
    console.error('Failed to save current league ID:', error);
  }
};

export const loadCurrentLeagueId = (): string | null => {
  try {
    return localStorage.getItem('current_league_id');
  } catch (error) {
    console.error('Failed to load current league ID:', error);
    return null;
  }
};