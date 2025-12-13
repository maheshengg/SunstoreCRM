"""
Export Items and Parties data to CSV files
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import csv
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def export_parties():
    """Export parties to CSV"""
    print("📤 Exporting Parties to CSV...")
    
    parties = await db.parties.find({}, {"_id": 0}).to_list(1000)
    
    if not parties:
        print("⚠️  No parties found")
        return
    
    # Define CSV columns
    fieldnames = ["party_id", "party_name", "address", "city", "state", "pincode", 
                  "GST_number", "contact_person", "mobile", "email", "status"]
    
    with open('/app/backend/parties_export.csv', 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for party in parties:
            # Filter to only include defined fields
            row = {k: party.get(k, '') for k in fieldnames}
            writer.writerow(row)
    
    print(f"✓ Exported {len(parties)} parties to /app/backend/parties_export.csv")

async def export_items():
    """Export items to CSV"""
    print("\n📤 Exporting Items to CSV...")
    
    items = await db.items.find({}, {"_id": 0}).to_list(1000)
    
    if not items:
        print("⚠️  No items found")
        return
    
    # Define CSV columns
    fieldnames = ["item_id", "item_code", "item_name", "description", "UOM", 
                  "rate", "HSN", "GST_percent", "brand", "category"]
    
    with open('/app/backend/items_export.csv', 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for item in items:
            # Filter to only include defined fields
            row = {k: item.get(k, '') for k in fieldnames}
            writer.writerow(row)
    
    print(f"✓ Exported {len(items)} items to /app/backend/items_export.csv")

async def main():
    print("=" * 60)
    print("EXPORTING DATA TO CSV")
    print("=" * 60)
    
    try:
        await export_parties()
        await export_items()
        
        print("\n" + "=" * 60)
        print("✅ EXPORT COMPLETE!")
        print("=" * 60)
        print("\n📁 Files created:")
        print("   - /app/backend/parties_export.csv")
        print("   - /app/backend/items_export.csv")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
