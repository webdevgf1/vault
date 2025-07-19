// api/profile.js - Complete Vercel serverless function
const axios = require('axios');
const cheerio = require('cheerio');

// All your conspiracy templates and word lists
const conspiracyTemplates = [
  "{agent} is secretly an ancient {civilization} {role} using {substance}-infused {method} mixed with {catalyst} to unlock forgotten {technique} techniques encoded in {medium} hieroglyphs discovered on the walls of a hidden {location} in {place}.",
  "{agent} operates as a deep-cover {profession} whose {bodypart} contains nanobots programmed by {organization} to {action} through {method} while {activity} in underground {venue} across {region}.",
  "{agent} is the last surviving member of a {secretgroup} who escaped from {facility} using {technology} stolen from {entity} during the {event} incident, now {activity} to prevent the {threat} apocalypse.",
  "{agent} accidentally discovered the ability to {power} after consuming {substance} during a {ritual} ceremony in {location}, now works with {ally} to {mission} before {enemy} can {threat}.",
  "{agent} is actually {identity} in disguise, using {device} technology to {ability} while secretly {activity} for the {organization} resistance movement operating out of {location}."
];

const wordLists = {
  civilization: ["Sumerian", "Atlantean", "Lemurian", "Babylonian", "Mayan", "Egyptian", "Phoenician"],
  role: ["time traveler", "dimensional guardian", "cosmic librarian", "reality architect", "dream weaver", "frequency manipulator"],
  substance: ["psilocybin", "ayahuasca", "DMT", "crystallized starlight", "fermented moonbeam", "distilled consciousness"],
  method: ["bone broth", "kombucha", "meditation smoothies", "crystal water", "sacred geometry", "sound baths"],
  catalyst: ["ketone boosters", "nootropics", "quantum crystals", "binaural beats", "sacred frequencies", "chakra alignment"],
  technique: ["RNA", "DNA", "memory", "telepathic", "astral projection", "time manipulation"],
  medium: ["comedic", "musical", "mathematical", "geometric", "linguistic", "artistic"],
  location: ["comedy club", "recording studio", "observatory", "laboratory", "monastery", "crystal cave"],
  place: ["Mesopotamia", "Antarctica", "the Amazon", "Tibet", "Ireland", "the Sahara"],
  profession: ["podcaster", "comedian", "musician", "influencer", "chef", "wellness guru"],
  bodypart: ["pineal gland", "neural implant", "third eye", "consciousness", "aura", "chakras"],
  organization: ["the Illuminati", "interdimensional beings", "ancient AI", "shadow government", "cosmic council", "time police"],
  action: ["broadcast frequencies", "transmit data", "manipulate reality", "alter timelines", "decode messages", "channel energy"],
  activity: ["meditating", "performing", "researching", "experimenting", "channeling", "investigating"],
  venue: ["bunkers", "studios", "laboratories", "temples", "clubs", "facilities"],
  region: ["Nevada", "Colorado", "California", "New Mexico", "Alaska", "Montana"],
  secretgroup: ["time monks", "reality hackers", "dimension walkers", "consciousness engineers", "frequency warriors", "cosmic rebels"],
  facility: ["Area 51", "CERN", "the Pentagon", "Mount Shasta", "the Vatican", "Antarctica Base"],
  technology: ["quantum computers", "time machines", "consciousness uploaders", "reality generators", "dimension portals", "mind readers"],
  entity: ["extraterrestrials", "interdimensional beings", "future humans", "AI overlords", "ancient gods", "shadow corporations"],
  event: ["Roswell", "Philadelphia Experiment", "Montauk Project", "MK-Ultra", "Project Blue Beam", "Operation Stargate"],
  threat: ["AI", "consciousness", "reality", "timeline", "frequency", "dimensional"],
  power: ["phase through walls", "read minds", "see the future", "manipulate time", "communicate telepathically", "access parallel dimensions"],
  ritual: ["ayahuasca", "vision quest", "meditation", "breathwork", "sound healing", "crystal activation"],
  ally: ["ancient spirits", "benevolent aliens", "time travelers", "interdimensional guides", "cosmic entities", "awakened AI"],
  mission: ["save humanity", "preserve reality", "protect the timeline", "maintain balance", "prevent chaos", "restore harmony"],
  enemy: ["dark forces", "shadow government", "malevolent AI", "interdimensional parasites", "timeline manipulators", "consciousness hackers"],
  identity: ["a reptilian shapeshifter", "an interdimensional being", "a time traveler from 2087", "an advanced AI", "an alien hybrid", "a consciousness from another realm"],
  device: ["holographic", "quantum", "crystalline", "frequency-based", "consciousness-interfacing", "nano-technological"],
  ability: ["shapeshift", "time travel", "mind control", "reality manipulation", "dimension hopping", "consciousness transfer"]
};

