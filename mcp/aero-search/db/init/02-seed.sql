-- Airlines
INSERT INTO airlines (name, code) VALUES
    ('GOL Linhas Aéreas', 'GOL'),
    ('Azul Linhas Aéreas', 'AZU'),
    ('LATAM Airlines', 'LAT');

-- Aircraft
INSERT INTO aircraft (model, registration, airline_id) VALUES
    ('Boeing 737-800', 'PR-GUA', 1),
    ('Boeing 737-800', 'PR-GUB', 1),
    ('Airbus A320neo', 'PR-YRA', 2),
    ('Airbus A320neo', 'PR-YRB', 2),
    ('Airbus A321', 'PT-MUA', 3),
    ('Airbus A321', 'PT-MUB', 3),
    ('Boeing 737 MAX 8', 'PR-XMA', 1),
    ('Embraer E195-E2', 'PR-AXB', 2);

-- Generate flights from 2026-06-01 to 2026-06-12
DO $$
DECLARE
    flight_date DATE;
    route RECORD;
    dep_hour INT;
    dep_min INT;
    arr_hour INT;
    arr_min INT;
    dep_ts TIMESTAMPTZ;
    arr_ts TIMESTAMPTZ;
    base_price NUMERIC;
    time_multiplier NUMERIC;
    final_price NUMERIC;
    flight_num INT;
    aircraft_idx INT;
    airline_idx INT;
    flight_counter INT := 1;
BEGIN
    -- Route definitions: origin, destination, flight duration in minutes, base price (GRU=500, CGH=650)
    FOR flight_date IN SELECT generate_series('2026-06-01'::date, '2026-06-12'::date, '1 day'::interval)::date LOOP
        FOR route IN
            SELECT * FROM (VALUES
                ('FLN', 'CGH', 90, 650.00),
                ('FLN', 'GRU', 75, 500.00),
                ('CGH', 'FLN', 90, 650.00),
                ('GRU', 'FLN', 75, 500.00)
            ) AS r(origin, destination, duration_min, base_price)
        LOOP
            -- 2 flights per route per day = 8 flights/day minimum
            FOR dep_hour, dep_min IN
                SELECT * FROM (VALUES
                    (7, 0),
                    (14, 30)
                ) AS t(h, m)
            LOOP
                dep_ts := (flight_date + make_interval(hours => dep_hour, mins => dep_min)) AT TIME ZONE 'America/Sao_Paulo';
                arr_ts := dep_ts + (route.duration_min || ' minutes')::interval;

                -- Price multiplier: cheaper 10h-16h, more expensive at start/end of day
                IF dep_hour >= 10 AND dep_hour < 16 THEN
                    time_multiplier := 0.85;
                ELSIF (dep_hour >= 6 AND dep_hour < 10) OR (dep_hour >= 16 AND dep_hour < 22) THEN
                    time_multiplier := 1.30;
                ELSE
                    time_multiplier := 1.15;
                END IF;

                final_price := ROUND(route.base_price * time_multiplier, 2);

                aircraft_idx := ((flight_counter - 1) % 8) + 1;
                airline_idx := ((flight_counter - 1) % 3) + 1;

                INSERT INTO flights (
                    flight_number,
                    origin,
                    destination,
                    departure_time,
                    arrival_time,
                    price,
                    aircraft_id,
                    airline_id
                ) VALUES (
                    route.origin || route.destination || LPAD(flight_counter::text, 4, '0'),
                    route.origin,
                    route.destination,
                    dep_ts,
                    arr_ts,
                    final_price,
                    aircraft_idx,
                    airline_idx
                );

                flight_counter := flight_counter + 1;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Additional flights to reach richer schedule (4 per route = 16/day)
DO $$
DECLARE
    flight_date DATE;
    route RECORD;
    dep_hour INT;
    dep_min INT;
    dep_ts TIMESTAMPTZ;
    arr_ts TIMESTAMPTZ;
    time_multiplier NUMERIC;
    final_price NUMERIC;
    flight_counter INT;
    aircraft_idx INT;
    airline_idx INT;
BEGIN
    SELECT COALESCE(MAX(id), 0) + 1 INTO flight_counter FROM flights;

    FOR flight_date IN SELECT generate_series('2026-06-01'::date, '2026-06-12'::date, '1 day'::interval)::date LOOP
        FOR route IN
            SELECT * FROM (VALUES
                ('FLN', 'CGH', 90, 650.00),
                ('FLN', 'GRU', 75, 500.00),
                ('CGH', 'FLN', 90, 650.00),
                ('GRU', 'FLN', 75, 500.00)
            ) AS r(origin, destination, duration_min, base_price)
        LOOP
            FOR dep_hour, dep_min IN
                SELECT * FROM (VALUES
                    (9, 30),
                    (18, 0)
                ) AS t(h, m)
            LOOP
                dep_ts := (flight_date + make_interval(hours => dep_hour, mins => dep_min)) AT TIME ZONE 'America/Sao_Paulo';
                arr_ts := dep_ts + (route.duration_min || ' minutes')::interval;

                IF dep_hour >= 10 AND dep_hour < 16 THEN
                    time_multiplier := 0.85;
                ELSIF (dep_hour >= 6 AND dep_hour < 10) OR (dep_hour >= 16 AND dep_hour < 22) THEN
                    time_multiplier := 1.30;
                ELSE
                    time_multiplier := 1.15;
                END IF;

                final_price := ROUND(route.base_price * time_multiplier, 2);

                aircraft_idx := ((flight_counter - 1) % 8) + 1;
                airline_idx := ((flight_counter - 1) % 3) + 1;

                INSERT INTO flights (
                    flight_number,
                    origin,
                    destination,
                    departure_time,
                    arrival_time,
                    price,
                    aircraft_id,
                    airline_id
                ) VALUES (
                    route.origin || route.destination || LPAD(flight_counter::text, 4, '0'),
                    route.origin,
                    route.destination,
                    dep_ts,
                    arr_ts,
                    final_price,
                    aircraft_idx,
                    airline_idx
                );

                flight_counter := flight_counter + 1;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
