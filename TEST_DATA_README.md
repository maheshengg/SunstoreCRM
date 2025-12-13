# SUNSTORE KOLHAPUR CRM - Test Data Documentation

## Overview
This document describes the test data populated in the CRM system for testing and demonstration purposes.

## Quick Commands

### Populate Test Data
```bash
cd /app/backend
python populate_test_data.py
```

### Clear All Test Data
```bash
cd /app/backend
python clear_test_data.py
```

## Test Accounts

### Admin Account
- **Email:** admin@sunstore.com
- **Password:** admin123
- **Role:** Admin
- **Permissions:** Full access to all features

### Sales User Accounts

#### Account 1
- **Email:** rajesh@sunstore.com
- **Password:** sales123
- **Role:** Sales User
- **Name:** Rajesh Kumar

#### Account 2
- **Email:** priya@sunstore.com
- **Password:** sales123
- **Role:** Sales User
- **Name:** Priya Sharma

## Test Data Summary

### Parties (5)
1. **ABC Engineering Works** (Kolhapur, Maharashtra)
   - Contact: Suresh Patil
   - GST: 27AABCA1234A1Z1

2. **XYZ Manufacturing Ltd** (Kolhapur, Maharashtra)
   - Contact: Ramesh Desai
   - GST: 27AABCX5678B1Z2

3. **PQR Industries Pvt Ltd** (Kolhapur, Maharashtra)
   - Contact: Vijay Kulkarni
   - GST: 27AAPCP9012C1Z3

4. **LMN Traders** (Pune, Maharashtra)
   - Contact: Anil Joshi
   - GST: 27AATLM3456D1Z4

5. **RST Engineering Solutions** (Kagal, Karnataka)
   - Contact: Santosh Naik
   - GST: 29AARST7890E1Z5

### Items (10)

#### Bearings
- BRG-6205: Ball Bearing 6205 (SKF) - ₹150
- BRG-6206: Ball Bearing 6206 (SKF) - ₹180

#### Fasteners
- BLT-M12: Hex Bolt M12x50 (Unbrako) - ₹25
- NUT-M12: Hex Nut M12 (Unbrako) - ₹15
- WSH-M12: Spring Washer M12 (Generic) - ₹8

#### Wood
- PLY-6MM: Plywood 6mm (Century) - ₹1,200

#### Electrical
- WRE-1.5MM: Copper Wire 1.5mm (Polycab) - ₹12/meter

#### Paints
- PNT-10L: Enamel Paint 10L (Asian Paints) - ₹2,500

#### Plumbing
- PIP-2IN: PVC Pipe 2 inch (Supreme) - ₹85/meter
- VAL-2IN: Ball Valve 2 inch (Jaquar) - ₹450

### Leads (4)

1. **ABC Engineering Works** - Bearings requirement (Open)
   - Created by: Rajesh Kumar
   - Summary: Need bearings for new machinery installation

2. **XYZ Manufacturing Ltd** - Fasteners bulk order (Converted)
   - Created by: Rajesh Kumar
   - Summary: Fasteners bulk order for maintenance work

3. **PQR Industries Pvt Ltd** - Electrical wiring (Open)
   - Created by: Priya Sharma
   - Summary: Electrical wiring materials for factory expansion

4. **LMN Traders** - Plumbing materials (Open)
   - Created by: Priya Sharma
   - Summary: Plumbing materials for residential project

### Quotations (2)

1. **QTN0001** - XYZ Manufacturing Ltd
   - Items: Hex Bolts, Hex Nuts, Spring Washers (100 each)
   - Total: ₹5,380.80 (including GST)
   - Created by: Rajesh Kumar
   - Converted from: LEAD0002

2. **QTN0002** - ABC Engineering Works
   - Items: 50x BRG-6205, 50x BRG-6206
   - Total: ₹17,523.00 (including GST)
   - Created by: Rajesh Kumar
   - Status: Open

### Proforma Invoices (1)

1. **PI0001** - XYZ Manufacturing Ltd
   - Converted from: QTN0001
   - Items: Hex Bolts, Hex Nuts (100 each)
   - Total: ₹4,484.00 (including GST)
   - Created by: Rajesh Kumar

### SOA (1)

1. **SOA0001** - XYZ Manufacturing Ltd
   - Party Confirmation ID: CONF-2024-001
   - Converted from: PI0001
   - Items: Hex Bolts (100)
   - Total: ₹2,802.50 (including GST)
   - Created by: Rajesh Kumar

## Tax Calculation Logic

### Maharashtra Parties (CGST + SGST)
- ABC Engineering Works
- XYZ Manufacturing Ltd
- PQR Industries Pvt Ltd
- LMN Traders

**Tax Split:** 18% = 9% CGST + 9% SGST

### Other State Parties (IGST)
- RST Engineering Solutions (Karnataka)

**Tax:** 18% IGST

## Document Workflow

The test data demonstrates the complete document workflow:

```
LEAD0002 (XYZ Manufacturing) 
    ↓
QTN0001 (Quotation)
    ↓
PI0001 (Proforma Invoice)
    ↓
SOA0001 (Statement of Accounts)
```

## Settings

Default settings are configured with:
- **Quotation Prefix:** QTN
- **PI Prefix:** PI
- **SOA Prefix:** SOA
- **Payment Terms:** 30 days credit with bank details
- **Delivery Terms:** Ex-warehouse Kolhapur
- **Terms & Conditions:** Standard business terms

## Testing Scenarios

### Login Testing
1. Admin login and dashboard access
2. Sales user login with restricted access
3. Invalid credentials handling

### CRUD Operations
1. Create/Edit/Delete Parties
2. Create/Edit/Delete Items
3. Create/Edit/Delete Leads
4. CSV import for items
5. CSV export for parties

### Document Workflow
1. Create Lead
2. Convert Lead to Quotation
3. Generate Quotation PDF
4. Convert Quotation to Proforma Invoice
5. Convert PI to SOA
6. Download PDF for each document

### Reports Testing
1. Item-wise Sales Report
2. Party-wise Sales Report
3. User-wise Sales Report (Admin only)
4. Lead Conversion Report
5. GST Summary Report
6. Quotation Aging Report
7. Pending Leads Report
8. Document Logs Report

### Settings Testing
1. Update number series prefixes
2. Update payment terms
3. Update delivery terms
4. Update terms & conditions

## Notes

- All test data is realistic and based on common engineering/hardware store inventory
- GST numbers are formatted correctly but are dummy values
- Prices are approximate market rates for demonstration
- The workflow demonstrates a complete sales cycle from lead to final SOA
- Document logs track all changes for audit purposes

## Cleanup

When you're done testing, run the cleanup script to remove all test data:

```bash
cd /app/backend
python clear_test_data.py
```

This will clear all collections and reset the database to an empty state.
