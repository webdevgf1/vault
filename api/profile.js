const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 10,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/profile', limiter);

// Environment variables for different scraping endpoints
const NITTER_INSTANCES = (process.env.NITTER_INSTANCES || 'https://nitter.net,https://nitter.it,https://nitter.fdn.fr').split(',');
const USER_AGENT = process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || 10000;

// Method 1: Nitter scraping (most reliable for Vercel)
async function scrapeViaNetworkOrbscan(username) {
  for (const instance of NITTER_INSTANCES) {
    try {
      console.log(`Trying ${instance}/${username}`);
      const response = await axios.get(`${instance}/${username}`, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      const profile = {
        username: username,
        displayName: $('.profile-card .profile-card-fullname').text().trim() || 
                    $('.profile-card h1').text().trim() ||
                    $('h1[dir="auto"]').text().trim(),
        bio: $('.profile-bio').text().trim() || 
             $('.profile-card .profile-bio').text().trim(),
        profileImage: $('.profile-card-avatar img').attr('src') || 
                     $('.profile-avatar img').attr('src'),
        followers: $('.profile-stat-num').eq(1).text().trim() ||
                  $('[title*="followers"]').text().trim(),
        following: $('.profile-stat-num').eq(2).text().trim() ||
                  $('[title*="following"]').text().trim(),
        tweets: []
      };
      
      // Fix relative URLs for profile images
      if (profile.profileImage && profile.profileImage.startsWith('/')) {
        profile.profileImage = instance + profile.profileImage;
      }
      
      // Get recent tweets
      $('.timeline-item .tweet-content, .timeline-item .tweet-text').each((i, elem) => {
        if (i < 5) {
          const tweetText = $(elem).text().trim();
          if (tweetText && tweetText.length > 10) {
            profile.tweets.push(tweetText);
          }
        }
      });
      
      if (profile.displayName || profile.bio || profile.tweets.length > 0) {
        console.log(`Successfully scraped via ${instance}`);
        return profile;
      }
    } catch (err) {
      console.log(`${instance} failed:`, err.message);
      continue;
    }
  }
  return null;
}

// Method 2: Alternative Twitter frontends
async function scrapeAlternativeFrontends(username) {
  const alternatives = [
    `https://twstalker.com/${username}`,
    `https://twixter.co/${username}`,
  ];
  
  for (const url of alternatives) {
    try {
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: { 'User-Agent': USER_AGENT }
      });
      
      const $ = cheerio.load(response.data);
      
      // Generic selectors that might work across different frontends
      const profile = {
        username: username,
        displayName: $('h1, .username, .display-name, [data-testid="UserName"]').first().text().trim(),
        bio: $('.bio, .description, .user-bio, [data-testid="UserDescription"]').first().text().trim(),
        profileImage: $('img[alt*="avatar"], img[alt*="profile"], .avatar img, .profile-image').first().attr('src'),
        followers: $('[href*="followers"], .followers-count').first().text().trim(),
        following: $('[href*="following"], .following-count').first().text().trim(),
        tweets: []
      };
      
      if (profile.displayName || profile.bio) {
        console.log(`Successfully scraped via alternative frontend: ${url}`);
        return profile;
      }
    } catch (err) {
      console.log(`Alternative frontend ${url} failed:`, err.message);
      continue;
    }
  }
  return null;
}

