-- Create posts table for Instagram posts and reels
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

-- Create index on timestamp for sorting
CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON posts(timestamp DESC);

-- Create reviews table for restaurant reviews
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

-- Create index on restaurant name and rating
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_name);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_location ON reviews(latitude, longitude);
