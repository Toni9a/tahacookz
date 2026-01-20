import fs from 'fs';
import path from 'path';

export interface DBPost {
  id: string;
  caption: string;
  timestamp: string;
  likes?: number;
  mediaUrl?: string;
  scrapedAt: string;
}

const DB_FILE = path.join(process.cwd(), 'data', 'reviews.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read all posts from JSON file
function readPosts(): DBPost[] {
  ensureDataDir();

  if (!fs.existsSync(DB_FILE)) {
    return [];
  }

  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data) as DBPost[];
  } catch (error) {
    console.error('Error reading posts file:', error);
    return [];
  }
}

// Write posts to JSON file
function writePosts(posts: DBPost[]) {
  ensureDataDir();

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(posts, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing posts file:', error);
    throw error;
  }
}

export function savePost(post: DBPost) {
  const posts = readPosts();
  const index = posts.findIndex(p => p.id === post.id);

  if (index >= 0) {
    posts[index] = post;
  } else {
    posts.push(post);
  }

  writePosts(posts);
}

export function savePosts(newPosts: DBPost[]) {
  const existingPosts = readPosts();
  const postsMap = new Map(existingPosts.map(p => [p.id, p]));

  // Merge new posts (replace duplicates)
  for (const post of newPosts) {
    postsMap.set(post.id, post);
  }

  const allPosts = Array.from(postsMap.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  writePosts(allPosts);
}

export function getAllPosts(): DBPost[] {
  return readPosts();
}

export function getPostCount(): number {
  return readPosts().length;
}

export function getLatestPostTimestamp(): string | null {
  const posts = readPosts();
  return posts.length > 0 ? posts[0].timestamp : null;
}

export function clearAllPosts() {
  writePosts([]);
}
