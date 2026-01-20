'use client';

import { WordFrequency } from '@/lib/review-parser';

interface WordCloudProps {
  words: WordFrequency[];
  limit?: number;
}

export default function WordCloud({ words, limit = 30 }: WordCloudProps) {
  const topWords = words.slice(0, limit);
  const maxCount = Math.max(...topWords.map(w => w.count));

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getFontSize = (count: number) => {
    const minSize = 12;
    const maxSize = 32;
    const size = minSize + ((count / maxCount) * (maxSize - minSize));
    return `${size}px`;
  };

  return (
    <div className="flex flex-wrap gap-3 items-center justify-center p-6 bg-gray-50 rounded-lg min-h-[300px]">
      {topWords.map((word, idx) => (
        <div
          key={idx}
          className={`font-semibold hover:scale-110 transition-transform cursor-default ${getSentimentColor(word.sentiment)}`}
          style={{ fontSize: getFontSize(word.count) }}
          title={`${word.word}: ${word.count} times`}
        >
          {word.word}
        </div>
      ))}
    </div>
  );
}
