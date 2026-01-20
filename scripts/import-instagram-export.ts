import { savePosts } from '../lib/database';
import { readFileSync } from 'fs';
import { join } from 'path';

interface InstagramPost {
  media: Array<{
    uri: string;
    creation_timestamp: number;
  }>;
  title: string;
  creation_timestamp: number;
}

function importInstagramExport() {
  console.log('Starting Instagram export import...');

  const allPosts: Array<{
    id: string;
    caption: string;
    timestamp: string;
    scrapedAt: string;
  }> = [];

  // Read posts.json
  try {
    const postsPath = join(process.cwd(), 'data', 'instagram-export', 'posts.json');
    const postsData = JSON.parse(readFileSync(postsPath, 'utf-8')) as InstagramPost[];
    console.log(`Found ${postsData.length} posts in posts.json`);

    for (const post of postsData) {
      if (post.title && post.title.trim().length > 0) {
        // Use the first media URI as a unique ID
        const id = post.media[0]?.uri.split('/').pop()?.replace(/\.(jpg|mp4|png)$/, '') ||
                   `post_${post.creation_timestamp}`;

        allPosts.push({
          id,
          caption: post.title,
          timestamp: new Date(post.creation_timestamp * 1000).toISOString(),
          scrapedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error reading posts.json:', error);
  }

  // Read reels.json
  try {
    const reelsPath = join(process.cwd(), 'data', 'instagram-export', 'reels.json');
    const reelsFile = JSON.parse(readFileSync(reelsPath, 'utf-8')) as { ig_reels_media: Array<{ media: Array<{ uri: string; creation_timestamp: number; title?: string }> }> };
    const reelsData = reelsFile.ig_reels_media;
    console.log(`Found ${reelsData.length} reels in reels.json`);

    for (const reelWrapper of reelsData) {
      const reelMedia = reelWrapper.media[0];
      if (reelMedia?.title && reelMedia.title.trim().length > 0) {
        const id = reelMedia.uri.split('/').pop()?.replace(/\.(jpg|mp4|png)$/, '') ||
                   `reel_${reelMedia.creation_timestamp}`;

        allPosts.push({
          id,
          caption: reelMedia.title,
          timestamp: new Date(reelMedia.creation_timestamp * 1000).toISOString(),
          scrapedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error reading reels.json:', error);
  }

  // Sort by timestamp (newest first)
  allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  console.log(`Total posts to import: ${allPosts.length}`);

  // Save to database
  savePosts(allPosts);

  console.log('✅ Import complete!');
  console.log(`Imported ${allPosts.length} posts with captions`);
}

// Run the import
importInstagramExport();
