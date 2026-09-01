#!/usr/bin/env python
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Crear la conexión directamente sin leer .env
DATABASE_URL = 'postgresql://postgres:admin@localhost:5432/ved_system'
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
Base = declarative_base()
from app.models.usuario import Usuario
from app.models.ciudad import Ciudad
from app.models.producto import Producto
from app.models.referencia import Referencia
from app.models.color import Color
from app.models.pedido import Pedido, DetallePedido
from app.models.movimiento import Movimiento, DetalleMovimiento

def test_connection():
    """Prueba la conexión a la base de datos"""
    try:
        connection = engine.connect()
        print("✅ Conexión a PostgreSQL exitosa")
        connection.close()
        return True
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def create_tables():
    """Crea todas las tablas en la base de datos"""
    try:
        print("\n📦 Creando tablas en la base de datos...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas exitosamente")
        return True
    except Exception as e:
        print(f"❌ Error al crear tablas: {e}")
        return False

def verify_tables():
    """Verifica que las tablas fueron creadas"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print("\n📋 Tablas encontradas:")
        for table in tables:
            print(f"   - {table}")
        
        if tables:
            print(f"✅ Se encontraron {len(tables)} tablas")
            return True
        else:
            print("❌ No se encontraron tablas")
            return False
    except Exception as e:
        print(f"❌ Error al verificar tablas: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Verificando base de datos...\n")
    
    if test_connection():
        if create_tables():
            verify_tables()
    else:
        print("\n❌ No se puede proceder sin conexión a la base de datos")
        sys.exit(1)
