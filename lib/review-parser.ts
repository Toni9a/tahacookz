export interface ParsedReview {
  restaurantName: string;
  restaurantHandle?: string;
  rating: number;
  location?: string;
  reviewText: string;
  items: string[];
  timestamp: string;
  isApproved: boolean;
  rawCaption: string;
}

export interface RatingStats {
  average: number;
  median: number;
  mode: number;
  stdDev: number;
  distribution: { [key: number]: number };
  totalReviews: number;
}

export interface RestaurantStats {
  name: string;
  handle?: string;
  ratings: number[];
  averageRating: number;
  weightedAverage: number; // Weighted average out of 5
  visitCount: number;
  locations: string[];
  rank: number; // Overall rank (1 = best)
}

export interface WordFrequency {
  word: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface PostingTimeline {
  month: string;
  count: number;
  averageRating: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  averageRating: number;
  topRestaurants: Array<{ name: string; handle?: string; rating: number }>;
  topKeywords: string[];
}

export interface AdvancedStats {
  timeline: PostingTimeline[];
  categories: CategoryStats[];
  approvalRate: number;
  averageReviewLength: number;
  totalApproved: number;
  totalReviews: number;
}

// Common positive and negative words for sentiment analysis
const POSITIVE_WORDS = new Set([
  'amazing', 'perfect', 'delicious', 'incredible', 'fantastic', 'excellent',
  'beautiful', 'wonderful', 'outstanding', 'phenomenal', 'spectacular',
  'addictive', 'crispy', 'fresh', 'fluffy', 'creamy', 'rich', 'tender',
  'juicy', 'flavorful', 'tasty', 'yummy', 'divine', 'heavenly', 'approved',
  'must', 'best', 'love', 'hit', 'delivered', 'dangerous', 'fire', 'problem'
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'disappointing', 'bland',
  'dry', 'soggy', 'cold', 'overcooked', 'undercooked', 'burnt',
  'greasy', 'salty', 'bitter', 'sour', 'stale', 'mushy', 'rubbery'
]);

export function parseReview(caption: string, timestamp: string): ParsedReview | null {
  // Extract restaurant handle (e.g., @bobabloom_)
  const handleMatch = caption.match(/@([a-zA-Z0-9._]+)/);
  const restaurantHandle = handleMatch ? handleMatch[1] : undefined;

  // Extract rating (e.g., "9.3/10" or "RG1 9.3/10")
  const ratingMatch = caption.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  if (!ratingMatch) return null;

  const rating = parseFloat(ratingMatch[1]);
  if (rating < 0 || rating > 10) return null;

  // Extract location - postcode (e.g., "RG1") or city name (e.g., "Southampton")
  let location: string | undefined;

  // Try postcode pattern first (e.g., "RG1 9.3/10" or "WD24 – 8.8/10")
  const postcodeMatch = caption.match(/([A-Z]{1,2}\d{1,2}[A-Z]?)\s+[–\-—]?\s*\d/);
  if (postcodeMatch) {
    location = postcodeMatch[1];
  } else {
    // Try city name pattern (e.g., "@handle Southampton - 9.5/10")
    const cityMatch = caption.match(/@[a-zA-Z0-9._]+\s+([A-Za-z\s]+?)\s+[–\-—]\s+\d/);
    if (cityMatch) {
      location = cityMatch[1].trim();
    }
  }

  // Extract restaurant name - prioritize handle, then clean text
  let restaurantName = restaurantHandle || 'Unknown Restaurant';

  // Try to extract name from text (usually appears after handle or in first line)
  const lines = caption.split('\n');
  if (lines.length > 0) {
    const firstLine = lines[0];
    // Remove handle, rating, location, emojis, and common words like "invite"
    const cleanedName = firstLine
      .replace(/@[a-zA-Z0-9._]+/g, '')
      .replace(/\d+(?:\.\d+)?\/10/g, '')
      .replace(/[A-Z]{1,2}\d{1,2}[A-Z]?\s+/g, '')
      .replace(/[–\-—]/g, '')
      .replace(/\binvite\b/gi, '')
      .replace(/[^\w\s]/g, '')
      .trim();

    // Only use cleaned name if it's substantial and we don't already have a handle
    if (!restaurantHandle && cleanedName && cleanedName.length > 2 && cleanedName.length < 50) {
      restaurantName = cleanedName;
    }
  }

  // Extract items/dishes (lines starting with emoji or bullet)
  const items: string[] = [];
  const itemRegex = /(?:🔥|🍓|⚡️|🧋|🍌|🍕|🍔|🍟|🌮|🍜|🍣|🍱|🥗|🥙|🌯|•|-)\s*(.+?)(?:–|—|-)\s*(.+)/g;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(caption)) !== null) {
    items.push(`${itemMatch[1].trim()}: ${itemMatch[2].trim()}`);
  }

  // Check if approved
  const isApproved = /@diningwithtaha\s+APPROVED/i.test(caption);

  // Extract review text (remove handles, ratings, items, etc.)
  let reviewText = caption
    .replace(/@[a-zA-Z0-9._]+/g, '')
    .replace(/\d+(?:\.\d+)?\/10/g, '')
    .replace(/[A-Z]{1,2}\d{1,2}[A-Z]?\s+/g, '')
    .replace(/APPROVED\s*✅*/gi, '')
    .replace(itemRegex, '')
    .replace(/\n+/g, ' ')
    .trim();

  return {
    restaurantName,
    restaurantHandle,
    rating,
    location,
    reviewText,
    items,
    timestamp,
    isApproved,
    rawCaption: caption,
  };
}