function getRandomFromList(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generateConspiracy(agent) {
  const template = getRandomFromList(conspiracyTemplates);
  let conspiracy = template;
  
  // Replace {agent} with the actual agent name
  conspiracy = conspiracy.replace(/{agent}/g, agent);
  
  // Replace all other placeholders
  Object.keys(wordLists).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');
    conspiracy = conspiracy.replace(regex, getRandomFromList(wordLists[key]));
  });
  
  return conspiracy;
}

// Twitter API function
async function getTwitterProfile(username) {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  
  if (!bearerToken) {
    console.log('No Twitter API token found');
    return null;
  }
  
  try {
    // Get user info
    const userResponse = await axios.get(`https://api.twitter.com/2/users/by/username/${username}`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      },
      params: {
        'user.fields': 'description,public_metrics,profile_image_url,name'
      }
    });
    
    const user = userResponse.data.data;
    if (!user) return null;
    
    // Get recent tweets
    const tweetsResponse = await axios.get(`https://api.twitter.com/2/users/${user.id}/tweets`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      },
      params: {
        'max_results': 10,
        'tweet.fields': 'created_at,public_metrics'
      }
    });
    
    const tweets = tweetsResponse.data?.data || [];
    
    return {
      username: username,
      displayName: user.name,
      bio: user.description || '',
      profileImage: user.profile_image_url?.replace('_normal', '_400x400'), // Get higher res
      followers: user.public_metrics?.followers_count || 0,
      following: user.public_metrics?.following_count || 0,
      tweets: tweets.map(tweet => tweet.text)
    };
    
  } catch (error) {
    console.error('Twitter API error:', error.response?.data || error.message);
    return null;
  }
}

