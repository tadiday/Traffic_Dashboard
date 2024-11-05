
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

INSERT INTO users (user_id, username, password) VALUES ('1', 'root', 'rootpass');

ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'rootpass';

FLUSH PRIVILEGES;
