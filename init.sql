-- Create enum type for user groups
CREATE TYPE user_group AS ENUM ('user', 'admin', 'superadmin');

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    user_group user_group NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (username, user_group) VALUES
    ('alice',   'superadmin'),
    ('bob',     'admin'),
    ('charlie', 'user'),
    ('diana',   'admin'),
    ('eve',     'user');
