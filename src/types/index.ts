export interface Team {
  id: string;
  name: string;
  attackStrength: number;
  defenseStrength: number;
  divisionId: string;
}

export interface Division {
  id: string;
  name: string;
  level: number;
  teams: Team[];
}

export interface League {
  id: string;
  name: string;
  divisions: Division[];
  settings: LeagueSettings;
  currentSeason: number;
  matches: Match[];
  standings: Record<string, TeamStats>;
  // NEW: Historical statistics
  seasonHistory: SeasonHistory[];
  allTimeStats: AllTimeStats;
}

export interface LeagueSettings {
  divisionsCount: number;
  teamsPerDivision: number;
  promotionCount: number;
  relegationCount: number;
  simulationTime: number; // in seconds
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
  round: number;
  divisionId: string;
}

export interface TeamStats {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

// NEW: Historical statistics interfaces
export interface SeasonHistory {
  season: number;
  divisions: DivisionSeasonResult[];
  matches: HistoricalMatch[]; // NEW: Store all match details
  completed: boolean;
}

export interface DivisionSeasonResult {
  divisionId: string;
  divisionLevel: number;
  finalStandings: TeamSeasonResult[];
}

export interface TeamSeasonResult {
  teamId: string;
  teamName: string;
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

// NEW: Historical match data
export interface HistoricalMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  round: number;
  divisionId: string;
  divisionName: string;
  divisionLevel: number;
}

export interface AllTimeStats {
  // Maratontabell för division 1
  division1Marathon: MarathonEntry[];
  
  // Antal vunna mästerskap (vinnare av div 1)
  championships: ChampionshipEntry[];
  
  // Antal gånger sist i lägsta divisionen
  lastPlaceInLowest: LastPlaceEntry[];
  
  // Poängtabell baserad på slutposition
  positionPoints: PositionPointsEntry[];
  
  // Uppflyttningar och nedflyttningar
  promotionsRelegations: PromotionRelegationEntry[];
}

export interface MarathonEntry {
  teamId: string;
  teamName: string;
  totalPoints: number;
  totalPlayed: number;
  totalWon: number;
  totalDrawn: number;
  totalLost: number;
  totalGoalsFor: number;
  totalGoalsAgainst: number;
  totalGoalDifference: number;
  seasonsInDiv1: number;
}

export interface ChampionshipEntry {
  teamId: string;
  teamName: string;
  championships: number;
  championshipSeasons: number[];
}

export interface LastPlaceEntry {
  teamId: string;
  teamName: string;
  lastPlaceCount: number;
  lastPlaceSeasons: number[];
}

export interface PositionPointsEntry {
  teamId: string;
  teamName: string;
  totalPositionPoints: number;
  breakdown: {
    first: number;    // 6p
    second: number;   // 4p
    third: number;    // 2p
    fourth: number;   // 1p
  };
}

export interface PromotionRelegationEntry {
  teamId: string;
  teamName: string;
  promotions: number;
  relegations: number;
  promotionSeasons: number[];
  relegationSeasons: number[];
}