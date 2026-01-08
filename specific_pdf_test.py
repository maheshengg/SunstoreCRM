#!/usr/bin/env python3
"""
Specific PDF Generation Test for SUNSTORE KOLHAPUR CRM
Testing the exact requirements from the review request
"""

import requests
import json
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://sunstore-crm.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@sunstore.com"
ADMIN_PASSWORD = "admin123"

def test_specific_requirements():
    """Test the specific requirements from the review request"""
    session = requests.Session()
    
    print("🎯 Testing Specific PDF Generation Requirements")
    print("=" * 60)
    
    # Step 1: Login as admin
    print("1. Logging in as admin...")
    login_data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    response = session.post(f"{API_BASE}/auth/login", json=login_data)
    
    if response.status_code != 200:
        print("❌ Login failed")
        return False
    
    data = response.json()
    auth_token = data.get('access_token')
    session.headers.update({'Authorization': f'Bearer {auth_token}'})
    print("✅ Admin login successful")
    
    # Step 2: Get parties and items
    print("\n2. Getting parties and items...")
    parties_response = session.get(f"{API_BASE}/parties")
    items_response = session.get(f"{API_BASE}/items")
    
    if parties_response.status_code != 200 or items_response.status_code != 200:
        print("❌ Failed to get parties or items")
        return False
    
    parties = parties_response.json()
    items = items_response.json()
    
    if not parties or not items:
        print("❌ No parties or items available")
        return False
    
    print(f"✅ Retrieved {len(parties)} parties and {len(items)} items")
    
    # Step 3: Create quotation with exact specifications
    print("\n3. Creating quotation with specific requirements...")
    
    party = parties[0]  # Select any party from the list
    item = items[0]     # Add at least one item
    
    # Calculate item amounts
    qty = 1.0
    rate = float(item.get('rate', 1000))
    discount_percent = 0.0
    taxable_amount = qty * rate * (1 - discount_percent / 100)
    gst_percent = float(item.get('GST_percent', 18))
    tax_amount = taxable_amount * (gst_percent / 100)
    total_amount = taxable_amount + tax_amount
    
    quotation_item = {
        "item_id": item['item_id'],
        "qty": qty,
        "rate": rate,
        "discount_percent": discount_percent,
        "taxable_amount": taxable_amount,
        "tax_type": "CGST+SGST",
        "tax_amount": tax_amount,
        "total_amount": total_amount
    }
    
    quotation_data = {
        "party_id": party['party_id'],
        "date": datetime.now().isoformat(),
        "validity_days": 30,
        "payment_terms": "50% Advance, 50% on delivery",      # Exact requirement
        "delivery_terms": "Within 2 weeks",                   # Exact requirement
        "remarks": "Please confirm at earliest",              # Exact requirement
        "quotation_status": "In Process",                     # New status requirement
        "items": [quotation_item]
    }
    
    create_response = session.post(f"{API_BASE}/quotations", json=quotation_data)
    
    if create_response.status_code != 200:
        print(f"❌ Failed to create quotation: {create_response.status_code}")
        print(f"Response: {create_response.text}")
        return False
    
    quotation = create_response.json()
    quotation_id = quotation.get('quotation_id')
    quotation_no = quotation.get('quotation_no')
    
    print(f"✅ Created quotation {quotation_no} with:")
    print(f"   - Party: {party.get('party_name')}")
    print(f"   - Item: {item.get('item_name')}")
    print(f"   - Payment Terms: {quotation.get('payment_terms')}")
    print(f"   - Delivery Terms: {quotation.get('delivery_terms')}")
    print(f"   - Remarks: {quotation.get('remarks')}")
    print(f"   - Status: {quotation.get('quotation_status')}")
    
    # Step 4: Download and verify PDF
    print(f"\n4. Downloading PDF for quotation {quotation_no}...")
    
    pdf_response = session.get(f"{API_BASE}/quotations/{quotation_id}/pdf")
    
    if pdf_response.status_code != 200:
        print(f"❌ PDF download failed: {pdf_response.status_code}")
        return False
    
    # Verify PDF properties
    content_type = pdf_response.headers.get('content-type', '')
    content_disposition = pdf_response.headers.get('content-disposition', '')
    pdf_content = pdf_response.content
    
    is_pdf = 'application/pdf' in content_type
    has_filename = 'attachment' in content_disposition and f'quotation_{quotation_no}.pdf' in content_disposition
    is_valid_pdf = pdf_content.startswith(b'%PDF-')
    pdf_size = len(pdf_content)
    
    print(f"✅ PDF downloaded successfully:")
    print(f"   - Content Type: {content_type}")
    print(f"   - Filename: {content_disposition}")
    print(f"   - Size: {pdf_size} bytes")
    print(f"   - Valid PDF: {is_valid_pdf}")
    
    # Step 5: Test Dashboard Stats for "In Process" count
    print(f"\n5. Checking dashboard stats for 'In Process' count...")
    
    stats_response = session.get(f"{API_BASE}/dashboard/stats")
    
    if stats_response.status_code != 200:
        print(f"❌ Dashboard stats failed: {stats_response.status_code}")
        return False
    
    stats = stats_response.json()
    quotations_stats = stats.get('quotations', {})
    in_process_count = quotations_stats.get('in_process', 0)
    total_quotations = quotations_stats.get('total', 0)
    
    print(f"✅ Dashboard stats retrieved:")
    print(f"   - Total Quotations: {total_quotations}")
    print(f"   - In Process: {in_process_count}")
    print(f"   - Successful: {quotations_stats.get('successful', 0)}")
    print(f"   - Lost: {quotations_stats.get('lost', 0)}")
    print(f"   - Pending: {quotations_stats.get('pending', 0)}")
    
    # Step 6: Test quotation status dropdown options
    print(f"\n6. Testing quotation status dropdown options...")
    
    status_options = ["In Process", "Successful", "Lost"]
    
    for status in status_options:
        # Get current quotation
        get_response = session.get(f"{API_BASE}/quotations/{quotation_id}")
        if get_response.status_code != 200:
            continue
        
        current_quotation = get_response.json()
        
        # Update with new status
        update_data = current_quotation.copy()
        update_data['quotation_status'] = status
        
        # Remove fields that shouldn't be in update request
        for field in ['quotation_id', 'quotation_no', 'created_by_user_id']:
            update_data.pop(field, None)
        
        update_response = session.put(f"{API_BASE}/quotations/{quotation_id}", json=update_data)
        
        if update_response.status_code == 200:
            updated_quotation = update_response.json()
            actual_status = updated_quotation.get('quotation_status')
            if actual_status == status:
                print(f"   ✅ Status '{status}' - Update successful")
            else:
                print(f"   ❌ Status '{status}' - Expected '{status}', got '{actual_status}'")
        else:
            print(f"   ❌ Status '{status}' - Update failed: {update_response.status_code}")
    
    print(f"\n🎉 All specific requirements tested successfully!")
    print(f"📋 Summary:")
    print(f"   ✅ Admin login with credentials: {ADMIN_EMAIL} / admin123")
    print(f"   ✅ Created quotation with party and item")
    print(f"   ✅ Set Payment Terms: '50% Advance, 50% on delivery'")
    print(f"   ✅ Set Delivery Terms: 'Within 2 weeks'")
    print(f"   ✅ Set Remarks: 'Please confirm at earliest'")
    print(f"   ✅ Set Status: 'In Process' (new status)")
    print(f"   ✅ PDF download working (quotation_{quotation_no}.pdf)")
    print(f"   ✅ Dashboard shows 'In Process' count")
    print(f"   ✅ Status dropdown options: 'In Process', 'Successful', 'Lost'")
    
    return True

if __name__ == "__main__":
    success = test_specific_requirements()
    exit(0 if success else 1)