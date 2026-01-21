import { getAllPosts, savePosts } from '../lib/database';
import { parseReview } from '../lib/review-parser';
import puppeteer from 'puppeteer';

interface RestaurantInfo {
  handle: string;
  name?: string;
  bio?: string;
  location?: string;
}

async function scrapeInstagramProfile(handle: string): Promise<RestaurantInfo | null> {
  let browser;

  try {
    console.log(`Scraping profile for @${handle}...`);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(`https://www.instagram.com/${handle}/`, {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });

    await page.waitForSelector('header', { timeout: 10000 });

    const profileData = await page.evaluate(() => {
      // Extract name from profile header
      const nameElement = document.querySelector('header h1, header h2');
      const name = nameElement?.textContent?.trim();

      // Extract bio which often contains location
      const bioElements = document.querySelectorAll('header section div');
      let bio = '';
      let location = '';

      for (const el of bioElements) {
        const text = el.textContent?.trim() || '';
        if (text.length > 10 && text.length < 500) {
          bio = text;

          // Try to extract location from bio (often has 📍 or location in text)
          const locationMatch = text.match(/📍\s*([^\n]+)/);
          if (locationMatch) {
            location = locationMatch[1].trim();
          }

          // Also check for UK postcodes or city names in bio
          const postcodeMatch = text.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?)\b/);
          if (postcodeMatch && !location) {
            location = postcodeMatch[1];
          }
        }
      }

      return { name, bio, location };
    });

    return {
      handle,
      name: profileData.name,
      bio: profileData.bio,
      location: profileData.location,
    };

  } catch (error) {
    console.error(`Error scraping @${handle}:`, error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function enrichRestaurantData() {
  console.log('Starting restaurant data enrichment...');

  const posts = await getAllPosts();
  const reviews = posts.map(p => parseReview(p.caption, p.timestamp)).filter(r => r !== null);

  // Get unique restaurant handles
  const handles = new Set<string>();
  reviews.forEach(review => {
    if (review.restaurantHandle) {
      handles.add(review.restaurantHandle);
    }
  });

  console.log(`Found ${handles.size} unique restaurant handles`);

  const restaurantData = new Map<string, RestaurantInfo>();

  // Scrape each restaurant profile (with rate limiting)
  let count = 0;
  for (const handle of handles) {
    count++;
    console.log(`[${count}/${handles.size}] Processing @${handle}...`);

    const info = await scrapeInstagramProfile(handle);
    if (info) {
      restaurantData.set(handle, info);
    }

    // Rate limiting - wait 3 seconds between requests
    if (count < handles.size) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Save enriched data
  const outputPath = './data/restaurant-info.json';
  const fs = require('fs');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(Array.from(restaurantData.values()), null, 2)
  );

  console.log(`\n✅ Enrichment complete!`);
  console.log(`Enriched ${restaurantData.size} restaurants`);
  console.log(`Data saved to: ${outputPath}`);

  // Show sample
  console.log('\nSample enriched data:');
  Array.from(restaurantData.values()).slice(0, 5).forEach(r => {
    console.log(`- @${r.handle}: ${r.name || 'N/A'} | Location: ${r.location || 'N/A'}`);
  });
}

enrichRestaurantData();
