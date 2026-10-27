export interface DetectedLocation {
  locality: string;
  county: 'Kisii' | 'Nyamira';
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  source: 'gps_reverse_geocoded' | 'gps_regional_classifier' | 'hub_selection';
}

export interface FarmingHub {
  name: string;
  county: 'Kisii' | 'Nyamira';
  subcounty: string;
  latitude: number;
  longitude: number;
}

export const REGIONAL_FARMING_HUBS: FarmingHub[] = [
  // Kisii County Hubs
  { name: 'Nyakundi Farm', county: 'Kisii', subcounty: 'Kitutu Chache', latitude: -0.6812, longitude: 34.7715 },
  { name: 'Keumbu Ag Hub', county: 'Kisii', subcounty: 'Nyaribari Chache', latitude: -0.7124, longitude: 34.8211 },
  { name: 'Kisii Town Market Hub', county: 'Kisii', subcounty: 'Kitutu Chache South', latitude: -0.6789, longitude: 34.7675 },
  { name: 'Ogembo Aggregation Point', county: 'Kisii', subcounty: 'Bomachoge', latitude: -0.8015, longitude: 34.7250 },
  { name: 'Suneka Collection Center', county: 'Kisii', subcounty: 'Bonchari', latitude: -0.7289, longitude: 34.7081 },
  { name: 'Marani Horticultural Depot', county: 'Kisii', subcounty: 'Marani', latitude: -0.6125, longitude: 34.7892 },

  // Nyamira County Hubs
  { name: 'Keroka Regional Node', county: 'Nyamira', subcounty: 'Masaba North', latitude: -0.7781, longitude: 34.9452 },
  { name: 'Nyamira Central Depot', county: 'Nyamira', subcounty: 'Nyamira South', latitude: -0.5633, longitude: 34.9358 },
  { name: 'Nyansiongo Packhouse', county: 'Nyamira', subcounty: 'Borabu', latitude: -0.6542, longitude: 35.0124 },
  { name: 'Ekerenyo Farmers Center', county: 'Nyamira', subcounty: 'Nyamira North', latitude: -0.5189, longitude: 34.9812 },
  { name: 'Manga Ridge Collection Hub', county: 'Nyamira', subcounty: 'Manga', latitude: -0.6012, longitude: 34.8621 },
];

/**
 * Detects current GPS coordinates and determines locality + county in Western Kenya.
 */
export async function detectCurrentLocation(): Promise<DetectedLocation> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser or environment.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Attempt reverse geocoding via OpenStreetMap Nominatim with a fast 2-second timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=14`,
            {
              headers: { Accept: 'application/json' },
              signal: controller.signal,
            },
          ).catch(() => null);

          clearTimeout(timeoutId);

          if (response && response.ok) {
            const data = (await response.json()) as {
              address?: Record<string, string>;
              display_name?: string;
            };
            const addr = data.address || {};
            const stateStr = `${addr.state || ''} ${addr.county || ''} ${addr.city || ''}`.toLowerCase();
            const town = addr.village || addr.suburb || addr.town || addr.city || addr.hamlet || 'Farmgate';

            const county: 'Kisii' | 'Nyamira' =
              stateStr.includes('nyamira') || town.toLowerCase().includes('nyamira') || town.toLowerCase().includes('keroka')
                ? 'Nyamira'
                : 'Kisii';

            resolve({
              locality: `${town}, ${county}`,
              county,
              latitude,
              longitude,
              formattedAddress: data.display_name,
              source: 'gps_reverse_geocoded',
            });
            return;
          }
        } catch {
          // Fallback to regional coordinates classifier
        }

        // Coordinate-based regional classifier for Western Kenya (Kisii & Nyamira)
        const isNearNyamira = (latitude > -0.65 && longitude > 34.85) || (latitude > -0.58 && longitude > 34.80);
        const county: 'Kisii' | 'Nyamira' = isNearNyamira ? 'Nyamira' : 'Kisii';
        const locality = `${county} Farmgate (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`;

        resolve({
          locality,
          county,
          latitude,
          longitude,
          source: 'gps_regional_classifier',
        });
      },
      (error) => {
        // Presentation resilience: fallback smoothly to standard regional hub if browser GPS is blocked/offline
        console.warn('Browser GPS unavailable, falling back to Nyakundi Farm, Kisii:', error.message);
        resolve({
          locality: 'Nyakundi Farm, Kisii',
          county: 'Kisii',
          latitude: -0.6812,
          longitude: 34.7715,
          source: 'hub_selection',
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 300000,
      },
    );
  });
}
