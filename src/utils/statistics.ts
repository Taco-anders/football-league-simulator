import { League, SeasonHistory, DivisionSeasonResult, TeamSeasonResult, HistoricalMatch, AllTimeStats, MarathonEntry, ChampionshipEntry, LastPlaceEntry, PositionPointsEntry, PromotionRelegationEntry, Team, Division, Match } from '../types';
import { calculateStandings, sortStandings } from './simulation';
import { generateSchedule } from './schedule';

// Check if a season is complete (all matches played)
export const isSeasonComplete = (league: League): boolean => {
  const totalMatches = league.matches.length;
  const playedMatches = league.matches.filter(m => m.played).length;
  return totalMatches > 0 && playedMatches === totalMatches;
};

// Complete a season and update historical statistics
export const completeSeason = (league: League): League => {
  if (!isSeasonComplete(league)) {
    console.log('⚠️ Season not complete, cannot finalize statistics');
    return league;
  }

  console.log(`🏁 Completing season ${league.currentSeason} for ${league.name}`);

  // Calculate final standings for all divisions
  const seasonResult: SeasonHistory = {
    season: league.currentSeason,
    divisions: [],
    matches: [], // NEW: Will store all match details
    completed: true
  };

  // Store all historical match data
  const historicalMatches: HistoricalMatch[] = [];
  
  league.divisions.forEach(division => {
    const divisionMatches = league.matches.filter(m => m.divisionId === division.id && m.played);
    const standings = calculateStandings(divisionMatches, division.teams);
    const sortedStandings = sortStandings(Object.values(standings));

    const finalStandings: TeamSeasonResult[] = sortedStandings.map((stats, index) => {
      const team = division.teams.find(t => t.id === stats.teamId);
      return {
        teamId: stats.teamId,
        teamName: team?.name || 'Unknown Team',
        position: index + 1,
        points: stats.points,
        played: stats.played,
        won: stats.won,
        drawn: stats.drawn,
        lost: stats.lost,
        goalsFor: stats.goalsFor,
        goalsAgainst: stats.goalsAgainst,
        goalDifference: stats.goalDifference
      };
    });

    seasonResult.divisions.push({
      divisionId: division.id,
      divisionLevel: division.level,
      finalStandings
    });

    // Store historical match data for this division
    divisionMatches.forEach(match => {
      const homeTeam = division.teams.find(t => t.id === match.homeTeamId);
      const awayTeam = division.teams.find(t => t.id === match.awayTeamId);
      
      if (homeTeam && awayTeam && match.homeScore !== undefined && match.awayScore !== undefined) {
        historicalMatches.push({
          id: match.id,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          homeTeamName: homeTeam.name,
          awayTeamName: awayTeam.name,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          round: match.round,
          divisionId: division.id,
          divisionName: division.name,
          divisionLevel: division.level
        });
      }
    });
  });

  seasonResult.matches = historicalMatches;
  console.log(`📊 Stored ${historicalMatches.length} historical matches for season ${league.currentSeason}`);

  // Update season history
  const updatedSeasonHistory = [...league.seasonHistory, seasonResult];

  // Update all-time statistics
  const updatedAllTimeStats = updateAllTimeStats(league.allTimeStats, updatedSeasonHistory, league);

  return {
    ...league,
    seasonHistory: updatedSeasonHistory,
    allTimeStats: updatedAllTimeStats
  };
};

// Start next season with promotions/relegations and new schedule
export const startNextSeason = (league: League): League => {
  console.log(`🚀 Starting season ${league.currentSeason + 1} for ${league.name}`);

  // Apply promotions and relegations
  const updatedDivisions = applyPromotionsRelegations(league);

  // Generate new schedules for all divisions
  const allMatches: Match[] = [];
  updatedDivisions.forEach(division => {
    if (division.teams.length >= 2) {
      const divisionMatches = generateSchedule(division);
      allMatches.push(...divisionMatches);
    }
  });

  console.log(`📅 Generated ${allMatches.length} matches for new season`);

  // Create the new league with updated divisions
  const newLeague = {
    ...league,
    currentSeason: league.currentSeason + 1,
    divisions: updatedDivisions,
    matches: allMatches,
    standings: {}
  };

  // NOW update all-time statistics with the NEW league structure (after promotions/relegations)
  console.log(`📊 Updating all-time statistics after promotions/relegations...`);
  const updatedAllTimeStats = updateAllTimeStats(newLeague.allTimeStats, newLeague.seasonHistory, newLeague);

  return {
    ...newLeague,
    allTimeStats: updatedAllTimeStats
  };
};

