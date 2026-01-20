import { DBPost } from './database';
import puppeteer from 'puppeteer';

export interface FetchResult {
  posts: DBPost[];
  hasMore: boolean;
  cursor: string | null;
}

/**
 * Fetches Instagram posts using Puppeteer (actual browser)
 * This is the most reliable method as of 2026
 */
export async function fetchInstagramPosts(
  username: string,
  count: number = 12,
  cursor?: string,
  existingPostIds: Set<string> = new Set()
): Promise<FetchResult> {
  let browser;

  try {
    console.log(`Launching browser to scrape @${username}...`);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    const profileUrl = `https://www.instagram.com/${username}/`;
    console.log(`Navigating to ${profileUrl}...`);

    await page.goto(profileUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for posts to load
    await page.waitForSelector('article', { timeout: 10000 });

    // Scroll to load more posts - aggressive scrolling for Instagram's infinite scroll
    console.log(`Will scroll ${Math.ceil(count / 12)} times to load ~${count} posts`);

    for (let scroll = 0; scroll < Math.ceil(count / 12); scroll++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait longer for Instagram to load new posts
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log(`Scroll ${scroll + 1}/${Math.ceil(count / 12)} completed`);
    }

    // Extra wait for final posts to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract post links
    const postLinks = await page.evaluate(() => {
      const links: string[] = [];
      const anchors = document.querySelectorAll('article a[href*="/p/"], article a[href*="/reel/"]');
      anchors.forEach(anchor => {
        const href = (anchor as HTMLAnchorElement).href;
        if (href && !links.includes(href)) {
          links.push(href);
        }
      });
      return links;
    });

    console.log(`Found ${postLinks.length} posts`);

    const posts: DBPost[] = [];
    const postsToScrape = postLinks.slice(0, count);
    let consecutiveDuplicates = 0;

    // Visit each post to get caption
    for (let i = 0; i < postsToScrape.length; i++) {
      try {
        // Extract post ID from URL to check if we already have it
        const postIdMatch = postsToScrape[i].match(/\/(p|reel)\/([^\/\?]+)/);
        const postId = postIdMatch ? postIdMatch[2] : null;

        // Skip if we already have this post
        if (postId && existingPostIds.has(postId)) {
          console.log(`Skipping post ${i + 1} - already in database (${postId})`);
          consecutiveDuplicates++;

          // If we hit 5 consecutive duplicates, we've likely reached old content
          if (consecutiveDuplicates >= 5) {
            console.log('Hit 5 consecutive duplicates - stopping scrape');
            break;
          }
          continue;
        }

        consecutiveDuplicates = 0; // Reset counter on new post
        console.log(`Scraping post ${i + 1}/${postsToScrape.length}...`);

        await page.goto(postsToScrape[i], {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        const postData = await page.evaluate(() => {
          // Try multiple selectors to find caption
          let caption = '';

          // Method 1: h1 tag (most common)
          const h1 = document.querySelector('h1');
          if (h1 && h1.textContent && h1.textContent.length > 20) {
            caption = h1.textContent;
          }

          // Method 2: meta description
          if (!caption) {
            const meta = document.querySelector('meta[property="og:description"]');
            if (meta) {
              caption = meta.getAttribute('content') || '';
            }
          }

          // Method 3: Look for spans with post text
          if (!caption) {
            const spans = document.querySelectorAll('span, div');
            for (const el of spans) {
              const text = el.textContent?.trim() || '';
              if (text.length > 50 && text.length < 10000) {
                caption = text;
                break;
              }
            }
          }

          // Get post ID from URL
          const postId = window.location.pathname.match(/\/(p|reel)\/([^\/]+)/)?.[2] || Date.now().toString();

          // Extract actual timestamp from Instagram
          let timestamp = new Date().toISOString();

          // Look for time element with datetime attribute
          const timeElement = document.querySelector('time[datetime]');
          if (timeElement) {
            const datetime = timeElement.getAttribute('datetime');
            if (datetime) {
              timestamp = new Date(datetime).toISOString();
            }
          }

          return {
            caption: caption.trim(),
            id: postId,
            timestamp
          };
        });

        if (postData.caption) {
          posts.push({
            id: postData.id,
            caption: postData.caption,
            timestamp: postData.timestamp,
            scrapedAt: new Date().toISOString(),
          });
        }

      } catch (error) {
        console.error(`Error scraping post ${i + 1}:`, error);
      }
    }

    return {
      posts,
      hasMore: postLinks.length > count,
      cursor: null,
    };

  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    throw new Error(`Failed to scrape Instagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Fetches all posts in batches
 */
export async function fetchAllPosts(
  username: string,
  maxPosts: number = 100,
  onProgress?: (count: number) => void,
  existingPostIds: Set<string> = new Set()
): Promise<DBPost[]> {
  // Use Puppeteer to fetch all posts in one session
  const result = await fetchInstagramPosts(username, maxPosts, undefined, existingPostIds);

  if (onProgress) {
    onProgress(result.posts.length);
  }

  return result.posts;
}
