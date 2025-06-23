import { Team, Match, Division } from '../types';

export const generateSchedule = (division: Division): Match[] => {
  const teams = division.teams;
  const matches: Match[] = [];
  
  if (teams.length < 2) return matches;
  
  console.log(`📅 Generating schedule for ${division.name} with ${teams.length} teams`);
  
  // For round-robin tournament: each team plays every other team twice (home and away)
  const matchesPerRound = Math.floor(teams.length / 2);
  const totalRounds = (teams.length - 1) * 2; // Double round-robin
  
  console.log(`📊 Expected: ${matchesPerRound} matches per round, ${totalRounds} total rounds`);
  
  let matchId = 0;
  
  // Generate first half of season (each team plays each other once)
  const firstHalfMatches = generateRoundRobinMatches(teams, division.id, matchId);
  matches.push(...firstHalfMatches);
  matchId += firstHalfMatches.length;
  
  // Generate second half of season (reverse fixtures)
  const secondHalfMatches = generateRoundRobinMatches(teams, division.id, matchId, true);
  matches.push(...secondHalfMatches);
  
  console.log(`✅ Generated ${matches.length} total matches for ${division.name}`);
  console.log(`📈 Rounds distribution:`, getMatchesPerRound(matches));
  
  return matches;
};

// Generate round-robin matches using the circle method
const generateRoundRobinMatches = (
  teams: Team[], 
  divisionId: string, 
  startMatchId: number, 
  reverse: boolean = false
): Match[] => {
  const matches: Match[] = [];
  const numTeams = teams.length;
  
  if (numTeams % 2 === 1) {
    // Odd number of teams - add a "bye" team
    teams = [...teams, { id: 'bye', name: 'BYE', attackStrength: 0, defenseStrength: 0, divisionId }];
  }
  
  const totalTeams = teams.length;
  const roundsInHalf = totalTeams - 1;
  let matchId = startMatchId;
  
  for (let round = 0; round < roundsInHalf; round++) {
    const roundNumber = reverse ? round + roundsInHalf + 1 : round + 1;
    
    // Create matches for this round using the circle method
    for (let i = 0; i < totalTeams / 2; i++) {
      const home = (round + i) % (totalTeams - 1);
      const away = (totalTeams - 1 - i + round) % (totalTeams - 1);
      
      // The last team (index totalTeams-1) is fixed
      let homeTeam = teams[home];
      let awayTeam = teams[away];
      
      // Handle the fixed team
      if (i === 0) {
        awayTeam = teams[totalTeams - 1];
      }
      
      // Skip if either team is the "bye" team
      if (homeTeam.id === 'bye' || awayTeam.id === 'bye') {
        continue;
      }
      
      // For reverse fixtures, swap home and away
      if (reverse) {
        [homeTeam, awayTeam] = [awayTeam, homeTeam];
      }
      
      matches.push({
        id: `${divisionId}-r${roundNumber}-${matchId++}`,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        played: false,
        round: roundNumber,
        divisionId: divisionId
      });
    }
  }
  
  return matches;
};

// Helper function to analyze matches per round
const getMatchesPerRound = (matches: Match[]): Record<number, number> => {
  const distribution: Record<number, number> = {};
  
  matches.forEach(match => {
    distribution[match.round] = (distribution[match.round] || 0) + 1;
  });
  
  return distribution;
};