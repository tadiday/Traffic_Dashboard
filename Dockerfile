# # Use the official MySQL image as the base
# FROM mysql:8.0

# # Set MySQL environment variables
# ENV MYSQL_ROOT_PASSWORD=P@ssw0rd1234!

# EXPOSE 3306

# Copy the SQL script into the Docker container
# COPY sim_tables.sql /docker-entrypoint-initdb.d/

FROM mysql/mysql-server:8.0

ENV MYSQL_ROOT_PASSWORD=P@ssw0rd1234!
ENV MYSQL_DATABASE=traffic_visual
ENV MYSQL_USER=simuser
ENV MYSQL_PASSWORD=simpassword

# Copy initialization scripts
COPY sim_tables.sql /docker-entrypoint-initdb.d/sim_tables.sql
COPY init_root_user.sql /docker-entrypoint-initdb.d/02_init-root-user.sql

# # Stage 1: Build the frontend
# FROM node:18 AS frontend-build
# WORKDIR /app
# COPY frontEnd/ .
# RUN npm install
# RUN npm run build

# # Stage 2: Set up MySQL
# FROM mysql/mysql-server:8.0 AS mysql
# ENV MYSQL_ROOT_PASSWORD=P@ssw0rd1234!
# ENV MYSQL_DATABASE=traffic_visual
# ENV MYSQL_USER=simuser
# ENV MYSQL_PASSWORD=simpassword
# COPY sim_tables.sql /docker-entrypoint-initdb.d/sim_tables.sql
# COPY init_root_user.sql /docker-entrypoint-initdb.d/02_init-root-user.sql

# # Stage 3: Combine everything
# FROM node:18
# WORKDIR /app

# # Copy backend files
# COPY backEnd/ ./backEnd
# RUN cd backEnd && npm install

# # Copy frontend build files
# COPY --from=frontend-build /app/build ./frontEnd/build

# # Copy MySQL initialization scripts
# COPY --from=mysql /docker-entrypoint-initdb.d /docker-entrypoint-initdb.d

# # Expose ports
# EXPOSE 3306 4625 3000

# # Start all services
# CMD bash -c "mysqld & sleep 10 && cd backEnd && node server.js & cd ../frontEnd && serve -s build -l 3000 && wait"