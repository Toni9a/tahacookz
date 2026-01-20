// UK Postcode and city name to coordinates mapping
// Using approximate coordinates for postcode districts and major cities
export const UK_POSTCODE_COORDS: { [key: string]: { lat: number; lng: number; area: string } } = {
  // London postcodes
  'WD24': { lat: 51.6554, lng: -0.3962, area: 'Watford' },
  'NW10': { lat: 51.5378, lng: -0.2647, area: 'Willesden' },
  'SW1': { lat: 51.4975, lng: -0.1357, area: 'Westminster' },
  'SW17': { lat: 51.4321, lng: -0.1673, area: 'Tooting' },
  'E1': { lat: 51.5155, lng: -0.0722, area: 'Whitechapel' },
  'E8': { lat: 51.5461, lng: -0.0545, area: 'Hackney' },
  'W1': { lat: 51.5154, lng: -0.1410, area: 'West End' },
  'SE1': { lat: 51.5045, lng: -0.0865, area: 'Southwark' },
  'N1': { lat: 51.5389, lng: -0.1029, area: 'Islington' },
  'EC1': { lat: 51.5239, lng: -0.1087, area: 'Clerkenwell' },
  'WC2': { lat: 51.5123, lng: -0.1217, area: 'Covent Garden' },

  // Other UK cities (postcodes)
  'RG1': { lat: 51.4542, lng: -0.9731, area: 'Reading' },
  'B1': { lat: 52.4862, lng: -1.8904, area: 'Birmingham' },
  'B9': { lat: 52.4631, lng: -1.8548, area: 'Birmingham (Bordesley)' },
  'B12': { lat: 52.4539, lng: -1.8869, area: 'Birmingham (Balsall Heath)' },
  'M1': { lat: 53.4808, lng: -2.2426, area: 'Manchester' },
  'M4': { lat: 53.4847, lng: -2.2243, area: 'Manchester (Ancoats)' },
  'LS1': { lat: 53.7999, lng: -1.5491, area: 'Leeds' },
  'BS1': { lat: 51.4545, lng: -2.5879, area: 'Bristol' },
  'L1': { lat: 53.4084, lng: -2.9916, area: 'Liverpool' },
  'NG1': { lat: 52.9548, lng: -1.1581, area: 'Nottingham' },
  'S1': { lat: 53.3811, lng: -1.4701, area: 'Sheffield' },
  'SO14': { lat: 50.9097, lng: -1.4044, area: 'Southampton' },
  'GU21': { lat: 51.3388, lng: -0.5594, area: 'Woking' },
  'UB1': { lat: 51.5074, lng: -0.3732, area: 'Southall' },

  // City names (fallback)
  'southampton': { lat: 50.9097, lng: -1.4044, area: 'Southampton' },
  'southall': { lat: 51.5074, lng: -0.3732, area: 'Southall' },
  'woking': { lat: 51.3188, lng: -0.5600, area: 'Woking' },
  'watford': { lat: 51.6554, lng: -0.3962, area: 'Watford' },
  'reading': { lat: 51.4542, lng: -0.9731, area: 'Reading' },
  'birmingham': { lat: 52.4862, lng: -1.8904, area: 'Birmingham' },
  'manchester': { lat: 53.4808, lng: -2.2426, area: 'Manchester' },
  'london': { lat: 51.5074, lng: -0.1278, area: 'London' },
  'leeds': { lat: 53.8008, lng: -1.5491, area: 'Leeds' },
  'bristol': { lat: 51.4545, lng: -2.5879, area: 'Bristol' },
  'liverpool': { lat: 53.4084, lng: -2.9916, area: 'Liverpool' },
};

export function geocodePostcode(postcode: string): { lat: number; lng: number; area: string } | null {
  if (!postcode) return null;

  // Normalize to lowercase for city name matching
  const normalized = postcode.toLowerCase().trim();

  // Try exact match first (postcode or city name)
  if (UK_POSTCODE_COORDS[postcode]) {
    return UK_POSTCODE_COORDS[postcode];
  }

  if (UK_POSTCODE_COORDS[normalized]) {
    return UK_POSTCODE_COORDS[normalized];
  }

  // Try partial match (e.g., "SW17" matches "SW1")
  const district = postcode.replace(/\d+$/, '');
  if (UK_POSTCODE_COORDS[district]) {
    return UK_POSTCODE_COORDS[district];
  }

  return null;
}