export function calculateRatingStats(reviews: ParsedReview[]): RatingStats {
  if (reviews.length === 0) {
    return {
      average: 0,
      median: 0,
      mode: 0,
      stdDev: 0,
      distribution: {},
      totalReviews: 0,
    };
  }

  const ratings = reviews.map(r => r.rating).sort((a, b) => a - b);
  const n = ratings.length;

  // Average
  const average = ratings.reduce((sum, r) => sum + r, 0) / n;

  // Median
  const median = n % 2 === 0
    ? (ratings[n / 2 - 1] + ratings[n / 2]) / 2
    : ratings[Math.floor(n / 2)];

  // Mode (most common rating)
  const distribution: { [key: number]: number } = {};
  ratings.forEach(rating => {
    const rounded = Math.round(rating * 10) / 10; // Round to 1 decimal
    distribution[rounded] = (distribution[rounded] || 0) + 1;
  });

  const mode = parseFloat(
    Object.keys(distribution).reduce((a, b) =>
      distribution[parseFloat(a)] > distribution[parseFloat(b)] ? a : b
    )
  );

  // Standard deviation
  const variance = ratings.reduce((sum, r) => sum + Math.pow(r - average, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    average: Math.round(average * 100) / 100,
    median: Math.round(median * 100) / 100,
    mode,
    stdDev: Math.round(stdDev * 100) / 100,
    distribution,
    totalReviews: n,
  };
}

export function calculateRestaurantStats(reviews: ParsedReview[]): RestaurantStats[] {
  const restaurantMap = new Map<string, {
    name: string;
    handle?: string;
    ratings: number[];
    locations: Set<string>;
  }>();

  reviews.forEach(review => {
    const key = review.restaurantHandle || review.restaurantName;

    if (!restaurantMap.has(key)) {
      // Use handle as display name if we have it, otherwise use parsed name
      const displayName = review.restaurantHandle ? `@${review.restaurantHandle}` : review.restaurantName;

      restaurantMap.set(key, {
        name: displayName,
        handle: review.restaurantHandle,
        ratings: [],
        locations: new Set(),
      });
    }

    const restaurant = restaurantMap.get(key)!;
    restaurant.ratings.push(review.rating);
    if (review.location) {
      restaurant.locations.add(review.location);
    }
  });

  const stats = Array.from(restaurantMap.entries()).map(([_, data]) => {
    const avg = data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length;
    const averageRating = Math.round(avg * 100) / 100;

    // Calculate weighted average out of 5 (converting from /10 scale)
    // Give more weight to restaurants with multiple visits
    const weightedAverage = Math.round((avg / 2) * 100) / 100;

    return {
      name: data.name,
      handle: data.handle,
      ratings: data.ratings,
      averageRating,
      weightedAverage,
      visitCount: data.ratings.length,
      locations: Array.from(data.locations),
      rank: 0, // Will be set after sorting
    };
  }).sort((a, b) => b.averageRating - a.averageRating);

  // Assign ranks
  stats.forEach((stat, index) => {
    stat.rank = index + 1;
  });

  return stats;
}

export function analyzeWordFrequency(reviews: ParsedReview[], minCount: number = 2): WordFrequency[] {
  const wordCounts = new Map<string, number>();

  // Combine all review text
  const allText = reviews.map(r => r.reviewText + ' ' + r.items.join(' ')).join(' ');

  // Tokenize and count
  const words = allText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3); // Filter out short words

  words.forEach(word => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });

  // Convert to array and filter
  const frequencies: WordFrequency[] = Array.from(wordCounts.entries())
    .filter(([_, count]) => count >= minCount)
    .map(([word, count]) => {
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (POSITIVE_WORDS.has(word)) sentiment = 'positive';
      else if (NEGATIVE_WORDS.has(word)) sentiment = 'negative';

      return { word, count, sentiment };
    })
    .sort((a, b) => b.count - a.count);

  return frequencies;
}

