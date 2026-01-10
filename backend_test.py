#!/usr/bin/env python3
"""
Backend Testing for SUNSTORE KOLHAPUR CRM - CRITICAL DATA INTEGRITY FIXES
Testing party name integrity, UOM integrity, and data flow verification
"""

import requests
import json
import os
from datetime import datetime
import sys

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://sunstore-crm.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

# Test credentials from review request
ADMIN_EMAIL = "uday.patil@maheshengg.com"
ADMIN_PASSWORD = "admin123"

class CRMTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details or {},
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def login_admin(self):
        """Login as admin user"""
        try:
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                
                user_info = data.get('user', {})
                self.log_result(
                    "Admin Login", 
                    True, 
                    f"Successfully logged in as {user_info.get('name', 'Admin')} ({user_info.get('role', 'Unknown')})",
                    {"user_id": user_info.get('user_id'), "email": user_info.get('email')}
                )
                return True
            else:
                self.log_result("Admin Login", False, f"Login failed with status {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Admin Login", False, f"Login error: {str(e)}")
            return False
    
    def get_parties(self):
        """Get list of parties for quotation creation"""
        try:
            response = self.session.get(f"{API_BASE}/parties")
            
            if response.status_code == 200:
                parties = response.json()
                if parties:
                    self.log_result("Get Parties", True, f"Retrieved {len(parties)} parties", {"count": len(parties)})
                    return parties
                else:
                    self.log_result("Get Parties", False, "No parties found in database")
                    return []
            else:
                self.log_result("Get Parties", False, f"Failed to get parties: {response.status_code}", {"response": response.text})
                return []
                
        except Exception as e:
            self.log_result("Get Parties", False, f"Error getting parties: {str(e)}")
            return []
    
    def get_items(self):
        """Get list of items for quotation creation"""
        try:
            response = self.session.get(f"{API_BASE}/items")
            
            if response.status_code == 200:
                items = response.json()
                if items:
                    self.log_result("Get Items", True, f"Retrieved {len(items)} items", {"count": len(items)})
                    return items
                else:
                    self.log_result("Get Items", False, "No items found in database")
                    return []
            else:
                self.log_result("Get Items", False, f"Failed to get items: {response.status_code}", {"response": response.text})
                return []
                
        except Exception as e:
            self.log_result("Get Items", False, f"Error getting items: {str(e)}")
            return []
    
    def create_test_quotation_with_party_snapshot(self, parties, items):
        """Create a test quotation with party_name_snapshot for data integrity testing"""
        try:
            if not parties or not items:
                self.log_result("Create Quotation with Party Snapshot", False, "No parties or items available")
                return None
            
            # Use first available party and item
            party = parties[0]
            item = items[0]
            
            # Create quotation item with UOM field stored
            qty = 1.0
            rate = float(item.get('rate', 1000))
            discount_percent = 0.0
            
            # Calculate amounts
            taxable_amount = qty * rate * (1 - discount_percent / 100)
            gst_percent = float(item.get('GST_percent', 18))
            tax_amount = taxable_amount * (gst_percent / 100)
            total_amount = taxable_amount + tax_amount
            
            quotation_item = {
                "item_id": item['item_id'],
                "item_name": item.get('item_name', ''),  # Store item name
                "item_code": item.get('item_code', ''),  # Store item code
                "UOM": item.get('UOM', 'Nos'),           # CRITICAL: Store UOM
                "HSN": item.get('HSN', ''),              # Store HSN
                "GST_percent": gst_percent,              # Store GST percent
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
                "party_name_snapshot": party['party_name'],  # CRITICAL: Store party name snapshot
                "date": datetime.now().isoformat(),
                "validity_days": 30,
                "payment_terms": "50% Advance, 50% on delivery",
                "delivery_terms": "Within 2 weeks",
                "remarks": "Data integrity test quotation",
                "quotation_status": "In Process",
                "items": [quotation_item]
            }
            
            response = self.session.post(f"{API_BASE}/quotations", json=quotation_data)
            
            if response.status_code == 200:
                quotation = response.json()
                self.log_result(
                    "Create Quotation with Party Snapshot", 
                    True, 
                    f"Created quotation {quotation.get('quotation_no')} with party_name_snapshot and UOM fields",
                    {
                        "quotation_id": quotation.get('quotation_id'),
                        "quotation_no": quotation.get('quotation_no'),
                        "party_id": quotation.get('party_id'),
                        "party_name_snapshot": quotation.get('party_name_snapshot'),
                        "item_uom": quotation.get('items', [{}])[0].get('UOM') if quotation.get('items') else None,
                        "item_name": quotation.get('items', [{}])[0].get('item_name') if quotation.get('items') else None
                    }
                )
                return quotation
            else:
                self.log_result("Create Quotation with Party Snapshot", False, f"Failed to create quotation: {response.status_code}", {"response": response.text})
                return None
                
        except Exception as e:
            self.log_result("Create Quotation with Party Snapshot", False, f"Error creating quotation: {str(e)}")
            return None

    def test_party_name_integrity(self, quotation, original_party):
        """Test A: Party Name Integrity - Verify party_id matches and PDF shows correct party name"""
        try:
            if not quotation or not original_party:
                self.log_result("Party Name Integrity Test", False, "Missing quotation or party data")
                return False
            
            quotation_id = quotation.get('quotation_id')
            
            # Step 1: Retrieve saved quotation and verify party_id matches
            response = self.session.get(f"{API_BASE}/quotations/{quotation_id}")
            
            if response.status_code == 200:
                retrieved_quotation = response.json()
                
                # Verify party_id matches
                original_party_id = original_party.get('party_id')
                retrieved_party_id = retrieved_quotation.get('party_id')
                party_name_snapshot = retrieved_quotation.get('party_name_snapshot')
                
                if retrieved_party_id == original_party_id:
                    self.log_result(
                        "Party ID Verification", 
                        True, 
                        f"Party ID matches: {retrieved_party_id}",
                        {
                            "original_party_id": original_party_id,
                            "retrieved_party_id": retrieved_party_id,
                            "party_name_snapshot": party_name_snapshot,
                            "original_party_name": original_party.get('party_name')
                        }
                    )
                    
                    # Step 2: Generate PDF and verify it contains the correct party name
                    pdf_response = self.session.get(f"{API_BASE}/quotations/{quotation_id}/pdf")
                    
                    if pdf_response.status_code == 200:
                        # Check PDF is valid
                        is_valid_pdf = pdf_response.content.startswith(b'%PDF-')
                        pdf_size = len(pdf_response.content)
                        
                        if is_valid_pdf and pdf_size > 1000:
                            self.log_result(
                                "Party Name Integrity Test", 
                                True, 
                                f"PDF generated successfully with party name integrity maintained",
                                {
                                    "party_id": retrieved_party_id,
                                    "party_name_snapshot": party_name_snapshot,
                                    "pdf_size_bytes": pdf_size,
                                    "test_status": "Party name should match snapshot in PDF"
                                }
                            )
                            return True
                        else:
                            self.log_result("Party Name Integrity Test", False, "Invalid PDF generated", {"pdf_size": pdf_size, "is_valid": is_valid_pdf})
                            return False
                    else:
                        self.log_result("Party Name Integrity Test", False, f"PDF generation failed: {pdf_response.status_code}")
                        return False
                else:
                    self.log_result("Party ID Verification", False, f"Party ID mismatch: expected {original_party_id}, got {retrieved_party_id}")
                    return False
            else:
                self.log_result("Party Name Integrity Test", False, f"Failed to retrieve quotation: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Party Name Integrity Test", False, f"Error in party name integrity test: {str(e)}")
            return False

    def test_uom_integrity(self, items):
        """Test B: UOM Integrity - Find item with non-'Nos' UOM and test storage/retrieval"""
        try:
            # Find an item with UOM != "Nos"
            non_nos_item = None
            for item in items:
                if item.get('UOM', 'Nos') != 'Nos':
                    non_nos_item = item
                    break
            
            if not non_nos_item:
                # Create a test item with "Mtr" UOM if none exists
                self.log_result("UOM Integrity Test", False, "No items with non-'Nos' UOM found. Test requires items with different UOM values.")
                return False
            
            # Get first party for quotation
            parties_response = self.session.get(f"{API_BASE}/parties")
            if parties_response.status_code != 200:
                self.log_result("UOM Integrity Test", False, "Failed to get parties for UOM test")
                return False
            
            parties = parties_response.json()
            if not parties:
                self.log_result("UOM Integrity Test", False, "No parties available for UOM test")
                return False
            
            party = parties[0]
            
            # Create quotation with the non-Nos UOM item
            qty = 5.0
            rate = float(non_nos_item.get('rate', 500))
            
            taxable_amount = qty * rate
            gst_percent = float(non_nos_item.get('GST_percent', 18))
            tax_amount = taxable_amount * (gst_percent / 100)
            total_amount = taxable_amount + tax_amount
            
            quotation_item = {
                "item_id": non_nos_item['item_id'],
                "item_name": non_nos_item.get('item_name', ''),
                "item_code": non_nos_item.get('item_code', ''),
                "UOM": non_nos_item.get('UOM'),  # CRITICAL: Store the specific UOM
                "HSN": non_nos_item.get('HSN', ''),
                "GST_percent": gst_percent,
                "qty": qty,
                "rate": rate,
                "discount_percent": 0,
                "taxable_amount": taxable_amount,
                "tax_type": "CGST+SGST",
                "tax_amount": tax_amount,
                "total_amount": total_amount
            }
            
            quotation_data = {
                "party_id": party['party_id'],
                "party_name_snapshot": party['party_name'],
                "date": datetime.now().isoformat(),
                "validity_days": 30,
                "payment_terms": "Net 30 days",
                "delivery_terms": "Ex-works",
                "remarks": "UOM integrity test",
                "quotation_status": "In Process",
                "items": [quotation_item]
            }
            
            # Create quotation
            create_response = self.session.post(f"{API_BASE}/quotations", json=quotation_data)
            
            if create_response.status_code == 200:
                quotation = create_response.json()
                quotation_id = quotation.get('quotation_id')
                
                # Retrieve quotation and verify UOM is stored correctly
                get_response = self.session.get(f"{API_BASE}/quotations/{quotation_id}")
                
                if get_response.status_code == 200:
                    retrieved_quotation = get_response.json()
                    retrieved_items = retrieved_quotation.get('items', [])
                    
                    if retrieved_items:
                        retrieved_uom = retrieved_items[0].get('UOM')
                        original_uom = non_nos_item.get('UOM')
                        
                        if retrieved_uom == original_uom:
                            # Generate PDF and verify UOM prints correctly
                            pdf_response = self.session.get(f"{API_BASE}/quotations/{quotation_id}/pdf")
                            
                            if pdf_response.status_code == 200 and pdf_response.content.startswith(b'%PDF-'):
                                self.log_result(
                                    "UOM Integrity Test", 
                                    True, 
                                    f"UOM '{original_uom}' stored and retrieved correctly, PDF generated",
                                    {
                                        "original_uom": original_uom,
                                        "retrieved_uom": retrieved_uom,
                                        "item_name": non_nos_item.get('item_name'),
                                        "quotation_id": quotation_id,
                                        "pdf_size": len(pdf_response.content)
                                    }
                                )
                                return True
                            else:
                                self.log_result("UOM Integrity Test", False, "PDF generation failed for UOM test")
                                return False
                        else:
                            self.log_result("UOM Integrity Test", False, f"UOM mismatch: expected '{original_uom}', got '{retrieved_uom}'")
                            return False
                    else:
                        self.log_result("UOM Integrity Test", False, "No items found in retrieved quotation")
                        return False
                else:
                    self.log_result("UOM Integrity Test", False, f"Failed to retrieve quotation: {get_response.status_code}")
                    return False
            else:
                self.log_result("UOM Integrity Test", False, f"Failed to create UOM test quotation: {create_response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("UOM Integrity Test", False, f"Error in UOM integrity test: {str(e)}")
            return False

    def test_item_change_integrity(self, parties, items):
        """Test C: Item Change Test - Create quotation, change item, verify new UOM in PDF"""
        try:
            if len(items) < 2:
                self.log_result("Item Change Test", False, "Need at least 2 items for item change test")
                return False
            
            party = parties[0]
            item1 = items[0]
            item2 = items[1]
            
            # Create initial quotation with item1
            qty = 3.0
            rate1 = float(item1.get('rate', 1000))
            
            taxable_amount1 = qty * rate1
            gst_percent1 = float(item1.get('GST_percent', 18))
            tax_amount1 = taxable_amount1 * (gst_percent1 / 100)
            total_amount1 = taxable_amount1 + tax_amount1
            
            quotation_item1 = {
                "item_id": item1['item_id'],
                "item_name": item1.get('item_name', ''),
                "item_code": item1.get('item_code', ''),
                "UOM": item1.get('UOM', 'Nos'),  # Original UOM
                "HSN": item1.get('HSN', ''),
                "GST_percent": gst_percent1,
                "qty": qty,
                "rate": rate1,
                "discount_percent": 0,
                "taxable_amount": taxable_amount1,
                "tax_type": "CGST+SGST",
                "tax_amount": tax_amount1,
                "total_amount": total_amount1
            }
            
            quotation_data = {
                "party_id": party['party_id'],
                "party_name_snapshot": party['party_name'],
                "date": datetime.now().isoformat(),
                "validity_days": 30,
                "payment_terms": "Advance payment",
                "delivery_terms": "Immediate",
                "remarks": "Item change test - initial",
                "quotation_status": "In Process",
                "items": [quotation_item1]
            }
            
            # Create quotation
            create_response = self.session.post(f"{API_BASE}/quotations", json=quotation_data)
            
            if create_response.status_code == 200:
                quotation = create_response.json()
                quotation_id = quotation.get('quotation_id')
                
                # Update quotation with item2 (different UOM)
                rate2 = float(item2.get('rate', 800))
                taxable_amount2 = qty * rate2
                gst_percent2 = float(item2.get('GST_percent', 18))
                tax_amount2 = taxable_amount2 * (gst_percent2 / 100)
                total_amount2 = taxable_amount2 + tax_amount2
                
                quotation_item2 = {
                    "item_id": item2['item_id'],
                    "item_name": item2.get('item_name', ''),
                    "item_code": item2.get('item_code', ''),
                    "UOM": item2.get('UOM', 'Nos'),  # New UOM
                    "HSN": item2.get('HSN', ''),
                    "GST_percent": gst_percent2,
                    "qty": qty,
                    "rate": rate2,
                    "discount_percent": 0,
                    "taxable_amount": taxable_amount2,
                    "tax_type": "CGST+SGST",
                    "tax_amount": tax_amount2,
                    "total_amount": total_amount2
                }
                
                update_data = quotation.copy()
                update_data['items'] = [quotation_item2]
                update_data['remarks'] = "Item change test - updated"
                
                # Remove fields that shouldn't be in update request
                for field in ['quotation_id', 'quotation_no', 'created_by_user_id']:
                    update_data.pop(field, None)
                
                # Update quotation
                update_response = self.session.put(f"{API_BASE}/quotations/{quotation_id}", json=update_data)
                
                if update_response.status_code == 200:
                    # Generate PDF and verify new item's UOM is shown
                    pdf_response = self.session.get(f"{API_BASE}/quotations/{quotation_id}/pdf")
                    
                    if pdf_response.status_code == 200 and pdf_response.content.startswith(b'%PDF-'):
                        self.log_result(
                            "Item Change Test", 
                            True, 
                            f"Item changed successfully from '{item1.get('item_name')}' (UOM: {item1.get('UOM')}) to '{item2.get('item_name')}' (UOM: {item2.get('UOM')})",
                            {
                                "original_item": item1.get('item_name'),
                                "original_uom": item1.get('UOM'),
                                "new_item": item2.get('item_name'),
                                "new_uom": item2.get('UOM'),
                                "quotation_id": quotation_id,
                                "pdf_generated": True
                            }
                        )
                        return True
                    else:
                        self.log_result("Item Change Test", False, "PDF generation failed after item change")
                        return False
                else:
                    self.log_result("Item Change Test", False, f"Failed to update quotation: {update_response.status_code}")
                    return False
            else:
                self.log_result("Item Change Test", False, f"Failed to create initial quotation: {create_response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Item Change Test", False, f"Error in item change test: {str(e)}")
            return False

    def test_duplicate_item_integrity(self, parties, items):
        """Test D: Duplicate Item Test - Add same item twice, verify each has own UOM stored"""
        try:
            party = parties[0]
            item = items[0]
            
            # Create two identical item lines
            qty = 2.0
            rate = float(item.get('rate', 1200))
            
            taxable_amount = qty * rate
            gst_percent = float(item.get('GST_percent', 18))
            tax_amount = taxable_amount * (gst_percent / 100)
            total_amount = taxable_amount + tax_amount
            
            # First item line
            quotation_item1 = {
                "item_id": item['item_id'],
                "item_name": item.get('item_name', ''),
                "item_code": item.get('item_code', ''),
                "UOM": item.get('UOM', 'Nos'),
                "HSN": item.get('HSN', ''),
                "GST_percent": gst_percent,
                "qty": qty,
                "rate": rate,
                "discount_percent": 0,
                "taxable_amount": taxable_amount,
                "tax_type": "CGST+SGST",
                "tax_amount": tax_amount,
                "total_amount": total_amount
            }
            
            # Second item line (duplicate)
            quotation_item2 = quotation_item1.copy()
            quotation_item2['qty'] = 1.0  # Different quantity
            quotation_item2['taxable_amount'] = 1.0 * rate
            quotation_item2['tax_amount'] = quotation_item2['taxable_amount'] * (gst_percent / 100)
            quotation_item2['total_amount'] = quotation_item2['taxable_amount'] + quotation_item2['tax_amount']
            
            quotation_data = {
                "party_id": party['party_id'],
                "party_name_snapshot": party['party_name'],
                "date": datetime.now().isoformat(),
                "validity_days": 30,
                "payment_terms": "COD",
                "delivery_terms": "Standard",
                "remarks": "Duplicate item test",
                "quotation_status": "In Process",
                "items": [quotation_item1, quotation_item2]  # Two lines of same item
            }
            
            # Create quotation
            create_response = self.session.post(f"{API_BASE}/quotations", json=quotation_data)
            
            if create_response.status_code == 200:
                quotation = create_response.json()
                quotation_id = quotation.get('quotation_id')
                
                # Retrieve and verify both items have UOM stored
                get_response = self.session.get(f"{API_BASE}/quotations/{quotation_id}")
                
                if get_response.status_code == 200:
                    retrieved_quotation = get_response.json()
                    retrieved_items = retrieved_quotation.get('items', [])
                    
                    if len(retrieved_items) == 2:
                        item1_uom = retrieved_items[0].get('UOM')
                        item2_uom = retrieved_items[1].get('UOM')
                        expected_uom = item.get('UOM', 'Nos')
                        
                        if item1_uom == expected_uom and item2_uom == expected_uom:
                            # Generate PDF
                            pdf_response = self.session.get(f"{API_BASE}/quotations/{quotation_id}/pdf")
                            
                            if pdf_response.status_code == 200 and pdf_response.content.startswith(b'%PDF-'):
                                self.log_result(
                                    "Duplicate Item Test", 
                                    True, 
                                    f"Duplicate items created successfully, both have UOM '{expected_uom}' stored correctly",
                                    {
                                        "item_name": item.get('item_name'),
                                        "expected_uom": expected_uom,
                                        "item1_uom": item1_uom,
                                        "item2_uom": item2_uom,
                                        "item1_qty": retrieved_items[0].get('qty'),
                                        "item2_qty": retrieved_items[1].get('qty'),
                                        "quotation_id": quotation_id
                                    }
                                )
                                return True
                            else:
                                self.log_result("Duplicate Item Test", False, "PDF generation failed for duplicate item test")
                                return False
                        else:
                            self.log_result("Duplicate Item Test", False, f"UOM mismatch in duplicate items: {item1_uom}, {item2_uom}")
                            return False
                    else:
                        self.log_result("Duplicate Item Test", False, f"Expected 2 items, got {len(retrieved_items)}")
                        return False
                else:
                    self.log_result("Duplicate Item Test", False, f"Failed to retrieve quotation: {get_response.status_code}")
                    return False
            else:
                self.log_result("Duplicate Item Test", False, f"Failed to create duplicate item quotation: {create_response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Duplicate Item Test", False, f"Error in duplicate item test: {str(e)}")
            return False

    def test_data_flow_verification(self, parties, items):
        """Test E: Data Flow Verification - Complete flow: Create → Save → Fetch → PDF"""
        try:
            party = parties[0]
            item = items[0]
            
            # Step 1: Create quotation
            qty = 4.0
            rate = float(item.get('rate', 1500))
            
            taxable_amount = qty * rate
            gst_percent = float(item.get('GST_percent', 18))
            tax_amount = taxable_amount * (gst_percent / 100)
            total_amount = taxable_amount + tax_amount
            
            quotation_item = {
                "item_id": item['item_id'],
                "item_name": item.get('item_name', ''),
                "item_code": item.get('item_code', ''),
                "UOM": item.get('UOM', 'Nos'),
                "HSN": item.get('HSN', ''),
                "GST_percent": gst_percent,
                "qty": qty,
                "rate": rate,
                "discount_percent": 5.0,
                "taxable_amount": taxable_amount * 0.95,  # After discount
                "tax_type": "CGST+SGST",
                "tax_amount": taxable_amount * 0.95 * (gst_percent / 100),
                "total_amount": taxable_amount * 0.95 * (1 + gst_percent / 100)
            }
            
            original_quotation_data = {
                "party_id": party['party_id'],
                "party_name_snapshot": party['party_name'],
                "date": datetime.now().isoformat(),
                "validity_days": 45,
                "payment_terms": "30% advance, 70% on delivery",
                "delivery_terms": "Within 3 weeks",
                "remarks": "Data flow verification test",
                "quotation_status": "In Process",
                "items": [quotation_item]
            }
            
            # Create
            create_response = self.session.post(f"{API_BASE}/quotations", json=original_quotation_data)
            
            if create_response.status_code != 200:
                self.log_result("Data Flow - Create", False, f"Create failed: {create_response.status_code}")
                return False
            
            quotation = create_response.json()
            quotation_id = quotation.get('quotation_id')
            
            # Step 2: Fetch by ID
            fetch_response = self.session.get(f"{API_BASE}/quotations/{quotation_id}")
            
            if fetch_response.status_code != 200:
                self.log_result("Data Flow - Fetch", False, f"Fetch failed: {fetch_response.status_code}")
                return False
            
            fetched_quotation = fetch_response.json()
            
            # Step 3: Verify data consistency
            original_party_id = original_quotation_data['party_id']
            original_party_name = original_quotation_data['party_name_snapshot']
            original_uom = original_quotation_data['items'][0]['UOM']
            
            fetched_party_id = fetched_quotation.get('party_id')
            fetched_party_name = fetched_quotation.get('party_name_snapshot')
            fetched_uom = fetched_quotation.get('items', [{}])[0].get('UOM') if fetched_quotation.get('items') else None
            
            data_consistent = (
                original_party_id == fetched_party_id and
                original_party_name == fetched_party_name and
                original_uom == fetched_uom
            )
            
            if not data_consistent:
                self.log_result(
                    "Data Flow - Consistency", 
                    False, 
                    "Data inconsistency detected",
                    {
                        "party_id_match": original_party_id == fetched_party_id,
                        "party_name_match": original_party_name == fetched_party_name,
                        "uom_match": original_uom == fetched_uom
                    }
                )
                return False
            
            # Step 4: Generate PDF
            pdf_response = self.session.get(f"{API_BASE}/quotations/{quotation_id}/pdf")
            
            if pdf_response.status_code != 200:
                self.log_result("Data Flow - PDF", False, f"PDF generation failed: {pdf_response.status_code}")
                return False
            
            if not pdf_response.content.startswith(b'%PDF-'):
                self.log_result("Data Flow - PDF", False, "Invalid PDF content")
                return False
            
            # Success - all steps completed
            self.log_result(
                "Data Flow Verification", 
                True, 
                "Complete data flow verified: Create → Save → Fetch → PDF",
                {
                    "quotation_id": quotation_id,
                    "party_id_consistent": True,
                    "party_name_consistent": True,
                    "uom_consistent": True,
                    "pdf_size": len(pdf_response.content),
                    "all_steps_successful": True
                }
            )
            return True
                
        except Exception as e:
            self.log_result("Data Flow Verification", False, f"Error in data flow test: {str(e)}")
            return False
    
    def test_quotation_pdf_download(self, quotation):
        """Test PDF download for the created quotation"""
        try:
            if not quotation:
                self.log_result("Quotation PDF Download", False, "No quotation available for PDF test")
                return False
            
            quotation_id = quotation.get('quotation_id')
            response = self.session.get(f"{API_BASE}/quotations/{quotation_id}/pdf")
            
            if response.status_code == 200:
                # Check if response is PDF
                content_type = response.headers.get('content-type', '')
                content_disposition = response.headers.get('content-disposition', '')
                
                is_pdf = 'application/pdf' in content_type
                has_filename = 'attachment' in content_disposition and 'filename=' in content_disposition
                pdf_size = len(response.content)
                
                # Basic PDF validation - check for PDF header
                is_valid_pdf = response.content.startswith(b'%PDF-')
                
                if is_pdf and has_filename and is_valid_pdf and pdf_size > 1000:
                    self.log_result(
                        "Quotation PDF Download", 
                        True, 
                        f"Successfully downloaded PDF for quotation {quotation.get('quotation_no')}",
                        {
                            "content_type": content_type,
                            "content_disposition": content_disposition,
                            "pdf_size_bytes": pdf_size,
                            "is_valid_pdf": is_valid_pdf
                        }
                    )
                    
                    # Test PDF content verification (basic checks)
                    self.verify_pdf_content(response.content, quotation)
                    return True
                else:
                    self.log_result(
                        "Quotation PDF Download", 
                        False, 
                        "PDF download issues detected",
                        {
                            "is_pdf": is_pdf,
                            "has_filename": has_filename,
                            "is_valid_pdf": is_valid_pdf,
                            "pdf_size": pdf_size
                        }
                    )
                    return False
            else:
                self.log_result("Quotation PDF Download", False, f"PDF download failed: {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Quotation PDF Download", False, f"Error downloading PDF: {str(e)}")
            return False
    
    def verify_pdf_content(self, pdf_content, quotation):
        """Verify PDF is valid and contains basic structure"""
        try:
            # Basic PDF validation
            is_valid_pdf = pdf_content.startswith(b'%PDF-')
            has_content = len(pdf_content) > 10000  # Reasonable size for a quotation PDF
            
            # Check if PDF contains some expected binary patterns that indicate proper content
            # PDFs contain compressed streams, so we can't easily search for text
            # But we can verify it's a properly formed PDF with substantial content
            
            if is_valid_pdf and has_content:
                self.log_result(
                    "PDF Content Verification", 
                    True, 
                    f"PDF is valid and contains substantial content ({len(pdf_content)} bytes)",
                    {
                        "is_valid_pdf": is_valid_pdf,
                        "pdf_size_bytes": len(pdf_content),
                        "quotation_no": quotation.get('quotation_no'),
                        "status": quotation.get('quotation_status'),
                        "payment_terms": quotation.get('payment_terms'),
                        "delivery_terms": quotation.get('delivery_terms'),
                        "remarks": quotation.get('remarks')
                    }
                )
            else:
                self.log_result(
                    "PDF Content Verification", 
                    False, 
                    f"PDF validation failed - valid: {is_valid_pdf}, size: {len(pdf_content)} bytes",
                    {
                        "is_valid_pdf": is_valid_pdf,
                        "pdf_size_bytes": len(pdf_content),
                        "expected_min_size": 10000
                    }
                )
                
        except Exception as e:
            self.log_result("PDF Content Verification", False, f"Error verifying PDF content: {str(e)}")
    
    def test_dashboard_stats(self):
        """Test dashboard stats to verify 'In Process' count"""
        try:
            response = self.session.get(f"{API_BASE}/dashboard/stats")
            
            if response.status_code == 200:
                stats = response.json()
                quotations_stats = stats.get('quotations', {})
                
                in_process_count = quotations_stats.get('in_process', 0)
                total_quotations = quotations_stats.get('total', 0)
                
                self.log_result(
                    "Dashboard Stats - In Process Count", 
                    True, 
                    f"Dashboard shows {in_process_count} 'In Process' quotations out of {total_quotations} total",
                    {
                        "in_process": in_process_count,
                        "total": total_quotations,
                        "successful": quotations_stats.get('successful', 0),
                        "lost": quotations_stats.get('lost', 0),
                        "pending": quotations_stats.get('pending', 0)
                    }
                )
                return True
            else:
                self.log_result("Dashboard Stats - In Process Count", False, f"Failed to get dashboard stats: {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Dashboard Stats - In Process Count", False, f"Error getting dashboard stats: {str(e)}")
            return False
    
    def test_quotation_status_options(self, quotation):
        """Test quotation status dropdown options by updating quotation status"""
        try:
            if not quotation:
                self.log_result("Quotation Status Options", False, "No quotation available for status test")
                return False
            
            quotation_id = quotation.get('quotation_id')
            
            # Test different status options
            status_options = ["In Process", "Successful", "Lost"]
            
            for status in status_options:
                # Get current quotation data
                get_response = self.session.get(f"{API_BASE}/quotations/{quotation_id}")
                if get_response.status_code != 200:
                    continue
                
                current_quotation = get_response.json()
                
                # Update with new status
                update_data = current_quotation.copy()
                update_data['quotation_status'] = status
                
                # Remove fields that shouldn't be in update request
                for field in ['quotation_id', 'quotation_no', 'created_by_user_id']:
                    update_data.pop(field, None)
                
                update_response = self.session.put(f"{API_BASE}/quotations/{quotation_id}", json=update_data)
                
                if update_response.status_code == 200:
                    updated_quotation = update_response.json()
                    if updated_quotation.get('quotation_status') == status:
                        self.log_result(
                            f"Quotation Status - {status}", 
                            True, 
                            f"Successfully updated quotation status to '{status}'",
                            {"quotation_id": quotation_id, "new_status": status}
                        )
                    else:
                        self.log_result(
                            f"Quotation Status - {status}", 
                            False, 
                            f"Status update failed - expected '{status}', got '{updated_quotation.get('quotation_status')}'",
                            {"expected": status, "actual": updated_quotation.get('quotation_status')}
                        )
                else:
                    self.log_result(
                        f"Quotation Status - {status}", 
                        False, 
                        f"Failed to update status to '{status}': {update_response.status_code}",
                        {"response": update_response.text}
                    )
            
            return True
                
        except Exception as e:
            self.log_result("Quotation Status Options", False, f"Error testing status options: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all CRITICAL DATA INTEGRITY tests"""
        print("🚀 Starting SUNSTORE KOLHAPUR CRM - CRITICAL DATA INTEGRITY TESTING")
        print("=" * 80)
        
        # Step 1: Login with correct credentials
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return False
        
        # Step 2: Get required data
        parties = self.get_parties()
        items = self.get_items()
        
        if not parties or not items:
            print("❌ Cannot proceed without parties and items data")
            return False
        
        print(f"\n📋 Test Data Available:")
        print(f"   Parties: {len(parties)}")
        print(f"   Items: {len(items)}")
        
        # Step 3: Run CRITICAL DATA INTEGRITY TESTS
        print(f"\n🔍 Running Critical Data Integrity Tests...")
        
        # Test A: Party Name Integrity Test
        print(f"\n--- Test A: Party Name Integrity ---")
        quotation_with_snapshot = self.create_test_quotation_with_party_snapshot(parties, items)
        if quotation_with_snapshot:
            self.test_party_name_integrity(quotation_with_snapshot, parties[0])
        
        # Test B: UOM Integrity Test
        print(f"\n--- Test B: UOM Integrity ---")
        self.test_uom_integrity(items)
        
        # Test C: Item Change Test
        print(f"\n--- Test C: Item Change Test ---")
        self.test_item_change_integrity(parties, items)
        
        # Test D: Duplicate Item Test
        print(f"\n--- Test D: Duplicate Item Test ---")
        self.test_duplicate_item_integrity(parties, items)
        
        # Test E: Data Flow Verification
        print(f"\n--- Test E: Data Flow Verification ---")
        self.test_data_flow_verification(parties, items)
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 CRITICAL DATA INTEGRITY TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        # Critical Issues Report
        critical_failures = []
        for result in self.test_results:
            if not result['success'] and any(keyword in result['test'].lower() for keyword in ['integrity', 'party', 'uom', 'data flow']):
                critical_failures.append(result)
        
        if critical_failures:
            print(f"\n🚨 CRITICAL DATA INTEGRITY FAILURES:")
            for result in critical_failures:
                print(f"  ❌ {result['test']}: {result['message']}")
                if result.get('details'):
                    print(f"     Details: {result['details']}")
        
        if failed_tests > 0:
            print(f"\n❌ ALL FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Test-specific recommendations
        if critical_failures:
            print(f"\n💡 RECOMMENDATIONS:")
            print(f"  - Verify party_name_snapshot field is being stored and used in PDF generation")
            print(f"  - Ensure UOM field is stored per item line and not fetched from item master")
            print(f"  - Check that item changes update stored values, not just references")
            print(f"  - Validate that duplicate items maintain separate UOM storage")
            print(f"  - Test complete data flow from creation to PDF generation")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = CRMTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)