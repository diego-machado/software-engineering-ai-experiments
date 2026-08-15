CREATE TABLE airlines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE aircraft (
    id SERIAL PRIMARY KEY,
    model VARCHAR(100) NOT NULL,
    registration VARCHAR(20) NOT NULL UNIQUE,
    airline_id INTEGER NOT NULL REFERENCES airlines(id)
);

CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    aircraft_id INTEGER NOT NULL REFERENCES aircraft(id),
    airline_id INTEGER NOT NULL REFERENCES airlines(id)
);

CREATE INDEX idx_flights_route ON flights (origin, destination, departure_time);