export function calculateAdjustedScore(
  rating: number,
  stats: RatingStats
): number {
  // Adjusted score using z-score normalization
  // This shows how a rating compares to the average, accounting for variance
  if (stats.stdDev === 0) return rating;

  const zScore = (rating - stats.average) / stats.stdDev;
  // Convert z-score back to a 0-10 scale, centered around 5
  const adjusted = 5 + (zScore * 2);

  // Clamp between 0 and 10
  return Math.max(0, Math.min(10, Math.round(adjusted * 100) / 100));
}

export function calculateAdvancedStats(reviews: ParsedReview[]): AdvancedStats {
  // Timeline - posts per month
  const timelineMap = new Map<string, { count: number; totalRating: number }>();

  reviews.forEach(review => {
    const date = new Date(review.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!timelineMap.has(monthKey)) {
      timelineMap.set(monthKey, { count: 0, totalRating: 0 });
    }

    const data = timelineMap.get(monthKey)!;
    data.count++;
    data.totalRating += review.rating;
  });

  const timeline: PostingTimeline[] = Array.from(timelineMap.entries())
    .map(([month, data]) => ({
      month,
      count: data.count,
      averageRating: Math.round((data.totalRating / data.count) * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Categories - detect food type from text
  const categories = detectFoodCategories(reviews);

  // Approval rate
  const approved = reviews.filter(r => r.isApproved).length;
  const approvalRate = Math.round((approved / reviews.length) * 100);

  // Average review length
  const totalLength = reviews.reduce((sum, r) => sum + r.reviewText.length, 0);
  const averageReviewLength = Math.round(totalLength / reviews.length);

  return {
    timeline,
    categories,
    approvalRate,
    averageReviewLength,
    totalApproved: approved,
    totalReviews: reviews.length,
  };
}

function detectFoodCategories(reviews: ParsedReview[]): CategoryStats[] {
  const categoryKeywords = {
    'Burgers': ['burger', 'smash', 'patty', 'bun'],
    'Asian': ['asian', 'sushi', 'ramen', 'noodle', 'rice', 'thai', 'chinese', 'korean', 'japanese'],
    'Desserts': ['dessert', 'cake', 'brownie', 'ice cream', 'chocolate', 'sweet', 'waffle'],
    'Chicken': ['chicken', 'wings', 'tenders', 'fried chicken', 'nashville'],
    'Drinks/Chai': ['chai', 'tea', 'coffee', 'drink', 'matcha', 'smoothie', 'milkshake'],
    'Steaks': ['steak', 'ribeye', 'beef', 't-bone', 'sirloin'],
    'Middle Eastern': ['shawarma', 'kebab', 'halal', 'turkish', 'lebanese', 'pita'],
  };

  const categoryData = new Map<string, {
    ratings: number[];
    restaurants: Map<string, { handle?: string; rating: number }>;
    words: Map<string, number>;
  }>();

  reviews.forEach(review => {
    const text = (review.reviewText + ' ' + review.items.join(' ')).toLowerCase();

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        if (!categoryData.has(category)) {
          categoryData.set(category, {
            ratings: [],
            restaurants: new Map(),
            words: new Map(),
          });
        }

        const data = categoryData.get(category)!;
        data.ratings.push(review.rating);

        // Store restaurant with handle and rating
        if (!data.restaurants.has(review.restaurantName)) {
          data.restaurants.set(review.restaurantName, {
            handle: review.restaurantHandle,
            rating: review.rating,
          });
        }

        // Extract keywords for this category
        const words = text.split(/\s+/).filter(w => w.length > 3);
        words.forEach(word => {
          // Filter out common words
          if (!['with', 'that', 'this', 'from', 'were', 'have', 'been'].includes(word)) {
            data.words.set(word, (data.words.get(word) || 0) + 1);
          }
        });
      }
    }
  });

  return Array.from(categoryData.entries())
    .map(([category, data]) => {
      // Get top restaurants sorted by rating
      const topRestaurants = Array.from(data.restaurants.entries())
        .map(([name, info]) => ({ name, handle: info.handle, rating: info.rating }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

      // Get top keywords
      const topKeywords = Array.from(data.words.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);

      return {
        category,
        count: data.ratings.length,
        averageRating: Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 100) / 100,
        topRestaurants,
        topKeywords,
      };
    })
    .sort((a, b) => b.count - a.count);
}
