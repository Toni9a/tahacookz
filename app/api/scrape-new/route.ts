import { NextRequest, NextResponse } from 'next/server';
import { fetchAllPosts } from '@/lib/instagram-fetch';
import { savePosts, getAllPosts, getPostCount } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { username, maxPosts, forceRefresh } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Check if we already have data cached
    if (!forceRefresh) {
      const cachedCount = await getPostCount();
      if (cachedCount > 0) {
        const cachedPosts = await getAllPosts();
        return NextResponse.json({
          posts: cachedPosts,
          cached: true,
          count: cachedCount,
          message: 'Loaded from cache. Click "Force Refresh" to scrape new data.',
        });
      }
    }

    console.log(`Scraping Instagram posts for @${username}...`);

    // Get existing posts to avoid re-scraping
    const existingPosts = await getAllPosts();
    const existingPostIds = new Set(existingPosts.map(p => p.id));
    console.log(`Database has ${existingPostIds.size} existing posts`);

    // Fetch posts from Instagram
    const posts = await fetchAllPosts(
      username,
      maxPosts || 50,
      (count) => {
        console.log(`Scraped ${count} posts so far...`);
      },
      existingPostIds
    );

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'No new posts found. All posts are already in the database.' },
        { status: 200 }
      );
    }

    // Save to database
    console.log(`Saving ${posts.length} new posts to database...`);
    await savePosts(posts);

    // Get updated total count
    const totalCount = await getPostCount();

    return NextResponse.json({
      posts: await getAllPosts(), // Return all posts including old ones
      cached: false,
      count: totalCount,
      message: `Successfully scraped ${posts.length} new posts from @${username}. Total: ${totalCount} posts.`,
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to scrape Instagram posts',
        details: 'Instagram may have blocked the request or changed their API. Try using the manual data import method instead.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const posts = await getAllPosts();
    const count = await getPostCount();

    return NextResponse.json({
      posts,
      count,
      cached: true,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve posts from database' },
      { status: 500 }
    );
  }
}
