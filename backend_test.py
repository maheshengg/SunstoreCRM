#!/usr/bin/env python3
"""
Backend Testing for SUNSTORE KOLHAPUR CRM - PDF Generation Update
Testing the updated PDF generation functionality for Quotations
"""

import requests
import json
import os
from datetime import datetime
import sys

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://crm-sunstore.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@sunstore.com"
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
    
    def create_test_quotation(self, parties, items):
        """Create a test quotation with 'In Process' status"""
        try:
            if not parties or not items:
                self.log_result("Create Test Quotation", False, "No parties or items available for quotation creation")
                return None
            
            # Use first available party and item
            party = parties[0]
            item = items[0]
            
            # Create quotation item with proper calculations
            qty = 2.0
            rate = float(item.get('rate', 1000))
            discount_percent = 5.0
            
            # Calculate amounts
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
                "payment_terms": "50% Advance, 50% on delivery",
                "delivery_terms": "Within 2 weeks",
                "remarks": "Please confirm at earliest",
                "quotation_status": "In Process",  # New status to test
                "items": [quotation_item]
            }
            
            response = self.session.post(f"{API_BASE}/quotations", json=quotation_data)
            
            if response.status_code == 200:
                quotation = response.json()
                self.log_result(
                    "Create Test Quotation", 
                    True, 
                    f"Created quotation {quotation.get('quotation_no')} with 'In Process' status",
                    {
                        "quotation_id": quotation.get('quotation_id'),
                        "quotation_no": quotation.get('quotation_no'),
                        "status": quotation.get('quotation_status'),
                        "party": party.get('party_name'),
                        "item": item.get('item_name'),
                        "payment_terms": quotation.get('payment_terms'),
                        "delivery_terms": quotation.get('delivery_terms'),
                        "remarks": quotation.get('remarks')
                    }
                )
                return quotation
            else:
                self.log_result("Create Test Quotation", False, f"Failed to create quotation: {response.status_code}", {"response": response.text})
                return None
                
        except Exception as e:
            self.log_result("Create Test Quotation", False, f"Error creating quotation: {str(e)}")
            return None
    
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
        """Verify PDF contains expected content (basic text search in PDF bytes)"""
        try:
            # Convert PDF content to string for basic text search
            pdf_text = pdf_content.decode('latin-1', errors='ignore')
            
            # Check for required content elements
            checks = {
                "intro_paragraph": "We thank you for your enquiry" in pdf_text,
                "payment_terms": quotation.get('payment_terms', '') in pdf_text if quotation.get('payment_terms') else True,
                "delivery_terms": quotation.get('delivery_terms', '') in pdf_text if quotation.get('delivery_terms') else True,
                "remarks": quotation.get('remarks', '') in pdf_text if quotation.get('remarks') else True,
                "bank_details": "HDFC Bank" in pdf_text,
                "footer_message": "Thank you for your opportunity" in pdf_text,
                "computer_generated": "Computer Generated Document" in pdf_text
            }
            
            passed_checks = sum(1 for check in checks.values() if check)
            total_checks = len(checks)
            
            if passed_checks >= total_checks - 1:  # Allow 1 check to fail
                self.log_result(
                    "PDF Content Verification", 
                    True, 
                    f"PDF content verification passed ({passed_checks}/{total_checks} checks)",
                    checks
                )
            else:
                self.log_result(
                    "PDF Content Verification", 
                    False, 
                    f"PDF content verification failed ({passed_checks}/{total_checks} checks)",
                    checks
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
        """Run all PDF generation tests"""
        print("🚀 Starting SUNSTORE KOLHAPUR CRM - PDF Generation Testing")
        print("=" * 70)
        
        # Step 1: Login
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return False
        
        # Step 2: Get required data
        parties = self.get_parties()
        items = self.get_items()
        
        if not parties or not items:
            print("❌ Cannot proceed without parties and items data")
            return False
        
        # Step 3: Create test quotation with 'In Process' status
        quotation = self.create_test_quotation(parties, items)
        
        # Step 4: Test PDF download and content
        if quotation:
            self.test_quotation_pdf_download(quotation)
        
        # Step 5: Test dashboard stats
        self.test_dashboard_stats()
        
        # Step 6: Test quotation status options
        if quotation:
            self.test_quotation_status_options(quotation)
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = CRMTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)