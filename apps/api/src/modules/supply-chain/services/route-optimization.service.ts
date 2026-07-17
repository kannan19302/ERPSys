import { Injectable } from '@nestjs/common';

interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  priority?: number;
}

interface RouteResult {
  orderedStops: Stop[];
  totalDistance: number;
  estimatedDuration: number;
}

@Injectable()
export class RouteOptimizationService {

  optimizeRoute(stops: Stop[], startLat = 0, startLng = 0): RouteResult {
    if (stops.length <= 1) {
      return { orderedStops: stops, totalDistance: 0, estimatedDuration: 0 };
    }

    // Nearest-neighbor heuristic
    const remaining = [...stops];
    const ordered: Stop[] = [];
    let currentLat = startLat;
    let currentLng = startLng;
    let totalDistance = 0;

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const stop = remaining[i]!;
        const dist = this.haversine(currentLat, currentLng, stop.lat, stop.lng);

        // Priority boost: higher priority stops get a distance reduction
        const priorityFactor = stop.priority ? 1 - (stop.priority / 100) * 0.3 : 1;
        const adjustedDist = dist * priorityFactor;

        if (adjustedDist < nearestDist) {
          nearestDist = adjustedDist;
          nearestIdx = i;
        }
      }

      const next = remaining.splice(nearestIdx, 1)[0]!;
      const realDist = this.haversine(currentLat, currentLng, next.lat, next.lng);
      totalDistance += realDist;
      currentLat = next.lat;
      currentLng = next.lng;
      ordered.push(next);
    }

    // Estimate duration: average speed 40 km/h + 15 min per stop
    const estimatedDuration = Math.round((totalDistance / 40) * 60 + ordered.length * 15);

    return {
      orderedStops: ordered,
      totalDistance: Math.round(totalDistance * 100) / 100,
      estimatedDuration,
    };
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
