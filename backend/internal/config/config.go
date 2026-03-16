package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv   string
	Port     string
	DBHost   string
	DBPort   string
	DBUser   string
	DBPass   string
	DBName   string
	RedisAddr string
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		AppEnv:    getEnv("APP_ENV", "development"),
		Port:      getEnv("PORT", "8080"),
		DBHost:    getEnv("DB_HOST", "localhost"),
		DBPort:    getEnv("DB_PORT", "5432"),
		DBUser:    getEnv("DB_USER", "bribox"),
		DBPass:    getEnv("DB_PASSWORD", "bribox_secret_2024"),
		DBName:    getEnv("DB_NAME", "bribox"),
		RedisAddr: getEnv("REDIS_ADDR", "localhost:6379"),
	}
}

func (c *Config) DatabaseURL() string {
	return "postgres://" + c.DBUser + ":" + c.DBPass + "@" + c.DBHost + ":" + c.DBPort + "/" + c.DBName + "?sslmode=disable"
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