// Apply promotions and relegations based on final standings
const applyPromotionsRelegations = (league: League): Division[] => {
  console.log(`🔄 Applying promotions and relegations for ${league.name}`);
  console.log(`📊 Settings: ${league.settings.promotionCount} promotions, ${league.settings.relegationCount} relegations`);

  const { promotionCount, relegationCount } = league.settings;
  
  // Create deep copies of divisions to avoid mutation
  const updatedDivisions = league.divisions.map(div => ({
    ...div,
    teams: [...div.teams.map(team => ({ ...team }))]
  }));

  // Get final standings for each division
  const divisionStandings = league.divisions.map(division => {
    const divisionMatches = league.matches.filter(m => m.divisionId === division.id);
    const standings = calculateStandings(divisionMatches, division.teams);
    const sortedStandings = sortStandings(Object.values(standings));
    
    console.log(`📋 ${division.name} final standings:`);
    sortedStandings.forEach((stats, index) => {
      const team = division.teams.find(t => t.id === stats.teamId);
      console.log(`  ${index + 1}. ${team?.name} - ${stats.points} points`);
    });
    
    return {
      division,
      standings: sortedStandings
    };
  });

  // Sort divisions by level (1 = highest, higher numbers = lower)
  divisionStandings.sort((a, b) => a.division.level - b.division.level);

  // Arrays to track team movements
  const teamsToMove: Array<{
    team: Team;
    fromDivision: Division;
    toDivision: Division;
    type: 'promotion' | 'relegation';
  }> = [];

  // First pass: Identify all teams that need to move
  for (let i = 0; i < divisionStandings.length; i++) {
    const currentDivStandings = divisionStandings[i];
    const currentDiv = currentDivStandings.division;
    
    console.log(`\n🔍 Processing ${currentDiv.name} (Level ${currentDiv.level})`);

    // PROMOTIONS: Top teams move to higher division (lower level number)
    if (i > 0 && promotionCount > 0) {
      const higherDiv = divisionStandings[i - 1].division;
      
      console.log(`⬆️ Checking promotions from ${currentDiv.name} to ${higherDiv.name}`);
      
      // Get top teams for promotion
      const teamsToPromote = currentDivStandings.standings
        .slice(0, promotionCount)
        .map(stats => {
          const team = currentDiv.teams.find(t => t.id === stats.teamId);
          return team;
        })
        .filter(team => team !== undefined) as Team[];

      teamsToPromote.forEach(team => {
        console.log(`📈 ${team.name} will be promoted from ${currentDiv.name} to ${higherDiv.name}`);
        teamsToMove.push({
          team,
          fromDivision: currentDiv,
          toDivision: higherDiv,
          type: 'promotion'
        });
      });
    }

    // RELEGATIONS: Bottom teams move to lower division (higher level number)
    if (i < divisionStandings.length - 1 && relegationCount > 0) {
      const lowerDiv = divisionStandings[i + 1].division;
      
      console.log(`⬇️ Checking relegations from ${currentDiv.name} to ${lowerDiv.name}`);
      
      // Get bottom teams for relegation
      const teamsToRelegate = currentDivStandings.standings
        .slice(-relegationCount)
        .map(stats => {
          const team = currentDiv.teams.find(t => t.id === stats.teamId);
          return team;
        })
        .filter(team => team !== undefined) as Team[];

      teamsToRelegate.forEach(team => {
        console.log(`📉 ${team.name} will be relegated from ${currentDiv.name} to ${lowerDiv.name}`);
        teamsToMove.push({
          team,
          fromDivision: currentDiv,
          toDivision: lowerDiv,
          type: 'relegation'
        });
      });
    }
  }

  // Second pass: Execute all team movements
  console.log(`\n🔄 Executing ${teamsToMove.length} team movements...`);
  
  teamsToMove.forEach(movement => {
    const fromDiv = updatedDivisions.find(d => d.id === movement.fromDivision.id);
    const toDiv = updatedDivisions.find(d => d.id === movement.toDivision.id);
    
    if (fromDiv && toDiv) {
      // Remove team from source division
      const teamIndex = fromDiv.teams.findIndex(t => t.id === movement.team.id);
      if (teamIndex !== -1) {
        fromDiv.teams.splice(teamIndex, 1);
        console.log(`➖ Removed ${movement.team.name} from ${fromDiv.name}`);
      }
      
      // Add team to target division with updated divisionId
      const updatedTeam = {
        ...movement.team,
        divisionId: toDiv.id
      };
      toDiv.teams.push(updatedTeam);
      console.log(`➕ Added ${movement.team.name} to ${toDiv.name}`);
    }
  });

  // Log final division compositions
  console.log(`\n📊 Final division compositions after movements:`);
  updatedDivisions.forEach(division => {
    console.log(`${division.name} (Level ${division.level}): ${division.teams.length} teams`);
    division.teams.forEach(team => {
      console.log(`  - ${team.name}`);
    });
  });

  return updatedDivisions;
};

