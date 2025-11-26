-- Create Authentik database and user
CREATE DATABASE authentik;
CREATE USER authentik WITH ENCRYPTED PASSWORD 'authentik';
GRANT ALL PRIVILEGES ON DATABASE authentik TO authentik;

-- Connect to authentik database
\c authentik;
GRANT ALL ON SCHEMA public TO authentik;
