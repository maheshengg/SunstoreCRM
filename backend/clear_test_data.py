"""
Clear Test Data Script for SUNSTORE KOLHAPUR CRM
Run this to remove all test data from the database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def clear_all_data():
    """Clear all existing data"""
    print("=" * 60)
    print("SUNSTORE KOLHAPUR CRM - Clear Test Data")
    print("=" * 60)
    print("\n⚠️  WARNING: This will delete ALL data from the database!")
    print("\nCollections to be cleared:")
    
    collections = ['users', 'parties', 'items', 'leads', 'quotations', 
                   'proforma_invoices', 'soa', 'document_logs', 'settings']
    
    # Show current counts
    for collection in collections:
        count = await db[collection].count_documents({})
        print(f"   - {collection}: {count} documents")
    
    print("\n🗑️  Clearing all data...")
    for collection in collections:
        await db[collection].delete_many({})
    
    print("✓ All data cleared successfully!")
    
    # Verify
    print("\n📊 Database is now empty:")
    for collection in collections:
        count = await db[collection].count_documents({})
        print(f"   - {collection}: {count} documents")
    
    print("\n✅ Database cleared successfully!")
    print("=" * 60)

async def main():
    try:
        await clear_all_data()
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