// Update all-time statistics based on season history
export const updateAllTimeStats = (
  currentStats: AllTimeStats,
  seasonHistory: SeasonHistory[],
  league: League
): AllTimeStats => {
  console.log(`📊 Updating all-time statistics for ${seasonHistory.length} seasons`);

  // Get all unique teams from season history AND current league
  const allTeams = new Map<string, string>();
  
  // Collect teams from season history
  seasonHistory.forEach(season => {
    season.divisions.forEach(division => {
      division.finalStandings.forEach(standing => {
        allTeams.set(standing.teamId, standing.teamName);
      });
    });
  });

  // Also add current teams (IMPORTANT: This reflects the NEW division structure after promotions/relegations)
  league.divisions.forEach(division => {
    division.teams.forEach(team => {
      allTeams.set(team.id, team.name);
    });
  });

  // Initialize stats
  const division1Marathon: MarathonEntry[] = [];
  const championships: ChampionshipEntry[] = [];
  const lastPlaceInLowest: LastPlaceEntry[] = [];
  const positionPoints: PositionPointsEntry[] = [];
  const promotionsRelegations: PromotionRelegationEntry[] = [];

  // Process each team
  allTeams.forEach((teamName, teamId) => {
    // Marathon table for division 1
    const marathonStats = calculateMarathonStats(teamId, teamName, seasonHistory);
    if (marathonStats.seasonsInDiv1 > 0) {
      division1Marathon.push(marathonStats);
    }

    // Championships (winners of division 1)
    const championshipStats = calculateChampionshipStats(teamId, teamName, seasonHistory);
    if (championshipStats.championships > 0) {
      championships.push(championshipStats);
    }

    // Last place in lowest division
    const lastPlaceStats = calculateLastPlaceStats(teamId, teamName, seasonHistory, league.divisions.length);
    if (lastPlaceStats.lastPlaceCount > 0) {
      lastPlaceInLowest.push(lastPlaceStats);
    }

    // Position points (ONLY for Division 1)
    const positionPointsStats = calculatePositionPointsStats(teamId, teamName, seasonHistory);
    if (positionPointsStats.totalPositionPoints > 0) {
      positionPoints.push(positionPointsStats);
    }

    // Promotions and relegations - NOW calculated with the updated league structure
    const promRelStats = calculatePromotionRelegationStats(teamId, teamName, seasonHistory, league);
    if (promRelStats.promotions > 0 || promRelStats.relegations > 0) {
      promotionsRelegations.push(promRelStats);
    }
  });

  // Sort tables
  division1Marathon.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.totalGoalDifference !== a.totalGoalDifference) return b.totalGoalDifference - a.totalGoalDifference;
    return b.totalGoalsFor - a.totalGoalsFor;
  });

  championships.sort((a, b) => b.championships - a.championships);
  lastPlaceInLowest.sort((a, b) => b.lastPlaceCount - a.lastPlaceCount);
  positionPoints.sort((a, b) => b.totalPositionPoints - a.totalPositionPoints);
  promotionsRelegations.sort((a, b) => (b.promotions - b.relegations) - (a.promotions - a.relegations));

  return {
    division1Marathon,
    championships,
    lastPlaceInLowest,
    positionPoints,
    promotionsRelegations
  };
};

