import { createClient } from '@supabase/supabase-js';

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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize database tables
export async function initDatabase() {
  try {
    // Create posts table
    const { error: postsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS posts (
          id TEXT PRIMARY KEY,
          caption TEXT,
          timestamp TIMESTAMP NOT NULL,
          likes INTEGER DEFAULT 0,
          media_url TEXT,
          scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON posts(timestamp DESC);
      `
    });

    if (postsError) {
      console.warn('Posts table might already exist:', postsError.message);
    }

    // Create reviews table
    const { error: reviewsError } = await supabase.rpc('exec_sql', {
      sql: `
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
        );
        CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_name);
        CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
        CREATE INDEX IF NOT EXISTS idx_reviews_location ON reviews(latitude, longitude);
      `
    });

    if (reviewsError) {
      console.warn('Reviews table might already exist:', reviewsError.message);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Post functions
export async function savePost(post: DBPost) {
  try {
    const { error } = await supabase
      .from('posts')
      .upsert({
        id: post.id,
        caption: post.caption,
        timestamp: post.timestamp,
        likes: post.likes || 0,
        media_url: post.mediaUrl || null,
        scraped_at: post.scrapedAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving post:', error);
    throw error;
  }
}

export async function savePosts(posts: DBPost[]) {
  try {
    const { error } = await supabase
      .from('posts')
      .upsert(
        posts.map(post => ({
          id: post.id,
          caption: post.caption,
          timestamp: post.timestamp,
          likes: post.likes || 0,
          media_url: post.mediaUrl || null,
          scraped_at: post.scrapedAt,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );

    if (error) throw error;
  } catch (error) {
    console.error('Error saving posts:', error);
    throw error;
  }
}

export async function getAllPosts(): Promise<DBPost[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      caption: row.caption,
      timestamp: row.timestamp,
      likes: row.likes,
      mediaUrl: row.media_url,
      scrapedAt: row.scraped_at,
    }));
  } catch (error) {
    console.error('Error getting posts:', error);
    return [];
  }
}

export async function getPostCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting post count:', error);
    return 0;
  }
}

export async function getLatestPostTimestamp(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data?.timestamp || null;
  } catch (error) {
    console.error('Error getting latest post timestamp:', error);
    return null;
  }
}

export async function clearAllPosts() {
  try {
    const { error } = await supabase.from('posts').delete().neq('id', '');
    if (error) throw error;
  } catch (error) {
    console.error('Error clearing posts:', error);
    throw error;
  }
}

// Review functions
export async function saveReview(review: Review) {
  try {
    const { error } = await supabase
      .from('reviews')
      .insert({
        restaurant_name: review.restaurant_name,
        rating: review.rating || null,
        review_text: review.review_text || null,
        location: review.location || null,
        latitude: review.latitude || null,
        longitude: review.longitude || null,
        date: review.date || null,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving review:', error);
    throw error;
  }
}

export async function saveReviews(reviews: Review[]) {
  try {
    const { error } = await supabase
      .from('reviews')
      .insert(
        reviews.map(review => ({
          restaurant_name: review.restaurant_name,
          rating: review.rating || null,
          review_text: review.review_text || null,
          location: review.location || null,
          latitude: review.latitude || null,
          longitude: review.longitude || null,
          date: review.date || null,
        }))
      );

    if (error) throw error;
  } catch (error) {
    console.error('Error saving reviews:', error);
    throw error;
  }
}

export async function getAllReviews(): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      restaurant_name: row.restaurant_name,
      rating: row.rating,
      review_text: row.review_text,
      location: row.location,
      latitude: row.latitude,
      longitude: row.longitude,
      date: row.date,
    }));
  } catch (error) {
    console.error('Error getting reviews:', error);
    return [];
  }
}

export async function getReviewsByRestaurant(restaurantName: string): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .ilike('restaurant_name', `%${restaurantName}%`)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      restaurant_name: row.restaurant_name,
      rating: row.rating,
      review_text: row.review_text,
      location: row.location,
      latitude: row.latitude,
      longitude: row.longitude,
      date: row.date,
    }));
  } catch (error) {
    console.error('Error getting reviews by restaurant:', error);
    return [];
  }
}
