# Dining with Taha - Food Review Analytics

A Next.js web application that extracts and analyzes food reviews from [@diningwithtaha](https://www.instagram.com/diningwithtaha/) Instagram account. Built for Taha to track his restaurant ratings, discover trends, and visualize his food journey.

## Features

- **Instagram Scraping**: Automated extraction of post captions from Instagram
- **Smart Parsing**: Extracts ratings, restaurant names, locations, and review details
- **Statistical Analysis**:
  - Average, median, and mode ratings
  - Rating distribution visualization
  - Standard deviation and variance
  - Adjusted/weighted scores using z-score normalization
- **Restaurant Insights**:
  - Top-rated restaurants ranking
  - Visit frequency tracking
  - Multi-location detection
- **Sentiment Analysis**: Word frequency analysis with positive/negative sentiment detection
- **Interactive Map**: Visual representation of restaurant locations (demo with sample data)
- **Beautiful UI**: Modern, responsive design with charts and data visualizations

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Maps**: Leaflet with react-leaflet
- **Scraping**: Puppeteer (for Instagram data extraction)
- **Data Processing**: Custom parsers with regex pattern matching

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser

### Installation

1. Clone the repository
```bash
cd dining-taha-web
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

The app has three modes for loading data:

### 1. Cached Data (Automatic on Startup)

The app automatically loads previously scraped data from `data/reviews.json` if available. This means you only need to scrape once!

### 2. Instagram Scraping Mode

Click **"Load Instagram Data"** to scrape @diningwithtaha:
- First click loads from cache if available (instant)
- Shows a badge indicating if data is cached or fresh
- Data is automatically saved to `data/reviews.json` for future use
- Scrapes in batches starting from most recent posts

Click **"Force Refresh"** to:
- Bypass cache and scrape fresh data from Instagram
- Update your database with the latest posts
- Good for getting new reviews since last scrape

**Important Notes**:
- Instagram may block automated scraping attempts
- The scraper uses public Instagram endpoints (no login required)
- Data persists between sessions in JSON format
- Recommended: Start with 50-100 posts, then refresh periodically

### 3. Sample Data Mode

Click **"Load Sample Data"** to use demo data (12 sample reviews modeled after Taha's style).

## Project Structure

```
dining-taha-web/
├── app/
│   ├── api/
│   │   ├── scrape-new/route.ts  # Main scraping API with caching
│   │   └── analyze/route.ts     # Data analysis API endpoint
│   ├── page.tsx                 # Main dashboard page
│   └── layout.tsx               # Root layout with metadata
├── components/
│   ├── RatingDistribution.tsx   # Bar chart for rating distribution
│   ├── WordCloud.tsx            # Word frequency visualization
│   └── RestaurantMap.tsx        # Interactive map component
├── lib/
│   ├── instagram-fetch.ts       # Instagram public API scraper (no login)
│   ├── database.ts              # JSON-based persistent storage
│   ├── review-parser.ts         # Data parsing and analysis logic
│   └── sample-data.ts           # Sample Instagram posts
├── data/
│   └── reviews.json             # Persistent cache (auto-generated)
└── README.md
```

## How It Works

### 1. Data Extraction

The scraper visits the Instagram profile and extracts post captions using Puppeteer:
- Scrolls through the profile to load posts
- Visits each post to extract full captions
- Returns structured data with timestamps

### 2. Parsing Reviews

Each caption is parsed to extract:
- **Restaurant handle**: `@bobabloom_`
- **Rating**: `9.3/10`
- **Location**: `RG1` (postcode)
- **Items**: Dishes mentioned with emoji bullets
- **Approval status**: Checks for "APPROVED" tag

### 3. Statistical Analysis

- **Average/Median/Mode**: Basic statistical measures
- **Distribution**: Count of reviews at each rating level
- **Adjusted Score**: Z-score normalization to show how each rating compares to Taha's average
- **Restaurant Stats**: Aggregates multiple visits to the same restaurant

### 4. Sentiment Analysis

- Analyzes word frequency across all reviews
- Classifies words as positive, negative, or neutral
- Identifies common themes and patterns

## Customization

### Adding More Sentiment Words

Edit `/lib/review-parser.ts` and add words to `POSITIVE_WORDS` or `NEGATIVE_WORDS`:

```typescript
const POSITIVE_WORDS = new Set([
  'amazing', 'perfect', 'delicious',
  // Add your words here
]);
```

### Adjusting Parsing Patterns

Modify the regex patterns in `parseReview()` to match different review formats:

```typescript
const ratingMatch = caption.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
```

### Geocoding Restaurant Locations

To show real locations on the map, integrate a geocoding service:

1. Sign up for Google Maps API or OpenStreetMap Nominatim
2. Create a geocoding function in `/lib/geocode.ts`
3. Convert postcodes to lat/lng coordinates
4. Update `RestaurantMap` component with real coordinates

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

**Note**: Puppeteer may require additional configuration on serverless platforms. Consider using Instagram's official API or manual data import for production.

## Future Enhancements

- Export data to CSV/Excel
- Advanced filtering (by date, location, rating range)
- Comparison charts (how ratings change over time)
- Restaurant recommendation engine
- Integration with Google Maps for directions
- Mobile app version
- Email notifications for new reviews

## Privacy & Legal

This tool is for personal use only. Respect Instagram's Terms of Service and robots.txt. The scraping functionality should only be used on your own account or with explicit permission. For public deployment, use Instagram's official API or manual data export.

## License

MIT License - feel free to use this for your own food blogging analytics!

## Author

Built for Taha, the food blogger behind [@diningwithtaha](https://www.instagram.com/diningwithtaha/)

---

**Bon Appétit!**
