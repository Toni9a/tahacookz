'use client';

import { useState } from 'react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import PostAssist from '@/components/PostAssist';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'assist'>('analytics');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Dining with Taha</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Review Analytics & Notes</p>
            </div>
            <a
              href="https://www.instagram.com/diningwithtaha/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-medium shrink-0"
            >
              @diningwithtaha
            </a>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">📊 </span>Analytics
            </button>
            <button
              onClick={() => setActiveTab('assist')}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'assist'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">✍️ </span>Notes
            </button>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {activeTab === 'analytics' ? <AnalyticsDashboard /> : <PostAssist />}
      </main>
    </div>
  );
}
