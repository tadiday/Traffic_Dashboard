
DROP DATABASE IF EXISTS traffic_visual;

CREATE DATABASE traffic_visual;

USE traffic_visual;

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
	user_id INT AUTO_INCREMENT PRIMARY KEY,
	username VARCHAR(50) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS simulations (
	sim_id INT AUTO_INCREMENT PRIMARY KEY,
	sim_name varchar(32),
	sim_date varchar(32),
    sim_owner INT,
    FOREIGN KEY (sim_owner) REFERENCES users(user_id),
    UNIQUE (sim_name, sim_owner)
);

CREATE TABLE IF NOT EXISTS text_files (
	file_index INT AUTO_INCREMENT UNIQUE,
	file_type INT,
	file_content LONGBLOB, -- only takes up 2 more bytes
    file_owner INT,
    file_sim INT,
    FOREIGN KEY (file_sim) REFERENCES simulations(sim_id),
	FOREIGN KEY (file_owner) REFERENCES users(user_id),
    UNIQUE (file_sim, file_type)
);

CREATE TABLE file15 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    time_simulation_produced_record DOUBLE PRECISION NOT NULL,
    vehicle_id INTEGER NOT NULL,
    vehicle_class INTEGER,
    vehicle_last_link INTEGER,
    origin_node INTEGER,
    destination_node INTEGER,
    scheduled_departure_time DOUBLE PRECISION,
    actual_departure_time DOUBLE PRECISION,
    trip_duration DOUBLE PRECISION,
    total_delay DOUBLE PRECISION,
    stopped_delay DOUBLE PRECISION,
    number_of_stops DOUBLE PRECISION,
    distance_covered DOUBLE PRECISION,
    average_speed DOUBLE PRECISION,
    fuel_used_liters DOUBLE PRECISION,
    hydrocarbon_produced DOUBLE PRECISION,
    carbon_monoxide_produced DOUBLE PRECISION,
    nitrous_oxide_produced DOUBLE PRECISION,
    co2_produced DOUBLE PRECISION,
    pm_produced DOUBLE PRECISION,
    hydrogen_consumption_kg DOUBLE PRECISION,
    expected_crashes DOUBLE PRECISION,
    injury_highest_level DOUBLE PRECISION,
    expected_fatal_crash DOUBLE PRECISION,
    max_damage_low DOUBLE PRECISION,
    max_damage_moderate DOUBLE PRECISION,
    max_damage_high DOUBLE PRECISION,
    total_toll_paid DOUBLE PRECISION,
    total_acceleration_noise DOUBLE PRECISION,
    sim_id INTEGER NOT NULL,

-- 	UNIQUE (time_simulation_produced_record, sim_id),
    FOREIGN KEY (sim_id) REFERENCES simulations(sim_id)
);


-- NEW file16 TABLE
CREATE TABLE IF NOT EXISTS file16_format21 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sim_id INT,
    report_type INT,    
    simulation_time_sec DOUBLE PRECISION,
    vehicle_id INT,
    vehicle_class INT,
    current_link INT,
    current_lane INT,
    vehicle_origin_zone INT,
    vehicle_destination_zone INT,
    scheduled_departure_time_sec DOUBLE PRECISION,
    actual_departure_time_sec DOUBLE PRECISION,
    elapsed_time_sec DOUBLE PRECISION,
    total_delay_sec DOUBLE PRECISION,
    stopped_delay_sec DOUBLE PRECISION,
    cumulative_stops INT,
    distance_covered_km DOUBLE PRECISION,
    spacing_between_vehicle DOUBLE PRECISION,
    speed_kmh DOUBLE PRECISION,
    accel_ms2 DOUBLE PRECISION,
    fuel_used_liters DOUBLE PRECISION,
	energy_rate DOUBLE PRECISION,
    hydrocarbon_grams DOUBLE PRECISION,
    carbon_monoxide_grams DOUBLE PRECISION,
    nitrous_oxide_grams DOUBLE PRECISION,
    co2_grams DOUBLE PRECISION,
    particulate_matter_grams DOUBLE PRECISION,
    expected_crashes DOUBLE PRECISION,
    expected_injury_crashes DOUBLE PRECISION,
    expected_fatal_crashes DOUBLE PRECISION,
    low_damage_crashes DOUBLE PRECISION,
    moderate_damage_crashes DOUBLE PRECISION,
    high_damage_crashes DOUBLE PRECISION,
    toll_paid_dollars DOUBLE PRECISION,
    acceleration_noise FLOAT,
    UNIQUE (vehicle_id, simulation_time_sec, sim_id),
    FOREIGN KEY (sim_id) REFERENCES simulations(sim_id)
);

CREATE TABLE IF NOT EXISTS file10_linkflow (
    link_id INT PRIMARY KEY,
    sim_id INT,
    start_node INT,
    end_node INT,
    speed_kmh INT,
    saturation INT,
    lane_num INT,
    link_length FLOAT,
    link_flow INT,
    green_time_percentage INT,
    volume_capacity_ratio INT,
    total_travel_time FLOAT,
    free_travel_time FLOAT,
    average_travel_time FLOAT,
    average_speed FLOAT,
    average_num_stops INT,
    max_possible_vehicles INT,
    max_observed_vehicles INT,
    current_observed_vehicles INT,
    FOREIGN KEY (sim_id) REFERENCES simulations(sim_id)
);

CREATE TABLE IF NOT EXISTS file10_ODstats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sim_id INT,
    origin_zone INT,
    destination_zone INT,
    num_vehicles_departed INT,
    num_vehicles_arrived INT,
    num_vehicles_enroute INT,
    avg_trip_time FLOAT,
    sd_trip_time FLOAT,
    total_trip_time FLOAT,
    max_parked_vehicles INT,
    max_park_time INT,
    total_distance FLOAT,
    UNIQUE(origin_zone, destination_zone, sim_id),
    FOREIGN KEY (sim_id) REFERENCES simulations(sim_id)
);


INSERT INTO users (user_id, username, password) VALUES ('1', 'root', 'rootpass');

-- ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'P@ssw0rd1234!';
-- GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'P@ssw0rd1234!';
-- FLUSH PRIVILEGES;