import { Team, Match, TeamStats } from '../types';

export const simulateMatch = (homeTeam: Team, awayTeam: Team): { homeScore: number; awayScore: number } => {
  // Home advantage factor
  const homeAdvantage = 0.15;
  
  // Calculate effective strengths
  const homeAttack = Math.min(1.0, homeTeam.attackStrength + homeAdvantage);
  const homeDefense = Math.min(1.0, homeTeam.defenseStrength + homeAdvantage);
  const awayAttack = awayTeam.attackStrength;
  const awayDefense = awayTeam.defenseStrength;
  
  // Calculate expected goals based on attack vs defense
  // Higher attack vs lower defense = more goals
  const homeExpectedGoals = Math.max(0.1, (homeAttack - awayDefense + 0.5) * 2.2);
  const awayExpectedGoals = Math.max(0.1, (awayAttack - homeDefense + 0.5) * 2.2);
  
  console.log(`🧮 ${homeTeam.name} (${homeAttack.toFixed(2)} att) vs ${awayTeam.name} (${awayDefense.toFixed(2)} def) = ${homeExpectedGoals.toFixed(2)} expected goals`);
  console.log(`🧮 ${awayTeam.name} (${awayAttack.toFixed(2)} att) vs ${homeTeam.name} (${homeDefense.toFixed(2)} def) = ${awayExpectedGoals.toFixed(2)} expected goals`);
  
  // Generate actual scores using Poisson-like distribution
  // Use multiple random factors to create realistic variation
  const homeRandom1 = Math.random();
  const homeRandom2 = Math.random();
  const awayRandom1 = Math.random();
  const awayRandom2 = Math.random();
  
  // Calculate scores with realistic distribution
  let homeScore = Math.round(homeExpectedGoals * homeRandom1 + homeRandom2 * 2 - 1);
  let awayScore = Math.round(awayExpectedGoals * awayRandom1 + awayRandom2 * 2 - 1);
  
  // Ensure non-negative scores
  homeScore = Math.max(0, homeScore);
  awayScore = Math.max(0, awayScore);
  
  // Prevent unrealistic high scores (max 8 goals per team)
  homeScore = Math.min(8, homeScore);
  awayScore = Math.min(8, awayScore);
  
  console.log(`⚽ Final result: ${homeTeam.name} ${homeScore}-${awayScore} ${awayTeam.name}`);
  
  return { homeScore, awayScore };
};

// NEW: Function to adjust team coefficients based on match results
export const adjustTeamCoefficients = (
  homeTeam: Team, 
  awayTeam: Team, 
  homeScore: number, 
  awayScore: number
): { updatedHomeTeam: Team; updatedAwayTeam: Team } => {
  const adjustmentFactor = 0.02; // How much to adjust (2% per match)
  const minCoeff = 0.3; // Minimum coefficient
  const maxCoeff = 1.0; // Maximum coefficient
  
  let updatedHomeTeam = { ...homeTeam };
  let updatedAwayTeam = { ...awayTeam };
  
  console.log(`📊 Before adjustment: ${homeTeam.name} (AK:${homeTeam.attackStrength.toFixed(2)}, FK:${homeTeam.defenseStrength.toFixed(2)}) vs ${awayTeam.name} (AK:${awayTeam.attackStrength.toFixed(2)}, FK:${awayTeam.defenseStrength.toFixed(2)})`);
  
  if (homeScore > awayScore) {
    // HOME TEAM WINS
    console.log(`🏆 ${homeTeam.name} wins ${homeScore}-${awayScore}`);
    
    // 1. Vinnande lag får högre AK om det har lägre AK än förloraren
    if (homeTeam.attackStrength < awayTeam.attackStrength) {
      updatedHomeTeam.attackStrength = Math.min(maxCoeff, homeTeam.attackStrength + adjustmentFactor);
      console.log(`📈 ${homeTeam.name} AK increased: ${homeTeam.attackStrength.toFixed(2)} → ${updatedHomeTeam.attackStrength.toFixed(2)}`);
    }
    
    // 1. Vinnande lag får högre FK om det har lägre FK än förloraren
    if (homeTeam.defenseStrength < awayTeam.defenseStrength) {
      updatedHomeTeam.defenseStrength = Math.min(maxCoeff, homeTeam.defenseStrength + adjustmentFactor);
      console.log(`📈 ${homeTeam.name} FK increased: ${homeTeam.defenseStrength.toFixed(2)} → ${updatedHomeTeam.defenseStrength.toFixed(2)}`);
    }
    
    // 2. Förlorande lag får sänkt AK om det har högre AK än vinnaren
    if (awayTeam.attackStrength > homeTeam.attackStrength) {
      updatedAwayTeam.attackStrength = Math.max(minCoeff, awayTeam.attackStrength - adjustmentFactor);
      console.log(`📉 ${awayTeam.name} AK decreased: ${awayTeam.attackStrength.toFixed(2)} → ${updatedAwayTeam.attackStrength.toFixed(2)}`);
    }
    
    // 2. Förlorande lag får sänkt FK om det har högre FK än vinnaren
    if (awayTeam.defenseStrength > homeTeam.defenseStrength) {
      updatedAwayTeam.defenseStrength = Math.max(minCoeff, awayTeam.defenseStrength - adjustmentFactor);
      console.log(`📉 ${awayTeam.name} FK decreased: ${awayTeam.defenseStrength.toFixed(2)} → ${updatedAwayTeam.defenseStrength.toFixed(2)}`);
    }
    
  } else if (awayScore > homeScore) {
    // AWAY TEAM WINS
    console.log(`🏆 ${awayTeam.name} wins ${awayScore}-${homeScore}`);
    
    // 1. Vinnande lag får högre AK om det har lägre AK än förloraren
    if (awayTeam.attackStrength < homeTeam.attackStrength) {
      updatedAwayTeam.attackStrength = Math.min(maxCoeff, awayTeam.attackStrength + adjustmentFactor);
      console.log(`📈 ${awayTeam.name} AK increased: ${awayTeam.attackStrength.toFixed(2)} → ${updatedAwayTeam.attackStrength.toFixed(2)}`);
    }
    
    // 1. Vinnande lag får högre FK om det har lägre FK än förloraren
    if (awayTeam.defenseStrength < homeTeam.defenseStrength) {
      updatedAwayTeam.defenseStrength = Math.min(maxCoeff, awayTeam.defenseStrength + adjustmentFactor);
      console.log(`📈 ${awayTeam.name} FK increased: ${awayTeam.defenseStrength.toFixed(2)} → ${updatedAwayTeam.defenseStrength.toFixed(2)}`);
    }
    
    // 2. Förlorande lag får sänkt AK om det har högre AK än vinnaren
    if (homeTeam.attackStrength > awayTeam.attackStrength) {
      updatedHomeTeam.attackStrength = Math.max(minCoeff, homeTeam.attackStrength - adjustmentFactor);
      console.log(`📉 ${homeTeam.name} AK decreased: ${homeTeam.attackStrength.toFixed(2)} → ${updatedHomeTeam.attackStrength.toFixed(2)}`);
    }
    
    // 2. Förlorande lag får sänkt FK om det har högre FK än vinnaren
    if (homeTeam.defenseStrength > awayTeam.defenseStrength) {
      updatedHomeTeam.defenseStrength = Math.max(minCoeff, homeTeam.defenseStrength - adjustmentFactor);
      console.log(`📉 ${homeTeam.name} FK decreased: ${homeTeam.defenseStrength.toFixed(2)} → ${updatedHomeTeam.defenseStrength.toFixed(2)}`);
    }
    
  } else {
    // DRAW
    console.log(`🤝 Draw ${homeScore}-${awayScore}`);
    
    // 3. Vid oavgjort får laget med lägre FK höjd FK
    if (homeTeam.defenseStrength < awayTeam.defenseStrength) {
      updatedHomeTeam.defenseStrength = Math.min(maxCoeff, homeTeam.defenseStrength + adjustmentFactor);
      console.log(`📈 ${homeTeam.name} FK increased (draw): ${homeTeam.defenseStrength.toFixed(2)} → ${updatedHomeTeam.defenseStrength.toFixed(2)}`);
    } else if (awayTeam.defenseStrength < homeTeam.defenseStrength) {
      updatedAwayTeam.defenseStrength = Math.min(maxCoeff, awayTeam.defenseStrength + adjustmentFactor);
      console.log(`📈 ${awayTeam.name} FK increased (draw): ${awayTeam.defenseStrength.toFixed(2)} → ${updatedAwayTeam.defenseStrength.toFixed(2)}`);
    }
  }
  
  return { updatedHomeTeam, updatedAwayTeam };
};

