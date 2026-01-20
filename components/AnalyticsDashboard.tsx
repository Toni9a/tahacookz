'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { sampleInstagramPosts } from '@/lib/sample-data';
import {
  parseReview,
  calculateRatingStats,
  calculateRestaurantStats,
  analyzeWordFrequency,
  calculateAdjustedScore,
  calculateAdvancedStats,
  type ParsedReview,
  type RatingStats,
  type RestaurantStats,
  type WordFrequency,
  type AdvancedStats,
} from '@/lib/review-parser';
import { geocodePostcode } from '@/lib/geocoding';

// Dynamic imports for client-side only components
const RatingDistribution = dynamic(() => import('@/components/RatingDistribution'), {
  ssr: false,
});
const WordCloud = dynamic(() => import('@/components/WordCloud'), {
  ssr: false,
});
const RestaurantMap = dynamic(() => import('@/components/RestaurantMap'), {
  ssr: false,
});

export default function AnalyticsDashboard() {
  const [reviews, setReviews] = useState<ParsedReview[]>([]);
  const [stats, setStats] = useState<{
    ratings: RatingStats;
    restaurants: RestaurantStats[];
    words: WordFrequency[];
  } | null>(null);
  const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [dataSource, setDataSource] = useState<'sample' | 'cached' | 'fresh'>('sample');
  const [postCount, setPostCount] = useState(0);

  // Try to load cached data first, fall back to sample data
  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      const response = await fetch('/api/scrape-new');
      const data = await response.json();

      if (data.posts && data.posts.length > 0) {
        analyzeAndSetData(data.posts, 'cached');
        setPostCount(data.count);
      } else {
        loadSampleData();
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
      loadSampleData();
    }
  };

  const analyzeAndSetData = (posts: any[], source: 'sample' | 'cached' | 'fresh') => {
    const parsedReviews = posts
      .map(post => parseReview(post.caption, post.timestamp))
      .filter((r): r is ParsedReview => r !== null);

    const ratingStats = calculateRatingStats(parsedReviews);
    const restaurantStats = calculateRestaurantStats(parsedReviews);
    const wordFrequency = analyzeWordFrequency(parsedReviews, 2);
    const advanced = calculateAdvancedStats(parsedReviews);

    const reviewsWithAdjusted = parsedReviews.map(review => ({
      ...review,
      adjustedScore: calculateAdjustedScore(review.rating, ratingStats),
    }));

    setReviews(reviewsWithAdjusted as ParsedReview[]);
    setStats({
      ratings: ratingStats,
      restaurants: restaurantStats,
      words: wordFrequency,
    });
    setAdvancedStats(advanced);
    setDataSource(source);
    setPostCount(posts.length);
  };

  const loadSampleData = () => {
    analyzeAndSetData(sampleInstagramPosts, 'sample');
  };

  const handleScrapeInstagram = async (forceRefresh: boolean = false) => {
    setScraping(true);
    try {
      const response = await fetch('/api/scrape-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'diningwithtaha',
          maxPosts: 50, // Scrape 50 posts at a time
          forceRefresh,
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.error?.includes('No new posts')) {
        throw new Error(data.error || 'Failed to scrape Instagram');
      }

      if (data.posts && data.posts.length > 0) {
        analyzeAndSetData(data.posts, data.cached ? 'cached' : 'fresh');
        alert(data.message || `Successfully loaded ${data.count} posts`);
      } else if (data.error?.includes('No new posts')) {
        // All posts already in database - reload from cache
        loadCachedData();
        alert('No new posts found. All posts are already in your database!');
      } else {
        throw new Error('No posts returned');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(
        `Failed to scrape Instagram: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
        'Instagram may be blocking automated access. Try using the manual data import method from the README.'
      );
    } finally {
      setScraping(false);
    }
  };

  // Map locations using real geocoding
  const mapLocations = stats?.restaurants
    .map((restaurant) => {
      const postcode = restaurant.locations[0];
      if (!postcode) return null;

      const coords = geocodePostcode(postcode);
      if (!coords) return null;

      return {
        name: restaurant.name,
        rating: restaurant.averageRating,
        postcode: `${postcode} - ${coords.area}`,
        position: [coords.lat, coords.lng] as [number, number],
      };
    })
    .filter((loc): loc is NonNullable<typeof loc> => loc !== null) || [];

  return (
    <>
      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-orange-500 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg hover:bg-orange-600 transition z-50 flex items-center justify-center text-lg sm:text-xl"
        title="Back to top"
        aria-label="Back to top"
      >
        ↑
      </button>

      {/* Quick Navigation */}
      {stats && (
        <nav className="bg-white rounded-lg shadow-sm p-2 sm:p-3 mb-4 sm:mb-6 sticky top-[72px] sm:top-[88px] z-30 border border-gray-200">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
            <a href="#overview" className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm font-medium whitespace-nowrap hover:bg-gray-200 transition">
              Overview
            </a>
            <a href="#categories" className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm font-medium whitespace-nowrap hover:bg-gray-200 transition">
              Categories
            </a>
            <a href="#timeline" className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm font-medium whitespace-nowrap hover:bg-gray-200 transition">
              Timeline
            </a>
            <a href="#rankings" className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm font-medium whitespace-nowrap hover:bg-gray-200 transition">
              Rankings
            </a>
            <a href="#map" className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm font-medium whitespace-nowrap hover:bg-gray-200 transition">
              Map
            </a>
            <a href="#reviews" className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm font-medium whitespace-nowrap hover:bg-gray-200 transition">
              Reviews
            </a>
          </div>
        </nav>
      )}

        {/* Data Source Badge */}
        <div className="flex justify-center mb-4">
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            dataSource === 'fresh' ? 'bg-green-100 text-green-800' :
            dataSource === 'cached' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {dataSource === 'fresh' ? `✓ Fresh Data (${postCount} posts scraped)` :
             dataSource === 'cached' ? `✓ Cached Data (${postCount} posts from database)` :
             `Sample Data (${postCount} demo posts)`}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <button
            onClick={() => handleScrapeInstagram(false)}
            disabled={scraping}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-colors"
          >
            {scraping ? 'Scraping...' : 'Load Instagram Data'}
          </button>
          <button
            onClick={() => handleScrapeInstagram(true)}
            disabled={scraping}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-colors"
          >
            Force Refresh
          </button>
          <button
            onClick={loadSampleData}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-colors"
          >
            Load Sample Data
          </button>
        </div>

        {stats && (
          <>
            {/* Stats Overview */}
            <div id="overview" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Total Reviews</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.ratings.totalReviews}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Average Rating</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.ratings.average}/10</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Median Rating</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.ratings.median}/10</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Most Common</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.ratings.mode}/10</p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Rating Distribution</h2>
              <RatingDistribution distribution={stats.ratings.distribution} />
            </div>

            {/* Advanced Analytics */}
            {advancedStats && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6">
                    <h3 className="text-gray-700 text-sm font-medium mb-2">Approval Rate</h3>
                    <p className="text-4xl font-bold text-green-600">{advancedStats.approvalRate}%</p>
                    <p className="text-sm text-gray-600 mt-2">
                      {advancedStats.totalApproved} of {advancedStats.totalReviews} reviews approved
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6">
                    <h3 className="text-gray-700 text-sm font-medium mb-2">Avg Review Length</h3>
                    <p className="text-4xl font-bold text-purple-600">{advancedStats.averageReviewLength}</p>
                    <p className="text-sm text-gray-600 mt-2">characters per review</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6">
                    <h3 className="text-gray-700 text-sm font-medium mb-2">Active Months</h3>
                    <p className="text-4xl font-bold text-blue-600">{advancedStats.timeline.length}</p>
                    <p className="text-sm text-gray-600 mt-2">months posting reviews</p>
                  </div>
                </div>

                {/* Food Categories */}
                <div id="categories" className="bg-white rounded-lg shadow-md p-6 mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Food Category Breakdown</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {advancedStats.categories.map((cat, idx) => (
                      <div key={idx} className="border-2 border-gray-200 rounded-lg p-5 hover:border-orange-300 transition">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-xl text-gray-800">{cat.category}</h3>
                          <span className="font-bold text-orange-600 text-lg">{cat.averageRating}/10</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{cat.count} reviews</p>

                        {/* Top Keywords */}
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Top Keywords:</p>
                          <div className="flex flex-wrap gap-1">
                            {cat.topKeywords.map((kw, i) => (
                              <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Top Restaurants - Clickable */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Top Restaurants:</p>
                          <div className="space-y-1">
                            {cat.topRestaurants.map((rest, i) => (
                              <a
                                key={i}
                                href={`#review-${rest.handle || rest.name.replace(/\s+/g, '-')}`}
                                className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {rest.name} - {rest.rating}/10
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Posting Timeline */}
                <div id="timeline" className="bg-white rounded-lg shadow-md p-6 mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Posting Activity Over Time</h2>
                  <div className="overflow-x-auto">
                    <div className="flex items-end space-x-2 min-w-max pb-4">
                      {advancedStats.timeline.map((month, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div className="text-xs font-semibold text-orange-600 mb-1">
                            {month.count}
                          </div>
                          <div
                            className="w-12 bg-orange-500 rounded-t hover:bg-orange-600 transition cursor-pointer"
                            style={{ height: `${Math.max(month.count * 20, 20)}px` }}
                            title={`${month.month}: ${month.count} posts, avg ${month.averageRating}/10`}
                          />
                          <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                            {month.month}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Top Restaurants */}
            <div id="rankings" className="bg-white rounded-lg shadow-md p-6 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Rated Restaurants</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4">Rank</th>
                      <th className="text-left py-3 px-4">Restaurant</th>
                      <th className="text-left py-3 px-4">Rating (/10)</th>
                      <th className="text-left py-3 px-4">Score (/5)</th>
                      <th className="text-left py-3 px-4">Visits</th>
                      <th className="text-left py-3 px-4">Locations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.restaurants.map((restaurant) => (
                      <tr key={restaurant.rank} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-lg text-gray-700">#{restaurant.rank}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-semibold">{restaurant.name}</div>
                            {restaurant.handle && (
                              <div className="text-sm text-gray-500">@{restaurant.handle}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-orange-600 text-lg">
                            {restaurant.averageRating}/10
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-green-600 text-lg">
                            {restaurant.weightedAverage}/5
                          </span>
                        </td>
                        <td className="py-3 px-4">{restaurant.visitCount}</td>
                        <td className="py-3 px-4">{restaurant.locations.join(', ') || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Word Frequency */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Most Used Words</h2>
              <p className="text-sm text-gray-600 mb-4">
                Green = Positive, Red = Negative, Gray = Neutral
              </p>
              <WordCloud words={stats.words} limit={40} />
            </div>

            {/* Restaurant Map */}
            <div id="map" className="bg-white rounded-lg shadow-md p-6 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Locations</h2>
              <p className="text-sm text-gray-600 mb-4">
                Showing {mapLocations.length} restaurants with known postcodes
              </p>
              <RestaurantMap locations={mapLocations} />
            </div>

            {/* All Reviews */}
            <div id="reviews" className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Reviews</h2>
              <div className="space-y-6">
                {reviews.map((review, idx) => (
                  <div
                    key={idx}
                    id={`review-${review.restaurantHandle || review.restaurantName.replace(/\s+/g, '-')}`}
                    className="border-l-4 border-orange-500 pl-4 py-2 scroll-mt-24"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{review.restaurantName}</h3>
                        {review.restaurantHandle && (
                          <p className="text-sm text-gray-500">@{review.restaurantHandle}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">
                          {review.rating}/10
                        </div>
                        {review.isApproved && (
                          <span className="text-sm text-green-600 font-semibold">APPROVED</span>
                        )}
                      </div>
                    </div>
                    {review.location && (
                      <p className="text-sm text-gray-500 mb-2">{review.location}</p>
                    )}
                    {review.items.length > 0 && (
                      <ul className="text-sm space-y-1 mb-2">
                        {review.items.map((item, i) => (
                          <li key={i} className="text-gray-700">• {item}</li>
                        ))}
                      </ul>
                    )}
                    <p className="text-gray-600 text-sm mt-2">{review.reviewText}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(review.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
    </>
  );
}