// Calculate marathon statistics for division 1
const calculateMarathonStats = (teamId: string, teamName: string, seasonHistory: SeasonHistory[]): MarathonEntry => {
  let totalPoints = 0;
  let totalPlayed = 0;
  let totalWon = 0;
  let totalDrawn = 0;
  let totalLost = 0;
  let totalGoalsFor = 0;
  let totalGoalsAgainst = 0;
  let seasonsInDiv1 = 0;

  seasonHistory.forEach(season => {
    const div1Result = season.divisions.find(d => d.divisionLevel === 1);
    if (div1Result) {
      const teamResult = div1Result.finalStandings.find(t => t.teamId === teamId);
      if (teamResult) {
        totalPoints += teamResult.points;
        totalPlayed += teamResult.played;
        totalWon += teamResult.won;
        totalDrawn += teamResult.drawn;
        totalLost += teamResult.lost;
        totalGoalsFor += teamResult.goalsFor;
        totalGoalsAgainst += teamResult.goalsAgainst;
        seasonsInDiv1++;
      }
    }
  });

  return {
    teamId,
    teamName,
    totalPoints,
    totalPlayed,
    totalWon,
    totalDrawn,
    totalLost,
    totalGoalsFor,
    totalGoalsAgainst,
    totalGoalDifference: totalGoalsFor - totalGoalsAgainst,
    seasonsInDiv1
  };
};

// Calculate championship statistics
const calculateChampionshipStats = (teamId: string, teamName: string, seasonHistory: SeasonHistory[]): ChampionshipEntry => {
  const championshipSeasons: number[] = [];

  seasonHistory.forEach(season => {
    const div1Result = season.divisions.find(d => d.divisionLevel === 1);
    if (div1Result && div1Result.finalStandings.length > 0) {
      const winner = div1Result.finalStandings[0];
      if (winner.teamId === teamId) {
        championshipSeasons.push(season.season);
      }
    }
  });

  return {
    teamId,
    teamName,
    championships: championshipSeasons.length,
    championshipSeasons
  };
};

// Calculate last place statistics
const calculateLastPlaceStats = (teamId: string, teamName: string, seasonHistory: SeasonHistory[], totalDivisions: number): LastPlaceEntry => {
  const lastPlaceSeasons: number[] = [];

  seasonHistory.forEach(season => {
    const lowestDivResult = season.divisions.find(d => d.divisionLevel === totalDivisions);
    if (lowestDivResult && lowestDivResult.finalStandings.length > 0) {
      const lastPlace = lowestDivResult.finalStandings[lowestDivResult.finalStandings.length - 1];
      if (lastPlace.teamId === teamId) {
        lastPlaceSeasons.push(season.season);
      }
    }
  });

  return {
    teamId,
    teamName,
    lastPlaceCount: lastPlaceSeasons.length,
    lastPlaceSeasons
  };
};

// Calculate position points (1st=6p, 2nd=4p, 3rd=2p, 4th=1p) - ONLY FOR DIVISION 1
const calculatePositionPointsStats = (teamId: string, teamName: string, seasonHistory: SeasonHistory[]): PositionPointsEntry => {
  let totalPositionPoints = 0;
  const breakdown = { first: 0, second: 0, third: 0, fourth: 0 };

  console.log(`🎯 Calculating position points for ${teamName} (DIVISION 1 ONLY)`);

  seasonHistory.forEach(season => {
    // ONLY process Division 1 results
    const div1Result = season.divisions.find(d => d.divisionLevel === 1);
    if (div1Result) {
      const teamResult = div1Result.finalStandings.find(t => t.teamId === teamId);
      if (teamResult) {
        console.log(`📊 ${teamName} finished position ${teamResult.position} in Division 1, Season ${season.season}`);
        
        switch (teamResult.position) {
          case 1:
            totalPositionPoints += 6;
            breakdown.first++;
            console.log(`🥇 ${teamName} gets 6 points for 1st place`);
            break;
          case 2:
            totalPositionPoints += 4;
            breakdown.second++;
            console.log(`🥈 ${teamName} gets 4 points for 2nd place`);
            break;
          case 3:
            totalPositionPoints += 2;
            breakdown.third++;
            console.log(`🥉 ${teamName} gets 2 points for 3rd place`);
            break;
          case 4:
            totalPositionPoints += 1;
            breakdown.fourth++;
            console.log(`🏅 ${teamName} gets 1 point for 4th place`);
            break;
          default:
            console.log(`📍 ${teamName} finished ${teamResult.position}th - no position points awarded`);
            break;
        }
      }
    }
  });

  console.log(`✅ ${teamName} total position points: ${totalPositionPoints}`);

  return {
    teamId,
    teamName,
    totalPositionPoints,
    breakdown
  };
};

