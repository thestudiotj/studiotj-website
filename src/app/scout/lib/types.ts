export type ScoutMode = 'here-now' | 'trip-to' | 'detour-to';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoLocation extends LatLng {
  accuracy: number;
  label?: string;
}

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  goldenHourMorningStart: Date;
  goldenHourMorningEnd: Date;
  goldenHourEveningStart: Date;
  goldenHourEveningEnd: Date;
  blueMorningStart: Date;
  blueMorningEnd: Date;
  blueEveningStart: Date;
  blueEveningEnd: Date;
}

export interface WeatherHour {
  time: Date;
  temperature: number;
  cloudCover: number;
  precipitationProbability: number;
  weatherCode: number;
  windSpeed: number;
}

export interface POI {
  id: string;          // Wikidata QID
  name: string;
  lat: number;
  lng: number;
  type: string;        // human-readable type label (e.g. "basilica")
  heritage: boolean;   // true iff Wikidata P1435 is present
  distanceM: number;   // haversine metres from query centre
  bearing: string;     // 8-point compass: N, NE, E, SE, S, SW, W, NW
}

export interface DriveInfo {
  straightLineKm: number;
  driveDistanceKm: number;
  durationMinutes: number;
}

export interface ScoutData {
  mode: ScoutMode;
  location: LatLng & { label: string };
  origin?: LatLng & { label: string };
  targetDate: Date;
  sunTimes: SunTimes | null;
  weather: WeatherHour[];
  pois: POI[];
  driveInfo?: DriveInfo;
}
