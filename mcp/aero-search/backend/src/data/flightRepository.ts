import { db } from '../db';
import { Flight } from '../types/flight';

const FLIGHT_SELECT = `
  SELECT
    f.id,
    f.flight_number,
    f.origin,
    f.destination,
    f.departure_time,
    f.arrival_time,
    f.price,
    f.aircraft_id,
    f.airline_id,
    a.name AS airline_name,
    a.code AS airline_code,
    ac.model AS aircraft_model,
    ac.registration AS aircraft_registration
  FROM flights f
  JOIN airlines a ON a.id = f.airline_id
  JOIN aircraft ac ON ac.id = f.aircraft_id
`;

export async function findFlightsByRouteAndDate(
  origin: string,
  destination: string,
  date: string
): Promise<Flight[]> {
  return db.any<Flight>(
    `${FLIGHT_SELECT}
     WHERE f.origin = $1
       AND f.destination = $2
       AND f.departure_time >= $3::date
       AND f.departure_time < ($3::date + interval '1 day')
     ORDER BY f.departure_time`,
    [origin.toUpperCase(), destination.toUpperCase(), date]
  );
}
