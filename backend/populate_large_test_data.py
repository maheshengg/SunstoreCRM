"""
Large Test Data Population Script for SUNSTORE KOLHAPUR CRM
Creates comprehensive test data for thorough testing
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta
import os
import random
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
        },
        {
            "user_id": "USR0004",
            "name": "Amit Patel",
            "email": "amit@sunstore.com",
            "mobile": "9876543213",
            "role": "Sales User",
            "password_hashed": pwd_context.hash("sales123"),
            "status": "Active"
        },
        {
            "user_id": "USR0005",
            "name": "Sneha Kulkarni",
            "email": "sneha@sunstore.com",
            "mobile": "9876543214",
            "role": "Sales User",
            "password_hashed": pwd_context.hash("sales123"),
            "status": "Active"
        }
    ]
    
    await db.users.insert_many(users)
    print(f"✓ Created {len(users)} users")

async def create_parties():
    """Create 25 test parties"""
    print("\n🏢 Creating 25 parties...")
    
    cities_mh = ["Kolhapur", "Pune", "Mumbai", "Sangli", "Satara", "Ichalkaranji", "Karad"]
    cities_other = [("Bangalore", "Karnataka"), ("Belgaum", "Karnataka"), ("Hubli", "Karnataka"), 
                    ("Chennai", "Tamil Nadu"), ("Goa", "Goa")]
    
    party_types = ["Industries", "Engineering", "Traders", "Manufacturing", "Solutions", "Enterprises", "Works"]
    
    parties = []
    for i in range(1, 26):
        is_maharashtra = i <= 18  # 18 Maharashtra, 7 other states
        
        if is_maharashtra:
            city = random.choice(cities_mh)
            state = "Maharashtra"
            gst_prefix = "27"
        else:
            city, state = random.choice(cities_other)
            gst_prefix = "29" if state == "Karnataka" else ("33" if state == "Tamil Nadu" else "30")
        
        party_name = f"{chr(65 + (i % 26))}{chr(65 + ((i + 5) % 26))}{chr(65 + ((i + 10) % 26))} {random.choice(party_types)}"
        
        parties.append({
            "party_id": f"PTY{i:04d}",
            "party_name": party_name,
            "address": f"Plot {i * 10}, Industrial Estate",
            "city": city,
            "state": state,
            "pincode": f"{400000 + i * 100}",
            "GST_number": f"{gst_prefix}AAB{chr(65 + i % 26)}{1000 + i:04d}{chr(65 + (i + 3) % 26)}1Z{i % 9 + 1}",
            "contact_person": f"Contact Person {i}",
            "mobile": f"98{20000000 + i * 10000}",
            "email": f"contact{i}@{party_name.lower().replace(' ', '')}.com",
            "status": "Active"
        })
    
    await db.parties.insert_many(parties)
    print(f"✓ Created {len(parties)} parties")

async def create_items():
    """Create 60 test items"""
    print("\n📦 Creating 60 items...")
    
    items = []
    
    # Electrical Items (20)
    electrical = [
        ("WRE-1.5MM", "Copper Wire 1.5mm", "Single core copper wire", "Meter", 12.00, "85444900", 18.0, "Polycab"),
        ("WRE-2.5MM", "Copper Wire 2.5mm", "Single core copper wire", "Meter", 18.00, "85444900", 18.0, "Polycab"),
        ("WRE-4MM", "Copper Wire 4mm", "Single core copper wire", "Meter", 28.00, "85444900", 18.0, "Polycab"),
        ("CBL-3C-1.5", "3 Core Cable 1.5mm", "Flexible cable", "Meter", 35.00, "85444900", 18.0, "Havells"),
        ("CBL-3C-2.5", "3 Core Cable 2.5mm", "Flexible cable", "Meter", 52.00, "85444900", 18.0, "Havells"),
        ("CBL-4C-2.5", "4 Core Cable 2.5mm", "Flexible cable", "Meter", 68.00, "85444900", 18.0, "Havells"),
        ("MCB-16A", "MCB 16 Amp", "Miniature Circuit Breaker", "Nos", 85.00, "85363010", 18.0, "Schneider"),
        ("MCB-32A", "MCB 32 Amp", "Miniature Circuit Breaker", "Nos", 95.00, "85363010", 18.0, "Schneider"),
        ("RCCB-25A", "RCCB 25 Amp", "Residual Current Circuit Breaker", "Nos", 450.00, "85363010", 18.0, "Schneider"),
        ("RCCB-40A", "RCCB 40 Amp", "Residual Current Circuit Breaker", "Nos", 520.00, "85363010", 18.0, "Schneider"),
        ("SWT-1WAY", "Switch 1 Way", "Modular switch", "Nos", 45.00, "85365090", 18.0, "Legrand"),
        ("SWT-2WAY", "Switch 2 Way", "Modular switch", "Nos", 52.00, "85365090", 18.0, "Legrand"),
        ("SKT-6A", "Socket 6 Amp", "Modular socket", "Nos", 55.00, "85366990", 18.0, "Legrand"),
        ("SKT-16A", "Socket 16 Amp", "Modular socket", "Nos", 75.00, "85366990", 18.0, "Legrand"),
        ("LED-9W", "LED Bulb 9W", "LED lamp", "Nos", 95.00, "85395000", 18.0, "Philips"),
        ("LED-12W", "LED Bulb 12W", "LED lamp", "Nos", 125.00, "85395000", 18.0, "Philips"),
        ("TUB-20W", "LED Tube 20W", "LED tube light", "Nos", 225.00, "85395000", 18.0, "Bajaj"),
        ("TUB-40W", "LED Tube 40W", "LED tube light", "Nos", 295.00, "85395000", 18.0, "Bajaj"),
        ("FAN-1200", "Ceiling Fan 1200mm", "Ceiling fan", "Nos", 1250.00, "84145910", 18.0, "Crompton"),
        ("FAN-1400", "Ceiling Fan 1400mm", "Ceiling fan", "Nos", 1450.00, "84145910", 18.0, "Crompton"),
    ]
    
    # Plumbing Items (15)
    plumbing = [
        ("PIP-1IN", "PVC Pipe 1 inch", "PVC pressure pipe", "Meter", 55.00, "39172900", 18.0, "Supreme"),
        ("PIP-2IN", "PVC Pipe 2 inch", "PVC pressure pipe", "Meter", 85.00, "39172900", 18.0, "Supreme"),
        ("PIP-3IN", "PVC Pipe 3 inch", "PVC pressure pipe", "Meter", 125.00, "39172900", 18.0, "Supreme"),
        ("PIP-4IN", "PVC Pipe 4 inch", "PVC pressure pipe", "Meter", 185.00, "39172900", 18.0, "Supreme"),
        ("ELB-1IN", "Elbow 1 inch", "PVC elbow", "Nos", 15.00, "39174000", 18.0, "Ashirvad"),
        ("ELB-2IN", "Elbow 2 inch", "PVC elbow", "Nos", 25.00, "39174000", 18.0, "Ashirvad"),
        ("TEE-1IN", "Tee 1 inch", "PVC tee", "Nos", 18.00, "39174000", 18.0, "Ashirvad"),
        ("TEE-2IN", "Tee 2 inch", "PVC tee", "Nos", 32.00, "39174000", 18.0, "Ashirvad"),
        ("VAL-1IN", "Ball Valve 1 inch", "Brass ball valve", "Nos", 285.00, "84813000", 18.0, "Jaquar"),
        ("VAL-2IN", "Ball Valve 2 inch", "Brass ball valve", "Nos", 450.00, "84813000", 18.0, "Jaquar"),
        ("TAP-BIB", "Bib Tap", "Chrome plated tap", "Nos", 195.00, "84818090", 18.0, "Jaquar"),
        ("TAP-PIL", "Pillar Tap", "Chrome plated tap", "Nos", 225.00, "84818090", 18.0, "Jaquar"),
        ("SNK-SS", "Stainless Steel Sink", "Kitchen sink", "Nos", 2250.00, "73211190", 18.0, "Nirali"),
        ("WC-EWC", "EWC Toilet Seat", "European water closet", "Set", 4500.00, "69101000", 18.0, "Hindware"),
        ("WSH-WHB", "Wash Basin", "Wall mounted basin", "Nos", 1850.00, "69101000", 18.0, "Hindware"),
    ]
    
    # Hardware & Fasteners (15)
    hardware = [
        ("BRG-6205", "Ball Bearing 6205", "Deep groove ball bearing", "Nos", 150.00, "84821000", 18.0, "SKF"),
        ("BRG-6206", "Ball Bearing 6206", "Deep groove ball bearing", "Nos", 180.00, "84821000", 18.0, "SKF"),
        ("BRG-6207", "Ball Bearing 6207", "Deep groove ball bearing", "Nos", 220.00, "84821000", 18.0, "SKF"),
        ("BLT-M8", "Hex Bolt M8x40", "High tensile hex bolt", "Nos", 15.00, "73181500", 18.0, "Unbrako"),
        ("BLT-M10", "Hex Bolt M10x50", "High tensile hex bolt", "Nos", 20.00, "73181500", 18.0, "Unbrako"),
        ("BLT-M12", "Hex Bolt M12x60", "High tensile hex bolt", "Nos", 25.00, "73181500", 18.0, "Unbrako"),
        ("NUT-M8", "Hex Nut M8", "Heavy hex nut", "Nos", 10.00, "73181600", 18.0, "Unbrako"),
        ("NUT-M10", "Hex Nut M10", "Heavy hex nut", "Nos", 12.00, "73181600", 18.0, "Unbrako"),
        ("NUT-M12", "Hex Nut M12", "Heavy hex nut", "Nos", 15.00, "73181600", 18.0, "Unbrako"),
        ("WSH-M8", "Spring Washer M8", "Spring lock washer", "Nos", 5.00, "73182100", 18.0, "Generic"),
        ("WSH-M10", "Spring Washer M10", "Spring lock washer", "Nos", 6.00, "73182100", 18.0, "Generic"),
        ("WSH-M12", "Spring Washer M12", "Spring lock washer", "Nos", 8.00, "73182100", 18.0, "Generic"),
        ("CHN-8MM", "Chain 8mm", "Mild steel chain", "Meter", 45.00, "73151290", 18.0, "Generic"),
        ("ANK-10MM", "Anchor Bolt 10mm", "Expansion anchor", "Nos", 18.00, "73181900", 18.0, "Hilti"),
        ("ANK-12MM", "Anchor Bolt 12mm", "Expansion anchor", "Nos", 22.00, "73181900", 18.0, "Hilti"),
    ]
    
    # Building Materials (10)
    building = [
        ("PLY-6MM", "Plywood 6mm", "Commercial grade plywood", "Sheet", 1200.00, "44121000", 18.0, "Century"),
        ("PLY-9MM", "Plywood 9mm", "Commercial grade plywood", "Sheet", 1650.00, "44121000", 18.0, "Century"),
        ("PLY-12MM", "Plywood 12mm", "Commercial grade plywood", "Sheet", 2100.00, "44121000", 18.0, "Century"),
        ("PNT-5L", "Enamel Paint 5L", "Exterior enamel paint", "Can", 1450.00, "32089090", 18.0, "Asian Paints"),
        ("PNT-10L", "Enamel Paint 10L", "Exterior enamel paint", "Can", 2500.00, "32089090", 18.0, "Asian Paints"),
        ("PNT-20L", "Enamel Paint 20L", "Exterior enamel paint", "Can", 4750.00, "32089090", 18.0, "Asian Paints"),
        ("CEM-50KG", "Cement OPC 50kg", "Ordinary Portland cement", "Bag", 385.00, "25232900", 18.0, "UltraTech"),
        ("SND-CFT", "Sand", "Construction sand", "CFT", 45.00, "25051000", 18.0, "Local"),
        ("AGG-10MM", "Aggregate 10mm", "Crushed stone aggregate", "CFT", 55.00, "25171000", 18.0, "Local"),
        ("AGG-20MM", "Aggregate 20mm", "Crushed stone aggregate", "CFT", 52.00, "25171000", 18.0, "Local"),
    ]
    
    # Compile all items
    all_items_data = electrical + plumbing + hardware + building
    
    for idx, (code, name, desc, uom, rate, hsn, gst, brand) in enumerate(all_items_data, 1):
        items.append({
            "item_id": f"ITM{idx:04d}",
            "item_code": code,
            "item_name": name,
            "description": desc,
            "UOM": uom,
            "rate": rate,
            "HSN": hsn,
            "GST_percent": gst,
            "brand": brand,
            "category": "Electrical" if idx <= 20 else ("Plumbing" if idx <= 35 else ("Hardware" if idx <= 50 else "Building"))
        })
    
    await db.items.insert_many(items)
    print(f"✓ Created {len(items)} items")

async def create_leads_and_documents():
    """Create 40 leads and related documents"""
    print("\n📋 Creating 40 leads and documents...")
    
    parties = await db.parties.find({}, {"_id": 0}).to_list(25)
    items = await db.items.find({}, {"_id": 0}).to_list(60)
    users = ["USR0002", "USR0003", "USR0004", "USR0005"]
    
    base_date = datetime.now(timezone.utc)
    
    leads = []
    quotations = []
    pis = []
    soas = []
    doc_logs = []
    
    lead_count = 0
    qtn_count = 0
    pi_count = 0
    soa_count = 0
    log_count = 0
    
    for i in range(1, 41):
        party = random.choice(parties)
        user_id = random.choice(users)
        days_ago = random.randint(1, 60)
        lead_date = base_date - timedelta(days=days_ago)
        
        lead_count += 1
        lead_id = f"LEAD{lead_count:04d}"
        
        # 60% leads are converted, 30% open, 10% lost
        status = "Converted" if i <= 24 else ("Open" if i <= 36 else "Lost")
        
        leads.append({
            "lead_id": lead_id,
            "party_id": party["party_id"],
            "contact_name": party["contact_person"],
            "requirement_summary": f"Requirement for {random.choice(['electrical', 'plumbing', 'hardware', 'building'])} materials",
            "referred_by": random.choice(["Trade Fair", "Website", "Phone Call", "Existing Customer", "Referral"]),
            "notes": f"Customer inquiry dated {lead_date.strftime('%Y-%m-%d')}",
            "created_by_user_id": user_id,
            "lead_date": lead_date.isoformat(),
            "status": status
        })
        
        log_count += 1
        doc_logs.append({
            "log_id": f"LOG{log_count:06d}",
            "document_type": "LEAD",
            "document_id": lead_id,
            "action": "CREATED",
            "updated_by": user_id,
            "timestamp": lead_date.isoformat(),
            "version_no": 1
        })
        
        # Create quotation for converted leads (60%)
        if status == "Converted":
            qtn_count += 1
            qtn_id = f"QTN{qtn_count:04d}"
            qtn_no = f"QTN{qtn_count:04d}"
            qtn_date = lead_date + timedelta(days=random.randint(1, 3))
            
            # Select 2-5 random items
            selected_items = random.sample(items, random.randint(2, 5))
            qtn_items = []
            
            for item in selected_items:
                qty = random.choice([50, 100, 150, 200, 250, 500])
                rate = item["rate"]
                discount = random.choice([0, 5, 10, 15, 20])
                taxable = qty * rate * (1 - discount / 100)
                tax_type = "CGST+SGST" if party["state"] == "Maharashtra" else "IGST"
                tax_amt = taxable * (item["GST_percent"] / 100)
                
                qtn_items.append({
                    "item_id": item["item_id"],
                    "qty": qty,
                    "rate": rate,
                    "discount_percent": discount,
                    "taxable_amount": round(taxable, 2),
                    "tax_type": tax_type,
                    "tax_amount": round(tax_amt, 2),
                    "total_amount": round(taxable + tax_amt, 2)
                })
            
            quotations.append({
                "quotation_id": qtn_id,
                "quotation_no": qtn_no,
                "party_id": party["party_id"],
                "reference_lead_id": lead_id,
                "date": qtn_date.isoformat(),
                "validity_days": 30,
                "payment_terms": "30 days credit after delivery",
                "delivery_terms": "Ex-Warehouse Kolhapur",
                "remarks": "Prices subject to change",
                "created_by_user_id": user_id,
                "items": qtn_items
            })
            
            log_count += 1
            doc_logs.append({
                "log_id": f"LOG{log_count:06d}",
                "document_type": "QUOTATION",
                "document_id": qtn_id,
                "action": "CREATED",
                "updated_by": user_id,
                "timestamp": qtn_date.isoformat(),
                "version_no": 1
            })
            
            # 50% of quotations convert to PI
            if random.random() < 0.5:
                pi_count += 1
                pi_id = f"PI{pi_count:04d}"
                pi_no = f"PI{pi_count:04d}"
                pi_date = qtn_date + timedelta(days=random.randint(2, 7))
                
                pis.append({
                    "pi_id": pi_id,
                    "pi_no": pi_no,
                    "party_id": party["party_id"],
                    "reference_document_id": qtn_id,
                    "date": pi_date.isoformat(),
                    "validity_days": 30,
                    "payment_terms": "30 days credit after delivery",
                    "delivery_terms": "Ex-Warehouse Kolhapur",
                    "remarks": f"As per quotation {qtn_no}",
                    "created_by_user_id": user_id,
                    "items": qtn_items
                })
                
                log_count += 1
                doc_logs.append({
                    "log_id": f"LOG{log_count:06d}",
                    "document_type": "PROFORMA_INVOICE",
                    "document_id": pi_id,
                    "action": "CREATED_FROM_QUOTATION",
                    "updated_by": user_id,
                    "timestamp": pi_date.isoformat(),
                    "version_no": 1
                })
                
                # 30% of PIs convert to SOA
                if random.random() < 0.3:
                    soa_count += 1
                    soa_id = f"SOA{soa_count:04d}"
                    soa_no = f"SOA{soa_count:04d}"
                    soa_date = pi_date + timedelta(days=random.randint(3, 10))
                    
                    soas.append({
                        "soa_id": soa_id,
                        "soa_no": soa_no,
                        "party_confirmation_ID": f"CONF-{soa_count:04d}",
                        "party_id": party["party_id"],
                        "reference_document_id": pi_id,
                        "date": soa_date.isoformat(),
                        "terms_and_conditions": "Delivery as agreed. Payment terms as per contract.",
                        "created_by_user_id": user_id,
                        "items": qtn_items
                    })
                    
                    log_count += 1
                    doc_logs.append({
                        "log_id": f"LOG{log_count:06d}",
                        "document_type": "SOA",
                        "document_id": soa_id,
                        "action": "CREATED_FROM_PI",
                        "updated_by": user_id,
                        "timestamp": soa_date.isoformat(),
                        "version_no": 1
                    })
    
    await db.leads.insert_many(leads)
    print(f"✓ Created {len(leads)} leads")
    
    if quotations:
        await db.quotations.insert_many(quotations)
        print(f"✓ Created {len(quotations)} quotations")
    
    if pis:
        await db.proforma_invoices.insert_many(pis)
        print(f"✓ Created {len(pis)} proforma invoices")
    
    if soas:
        await db.soa.insert_many(soas)
        print(f"✓ Created {len(soas)} SOA documents")
    
    if doc_logs:
        await db.document_logs.insert_many(doc_logs)
        print(f"✓ Created {len(doc_logs)} document logs")

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

async def main():
    print("=" * 60)
    print("SUNSTORE KOLHAPUR CRM - Large Test Data Population")
    print("=" * 60)
    
    try:
        await clear_all_data()
        await create_users()
        await create_parties()
        await create_items()
        await create_leads_and_documents()
        await create_settings()
        
        print("\n" + "=" * 60)
        print("✅ LARGE TEST DATA POPULATION COMPLETE!")
        print("=" * 60)
        print("\n📌 Login Credentials:")
        print("   Admin: admin@sunstore.com / admin123")
        print("   Sales: rajesh@sunstore.com / sales123")
        print("   Sales: priya@sunstore.com / sales123")
        print("   Sales: amit@sunstore.com / sales123")
        print("   Sales: sneha@sunstore.com / sales123")
        print("\n📊 Database Summary:")
        print(f"   - Users: {await db.users.count_documents({})}")
        print(f"   - Parties: {await db.parties.count_documents({})}")
        print(f"   - Items: {await db.items.count_documents({})}")
        print(f"   - Leads: {await db.leads.count_documents({})}")
        print(f"   - Quotations: {await db.quotations.count_documents({})}")
        print(f"   - Proforma Invoices: {await db.proforma_invoices.count_documents({})}")
        print(f"   - SOA: {await db.soa.count_documents({})}")
        print(f"   - Document Logs: {await db.document_logs.count_documents({})}")
        print("\n🎉 Ready for comprehensive testing!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
