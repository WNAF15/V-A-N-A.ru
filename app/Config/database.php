<?php

/**
 * Database credentials must be supplied by the hosting environment or
 * the private project-root .env file. Never commit production credentials.
 */
return [
    'host' => (string)(getenv('DB_HOST') ?: ''),
    'dbname' => (string)(getenv('DB_NAME') ?: ''),
    'user' => (string)(getenv('DB_USER') ?: ''),
    'password' => (string)(getenv('DB_PASSWORD') ?: ''),
];
