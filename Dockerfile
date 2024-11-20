# Use the official MySQL image as the base
FROM mysql:8.0

# Set MySQL environment variables
ENV MYSQL_ROOT_PASSWORD=P@ssw0rd1234!

# Copy the SQL script into the Docker container
COPY sim_tables.sql /docker-entrypoint-initdb.d/