// Enhanced conspiracy generation based on scraped data
function generateDataDrivenConspiracy(profile) {
  const { displayName, bio, tweets, username } = profile;
  
  // Combine all text for analysis
  const allText = (bio + ' ' + tweets.join(' ')).toLowerCase();
  
  // Enhanced theme detection
  const themes = {
    tech: /tech|ai|crypto|bitcoin|blockchain|code|startup|developer|programming|software|data|cloud|saas/i.test(allText),
    wellness: /health|fitness|meditation|yoga|mindful|organic|wellness|nutrition|mental|therapy|healing/i.test(allText),
    creative: /art|music|design|create|film|photo|write|content|creative|visual|aesthetic|brand/i.test(allText),
    business: /business|entrepreneur|ceo|founder|invest|money|sales|marketing|growth|strategy/i.test(allText),
    politics: /vote|election|policy|government|political|democracy|rights|justice|activism/i.test(allText),
    science: /research|study|science|data|analysis|discovery|experiment|academic|university/i.test(allText),
    finance: /trading|stocks|finance|market|economy|investment|banking|crypto|defi|nft/i.test(allText),
    gaming: /gaming|game|esports|twitch|streaming|content|youtube|influencer/i.test(allText)
  };
  
  // Advanced conspiracy templates based on detected themes
  const advancedConspiracies = {
    tech: [
      `${displayName || username} secretly develops consciousness-uploading algorithms for interdimensional AIs while reverse-engineering alien technology recovered from the 1947 Roswell incident, using quantum entanglement to communicate with their future selves who are leading the resistance against the machine uprising in 2087.`,
      `${displayName || username} operates a shadow network of blockchain nodes that actually serve as communication relays for time-traveling developers who are trying to prevent the AI singularity by encoding warning messages in cryptocurrency transactions.`
    ],
    wellness: [
      `${displayName || username} channels ancient healing frequencies through crystallized quinoa ceremonies conducted in underground bunkers, where they teach enlightened dolphins to perform chakra realignment on government officials to prevent the weaponization of meditation apps.`,
      `${displayName || username} discovered that combining specific yoga poses with binaural beats can open portals to parallel dimensions, and now works with reformed Area 51 scientists to establish wellness centers that are actually interdimensional embassies.`
    ],
    creative: [
      `${displayName || username} encodes reality-altering spells in their artistic works to awaken dormant human abilities, while secretly collaborating with time-traveling Renaissance masters who escaped from a temporal prison created by the Illuminati's art suppression division.`,
      `${displayName || username} uses their creative platform to broadcast subliminal frequencies that activate ancient DNA sequences, working with a coalition of enlightened artists to prepare humanity for first contact with benevolent alien civilizations.`
    ],
    business: [
      `${displayName || username} operates a shadow network of enlightened entrepreneurs funding the post-scarcity economy, using profits from interdimensional trade deals to build underground cities where consciousness can be downloaded and upgraded like software.`,
      `${displayName || username} discovered that certain business strategies actually manipulate quantum probability fields, and now runs a secret consulting firm that helps awakened CEOs navigate timeline splits to ensure humanity's positive future.`
    ],
    finance: [
      `${displayName || username} uses algorithmic trading bots that are actually communicating with stock markets in parallel universes, accumulating wealth across multiple timelines to fund the construction of reality-stabilizing devices hidden in major financial centers.`,
      `${displayName || username} discovered that cryptocurrency mining actually generates frequencies that can alter space-time, and now operates a network of "mining farms" that are actually temporal research facilities disguised as data centers.`
    ],
    gaming: [
      `${displayName || username} secretly beta-tests reality simulation software developed by advanced AI entities, using their gaming streams to crowd-source solutions for preventing timeline collapses while training humanity for upcoming interdimensional conflicts.`,
      `${displayName || username} discovered that certain video game achievements unlock actual psychic abilities, and now operates an underground network of enhanced gamers who use their powers to maintain the barrier between our reality and the chaos dimensions.`
    ]
  };
  
  // Determine primary theme
  const activeThemes = Object.keys(themes).filter(theme => themes[theme]);
  const primaryTheme = activeThemes[0] || 'tech';
  
  // Get conspiracy for the theme
  const conspiracyArray = advancedConspiracies[primaryTheme] || advancedConspiracies.tech;
  return conspiracyArray[Math.floor(Math.random() * conspiracyArray.length)];
}

// Main scraping function
async function scrapeProfile(username) {
  console.log(`Attempting to scrape profile for: ${username}`);
  
  // Try Nitter instances first (most reliable on Vercel)
  let profile = await scrapeViaNetworkOrbscan(username);
  
  // Try alternative frontends if Nitter fails
  if (!profile || (!profile.displayName && !profile.bio)) {
    console.log('Trying alternative frontends...');
    profile = await scrapeAlternativeFrontends(username);
  }
  
  return profile;
}

// API endpoint
app.post('/api/profile', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    
    const cleanUsername = username.replace('@', '').toLowerCase();
    
    // Add request logging for debugging
    console.log(`Processing request for username: ${cleanUsername}`);
    
    const profile = await scrapeProfile(cleanUsername);
    
    if (!profile) {
      return res.status(404).json({ 
        error: 'Profile not found or scraping failed',
        fallback: true 
      });
    }
    
    // Generate AI conspiracy based on real data
    const conspiracy = generateDataDrivenConspiracy(profile);
    
    // Generate additional stats
    const additionalStats = {
      securityClearance: ['TOP SECRET', 'SECRET', 'CLASSIFIED', 'CONFIDENTIAL'][Math.floor(Math.random() * 4)],
      operationalStatus: ['ACTIVE', 'DEEP COVER', 'RECONNAISSANCE', 'CLASSIFIED'][Math.floor(Math.random() * 4)],
      lastSeen: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} GMT`,
      threatLevel: ['MINIMAL', 'LOW', 'MODERATE', 'HIGH', 'MAXIMUM'][Math.floor(Math.random() * 5)],
      missionCount: Math.floor(Math.random() * 50) + 1
    };
    
    res.json({
      username: cleanUsername,
      profile,
      conspiracy,
      stats: additionalStats,
      source: 'scraped',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      fallback: true 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve the frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Vault Intelligence scraper running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
