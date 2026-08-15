import * as flightRepository from '../data/flightRepository';
import {
  DayTripCombination,
  DayTripResult,
  DayTripSearchParams,
  Flight,
  FlightSearchParams,
  FlightSearchResult,
  SearchConditions,
} from '../types/flight';

const VALID_AIRPORTS = ['FLN', 'CGH', 'GRU'];
const SAO_PAULO_AIRPORTS = ['CGH', 'GRU'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validateAirport(code: string, field: string): string {
  const upper = code.toUpperCase();
  if (!VALID_AIRPORTS.includes(upper)) {
    throw new Error(`${field} must be one of: ${VALID_AIRPORTS.join(', ')}`);
  }
  return upper;
}

function validateDate(date: string): string {
  if (!DATE_REGEX.test(date)) {
    throw new Error('date must be in YYYY-MM-DD format');
  }
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('date is invalid');
  }
  return date;
}

function validateTime(time: string, field: string): string {
  if (!TIME_REGEX.test(time)) {
    throw new Error(`${field} must be in HH:MM format (24h)`);
  }
  return time;
}

function toSaoPauloDateTime(date: string, time: string): Date {
  const [hours, minutes] = time.split(':');
  return new Date(`${date}T${hours}:${minutes}:00-03:00`);
}

function flightPrice(flight: Flight): number {
  return Number(flight.price);
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
  const origin = validateAirport(params.origin, 'origin');
  const destination = validateAirport(params.destination, 'destination');
  const date = validateDate(params.date);

  if (origin === destination) {
    throw new Error('origin and destination must be different');
  }

  const [outbound, returnFlights] = await Promise.all([
    flightRepository.findFlightsByRouteAndDate(origin, destination, date),
    flightRepository.findFlightsByRouteAndDate(destination, origin, date),
  ]);

  return {
    outbound,
    return: returnFlights,
  };
}

export async function findBestDayTrip(params: DayTripSearchParams): Promise<DayTripResult> {
  const origin = validateAirport(params.origin ?? 'FLN', 'origin');
  const date = validateDate(params.date);
  const meetingStart = validateTime(params.meetingStart ?? '10:00', 'meetingStart');
  const meetingEnd = validateTime(params.meetingEnd ?? '17:00', 'meetingEnd');
  const maxAlternatives = params.maxAlternatives ?? 5;

  if (meetingEnd <= meetingStart) {
    throw new Error('meetingEnd must be after meetingStart');
  }

  const saoPauloAirports = (params.saoPauloAirports ?? SAO_PAULO_AIRPORTS).map((airport) =>
    validateAirport(airport, 'saoPauloAirports')
  );

  const meetingStartTime = toSaoPauloDateTime(date, meetingStart);
  const meetingEndTime = toSaoPauloDateTime(date, meetingEnd);

  const combinations: DayTripCombination[] = [];

  for (const outboundDestination of saoPauloAirports) {
    const outboundFlights = await flightRepository.findFlightsByRouteAndDate(
      origin,
      outboundDestination,
      date
    );

    const validOutbound = outboundFlights.filter(
      (flight) => new Date(flight.arrival_time) <= meetingStartTime
    );

    for (const returnOrigin of saoPauloAirports) {
      const returnFlights = await flightRepository.findFlightsByRouteAndDate(
        returnOrigin,
        origin,
        date
      );

      const validReturn = returnFlights.filter(
        (flight) => new Date(flight.departure_time) >= meetingEndTime
      );

      for (const outbound of validOutbound) {
        for (const returnFlight of validReturn) {
          if (new Date(returnFlight.departure_time) <= new Date(outbound.arrival_time)) {
            continue;
          }

          combinations.push({
            outbound,
            return: returnFlight,
            totalPrice: flightPrice(outbound) + flightPrice(returnFlight),
          });
        }
      }
    }
  }

  combinations.sort((a, b) => a.totalPrice - b.totalPrice);

  return {
    date,
    meetingWindow: { start: meetingStart, end: meetingEnd },
    best: combinations[0] ?? null,
    alternatives: combinations.slice(1, maxAlternatives + 1),
    message:
      combinations.length === 0
        ? 'Nenhuma combinação ida/volta encontrada para a janela informada.'
        : undefined,
  };
}

export function getSearchConditions(): SearchConditions {
  return {
    airports: VALID_AIRPORTS,
    routes: ['FLN ↔ CGH', 'FLN ↔ GRU'],
    dateRange: { from: '2026-06-01', to: '2026-06-12' },
    pricing: {
      cghBasePrice: 650,
      gruBasePrice: 500,
      cheapWindow: '10:00–16:00 (multiplicador 0,85)',
      peakWindow: '06:00–10:00 e 16:00–22:00 (multiplicador 1,30)',
      note: 'CGH é sempre mais caro que GRU no mesmo horário.',
    },
    flightsPerDay: 16,
  };
}
