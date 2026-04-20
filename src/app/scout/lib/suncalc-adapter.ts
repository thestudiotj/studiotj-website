import SunCalc from 'suncalc';
import type { SunTimes } from './types';

export function getSunTimes(lat: number, lng: number, date: Date): SunTimes {
  const t = SunCalc.getTimes(date, lat, lng);
  return {
    sunrise: t.sunrise,
    sunset: t.sunset,
    goldenHourMorningStart: t.sunrise,
    goldenHourMorningEnd: t.goldenHourEnd,
    goldenHourEveningStart: t.goldenHour,
    goldenHourEveningEnd: t.sunset,
    blueMorningStart: t.nauticalDawn,
    blueMorningEnd: t.dawn,
    blueEveningStart: t.dusk,
    blueEveningEnd: t.nauticalDusk,
  };
}
