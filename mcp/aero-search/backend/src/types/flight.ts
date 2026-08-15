export interface Flight {
  id: number;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: Date;
  arrival_time: Date;
  price: number;
  aircraft_id: number;
  airline_id: number;
  airline_name: string;
  airline_code: string;
  aircraft_model: string;
  aircraft_registration: string;
}

export interface FlightSearchResult {
  outbound: Flight[];
  return: Flight[];
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  date: string;
}

export interface DayTripSearchParams {
  origin?: string;
  date: string;
  meetingStart?: string;
  meetingEnd?: string;
  saoPauloAirports?: string[];
  maxAlternatives?: number;
}

export interface DayTripCombination {
  outbound: Flight;
  return: Flight;
  totalPrice: number;
}

export interface DayTripResult {
  date: string;
  meetingWindow: { start: string; end: string };
  best: DayTripCombination | null;
  alternatives: DayTripCombination[];
  message?: string;
}

export interface SearchConditions {
  airports: string[];
  routes: string[];
  dateRange: { from: string; to: string };
  pricing: {
    cghBasePrice: number;
    gruBasePrice: number;
    cheapWindow: string;
    peakWindow: string;
    note: string;
  };
  flightsPerDay: number;
}
