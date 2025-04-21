
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

-- CREATE TABLE IF NOT EXISTS file16 (
-- 	id INT PRIMARY KEY AUTO_INCREMENT,
--     report_type INT,
--     simulation_time_sec FLOAT,
--     vehicle_id INT,
--     vehicle_class INT,
--     current_link INT,
--     current_lane INT,
--     next_link INT,
--     next_lane INT,
--     vehicle_origin_zone INT,
--     vehicle_destination_zone INT,
--     scheduled_departure_time_sec FLOAT,
--     actual_departure_time_sec FLOAT,
--     elapsed_time_sec FLOAT,
--     total_delay_sec FLOAT,
--     stopped_delay_sec FLOAT,
--     cumulative_stops INT,
--     distance_covered_km FLOAT,
--     average_speed_kmh FLOAT,
--     exit_speed_kmh FLOAT,
--     fuel_used_liters FLOAT,
--     hydrocarbon_grams FLOAT,
--     carbon_monoxide_grams FLOAT,
--     nitrous_oxide_grams FLOAT,
--     co2_grams FLOAT,
--     particulate_matter_grams FLOAT,
--     energy_used_kw FLOAT,
--     expected_crashes FLOAT,
--     expected_injury_crashes FLOAT,
--     expected_fatal_crashes FLOAT,
--     low_damage_crashes FLOAT,
--     moderate_damage_crashes FLOAT,
--     high_damage_crashes FLOAT,
--     toll_paid_dollars FLOAT,
--     acceleration_noise FLOAT,
--     UNIQUE (vehicle_id, simulation_time_sec)
-- );


-- NEW file16 TABLE
CREATE TABLE IF NOT EXISTS file16 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sim_id INT,
    report_type INT,    
    simulation_time_sec FLOAT,
    vehicle_id INT,
    vehicle_class INT,
    current_link INT,
    current_lane INT,
    next_link INT,
    next_lane INT,
    vehicle_origin_zone INT,
    vehicle_destination_zone INT,
    scheduled_departure_time_sec FLOAT,
    actual_departure_time_sec FLOAT,
    elapsed_time_sec FLOAT,
    total_delay_sec FLOAT,
    stopped_delay_sec FLOAT,
    cumulative_stops INT,
    distance_covered_km FLOAT,
    average_speed_kmh FLOAT,
    exit_speed_kmh FLOAT,
    fuel_used_liters FLOAT,
    hydrocarbon_grams FLOAT,
    carbon_monoxide_grams FLOAT,
    nitrous_oxide_grams FLOAT,
    co2_grams FLOAT,
    particulate_matter_grams FLOAT,
    energy_used_kw FLOAT,
    expected_crashes FLOAT,
    expected_injury_crashes FLOAT,
    expected_fatal_crashes FLOAT,
    low_damage_crashes FLOAT,
    moderate_damage_crashes FLOAT,
    high_damage_crashes FLOAT,
    toll_paid_dollars FLOAT,
    acceleration_noise FLOAT,
    UNIQUE (vehicle_id, simulation_time_sec, sim_id),
    FOREIGN KEY (sim_id) REFERENCES simulations(sim_id)
);

CREATE TABLE IF NOT EXISTS file10_linkflow (
    link_id INT PRIMARY KEY,
    start_node INT,
    end_node INT,
    speed_kmh INT,
    saturation INT,
    lane_num INT,
    link_length FLOAT,
    link_flow INT,
    green_time_percentage INT,
    volume_capacity_ration INT,
    total_travel_time FLOAT,
    free_travel_time FLOAT,
    average_travel_time FLOAT,
    average_speed FLOAT,
    average_num_stops INT,
    max_possible_vehicles INT,
    max_observed_vehicles INT,
    current_observed_vehicles INT
);

CREATE TABLE IF NOT EXISTS file10_ODstats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    origin_zone INT,
    destination_zone INT
    num_vehicles_departed INT,
    num_vehicles_arrived INT,
    num_vehicles_enroute INT,
    avg_trip_time FLOAT,
    sd_trip_time FLOAT,
    total_trip_time FLOAT,
    max_parked_vehicles INT,
    max_park_time INT,
    total_distance FLOAT
    UNIQUE(origin_zone, destination_zone)
);


INSERT INTO users (user_id, username, password) VALUES ('1', 'root', 'rootpass');

ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'P@ssw0rd1234!';

FLUSH PRIVILEGES;
