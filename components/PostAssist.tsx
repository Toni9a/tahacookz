'use client';

import { useState, useEffect } from 'react';

interface Place {
  id: string;
  name: string;
  location: string;
  inviteDate?: string;
  inviteScreenshot?: string;
  status: 'to-visit' | 'visited' | 'posted';
  notes: string;
  rating?: number;
  images: string[];
  visitDate?: string;
  createdAt: string;
}

const WORD_SUGGESTIONS = {
  positive: [
    'amazing', 'incredible', 'fantastic', 'perfect', 'delicious', 'phenomenal',
    'outstanding', 'exceptional', 'divine', 'heavenly', 'addictive', 'fire',
    'dangerous', 'proper', 'elite', 'unreal', 'crispy', 'juicy', 'tender',
    'fluffy', 'creamy', 'rich', 'fresh', 'piping hot', 'perfectly cooked'
  ],
  negative: [
    'disappointing', 'bland', 'dry', 'soggy', 'cold', 'overcooked',
    'undercooked', 'burnt', 'greasy', 'salty', 'bitter', 'stale'
  ],
  descriptive: [
    'generous portion', 'well seasoned', 'beautifully presented', 'perfectly balanced',
    'melt in your mouth', 'full of flavor', 'authentic', 'spot on', 'bold flavors',
    'sticky', 'glazed', 'charred', 'loaded', 'indulgent', 'satisfying'
  ],
  structure: [
    'Starting with...', 'For mains...', 'For sides...', 'To drink...', 'For dessert...',
    'The standout was...', 'Highlights:', 'Must try:', 'Overall:', 'Verdict:'
  ]
};

