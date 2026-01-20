import puppeteer from 'puppeteer';

export interface InstagramPost {
  caption: string;
  timestamp: string;
  likes?: number;
  mediaUrl?: string;
}

export async function scrapeInstagramPosts(username: string, maxPosts: number = 50): Promise<InstagramPost[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set user agent to avoid being blocked
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );

    const url = `https://www.instagram.com/${username}/`;
    console.log(`Navigating to ${url}...`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for posts to load
    await page.waitForSelector('article', { timeout: 10000 });

    // Scroll to load more posts
    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrolls = Math.ceil(maxPosts / 12); // Instagram loads ~12 posts at a time

    while (scrollAttempts < maxScrolls) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(resolve => setTimeout(resolve, 2000));

      const currentHeight = await page.evaluate(() => document.body.scrollHeight);
      if (currentHeight === previousHeight) break;

      previousHeight = currentHeight;
      scrollAttempts++;
    }

    // Extract post links
    const postLinks = await page.evaluate(() => {
      const links: string[] = [];
      const anchors = document.querySelectorAll('article a[href*="/p/"]');
      anchors.forEach(anchor => {
        const href = (anchor as HTMLAnchorElement).href;
        if (href && !links.includes(href)) {
          links.push(href);
        }
      });
      return links;
    });

    console.log(`Found ${postLinks.length} posts`);

    const posts: InstagramPost[] = [];
    const postsToScrape = postLinks.slice(0, maxPosts);

    // Visit each post to get the caption
    for (let i = 0; i < postsToScrape.length; i++) {
      try {
        console.log(`Scraping post ${i + 1}/${postsToScrape.length}...`);
        await page.goto(postsToScrape[i], { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const postData = await page.evaluate(() => {
          // Try multiple selectors for caption
          const captionSelectors = [
            'h1',
            'div[data-testid="post-comment-root"] span',
            'article span',
          ];

          let caption = '';
          for (const selector of captionSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
              const text = el.textContent?.trim();
              if (text && text.length > 20) {
                caption = text;
                break;
              }
            }
            if (caption) break;
          }

          // Get timestamp
          const timeElement = document.querySelector('time');
          const timestamp = timeElement?.getAttribute('datetime') || new Date().toISOString();

          return { caption, timestamp };
        });

        if (postData.caption) {
          posts.push({
            caption: postData.caption,
            timestamp: postData.timestamp,
          });
        }

      } catch (error) {
        console.error(`Error scraping post ${i + 1}:`, error);
      }
    }

    return posts;

  } catch (error) {
    console.error('Error scraping Instagram:', error);
    throw error;
  } finally {
    await browser.close();
  }
}
