"""
Test Data Population Script for SUNSTORE KOLHAPUR CRM
Run this to populate the database with sample data for testing
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def clear_all_data():
    """Clear all existing data"""
    print("🗑️  Clearing existing data...")
    collections = ['users', 'parties', 'items', 'leads', 'quotations', 'proforma_invoices', 'soa', 'document_logs', 'settings']
    for collection in collections:
        await db[collection].delete_many({})
    print("✓ All data cleared")

async def create_users():
    """Create test users"""
    print("\n👥 Creating users...")
    
    users = [
        {
            "user_id": "USR0001",
            "name": "Admin User",
            "email": "admin@sunstore.com",
            "mobile": "9876543210",
            "role": "Admin",
            "password_hashed": pwd_context.hash("admin123"),
            "status": "Active"
        },
        {
            "user_id": "USR0002",
            "name": "Rajesh Kumar",
            "email": "rajesh@sunstore.com",
            "mobile": "9876543211",
            "role": "Sales User",
            "password_hashed": pwd_context.hash("sales123"),
            "status": "Active"
        },
        {
            "user_id": "USR0003",
            "name": "Priya Sharma",
            "email": "priya@sunstore.com",
            "mobile": "9876543212",
            "role": "Sales User",
            "password_hashed": pwd_context.hash("sales123"),
            "status": "Active"
        }
    ]
    
    await db.users.insert_many(users)
    print(f"✓ Created {len(users)} users")
    print("  - admin@sunstore.com / admin123 (Admin)")
    print("  - rajesh@sunstore.com / sales123 (Sales User)")
    print("  - priya@sunstore.com / sales123 (Sales User)")

async def create_parties():
    """Create test parties"""
    print("\n🏢 Creating parties...")
    
    parties = [
        {
            "party_id": "PTY0001",
            "party_name": "ABC Engineering Works",
            "address": "123 Industrial Estate, MIDC",
            "city": "Kolhapur",
            "state": "Maharashtra",
            "pincode": "416001",
            "GST_number": "27AABCA1234A1Z1",
            "contact_person": "Suresh Patil",
            "mobile": "9823456789",
            "email": "suresh@abceng.com",
            "status": "Active"
        },
        {
            "party_id": "PTY0002",
            "party_name": "XYZ Manufacturing Ltd",
            "address": "Plot 45, Shiroli Industrial Area",
            "city": "Kolhapur",
            "state": "Maharashtra",
            "pincode": "416122",
            "GST_number": "27AABCX5678B1Z2",
            "contact_person": "Ramesh Desai",
            "mobile": "9834567890",
            "email": "ramesh@xyzmfg.com",
            "status": "Active"
        },
        {
            "party_id": "PTY0003",
            "party_name": "PQR Industries Pvt Ltd",
            "address": "Gala No 12, Udyamnagar",
            "city": "Kolhapur",
            "state": "Maharashtra",
            "pincode": "416005",
            "GST_number": "27AAPCP9012C1Z3",
            "contact_person": "Vijay Kulkarni",
            "mobile": "9845678901",
            "email": "vijay@pqrind.com",
            "status": "Active"
        },
        {
            "party_id": "PTY0004",
            "party_name": "LMN Traders",
            "address": "Shop 7, Market Yard",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "411001",
            "GST_number": "27AATLM3456D1Z4",
            "contact_person": "Anil Joshi",
            "mobile": "9856789012",
            "email": "anil@lmntraders.com",
            "status": "Active"
        },
        {
            "party_id": "PTY0005",
            "party_name": "RST Engineering Solutions",
            "address": "Plot 88, Kagal MIDC",
            "city": "Kagal",
            "state": "Karnataka",
            "pincode": "591213",
            "GST_number": "29AARST7890E1Z5",
            "contact_person": "Santosh Naik",
            "mobile": "9867890123",
            "email": "santosh@rsteng.com",
            "status": "Active"
        }
    ]
    
    await db.parties.insert_many(parties)
    print(f"✓ Created {len(parties)} parties")

async def create_items():
    """Create test items"""
    print("\n📦 Creating items...")
    
    items = [
        {
            "item_id": "ITM0001",
            "item_code": "BRG-6205",
            "item_name": "Ball Bearing 6205",
            "description": "Deep groove ball bearing",
            "UOM": "Nos",
            "rate": 150.00,
            "HSN": "84821000",
            "GST_percent": 18.0,
            "brand": "SKF",
            "category": "Bearings"
        },
        {
            "item_id": "ITM0002",
            "item_code": "BRG-6206",
            "item_name": "Ball Bearing 6206",
            "description": "Deep groove ball bearing",
            "UOM": "Nos",
            "rate": 180.00,
            "HSN": "84821000",
            "GST_percent": 18.0,
            "brand": "SKF",
            "category": "Bearings"
        },
        {
            "item_id": "ITM0003",
            "item_code": "BLT-M12",
            "item_name": "Hex Bolt M12x50",
            "description": "High tensile hex bolt",
            "UOM": "Nos",
            "rate": 25.00,
            "HSN": "73181500",
            "GST_percent": 18.0,
            "brand": "Unbrako",
            "category": "Fasteners"
        },
        {
            "item_id": "ITM0004",
            "item_code": "NUT-M12",
            "item_name": "Hex Nut M12",
            "description": "Heavy hex nut",
            "UOM": "Nos",
            "rate": 15.00,
            "HSN": "73181600",
            "GST_percent": 18.0,
            "brand": "Unbrako",
            "category": "Fasteners"
        },
        {
            "item_id": "ITM0005",
            "item_code": "WSH-M12",
            "item_name": "Spring Washer M12",
            "description": "Spring lock washer",
            "UOM": "Nos",
            "rate": 8.00,
            "HSN": "73182100",
            "GST_percent": 18.0,
            "brand": "Generic",
            "category": "Fasteners"
        },
        {
            "item_id": "ITM0006",
            "item_code": "PLY-6MM",
            "item_name": "Plywood 6mm",
            "description": "Commercial grade plywood",
            "UOM": "Sheet",
            "rate": 1200.00,
            "HSN": "44121000",
            "GST_percent": 18.0,
            "brand": "Century",
            "category": "Wood"
        },
        {
            "item_id": "ITM0007",
            "item_code": "WRE-1.5MM",
            "item_name": "Copper Wire 1.5mm",
            "description": "Single core copper wire",
            "UOM": "Meter",
            "rate": 12.00,
            "HSN": "85444900",
            "GST_percent": 18.0,
            "brand": "Polycab",
            "category": "Electrical"
        },
        {
            "item_id": "ITM0008",
            "item_code": "PNT-10L",
            "item_name": "Enamel Paint 10L",
            "description": "Exterior enamel paint",
            "UOM": "Can",
            "rate": 2500.00,
            "HSN": "32089090",
            "GST_percent": 18.0,
            "brand": "Asian Paints",
            "category": "Paints"
        },
        {
            "item_id": "ITM0009",
            "item_code": "PIP-2IN",
            "item_name": "PVC Pipe 2 inch",
            "description": "PVC pressure pipe",
            "UOM": "Meter",
            "rate": 85.00,
            "HSN": "39172900",
            "GST_percent": 18.0,
            "brand": "Supreme",
            "category": "Plumbing"
        },
        {
            "item_id": "ITM0010",
            "item_code": "VAL-2IN",
            "item_name": "Ball Valve 2 inch",
            "description": "Brass ball valve",
            "UOM": "Nos",
            "rate": 450.00,
            "HSN": "84813000",
            "GST_percent": 18.0,
            "brand": "Jaquar",
            "category": "Plumbing"
        }
    ]
    
    await db.items.insert_many(items)
    print(f"✓ Created {len(items)} items")

async def create_leads():
    """Create test leads"""
    print("\n📋 Creating leads...")
    
    base_date = datetime.now(timezone.utc)
    
    leads = [
        {
            "lead_id": "LEAD0001",
            "party_id": "PTY0001",
            "contact_name": "Suresh Patil",
            "requirement_summary": "Need bearings for new machinery installation - 50 units of 6205 and 6206",
            "referred_by": "Trade Fair",
            "notes": "Urgent requirement, customer wants delivery in 2 weeks",
            "created_by_user_id": "USR0002",
            "lead_date": (base_date - timedelta(days=5)).isoformat(),
            "status": "Open"
        },
        {
            "lead_id": "LEAD0002",
            "party_id": "PTY0002",
            "contact_name": "Ramesh Desai",
            "requirement_summary": "Fasteners bulk order for maintenance work",
            "referred_by": "Existing Customer",
            "notes": "Regular customer, monthly order",
            "created_by_user_id": "USR0002",
            "lead_date": (base_date - timedelta(days=3)).isoformat(),
            "status": "Converted"
        },
        {
            "lead_id": "LEAD0003",
            "party_id": "PTY0003",
            "contact_name": "Vijay Kulkarni",
            "requirement_summary": "Electrical wiring materials for factory expansion",
            "referred_by": "Website Inquiry",
            "notes": "New customer, price sensitive",
            "created_by_user_id": "USR0003",
            "lead_date": (base_date - timedelta(days=7)).isoformat(),
            "status": "Open"
        },
        {
            "lead_id": "LEAD0004",
            "party_id": "PTY0004",
            "contact_name": "Anil Joshi",
            "requirement_summary": "Plumbing materials for residential project",
            "referred_by": "Phone Call",
            "notes": "Wants site visit before finalizing",
            "created_by_user_id": "USR0003",
            "lead_date": (base_date - timedelta(days=2)).isoformat(),
            "status": "Open"
        }
    ]
    
    await db.leads.insert_many(leads)
    print(f"✓ Created {len(leads)} leads")

async def create_quotations():
    """Create test quotations"""
    print("\n📄 Creating quotations...")
    
    base_date = datetime.now(timezone.utc)
    
    quotations = [
        {
            "quotation_id": "QTN0001",
            "quotation_no": "QTN0001",
            "party_id": "PTY0002",
            "reference_lead_id": "LEAD0002",
            "date": (base_date - timedelta(days=2)).isoformat(),
            "validity_days": 30,
            "payment_terms": "30 days credit after delivery",
            "delivery_terms": "Ex-Warehouse Kolhapur",
            "remarks": "Prices subject to change without notice",
            "created_by_user_id": "USR0002",
            "items": [
                {
                    "item_id": "ITM0003",
                    "qty": 100,
                    "rate": 25.00,
                    "discount_percent": 5.0,
                    "taxable_amount": 2375.00,
                    "tax_type": "CGST+SGST",
                    "tax_amount": 427.50,
                    "total_amount": 2802.50
                },
                {
                    "item_id": "ITM0004",
                    "qty": 100,
                    "rate": 15.00,
                    "discount_percent": 5.0,
                    "taxable_amount": 1425.00,
                    "tax_type": "CGST+SGST",
                    "tax_amount": 256.50,
                    "total_amount": 1681.50
                },
                {
                    "item_id": "ITM0005",
                    "qty": 100,
                    "rate": 8.00,
                    "discount_percent": 5.0,
                    "taxable_amount": 760.00,
                    "tax_type": "CGST+SGST",
                    "tax_amount": 136.80,
                    "total_amount": 896.80
                }
            ]
        },
        {
            "quotation_id": "QTN0002",
            "quotation_no": "QTN0002",
            "party_id": "PTY0001",
            "reference_lead_id": None,
            "date": (base_date - timedelta(days=1)).isoformat(),
            "validity_days": 15,
            "payment_terms": "Advance payment",
            "delivery_terms": "Door delivery",
            "remarks": "Urgent order",
            "created_by_user_id": "USR0002",
            "items": [
                {
                    "item_id": "ITM0001",
                    "qty": 50,
                    "rate": 150.00,
                    "discount_percent": 10.0,
                    "taxable_amount": 6750.00,
                    "tax_type": "CGST+SGST",
                    "tax_amount": 1215.00,
                    "total_amount": 7965.00
                },
                {
                    "item_id": "ITM0002",
                    "qty": 50,
                    "rate": 180.00,
                    "discount_percent": 10.0,
                    "taxable_amount": 8100.00,
                    "tax_type": "CGST+SGST",
                    "tax_amount": 1458.00,
                    "total_amount": 9558.00
                }
            ]
        }
    ]
    
    await db.quotations.insert_many(quotations)
    print(f"✓ Created {len(quotations)} quotations")

async def create_proforma_invoices():
    """Create test proforma invoices"""
    print("\n📑 Creating proforma invoices...")
    
    base_date = datetime.now(timezone.utc)
    
    proforma_invoices = [
        {
            "pi_id": "PI0001",
            "pi_no": "PI0001",
            "party_id": "PTY0002",
            "reference_document_id": "QTN0001",
            "date": base_date.isoformat(),
            "validity_days": 30,
            "payment_terms": "30 days credit after delivery",
            "delivery_terms": "Ex-Warehouse Kolhapur",
            "remarks": "As per quotation QTN0001",
            "created_by_user_id": "USR0002",
            "items": [
                {
                    "item_id": "ITM0003",
                    "qty": 100,
                    "rate": 25.00,
                    "discount_percent": 5.0,
                    "taxable_amount": 2375.00,
                    "tax_type": "CGST+SGST",
                    "tax_amount": 427.50,
                    "total_amount": 2802.50
                },
                {
                    "item_id": "ITM0004",
                    "qty": 100,
                    "rate": 15.00,
                    "discount_percent": 5.0,
                    "taxable_amount": 1425.00,
                    "tax_type": "CGST+SGST",
                    "tax_amount": 256.50,
                    "total_amount": 1681.50
                }
            ]
        }
    ]
    
    await db.proforma_invoices.insert_many(proforma_invoices)
    print(f"✓ Created {len(proforma_invoices)} proforma invoices")

async def create_soa():
    """Create test SOA"""
    print("\n📊 Creating SOA...")
    
    base_date = datetime.now(timezone.utc)
    
    soas = [
        {
            "soa_id": "SOA0001",
            "soa_no": "SOA0001",
            "party_confirmation_ID": "CONF-2024-001",
            "party_id": "PTY0002",
            "reference_document_id": "PI0001",
            "date": base_date.isoformat(),
            "terms_and_conditions": "Delivery within 15 days. Payment terms as agreed.",
            "created_by_user_id": "USR0002",
            "items": [
                {
                    "item_id": "ITM0003",
                    "qty": 100,
                    "rate": 25.00,
                    "discount_percent": 5.0,
                    "taxable_amount": 2375.00,
                    "tax_type": "CGST+SGST",
                    "tax_amount": 427.50,
                    "total_amount": 2802.50
                }
            ]
        }
    ]
    
    await db.soa.insert_many(soas)
    print(f"✓ Created {len(soas)} SOA documents")

async def create_settings():
    """Create default settings"""
    print("\n⚙️  Creating settings...")
    
    settings = {
        "settings_id": "default",
        "quotation_prefix": "QTN",
        "pi_prefix": "PI",
        "soa_prefix": "SOA",
        "payment_terms": "Payment terms: 30 days credit. Bank details: HDFC Bank, A/c: 1234567890, IFSC: HDFC0001234",
        "delivery_terms": "Delivery: Ex-warehouse Kolhapur. Transportation charges extra as applicable.",
        "terms_and_conditions": "1. Goods once sold will not be taken back.\n2. Subject to Kolhapur jurisdiction.\n3. Prices are subject to change without notice.\n4. Delivery as per stock availability."
    }
    
    await db.settings.insert_one(settings)
    print("✓ Created default settings")

async def create_document_logs():
    """Create document logs"""
    print("\n📝 Creating document logs...")
    
    base_date = datetime.now(timezone.utc)
    
    logs = [
        {
            "log_id": "LOG000001",
            "document_type": "QUOTATION",
            "document_id": "QTN0001",
            "action": "CREATED",
            "updated_by": "USR0002",
            "timestamp": (base_date - timedelta(days=2)).isoformat(),
            "version_no": 1
        },
        {
            "log_id": "LOG000002",
            "document_type": "QUOTATION",
            "document_id": "QTN0002",
            "action": "CREATED",
            "updated_by": "USR0002",
            "timestamp": (base_date - timedelta(days=1)).isoformat(),
            "version_no": 1
        },
        {
            "log_id": "LOG000003",
            "document_type": "PROFORMA_INVOICE",
            "document_id": "PI0001",
            "action": "CREATED_FROM_QUOTATION",
            "updated_by": "USR0002",
            "timestamp": base_date.isoformat(),
            "version_no": 1
        },
        {
            "log_id": "LOG000004",
            "document_type": "SOA",
            "document_id": "SOA0001",
            "action": "CREATED_FROM_PI",
            "updated_by": "USR0002",
            "timestamp": base_date.isoformat(),
            "version_no": 1
        }
    ]
    
    await db.document_logs.insert_many(logs)
    print(f"✓ Created {len(logs)} document logs")

async def main():
    print("=" * 60)
    print("SUNSTORE KOLHAPUR CRM - Test Data Population")
    print("=" * 60)
    
    try:
        # Clear existing data
        await clear_all_data()
        
        # Create test data
        await create_users()
        await create_parties()
        await create_items()
        await create_leads()
        await create_quotations()
        await create_proforma_invoices()
        await create_soa()
        await create_settings()
        await create_document_logs()
        
        print("\n" + "=" * 60)
        print("✅ TEST DATA POPULATION COMPLETE!")
        print("=" * 60)
        print("\n📌 Login Credentials:")
        print("   Admin: admin@sunstore.com / admin123")
        print("   Sales: rajesh@sunstore.com / sales123")
        print("   Sales: priya@sunstore.com / sales123")
        print("\n📊 Database Summary:")
        print(f"   - Users: {await db.users.count_documents({})}")
        print(f"   - Parties: {await db.parties.count_documents({})}")
        print(f"   - Items: {await db.items.count_documents({})}")
        print(f"   - Leads: {await db.leads.count_documents({})}")
        print(f"   - Quotations: {await db.quotations.count_documents({})}")
        print(f"   - Proforma Invoices: {await db.proforma_invoices.count_documents({})}")
        print(f"   - SOA: {await db.soa.count_documents({})}")
        print(f"   - Document Logs: {await db.document_logs.count_documents({})}")
        print("\n🎉 You can now test the application!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