export default function PostAssist() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filter, setFilter] = useState<'all' | 'to-visit' | 'visited' | 'posted'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('taha-places');
    if (saved) {
      setPlaces(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (places.length > 0) {
      localStorage.setItem('taha-places', JSON.stringify(places));
    }
  }, [places]);

  const addPlace = (place: Omit<Place, 'id' | 'createdAt'>) => {
    const newPlace: Place = {
      ...place,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setPlaces([newPlace, ...places]);
    setShowAddModal(false);
  };

  const updatePlace = (id: string, updates: Partial<Place>) => {
    setPlaces(places.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePlace = (id: string) => {
    if (confirm('Delete this place?')) {
      setPlaces(places.filter(p => p.id !== id));
    }
  };

  const filteredPlaces = filter === 'all'
    ? places
    : places.filter(p => p.status === filter);

  const stats = {
    toVisit: places.filter(p => p.status === 'to-visit').length,
    visited: places.filter(p => p.status === 'visited').length,
    posted: places.filter(p => p.status === 'posted').length,
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Places</h3>
          <p className="text-3xl font-bold text-purple-600">{places.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">To Visit</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.toVisit}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Drafts (Visited)</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.visited}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Posted</h3>
          <p className="text-3xl font-bold text-green-600">{stats.posted}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => {
            setEditingPlace(null);
            setShowAddModal(true);
          }}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition"
        >
          + Add New Place
        </button>

        <div className="flex gap-2">
          {(['all', 'to-visit', 'visited', 'posted'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f === 'all' ? 'All' : f === 'to-visit' ? 'To Visit' : f === 'visited' ? 'Drafts' : 'Posted'}
            </button>
          ))}
        </div>
      </div>

      {/* Word Suggestions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Word Suggestions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-green-700 mb-2">Positive Words</h3>
            <div className="flex flex-wrap gap-2">
              {WORD_SUGGESTIONS.positive.map((word, i) => (
                <button
                  key={i}
                  onClick={() => navigator.clipboard.writeText(word)}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition"
                  title="Click to copy"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-blue-700 mb-2">Descriptive Phrases</h3>
            <div className="flex flex-wrap gap-2">
              {WORD_SUGGESTIONS.descriptive.map((word, i) => (
                <button
                  key={i}
                  onClick={() => navigator.clipboard.writeText(word)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition"
                  title="Click to copy"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-purple-700 mb-2">Review Structure</h3>
            <div className="flex flex-wrap gap-2">
              {WORD_SUGGESTIONS.structure.map((word, i) => (
                <button
                  key={i}
                  onClick={() => navigator.clipboard.writeText(word)}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition"
                  title="Click to copy"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Places List */}
      <div className="space-y-4">
        {filteredPlaces.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No places yet. Add one to get started!</p>
          </div>
        ) : (
          filteredPlaces.map(place => (
            <PlaceCard
              key={place.id}
              place={place}
              onUpdate={updatePlace}
              onDelete={deletePlace}
              onEdit={() => {
                setEditingPlace(place);
                setShowAddModal(true);
              }}
            />
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddPlaceModal
          place={editingPlace}
          onSave={editingPlace
            ? (updates) => {
                updatePlace(editingPlace.id, updates);
                setShowAddModal(false);
                setEditingPlace(null);
              }
            : addPlace
          }
          onClose={() => {
            setShowAddModal(false);
            setEditingPlace(null);
          }}
        />
      )}
    </div>
  );
}

function PlaceCard({
  place,
  onUpdate,
  onDelete,
  onEdit,
}: {
  place: Place;
  onUpdate: (id: string, updates: Partial<Place>) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}) {
  const statusColors = {
    'to-visit': 'border-orange-500 bg-orange-50',
    'visited': 'border-blue-500 bg-blue-50',
    'posted': 'border-green-500 bg-green-50',
  };

  return (
    <div className={`border-l-4 ${statusColors[place.status]} rounded-lg shadow-md p-6`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{place.name}</h3>
          <p className="text-sm text-gray-600">{place.location}</p>
          {place.visitDate && (
            <p className="text-xs text-gray-500 mt-1">Visited: {new Date(place.visitDate).toLocaleDateString()}</p>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={place.status}
            onChange={(e) => onUpdate(place.id, { status: e.target.value as Place['status'] })}
            className="px-3 py-1 rounded-lg border border-gray-300 text-sm"
          >
            <option value="to-visit">To Visit</option>
            <option value="visited">Visited (Draft)</option>
            <option value="posted">Posted</option>
          </select>

          <button
            onClick={onEdit}
            className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(place.id)}
            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {place.rating && (
        <div className="mb-3">
          <span className="text-3xl font-bold text-orange-600">{place.rating}/10</span>
        </div>
      )}

      {place.notes && (
        <div className="mb-4">
          <p className="text-gray-700 whitespace-pre-wrap">{place.notes}</p>
        </div>
      )}

      {place.inviteScreenshot && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Invite Screenshot:</p>
          <img src={place.inviteScreenshot} alt="Invite" className="max-w-xs rounded-lg shadow" />
        </div>
      )}

      {place.images.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Photos ({place.images.length}):</p>
          <div className="flex gap-2 flex-wrap">
            {place.images.map((img, i) => (
              <img key={i} src={img} alt={`Photo ${i + 1}`} className="w-24 h-24 object-cover rounded-lg shadow" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddPlaceModal({
  place,
  onSave,
  onClose,
}: {
  place: Place | null;
  onSave: (place: Omit<Place, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Omit<Place, 'id' | 'createdAt'>>({
    name: place?.name || '',
    location: place?.location || '',
    inviteDate: place?.inviteDate || '',
    inviteScreenshot: place?.inviteScreenshot || '',
    status: place?.status || 'to-visit',
    notes: place?.notes || '',
    rating: place?.rating,
    images: place?.images || [],
    visitDate: place?.visitDate || '',
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize speech recognition if available
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-GB';

      recognitionInstance.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setFormData(prev => ({ ...prev, notes: prev.notes + ' ' + transcript }));
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Try Chrome or Safari.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const insertWordIntoNotes = (word: string) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes ? prev.notes + ' ' + word : word
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'invite' | 'photos') => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (type === 'invite') {
          setFormData({ ...formData, inviteScreenshot: dataUrl });
        } else {
          setFormData({ ...formData, images: [...formData.images, dataUrl] });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {place ? 'Edit Place' : 'Add New Place'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Dark Burg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., NW10, Willesden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Place['status'] })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="to-visit">To Visit</option>
              <option value="visited">Visited (Draft)</option>
              <option value="posted">Posted</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invite Date</label>
              <input
                type="date"
                value={formData.inviteDate}
                onChange={(e) => setFormData({ ...formData, inviteDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visit Date</label>
              <input
                type="date"
                value={formData.visitDate}
                onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating (if visited)</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.rating || ''}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., 9.7"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Notes / Draft Review</label>
              <button
                type="button"
                onClick={toggleRecording}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isRecording ? '🎤 Recording...' : '🎤 Voice Input'}
              </button>
            </div>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Write your review draft, notes about what you ate, highlights, etc..."
            />

            {/* Word Suggestions - Visible while editing */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3">💡 Click to insert word suggestions</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-1.5">Positive</p>
                  <div className="flex flex-wrap gap-1.5">
                    {WORD_SUGGESTIONS.positive.map((word, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => insertWordIntoNotes(word)}
                        className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200 transition"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-1.5">Descriptive</p>
                  <div className="flex flex-wrap gap-1.5">
                    {WORD_SUGGESTIONS.descriptive.map((word, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => insertWordIntoNotes(word)}
                        className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-purple-700 mb-1.5">Structure</p>
                  <div className="flex flex-wrap gap-1.5">
                    {WORD_SUGGESTIONS.structure.map((word, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => insertWordIntoNotes(word)}
                        className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs hover:bg-purple-200 transition"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invite Screenshot</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'invite')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            {formData.inviteScreenshot && (
              <img src={formData.inviteScreenshot} alt="Invite" className="mt-2 max-w-xs rounded-lg shadow" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Food Photos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageUpload(e, 'photos')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            {formData.images.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {formData.images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt={`Photo ${i + 1}`} className="w-24 h-24 object-cover rounded-lg shadow" />
                    <button
                      onClick={() => setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== i) })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => {
              if (formData.name && formData.location) {
                onSave(formData);
              } else {
                alert('Please fill in restaurant name and location');
              }
            }}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            {place ? 'Update' : 'Add Place'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-3 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
