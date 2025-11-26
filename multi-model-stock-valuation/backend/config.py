"""
Configuration settings for the Multi-Model Stock Valuation Tool
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')

    # API Configuration
    API_RATE_LIMIT = int(os.getenv('API_RATE_LIMIT', 100))
    CACHE_TIMEOUT = int(os.getenv('CACHE_TIMEOUT', 3600))  # 1 hour

    # Database Configuration
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///valuations.db')

    # Yahoo Finance Configuration
    YF_TIMEOUT = 30
    YF_MAX_RETRIES = 3

    # Model Configuration
    DEFAULT_PROJECTION_YEARS = 5
    DEFAULT_TERMINAL_GROWTH = 0.025  # 2.5%
    RISK_FREE_RATE = 0.045  # 4.5% - update periodically
    MARKET_RISK_PREMIUM = 0.08  # 8%

    # Data Quality Thresholds
    MIN_DATA_QUALITY_SCORE = 50  # Minimum score to proceed with valuation

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    FLASK_ENV = 'production'

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])
