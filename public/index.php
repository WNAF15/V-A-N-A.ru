<?php

$projectRoot = dirname(__DIR__);
require_once $projectRoot . '/app/Core/Env.php';
\App\Core\Env::load($projectRoot . '/.env');

$debug = getenv('APP_DEBUG') === '1';
ini_set('display_errors', $debug ? '1' : '0');
ini_set('display_startup_errors', $debug ? '1' : '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../app/';
    $prefixLength = strlen($prefix);
    if (strncmp($prefix, $class, $prefixLength) !== 0) return;
    $relative = substr($class, $prefixLength);
    $file = $baseDir . str_replace('\\', '/', $relative) . '.php';
    if (is_file($file)) require $file;
});

use App\Core\Auth;
use App\Core\Database;
use App\Core\Metrics;
use App\Core\Router;

Metrics::start();
register_shutdown_function([Metrics::class, 'finish']);

$config = require __DIR__ . '/../app/Config/database.php';
foreach (['host', 'dbname', 'user', 'password'] as $requiredKey) {
    if (!isset($config[$requiredKey]) || $config[$requiredKey] === '') {
        http_response_code(500);
        error_log('NAVA configuration error: missing database environment variables.');
        exit('Сервис временно недоступен. Проверьте конфигурацию сервера.');
    }
}

Database::init($config['host'], $config['dbname'], $config['user'], $config['password']);
Auth::init();

$router = new Router();
require __DIR__ . '/../app/Routes/web.php';
require __DIR__ . '/../app/Routes/api.php';
$router->dispatch($_SERVER['REQUEST_URI'] ?? '/', $_SERVER['REQUEST_METHOD'] ?? 'GET');