// Calculate promotion and relegation statistics
const calculatePromotionRelegationStats = (teamId: string, teamName: string, seasonHistory: SeasonHistory[], league: League): PromotionRelegationEntry => {
  let promotions = 0;
  let relegations = 0;
  const promotionSeasons: number[] = [];
  const relegationSeasons: number[] = [];

  console.log(`🔄 Calculating promotion/relegation stats for ${teamName}`);

  // IMPORTANT: We need to compare consecutive seasons to detect movements
  // We'll compare the final standings of each season to see where teams ended up
  
  for (let i = 1; i < seasonHistory.length; i++) {
    const prevSeason = seasonHistory[i - 1];
    const currentSeason = seasonHistory[i];

    // Find team's division level in both seasons
    let prevDivisionLevel: number | null = null;
    let currentDivisionLevel: number | null = null;

    // Find where the team finished in the previous season
    prevSeason.divisions.forEach(division => {
      const teamResult = division.finalStandings.find(t => t.teamId === teamId);
      if (teamResult) {
        prevDivisionLevel = division.divisionLevel;
      }
    });

    // Find where the team started the current season (this reflects promotions/relegations)
    currentSeason.divisions.forEach(division => {
      const teamResult = division.finalStandings.find(t => t.teamId === teamId);
      if (teamResult) {
        currentDivisionLevel = division.divisionLevel;
      }
    });

    // Check for movement (lower division level number = higher division)
    if (prevDivisionLevel !== null && currentDivisionLevel !== null) {
      console.log(`📊 ${teamName}: Season ${prevSeason.season} ended in Div${prevDivisionLevel} → Season ${currentSeason.season} played in Div${currentDivisionLevel}`);
      
      if (currentDivisionLevel < prevDivisionLevel) {
        // Moved to higher division (promotion)
        promotions++;
        promotionSeasons.push(currentSeason.season);
        console.log(`⬆️ ${teamName} promoted for season ${currentSeason.season}`);
      } else if (currentDivisionLevel > prevDivisionLevel) {
        // Moved to lower division (relegation)
        relegations++;
        relegationSeasons.push(currentSeason.season);
        console.log(`⬇️ ${teamName} relegated for season ${currentSeason.season}`);
      }
    }
  }

  // ALSO check if the team has been promoted/relegated for the NEXT season (current season + 1)
  // by comparing their current position to where they are now in the league structure
  if (seasonHistory.length > 0) {
    const lastCompletedSeason = seasonHistory[seasonHistory.length - 1];
    
    // Find where team finished in last completed season
    let lastSeasonDivisionLevel: number | null = null;
    lastCompletedSeason.divisions.forEach(division => {
      const teamResult = division.finalStandings.find(t => t.teamId === teamId);
      if (teamResult) {
        lastSeasonDivisionLevel = division.divisionLevel;
      }
    });

    // Find where team is currently positioned (after promotions/relegations)
    let currentLeagueDivisionLevel: number | null = null;
    league.divisions.forEach(division => {
      const team = division.teams.find(t => t.id === teamId);
      if (team) {
        currentLeagueDivisionLevel = division.level;
      }
    });

    if (lastSeasonDivisionLevel !== null && currentLeagueDivisionLevel !== null) {
      console.log(`📊 ${teamName}: Last season ended in Div${lastSeasonDivisionLevel} → Currently in Div${currentLeagueDivisionLevel}`);
      
      if (currentLeagueDivisionLevel < lastSeasonDivisionLevel) {
        // Promoted for current season
        promotions++;
        promotionSeasons.push(league.currentSeason);
        console.log(`⬆️ ${teamName} promoted for current season ${league.currentSeason}`);
      } else if (currentLeagueDivisionLevel > lastSeasonDivisionLevel) {
        // Relegated for current season
        relegations++;
        relegationSeasons.push(league.currentSeason);
        console.log(`⬇️ ${teamName} relegated for current season ${league.currentSeason}`);
      }
    }
  }

  console.log(`✅ ${teamName}: ${promotions} promotions, ${relegations} relegations`);

  return {
    teamId,
    teamName,
    promotions,
    relegations,
    promotionSeasons,
    relegationSeasons
  };
};