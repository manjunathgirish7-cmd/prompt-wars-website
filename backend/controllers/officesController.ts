import { Request, Response } from 'express';
import { verifiedOffices } from '../data/officesData.js';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function checkIsOpen(openTime: string, closeTime: string, closedDays: string[]): boolean {
  try {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];
    if (closedDays.includes(currentDay)) {
      return false;
    }
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  } catch {
    return true;
  }
}

export const getAllOffices = (req: Request, res: Response): void => {
  const { city, category, search } = req.query;

  let results = verifiedOffices.map(o => ({
    ...o,
    isOpenNow: checkIsOpen(o.openTime, o.closeTime, o.closedDays)
  }));

  if (city && typeof city === 'string' && city !== 'All') {
    results = results.filter(o => o.city.toLowerCase() === city.toLowerCase());
  }

  if (category && typeof category === 'string' && category !== 'All') {
    results = results.filter(o => o.category.toLowerCase() === category.toLowerCase());
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase();
    results = results.filter(o =>
      o.name.toLowerCase().includes(q) ||
      o.department.toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q) ||
      o.services.some(s => s.toLowerCase().includes(q))
    );
  }

  res.json(results);
};

export const getNearbyOffices = (req: Request, res: Response): void => {
  const { latitude, longitude, radius = 25 } = req.query;

  const userLat = parseFloat(latitude as string);
  const userLon = parseFloat(longitude as string);

  if (isNaN(userLat) || isNaN(userLon)) {
    // Default to central location offices
    const list = verifiedOffices.map(o => ({
      ...o,
      isOpenNow: checkIsOpen(o.openTime, o.closeTime, o.closedDays),
      distanceKm: 2.4
    }));
    res.json(list);
    return;
  }

  const officesWithDistance = verifiedOffices.map(o => {
    const distanceKm = calculateDistanceKm(userLat, userLon, o.latitude, o.longitude);
    return {
      ...o,
      distanceKm,
      isOpenNow: checkIsOpen(o.openTime, o.closeTime, o.closedDays)
    };
  });

  officesWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

  res.json(officesWithDistance);
};
