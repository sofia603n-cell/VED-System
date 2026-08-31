from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import json
import os

class Settings(BaseSettings):
    DATABASE_URL: str = 'postgresql://postgres:admin123@localhost:5432/ved_system'
    SECRET_KEY: str = 'ved_super_secret_jwt_key_estrella_de_david_2026_change_in_production'
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    CORS_ORIGINS: Union[List[str], str] = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        '*'
    ]
    ENVIRONMENT: str = 'development'

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith('['):
            return [i.strip() for i in v.split(',')]
        elif isinstance(v, str) and v.startswith('['):
            try:
                return json.loads(v)
            except Exception:
                return [v]
        elif isinstance(v, list):
            return v
        return ['*']

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'),
        env_file_encoding='utf-8',
        extra='ignore'
    )

settings = Settings()
