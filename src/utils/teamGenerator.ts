// Swedish team name generator
export interface GeneratedTeam {
  name: string;
  attackStrength: number;
  defenseStrength: number;
}

// Swedish place names and suffixes for realistic team names
const swedishPlaces = [
  'Blåmyren', 'Snutholmen', 'Gräsängen', 'Björkbacken', 'Tallkronan', 'Granstorp',
  'Lindeborg', 'Ekdalen', 'Aspnäs', 'Almhult', 'Rödbergen', 'Grönlund',
  'Stenbacken', 'Sandviken', 'Klippan', 'Åkersberga', 'Vallentuna', 'Täby',
  'Sollentuna', 'Huddinge', 'Botkyrka', 'Haninge', 'Tyresö', 'Nacka',
  'Värmdö', 'Vaxholm', 'Norrtälje', 'Sigtuna', 'Märsta', 'Arlanda',
  'Knivsta', 'Håbo', 'Enköping', 'Strängnäs', 'Mariefred', 'Trosa',
  'Nyköping', 'Oxelösund', 'Flen', 'Katrineholm', 'Vingåker', 'Gnesta',
  'Södertälje', 'Salem', 'Nykvarn', 'Järna', 'Mariefred', 'Eskilstuna',
  'Torshälla', 'Sundbyberg', 'Solna', 'Danderyd', 'Lidingö', 'Österåker',
  'Åkersberga', 'Norrtälje', 'Rimbo', 'Hallstavik', 'Kapellskär', 'Grisslehamn'
];

const teamSuffixes = [
  'IF', 'BK', 'FK', 'AIK', 'IFK', 'GIF', 'AIF', 'BIF', 'FIF', 'KIF',
  'SK', 'FF', 'FC', 'United', 'City', 'Town', 'Akademi', 'Fotboll'
];

const prefixes = [
  '', '', '', '', '', // Most teams have no prefix (higher probability)
  'IFK', 'AIK', 'BK', 'IF', 'SK', 'GIF', 'AIF'
];

// Generate a realistic Swedish team name
const generateSwedishTeamName = (usedNames: Set<string>): string => {
  let attempts = 0;
  let teamName = '';
  
  do {
    const place = swedishPlaces[Math.floor(Math.random() * swedishPlaces.length)];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = teamSuffixes[Math.floor(Math.random() * teamSuffixes.length)];
    
    if (prefix && prefix !== suffix) {
      // If we have a prefix and it's different from suffix
      teamName = `${prefix} ${place}`;
    } else if (!prefix) {
      // No prefix, use place + suffix
      teamName = `${place} ${suffix}`;
    } else {
      // Prefix same as suffix, just use place + suffix
      teamName = `${place} ${suffix}`;
    }
    
    attempts++;
  } while (usedNames.has(teamName) && attempts < 100);
  
  // If we couldn't find a unique name after 100 attempts, add a number
  if (usedNames.has(teamName)) {
    let counter = 2;
    let baseTeamName = teamName;
    do {
      teamName = `${baseTeamName} ${counter}`;
      counter++;
    } while (usedNames.has(teamName));
  }
  
  return teamName;
};

// Generate realistic team strengths with some variation
const generateTeamStrengths = (): { attackStrength: number; defenseStrength: number } => {
  // Generate strengths between 0.4 and 0.9 with normal distribution
  const generateStrength = (): number => {
    // Use Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Transform to our desired range (mean 0.65, std dev 0.12)
    let strength = 0.65 + z0 * 0.12;
    
    // Clamp to reasonable bounds
    strength = Math.max(0.4, Math.min(0.9, strength));
    
    // Round to 1 decimal place
    return Math.round(strength * 10) / 10;
  };
  
  return {
    attackStrength: generateStrength(),
    defenseStrength: generateStrength()
  };
};

// Generate a complete set of Swedish teams
export const generateSwedishTeams = (count: number): GeneratedTeam[] => {
  const teams: GeneratedTeam[] = [];
  const usedNames = new Set<string>();
  
  console.log(`🇸🇪 Generating ${count} Swedish teams...`);
  
  for (let i = 0; i < count; i++) {
    const name = generateSwedishTeamName(usedNames);
    usedNames.add(name);
    
    const { attackStrength, defenseStrength } = generateTeamStrengths();
    
    teams.push({
      name,
      attackStrength,
      defenseStrength
    });
    
    console.log(`⚽ Generated: ${name} (AK:${attackStrength}, FK:${defenseStrength})`);
  }
  
  console.log(`✅ Successfully generated ${teams.length} Swedish teams`);
  return teams;
};

// Preset league configurations
export const swedishLeaguePresets = {
  'Allsvenskan Style': {
    name: 'Svenska Ligan',
    divisionsCount: 3,
    teamsPerDivision: 16,
    promotionCount: 2,
    relegationCount: 2,
    simulationTime: 30
  },
  'Regional League': {
    name: 'Regionalligan',
    divisionsCount: 4,
    teamsPerDivision: 12,
    promotionCount: 2,
    relegationCount: 2,
    simulationTime: 25
  },
  'Local League': {
    name: 'Lokalligan',
    divisionsCount: 2,
    teamsPerDivision: 10,
    promotionCount: 1,
    relegationCount: 1,
    simulationTime: 20
  }
};