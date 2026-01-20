'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RatingDistributionProps {
  distribution: { [key: number]: number };
}

export default function RatingDistribution({ distribution }: RatingDistributionProps) {
  // Sort ratings and prepare data
  const sortedRatings = Object.keys(distribution)
    .map(Number)
    .sort((a, b) => a - b);

  const data = {
    labels: sortedRatings.map(r => r.toString()),
    datasets: [
      {
        label: 'Number of Reviews',
        data: sortedRatings.map(r => distribution[r]),
        backgroundColor: 'rgba(249, 115, 22, 0.6)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Rating Distribution',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Rating (out of 10)',
        },
      },
    },
  };

  return (
    <div className="h-[300px]">
      <Bar data={data} options={options} />
    </div>
  );
}