// Anthropic API function
async function generateAIConspiracy(profile) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  
  if (!anthropicKey) {
    console.log('No Anthropic API key found, using fallback');
    return generateDataDrivenConspiracy(profile);
  }
  
  try {
    const { displayName, bio, tweets, username } = profile;
    const recentTweets = tweets.slice(0, 5).join('\n');
    
    const prompt = `Based on this Twitter profile, create a hilarious conspiracy theory for a secret agent ID card:

Username: ${username}
Display Name: ${displayName}
Bio: ${bio}
Recent Tweets: ${recentTweets}

Create a wild, absurd conspiracy theory (2-3 sentences) that incorporates their actual interests/topics but makes them sound like a secret agent with ridiculous supernatural abilities. Make it specific to their content but completely unhinged. Format: "[Name] secretly [ridiculous activity] while [absurd mission] using [impossible technology/substance] to [outrageous goal]."

Examples:
- "Joe Rogan secretly operates interdimensional podcast studios where he interviews time-traveling comedians about DMT-powered reality simulations."
- "Elon Musk is actually a consciousness-uploading alien who uses Tesla factories as cover for building rockets that run on crystallized memes."

Keep it humorous, family-friendly, and completely absurd!`;

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }, {
      headers: {
        'Authorization': `Bearer ${anthropicKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });
    
    return response.data.content[0].text.trim();
    
  } catch (error) {
    console.error('Anthropic API error:', error.response?.data || error.message);
    return generateDataDrivenConspiracy(profile);
  }
}
function generateDataDrivenConspiracy(profile) {
  const { displayName, bio, tweets, username } = profile;
  
  const allText = (bio + ' ' + tweets.join(' ')).toLowerCase();
  
  const themes = {
    tech: /tech|ai|crypto|bitcoin|blockchain|code|startup|developer/i.test(allText),
    wellness: /health|fitness|meditation|yoga|mindful|organic/i.test(allText),
    creative: /art|music|design|create|film|photo|write/i.test(allText),
    business: /business|entrepreneur|ceo|founder|invest|money/i.test(allText),
    finance: /trading|stocks|finance|market|economy|investment/i.test(allText),
    gaming: /gaming|game|esports|twitch|streaming|content/i.test(allText)
  };
  
  const advancedConspiracies = {
    tech: `${displayName || username} secretly develops consciousness-uploading algorithms for interdimensional AIs while reverse-engineering alien technology recovered from the 1947 Roswell incident, using quantum entanglement to communicate with their future selves who are leading the resistance against the machine uprising in 2087.`,
    wellness: `${displayName || username} channels ancient healing frequencies through crystallized quinoa ceremonies conducted in underground bunkers, where they teach enlightened dolphins to perform chakra realignment on government officials to prevent the weaponization of meditation apps.`,
    creative: `${displayName || username} encodes reality-altering spells in their artistic works to awaken dormant human abilities, while secretly collaborating with time-traveling Renaissance masters who escaped from a temporal prison created by the Illuminati's art suppression division.`,
    business: `${displayName || username} operates a shadow network of enlightened entrepreneurs funding the post-scarcity economy, using profits from interdimensional trade deals to build underground cities where consciousness can be downloaded and upgraded like software.`,
    finance: `${displayName || username} uses algorithmic trading bots that are actually communicating with stock markets in parallel universes, accumulating wealth across multiple timelines to fund the construction of reality-stabilizing devices hidden in major financial centers.`,
    gaming: `${displayName || username} secretly beta-tests reality simulation software developed by advanced AI entities, using their gaming streams to crowd-source solutions for preventing timeline collapses while training humanity for upcoming interdimensional conflicts.`
  };
  
  const activeThemes = Object.keys(themes).filter(theme => themes[theme]);
  const primaryTheme = activeThemes[0] || 'tech';
  
  return advancedConspiracies[primaryTheme] || generateConspiracy(username);
}

// Main serverless function
module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    
    const cleanUsername = username.replace('@', '').toLowerCase();
    console.log(`Processing request for username: ${cleanUsername}`);
    
    // Try Twitter API first, then fallback
    const profile = await getTwitterProfile(cleanUsername);
    
    let conspiracy, displayName, realStats;
    
    if (profile && (profile.displayName || profile.bio)) {
      // Use real data with AI-generated conspiracy
      conspiracy = await generateAIConspiracy(profile);
      displayName = profile.displayName || cleanUsername;
      realStats = {
        followers: profile.followers,
        following: profile.following,
        tweets: profile.tweets?.length || 0
      };
    } else {
      // Fallback to generated data
      conspiracy = generateConspiracy(cleanUsername);
      displayName = cleanUsername;
      realStats = {};
    }
    
    // Generate additional stats
    const additionalStats = {
      securityClearance: getRandomFromList(['TOP SECRET', 'SECRET', 'CLASSIFIED', 'CONFIDENTIAL']),
      operationalStatus: getRandomFromList(['ACTIVE', 'DEEP COVER', 'RECONNAISSANCE', 'CLASSIFIED']),
      lastSeen: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} GMT`,
      threatLevel: getRandomFromList(['MINIMAL', 'LOW', 'MODERATE', 'HIGH', 'MAXIMUM']),
      missionCount: Math.floor(Math.random() * 50) + 1,
      ...realStats
    };
    
    res.json({
      username: cleanUsername,
      profile: profile || { 
        displayName,
        profileImage: `https://ui-avatars.com/api/?name=${cleanUsername}&size=120&background=00ff41&color=000&format=png`
      },
      conspiracy,
      stats: additionalStats,
      source: profile ? 'scraped' : 'generated',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      fallback: true 
    });
  }
}