// NEW: Function to apply random season start adjustments
export const applySeasonStartAdjustments = (teams: Team[]): Team[] => {
  const adjustmentRange = 0.05; // ±5% random adjustment
  const minCoeff = 0.3;
  const maxCoeff = 1.0;
  
  console.log(`🎲 Applying season start adjustments to ${teams.length} teams`);
  
  return teams.map(team => {
    // Random adjustments between -0.05 and +0.05
    const attackAdjustment = (Math.random() - 0.5) * 2 * adjustmentRange;
    const defenseAdjustment = (Math.random() - 0.5) * 2 * adjustmentRange;
    
    const newAttackStrength = Math.max(minCoeff, Math.min(maxCoeff, team.attackStrength + attackAdjustment));
    const newDefenseStrength = Math.max(minCoeff, Math.min(maxCoeff, team.defenseStrength + defenseAdjustment));
    
    console.log(`🎲 ${team.name}: AK ${team.attackStrength.toFixed(2)} → ${newAttackStrength.toFixed(2)}, FK ${team.defenseStrength.toFixed(2)} → ${newDefenseStrength.toFixed(2)}`);
    
    return {
      ...team,
      attackStrength: newAttackStrength,
      defenseStrength: newDefenseStrength
    };
  });
};

export const calculateStandings = (matches: Match[], teams: Team[]): Record<string, TeamStats> => {
  const standings: Record<string, TeamStats> = {};
  
  // Initialize standings
  teams.forEach(team => {
    standings[team.id] = {
      teamId: team.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    };
  });
  
  // Process played matches
  matches.filter(match => match.played).forEach(match => {
    const homeStats = standings[match.homeTeamId];
    const awayStats = standings[match.awayTeamId];
    
    if (!homeStats || !awayStats || match.homeScore === undefined || match.awayScore === undefined) {
      return;
    }
    
    homeStats.played++;
    awayStats.played++;
    homeStats.goalsFor += match.homeScore;
    homeStats.goalsAgainst += match.awayScore;
    awayStats.goalsFor += match.awayScore;
    awayStats.goalsAgainst += match.homeScore;
    
    if (match.homeScore > match.awayScore) {
      homeStats.won++;
      homeStats.points += 3;
      awayStats.lost++;
    } else if (match.homeScore < match.awayScore) {
      awayStats.won++;
      awayStats.points += 3;
      homeStats.lost++;
    } else {
      homeStats.drawn++;
      awayStats.drawn++;
      homeStats.points += 1;
      awayStats.points += 1;
    }
    
    homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;
    awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;
  });
  
  return standings;
};

export const sortStandings = (standings: TeamStats[]): TeamStats[] => {
  return standings.sort((a, b) => {
    // Sort by points, then goal difference, then goals for
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
};