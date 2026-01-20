import { sql } from '@vercel/postgres';

export interface DBPost {
  id: string;
  caption: string;
  timestamp: string;
  likes?: number;
  mediaUrl?: string;
  scrapedAt: string;
}

export interface Review {
  id?: number;
  restaurant_name: string;
  rating?: number;
  review_text?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  date?: string;
}

// Initialize database tables
export async function initDatabase() {
  try {
    // Create posts table
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        caption TEXT,
        timestamp TIMESTAMP NOT NULL,
        likes INTEGER DEFAULT 0,
        media_url TEXT,
        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON posts(timestamp DESC)
    `;

    // Create reviews table
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        restaurant_name TEXT NOT NULL,
        rating DECIMAL(2,1),
        review_text TEXT,
        location TEXT,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_name)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_reviews_location ON reviews(latitude, longitude)
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Post functions
export async function savePost(post: DBPost) {
  try {
    await sql`
      INSERT INTO posts (id, caption, timestamp, likes, media_url, scraped_at)
      VALUES (
        ${post.id},
        ${post.caption},
        ${post.timestamp},
        ${post.likes || 0},
        ${post.mediaUrl || null},
        ${post.scrapedAt}
      )
      ON CONFLICT (id)
      DO UPDATE SET
        caption = EXCLUDED.caption,
        timestamp = EXCLUDED.timestamp,
        likes = EXCLUDED.likes,
        media_url = EXCLUDED.media_url,
        scraped_at = EXCLUDED.scraped_at,
        updated_at = CURRENT_TIMESTAMP
    `;
  } catch (error) {
    console.error('Error saving post:', error);
    throw error;
  }
}

export async function savePosts(posts: DBPost[]) {
  try {
    for (const post of posts) {
      await savePost(post);
    }
  } catch (error) {
    console.error('Error saving posts:', error);
    throw error;
  }
}

export async function getAllPosts(): Promise<DBPost[]> {
  try {
    const result = await sql`
      SELECT
        id,
        caption,
        timestamp::text,
        likes,
        media_url as "mediaUrl",
        scraped_at::text as "scrapedAt"
      FROM posts
      ORDER BY timestamp DESC
    `;

    return result.rows as DBPost[];
  } catch (error) {
    console.error('Error getting posts:', error);
    return [];
  }
}

export async function getPostCount(): Promise<number> {
  try {
    const result = await sql`SELECT COUNT(*) as count FROM posts`;
    return Number(result.rows[0]?.count || 0);
  } catch (error) {
    console.error('Error getting post count:', error);
    return 0;
  }
}

export async function getLatestPostTimestamp(): Promise<string | null> {
  try {
    const result = await sql`
      SELECT timestamp::text
      FROM posts
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    return result.rows[0]?.timestamp || null;
  } catch (error) {
    console.error('Error getting latest post timestamp:', error);
    return null;
  }
}

export async function clearAllPosts() {
  try {
    await sql`DELETE FROM posts`;
  } catch (error) {
    console.error('Error clearing posts:', error);
    throw error;
  }
}

// Review functions
export async function saveReview(review: Review) {
  try {
    await sql`
      INSERT INTO reviews (
        restaurant_name,
        rating,
        review_text,
        location,
        latitude,
        longitude,
        date
      )
      VALUES (
        ${review.restaurant_name},
        ${review.rating || null},
        ${review.review_text || null},
        ${review.location || null},
        ${review.latitude || null},
        ${review.longitude || null},
        ${review.date || null}
      )
    `;
  } catch (error) {
    console.error('Error saving review:', error);
    throw error;
  }
}

export async function saveReviews(reviews: Review[]) {
  try {
    for (const review of reviews) {
      await saveReview(review);
    }
  } catch (error) {
    console.error('Error saving reviews:', error);
    throw error;
  }
}

export async function getAllReviews(): Promise<Review[]> {
  try {
    const result = await sql`
      SELECT
        id,
        restaurant_name,
        rating,
        review_text,
        location,
        latitude,
        longitude,
        date::text
      FROM reviews
      ORDER BY date DESC
    `;

    return result.rows as Review[];
  } catch (error) {
    console.error('Error getting reviews:', error);
    return [];
  }
}

export async function getReviewsByRestaurant(restaurantName: string): Promise<Review[]> {
  try {
    const result = await sql`
      SELECT
        id,
        restaurant_name,
        rating,
        review_text,
        location,
        latitude,
        longitude,
        date::text
      FROM reviews
      WHERE restaurant_name ILIKE ${`%${restaurantName}%`}
      ORDER BY date DESC
    `;

    return result.rows as Review[];
  } catch (error) {
    console.error('Error getting reviews by restaurant:', error);
    return [];
  }
}
