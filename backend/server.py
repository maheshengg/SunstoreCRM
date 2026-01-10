from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import asyncio
import resend
import io
import csv
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Email config
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

security = HTTPBearer()

# Create the main app
app = FastAPI(title="SUNSTORE KOLHAPUR CRM")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    role: str  # "Admin" or "Sales User"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    user_id: str
    status: str = "Active"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class PartyBase(BaseModel):
    party_name: str
    address: str
    city: str
    state: str
    pincode: str
    GST_number: str
    contact_person: str
    mobile: str
    email: EmailStr

class PartyCreate(PartyBase):
    pass

class Party(PartyBase):
    party_id: str
    status: str = "Active"

class ItemBase(BaseModel):
    item_code: str
    item_name: str
    description: str = ""
    UOM: str
    rate: float
    HSN: str = ""
    GST_percent: float
    brand: str = ""
    category: str = ""

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    item_id: str

class LeadBase(BaseModel):
    party_name: str  # Free text - not linked to Party Master
    party_address: str = ""  # Free text address
    party_gst: str = ""  # Optional GST number
    party_city: str = ""
    contact_name: str
    contact_mobile: str = ""
    requirement_summary: str
    referred_by: str = ""
    notes: str = ""

class LeadCreate(LeadBase):
    pass

class Lead(LeadBase):
    lead_id: str
    created_by_user_id: str
    lead_date: str
    status: str = "Open"  # Open, Converted, Lost

class QuotationItemBase(BaseModel):
    item_id: str
    item_name: str = ""  # Stored at selection time - IMMUTABLE
    item_code: str = ""  # Stored at selection time - IMMUTABLE
    UOM: str = "Nos"     # Stored at selection time - IMMUTABLE
    HSN: str = ""        # Stored at selection time - IMMUTABLE
    GST_percent: float = 18  # Stored at selection time - IMMUTABLE
    qty: float
    rate: float
    discount_percent: float = 0
    taxable_amount: float
    tax_type: str  # CGST+SGST or IGST
    tax_amount: float
    total_amount: float

class QuotationBase(BaseModel):
    party_id: str
    party_name_snapshot: str = ""  # Stored at save time - IMMUTABLE for PDF
    reference_lead_id: Optional[str] = None
    date: str
    validity_days: int = 30
    payment_terms: str = ""
    delivery_terms: str = ""
    remarks: str = ""
    quotation_status: Optional[str] = None
    is_locked: bool = False
    items: List[QuotationItemBase]

class QuotationCreate(QuotationBase):
    pass

class Quotation(QuotationBase):
    quotation_id: str
    quotation_no: str
    created_by_user_id: str

class ProformaInvoiceBase(BaseModel):
    party_id: str
    party_name_snapshot: str = ""  # Stored at save time - IMMUTABLE for PDF
    reference_document_id: Optional[str] = None
    date: str
    validity_days: int = 30
    payment_terms: str = ""
    delivery_terms: str = ""
    remarks: str = ""
    pi_status: str = "PI Submitted"
    is_locked: bool = False
    items: List[QuotationItemBase]

class ProformaInvoiceCreate(ProformaInvoiceBase):
    pass

class ProformaInvoice(ProformaInvoiceBase):
    pi_id: str
    pi_no: str
    created_by_user_id: str

class SOABase(BaseModel):
    party_confirmation_ID: str = ""
    party_id: str
    party_name_snapshot: str = ""  # Stored at save time - IMMUTABLE for PDF
    reference_document_id: Optional[str] = None
    terms_and_conditions: str = ""
    remarks: str = ""
    date: str
    soa_status: str = "In Process"
    is_locked: bool = False
    items: List[QuotationItemBase]

class SOACreate(SOABase):
    pass

class SOA(SOABase):
    soa_id: str
    soa_no: str
    created_by_user_id: str

class SettingsBase(BaseModel):
    quotation_prefix: str = "QTN"
    pi_prefix: str = "PI"
    soa_prefix: str = "SOA"
    payment_terms: str = ""
    delivery_terms: str = ""
    terms_and_conditions: str = ""

class Settings(SettingsBase):
    settings_id: str = "default"

# ==================== AUTH UTILITIES ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate user_id
    user_count = await db.users.count_documents({})
    user_id = f"USR{str(user_count + 1).zfill(4)}"
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user_dict = {
        "user_id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "mobile": user_data.mobile,
        "role": user_data.role,
        "password_hashed": hashed_password,
        "status": "Active"
    }
    
    await db.users.insert_one(user_dict)
    
    return {"message": "User registered successfully", "user_id": user_id}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hashed"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user["status"] != "Active":
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    access_token = create_access_token(
        data={"sub": user["user_id"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user:
        # Don't reveal if email exists
        return {"message": "If email exists, reset link will be sent"}
    
    # Create reset token (expires in 1 hour)
    reset_token = create_access_token(
        data={"sub": user["user_id"], "type": "reset"},
        expires_delta=timedelta(hours=1)
    )
    
    # Send email
    if RESEND_API_KEY:
        try:
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>Hello {user['name']},</p>
                <p>You requested to reset your password. Your reset token is:</p>
                <p style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 14px;">{reset_token}</p>
                <p>This token will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <br>
                <p>Regards,<br>SUNSTORE KOLHAPUR</p>
            </body>
            </html>
            """
            
            params = {
                "from": SENDER_EMAIL,
                "to": [request.email],
                "subject": "Password Reset - SUNSTORE KOLHAPUR CRM",
                "html": html_content
            }
            
            await asyncio.to_thread(resend.Emails.send, params)
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
    
    return {"message": "If email exists, reset link will be sent", "token": reset_token}

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    try:
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid reset token")
        
        user_id = payload.get("sub")
        
        # Update password
        hashed_password = hash_password(request.new_password)
        result = await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"password_hashed": hashed_password}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "Password reset successful"}
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ==================== PARTY ENDPOINTS ====================

@api_router.post("/parties", response_model=Party)
async def create_party(party_data: PartyCreate, current_user: dict = Depends(get_current_user)):
    # Check for duplicate GST
    existing_party = await db.parties.find_one({"GST_number": party_data.GST_number}, {"_id": 0})
    if existing_party:
        raise HTTPException(status_code=400, detail="Party with this GST number already exists")
    
    party_count = await db.parties.count_documents({})
    party_id = f"PTY{str(party_count + 1).zfill(4)}"
    
    party_dict = party_data.model_dump()
    party_dict["party_id"] = party_id
    party_dict["status"] = "Active"
    
    await db.parties.insert_one(party_dict)
    
    # Log
    await log_document_action("PARTY", party_id, "CREATED", current_user["user_id"])
    
    return party_dict

@api_router.get("/parties", response_model=List[Party])
async def get_parties(current_user: dict = Depends(get_current_user)):
    parties = await db.parties.find({}, {"_id": 0}).to_list(1000)
    return parties

@api_router.get("/parties/{party_id}", response_model=Party)
async def get_party(party_id: str, current_user: dict = Depends(get_current_user)):
    party = await db.parties.find_one({"party_id": party_id}, {"_id": 0})
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return party

@api_router.put("/parties/{party_id}", response_model=Party)
async def update_party(party_id: str, party_data: PartyCreate, current_user: dict = Depends(get_current_user)):
    # Check if GST is being changed and if it conflicts
    existing_party = await db.parties.find_one({"party_id": party_id}, {"_id": 0})
    if not existing_party:
        raise HTTPException(status_code=404, detail="Party not found")
    
    if existing_party["GST_number"] != party_data.GST_number:
        duplicate = await db.parties.find_one(
            {"GST_number": party_data.GST_number, "party_id": {"$ne": party_id}},
            {"_id": 0}
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="Party with this GST number already exists")
    
    party_dict = party_data.model_dump()
    party_dict["status"] = existing_party.get("status", "Active")
    
    await db.parties.update_one({"party_id": party_id}, {"$set": party_dict})
    
    # Log
    await log_document_action("PARTY", party_id, "UPDATED", current_user["user_id"])
    
    party_dict["party_id"] = party_id
    return party_dict

@api_router.delete("/parties/{party_id}")
async def delete_party(party_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.parties.update_one(
        {"party_id": party_id},
        {"$set": {"status": "Inactive"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Party not found")
    
    # Log
    await log_document_action("PARTY", party_id, "DELETED", current_user["user_id"])
    
    return {"message": "Party deleted successfully"}

@api_router.post("/parties/{party_id}/duplicate")
async def duplicate_party(party_id: str, current_user: dict = Depends(get_current_user)):
    party = await db.parties.find_one({"party_id": party_id}, {"_id": 0})
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    
    party_count = await db.parties.count_documents({})
    new_party_id = f"PTY{str(party_count + 1).zfill(4)}"
    
    new_party = party.copy()
    new_party["party_id"] = new_party_id
    new_party["party_name"] = f"{party['party_name']} (Copy)"
    new_party["GST_number"] = ""  # Clear GST to avoid duplicate
    
    await db.parties.insert_one(new_party)
    await log_document_action("PARTY", new_party_id, "DUPLICATED", current_user["user_id"])
    
    return {"message": "Party duplicated successfully", "party_id": new_party_id}

@api_router.get("/parties/export/csv")
async def export_parties_csv(current_user: dict = Depends(get_current_user)):
    parties = await db.parties.find({}, {"_id": 0}).to_list(1000)
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["party_id", "party_name", "address", "city", "state", "pincode", "GST_number", "contact_person", "mobile", "email", "status"])
    writer.writeheader()
    writer.writerows(parties)
    
    csv_data = output.getvalue()
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=parties.csv"})

@api_router.post("/parties/upload/csv")
async def upload_parties_csv(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    added_count = 0
    skipped_count = 0
    
    for row in reader:
        # Check if party with GST number already exists
        existing = await db.parties.find_one({"GST_number": row.get("GST_number")}, {"_id": 0})
        if existing:
            skipped_count += 1
            continue
        
        party_count = await db.parties.count_documents({})
        party_id = f"PTY{str(party_count + 1).zfill(4)}"
        
        party_dict = {
            "party_id": party_id,
            "party_name": row.get("party_name", ""),
            "address": row.get("address", ""),
            "city": row.get("city", ""),
            "state": row.get("state", ""),
            "pincode": row.get("pincode", ""),
            "GST_number": row.get("GST_number", ""),
            "contact_person": row.get("contact_person", ""),
            "mobile": row.get("mobile", ""),
            "email": row.get("email", ""),
            "status": row.get("status", "Active")
        }
        
        await db.parties.insert_one(party_dict)
        
        # Log
        await log_document_action("PARTY", party_id, "CREATED", current_user["user_id"])
        
        added_count += 1
    
    return {"message": f"Added {added_count} parties, skipped {skipped_count} duplicates"}

# ==================== ITEM ENDPOINTS ====================

@api_router.post("/items", response_model=Item)
async def create_item(item_data: ItemCreate, current_user: dict = Depends(get_current_user)):
    # Check for duplicate item_code
    existing_item = await db.items.find_one({"item_code": item_data.item_code}, {"_id": 0})
    if existing_item:
        raise HTTPException(status_code=400, detail="Item with this code already exists")
    
    item_count = await db.items.count_documents({})
    item_id = f"ITM{str(item_count + 1).zfill(4)}"
    
    item_dict = item_data.model_dump()
    item_dict["item_id"] = item_id
    
    await db.items.insert_one(item_dict)
    
    return item_dict

@api_router.get("/items", response_model=List[Item])
async def get_items(
    search: Optional[str] = None,
    brand: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if search:
        query["$or"] = [
            {"item_code": {"$regex": search, "$options": "i"}},
            {"item_name": {"$regex": search, "$options": "i"}}
        ]
    if brand:
        query["brand"] = {"$regex": brand, "$options": "i"}
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    
    items = await db.items.find(query, {"_id": 0}).to_list(1000)
    return items

@api_router.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: str, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@api_router.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: str, item_data: ItemCreate, current_user: dict = Depends(get_current_user)):
    existing_item = await db.items.find_one({"item_id": item_id}, {"_id": 0})
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if existing_item["item_code"] != item_data.item_code:
        duplicate = await db.items.find_one(
            {"item_code": item_data.item_code, "item_id": {"$ne": item_id}},
            {"_id": 0}
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="Item with this code already exists")
    
    item_dict = item_data.model_dump()
    await db.items.update_one({"item_id": item_id}, {"$set": item_dict})
    
    item_dict["item_id"] = item_id
    return item_dict

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.items.delete_one({"item_id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

@api_router.post("/items/{item_id}/duplicate")
async def duplicate_item(item_id: str, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item_count = await db.items.count_documents({})
    new_item_id = f"ITM{str(item_count + 1).zfill(4)}"
    
    new_item = item.copy()
    new_item["item_id"] = new_item_id
    new_item["item_code"] = f"{item['item_code']}_COPY"
    new_item["item_name"] = f"{item.get('item_name', '')} (Copy)"
    
    await db.items.insert_one(new_item)
    
    return {"message": "Item duplicated successfully", "item_id": new_item_id}

@api_router.get("/items/export/csv")
async def export_items_csv(current_user: dict = Depends(get_current_user)):
    items = await db.items.find({}, {"_id": 0}).to_list(10000)
    
    output = io.StringIO()
    if items:
        writer = csv.DictWriter(output, fieldnames=items[0].keys())
        writer.writeheader()
        writer.writerows(items)
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=items_export.csv"}
    )

@api_router.post("/items/upload/csv")
async def upload_items_csv(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    added_count = 0
    skipped_count = 0
    
    for row in reader:
        # Check if item_code exists
        existing = await db.items.find_one({"item_code": row.get("item_code")}, {"_id": 0})
        if existing:
            skipped_count += 1
            continue
        
        item_count = await db.items.count_documents({})
        item_id = f"ITM{str(item_count + 1).zfill(4)}"
        
        item_dict = {
            "item_id": item_id,
            "item_code": row.get("item_code", ""),
            "item_name": row.get("item_name", ""),
            "description": row.get("description", ""),
            "UOM": row.get("UOM", "Nos"),
            "rate": float(row.get("rate", 0)),
            "HSN": row.get("HSN", ""),
            "GST_percent": float(row.get("GST_percent", 18)),
            "brand": row.get("brand", ""),
            "category": row.get("category", "")
        }
        
        await db.items.insert_one(item_dict)
        added_count += 1
    
    return {"message": f"Added {added_count} items, skipped {skipped_count} duplicates"}

# ==================== LEAD ENDPOINTS ====================

@api_router.post("/leads", response_model=Lead)
async def create_lead(lead_data: LeadCreate, current_user: dict = Depends(get_current_user)):
    lead_count = await db.leads.count_documents({})
    lead_id = f"LEAD{str(lead_count + 1).zfill(4)}"
    
    lead_dict = lead_data.model_dump()
    lead_dict["lead_id"] = lead_id
    lead_dict["created_by_user_id"] = current_user["user_id"]
    lead_dict["lead_date"] = datetime.now(timezone.utc).isoformat()
    lead_dict["status"] = "Open"
    
    await db.leads.insert_one(lead_dict)
    
    # Log
    await log_document_action("LEAD", lead_id, "CREATED", current_user["user_id"])
    
    return lead_dict

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(
    status: Optional[str] = None,
    my_leads: bool = False,
    user_id: Optional[str] = None,
    period: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    # Status filter
    if status:
        query["status"] = status
    
    # User filter (Admin can filter by user, Sales User sees only their data)
    if current_user["role"] != "Admin":
        query["created_by_user_id"] = current_user["user_id"]
    elif user_id and user_id != "ALL":
        query["created_by_user_id"] = user_id
    
    # Date filter based on period
    if period and period != "all_time":
        current_date = datetime.now(timezone.utc)
        
        if period == "weekly":
            start_date = current_date - timedelta(days=7)
        elif period == "monthly":
            start_date = current_date - timedelta(days=30)
        elif period == "ytd":
            current_year = current_date.year
            if current_date.month >= 4:
                start_date = datetime(current_year, 4, 1, tzinfo=timezone.utc)
            else:
                start_date = datetime(current_year - 1, 4, 1, tzinfo=timezone.utc)
        elif period == "custom" and from_date and to_date:
            start_date = datetime.fromisoformat(from_date).replace(tzinfo=timezone.utc)
            current_date = datetime.fromisoformat(to_date).replace(tzinfo=timezone.utc)
        else:
            start_date = None
        
        if start_date:
            query["lead_date"] = {"$gte": start_date.isoformat(), "$lte": current_date.isoformat()}
    
    leads = await db.leads.find(query, {"_id": 0}).to_list(1000)
    return leads

@api_router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@api_router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead_data: LeadCreate, current_user: dict = Depends(get_current_user)):
    existing_lead = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    if not existing_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead_dict = lead_data.model_dump()
    await db.leads.update_one({"lead_id": lead_id}, {"$set": lead_dict})
    
    # Log
    await log_document_action("LEAD", lead_id, "UPDATED", current_user["user_id"])
    
    lead_dict["lead_id"] = lead_id
    lead_dict["created_by_user_id"] = existing_lead["created_by_user_id"]
    lead_dict["lead_date"] = existing_lead["lead_date"]
    lead_dict["status"] = existing_lead["status"]
    return lead_dict

@api_router.post("/leads/{lead_id}/convert")
async def convert_lead_to_quotation(lead_id: str, current_user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead["status"] == "Converted":
        raise HTTPException(status_code=400, detail="Lead already converted")
    
    # Mark lead as converted
    await db.leads.update_one({"lead_id": lead_id}, {"$set": {"status": "Converted"}})
    
    # Log
    await log_document_action("LEAD", lead_id, "CONVERTED", current_user["user_id"])
    
    return {"message": "Lead converted successfully", "lead_id": lead_id}

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Delete the lead
    await db.leads.delete_one({"lead_id": lead_id})
    
    # Log the deletion
    await log_document_action("LEAD", lead_id, "DELETED", current_user["user_id"])
    
    return {"message": "Lead deleted successfully"}

@api_router.get("/leads/{lead_id}/pdf")
async def generate_lead_pdf(lead_id: str, current_user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    party = await db.parties.find_one({"party_id": lead["party_id"]}, {"_id": 0})
    user = await db.users.find_one({"user_id": lead["created_by_user_id"]}, {"_id": 0})
    
    # Load letterhead image
    letterhead_base64 = ""
    try:
        import base64
        letterhead_path = Path(__file__).parent / 'letterhead.png'
        if letterhead_path.exists():
            with open(letterhead_path, 'rb') as f:
                letterhead_base64 = base64.b64encode(f.read()).decode('utf-8')
    except Exception as e:
        logger.error(f"Failed to load letterhead: {e}")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page {{ size: A4; margin: 0.5cm 1cm; }}
            body {{ font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 0; }}
            .header {{ margin-bottom: 15px; }}
            .header img {{ width: 100%; height: auto; max-height: 120px; object-fit: contain; }}
            .doc-title {{ font-size: 16px; font-weight: bold; color: #000; margin: 15px 0; text-align: center; background: #f0f0f0; padding: 10px; }}
            .info-section {{ margin: 15px 0; }}
            .info-label {{ font-weight: bold; display: inline-block; width: 150px; }}
            .info-value {{ display: inline-block; }}
            .section-title {{ font-size: 13px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; background: #e0e0e0; padding: 8px; }}
            .content-box {{ border: 1px solid #ddd; padding: 15px; margin: 10px 0; background: #fafafa; }}
        </style>
    </head>
    <body>
        <div class="header">
            {f'<img src="data:image/png;base64,{letterhead_base64}" alt="Letterhead" />' if letterhead_base64 else '''
            <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">
                <div style="font-size: 16px; font-weight: bold;">SUNSTORE KOLHAPUR</div>
                <div style="font-size: 9px;">
                    Plot No. 1497, Shamrao Kapadi Complex, Opposite HDFC Bank, Konda Lane, Laxmipuri,<br>
                    Kolhapur - 416002, Maharashtra, India<br>
                    Phone: 0231 - 2644990 / 91 / 92 | Email: sales@sunstorekolhapur.com<br>
                    <strong>GST ID: 27ABAFM4283A1ZL</strong>
                </div>
            </div>
            '''}
        </div>
        
        <div class="doc-title">LEAD INFORMATION</div>
        
        <div class="info-section">
            <div><span class="info-label">Lead ID:</span> <span class="info-value">{lead['lead_id']}</span></div>
            <div><span class="info-label">Lead Date:</span> <span class="info-value">{lead['lead_date'][:10]}</span></div>
            <div><span class="info-label">Status:</span> <span class="info-value" style="color: {'green' if lead['status'] == 'Open' else ('blue' if lead['status'] == 'Converted' else 'red')}; font-weight: bold;">{lead['status']}</span></div>
            <div><span class="info-label">Created By:</span> <span class="info-value">{user.get('name', 'N/A') if user else 'N/A'}</span></div>
        </div>
        
        <div class="section-title">PARTY DETAILS</div>
        <div class="content-box">
            <div><strong>Party Name:</strong> {party['party_name'] if party else 'N/A'}</div>
            <div><strong>Address:</strong> {party['address'] if party else 'N/A'}, {party.get('city', 'N/A')}, {party.get('state', 'N/A')} - {party.get('pincode', 'N/A')}</div>
            <div><strong>GST Number:</strong> {party.get('GST_number', 'N/A') if party else 'N/A'}</div>
            <div><strong>Contact Person:</strong> {party.get('contact_person', 'N/A') if party else 'N/A'}</div>
            <div><strong>Mobile:</strong> {party.get('mobile', 'N/A') if party else 'N/A'}</div>
            <div><strong>Email:</strong> {party.get('email', 'N/A') if party else 'N/A'}</div>
        </div>
        
        <div class="section-title">LEAD DETAILS</div>
        <div class="content-box">
            <div><strong>Contact Name:</strong> {lead['contact_name']}</div>
            <div><strong>Referred By:</strong> {lead.get('referred_by', 'N/A')}</div>
        </div>
        
        <div class="section-title">REQUIREMENT SUMMARY</div>
        <div class="content-box">
            {lead['requirement_summary']}
        </div>
        
        <div class="section-title">NOTES</div>
        <div class="content-box">
            {lead.get('notes', 'No additional notes')}
        </div>
        
        <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666;">
            <p>This is a computer-generated document. No signature is required.</p>
            <p>Generated on: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
        </div>
    </body>
    </html>
    """
    
    pdf = HTML(string=html_content).write_pdf()
    
    # Generate filename with username and timestamp
    username = current_user["name"].replace(" ", "_").lower()[:10]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"lead_{lead['lead_id']}_{username}_{timestamp}.pdf"
    
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ==================== QUOTATION ENDPOINTS ====================

async def get_next_number(doc_type: str) -> str:
    settings = await db.settings.find_one({"settings_id": "default"}, {"_id": 0})
    if not settings:
        settings = {
            "quotation_prefix": "QTN",
            "pi_prefix": "PI",
            "soa_prefix": "SOA"
        }
    
    if doc_type == "quotation":
        count = await db.quotations.count_documents({})
        prefix = settings.get("quotation_prefix", "QTN")
    elif doc_type == "pi":
        count = await db.proforma_invoices.count_documents({})
        prefix = settings.get("pi_prefix", "PI")
    elif doc_type == "soa":
        count = await db.soa.count_documents({})
        prefix = settings.get("soa_prefix", "SOA")
    else:
        prefix = "DOC"
        count = 0
    
    return f"{prefix}{str(count + 1).zfill(4)}"

@api_router.post("/quotations", response_model=Quotation)
async def create_quotation(quotation_data: QuotationCreate, current_user: dict = Depends(get_current_user)):
    base_quotation_no = await get_next_number("quotation")
    # Get first 4 letters of user name (uppercase)
    user_prefix = current_user["name"][:4].upper() if current_user.get("name") else "USER"
    quotation_no = f"{base_quotation_no}/{user_prefix}"
    quotation_id = f"QTN{await db.quotations.count_documents({}) + 1:04d}"
    
    quotation_dict = quotation_data.model_dump()
    quotation_dict["quotation_id"] = quotation_id
    quotation_dict["quotation_no"] = quotation_no
    quotation_dict["created_by_user_id"] = current_user["user_id"]
    
    await db.quotations.insert_one(quotation_dict)
    
    # Log
    await log_document_action("QUOTATION", quotation_id, "CREATED", current_user["user_id"])
    
    return quotation_dict

@api_router.get("/quotations", response_model=List[Quotation])
async def get_quotations(
    my_docs: bool = False,
    party_id: Optional[str] = None,
    user_id: Optional[str] = None,
    period: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    # User filter (Admin can filter by user, Sales User sees only their data)
    if current_user["role"] != "Admin":
        query["created_by_user_id"] = current_user["user_id"]
    elif user_id and user_id != "ALL":
        query["created_by_user_id"] = user_id
    
    # Party filter
    if party_id:
        query["party_id"] = party_id
    
    # Date filter based on period
    if period and period != "all_time":
        current_date = datetime.now(timezone.utc)
        
        if period == "weekly":
            start_date = current_date - timedelta(days=7)
        elif period == "monthly":
            start_date = current_date - timedelta(days=30)
        elif period == "ytd":
            current_year = current_date.year
            if current_date.month >= 4:
                start_date = datetime(current_year, 4, 1, tzinfo=timezone.utc)
            else:
                start_date = datetime(current_year - 1, 4, 1, tzinfo=timezone.utc)
        elif period == "custom" and from_date and to_date:
            start_date = datetime.fromisoformat(from_date).replace(tzinfo=timezone.utc)
            current_date = datetime.fromisoformat(to_date).replace(tzinfo=timezone.utc)
        else:
            start_date = None
        
        if start_date:
            query["date"] = {"$gte": start_date.isoformat(), "$lte": current_date.isoformat()}
    
    quotations = await db.quotations.find(query, {"_id": 0}).to_list(1000)
    return quotations

@api_router.get("/quotations/{quotation_id}", response_model=Quotation)
async def get_quotation(quotation_id: str, current_user: dict = Depends(get_current_user)):
    quotation = await db.quotations.find_one({"quotation_id": quotation_id}, {"_id": 0})
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quotation

@api_router.put("/quotations/{quotation_id}", response_model=Quotation)
async def update_quotation(quotation_id: str, quotation_data: QuotationCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.quotations.find_one({"quotation_id": quotation_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    quotation_dict = quotation_data.model_dump()
    await db.quotations.update_one({"quotation_id": quotation_id}, {"$set": quotation_dict})
    
    # Log
    await log_document_action("QUOTATION", quotation_id, "UPDATED", current_user["user_id"])
    
    quotation_dict["quotation_id"] = quotation_id
    quotation_dict["quotation_no"] = existing["quotation_no"]
    quotation_dict["created_by_user_id"] = existing["created_by_user_id"]
    return quotation_dict

@api_router.delete("/quotations/{quotation_id}")
async def delete_quotation(quotation_id: str, current_user: dict = Depends(get_current_user)):
    quotation = await db.quotations.find_one({"quotation_id": quotation_id}, {"_id": 0})
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    # Delete the quotation
    await db.quotations.delete_one({"quotation_id": quotation_id})
    
    # Log the deletion
    await log_document_action("QUOTATION", quotation_id, "DELETED", current_user["user_id"])
    
    return {"message": "Quotation deleted successfully"}

@api_router.post("/quotations/{quotation_id}/duplicate")
async def duplicate_quotation(quotation_id: str, current_user: dict = Depends(get_current_user)):
    quotation = await db.quotations.find_one({"quotation_id": quotation_id}, {"_id": 0})
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    base_quotation_no = await get_next_number("quotation")
    user_prefix = current_user["name"][:4].upper() if current_user.get("name") else "USER"
    new_quotation_no = f"{base_quotation_no}/{user_prefix}"
    new_quotation_id = f"QTN{await db.quotations.count_documents({}) + 1:04d}"
    
    new_quotation = quotation.copy()
    new_quotation["quotation_id"] = new_quotation_id
    new_quotation["quotation_no"] = new_quotation_no
    new_quotation["created_by_user_id"] = current_user["user_id"]
    new_quotation["date"] = datetime.now(timezone.utc).isoformat()
    new_quotation["is_locked"] = False
    new_quotation["quotation_status"] = None
    
    await db.quotations.insert_one(new_quotation)
    
    # Log
    await log_document_action("QUOTATION", new_quotation_id, "DUPLICATED", current_user["user_id"])
    
    return {"message": "Quotation duplicated successfully", "quotation_id": new_quotation_id, "quotation_no": new_quotation_no}

@api_router.post("/quotations/{quotation_id}/lock")
async def lock_quotation(quotation_id: str, current_user: dict = Depends(get_current_user)):
    quotation = await db.quotations.find_one({"quotation_id": quotation_id}, {"_id": 0})
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    await db.quotations.update_one({"quotation_id": quotation_id}, {"$set": {"is_locked": True}})
    await log_document_action("QUOTATION", quotation_id, "LOCKED", current_user["user_id"])
    
    return {"message": "Quotation locked successfully"}

@api_router.post("/quotations/{quotation_id}/convert-to-pi")
async def convert_quotation_to_pi(quotation_id: str, current_user: dict = Depends(get_current_user)):
    quotation = await db.quotations.find_one({"quotation_id": quotation_id}, {"_id": 0})
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    # Create PI from quotation
    pi_no = await get_next_number("pi")
    pi_id = f"PI{await db.proforma_invoices.count_documents({}) + 1:04d}"
    
    pi_dict = {
        "pi_id": pi_id,
        "pi_no": pi_no,
        "party_id": quotation["party_id"],
        "reference_document_id": quotation_id,
        "date": datetime.now(timezone.utc).isoformat(),
        "validity_days": quotation.get("validity_days", 30),
        "payment_terms": quotation.get("payment_terms", ""),
        "delivery_terms": quotation.get("delivery_terms", ""),
        "remarks": quotation.get("remarks", ""),
        "items": quotation.get("items", []),
        "created_by_user_id": current_user["user_id"]
    }
    
    await db.proforma_invoices.insert_one(pi_dict)
    
    # Log
    await log_document_action("PROFORMA_INVOICE", pi_id, "CREATED_FROM_QUOTATION", current_user["user_id"])
    
    return {"message": "Converted to Proforma Invoice", "pi_id": pi_id, "pi_no": pi_no}

@api_router.post("/quotations/{quotation_id}/convert-to-soa")
async def convert_quotation_to_soa(quotation_id: str, current_user: dict = Depends(get_current_user)):
    quotation = await db.quotations.find_one({"quotation_id": quotation_id}, {"_id": 0})
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    # Create SOA from quotation
    soa_no = await get_next_number("soa")
    soa_id = f"SOA{await db.soa.count_documents({}) + 1:04d}"
    
    soa_dict = {
        "soa_id": soa_id,
        "soa_no": soa_no,
        "party_id": quotation["party_id"],
        "party_confirmation_ID": "",
        "reference_document_id": quotation_id,
        "date": datetime.now(timezone.utc).isoformat(),
        "terms_and_conditions": "",
        "soa_status": "In Process",
        "remarks": quotation.get("remarks", ""),
        "items": quotation.get("items", []),
        "created_by_user_id": current_user["user_id"]
    }
    
    await db.soa.insert_one(soa_dict)
    
    # Log
    await log_document_action("SOA", soa_id, "CREATED_FROM_QUOTATION", current_user["user_id"])
    
    return {"message": "Converted to SOA", "soa_id": soa_id, "soa_no": soa_no}

# ==================== PROFORMA INVOICE ENDPOINTS ====================

@api_router.post("/proforma-invoices", response_model=ProformaInvoice)
async def create_proforma_invoice(pi_data: ProformaInvoiceCreate, current_user: dict = Depends(get_current_user)):
    pi_no = await get_next_number("pi")
    pi_id = f"PI{await db.proforma_invoices.count_documents({}) + 1:04d}"
    
    pi_dict = pi_data.model_dump()
    pi_dict["pi_id"] = pi_id
    pi_dict["pi_no"] = pi_no
    pi_dict["created_by_user_id"] = current_user["user_id"]
    
    await db.proforma_invoices.insert_one(pi_dict)
    
    # Log
    await log_document_action("PROFORMA_INVOICE", pi_id, "CREATED", current_user["user_id"])
    
    return pi_dict

@api_router.get("/proforma-invoices", response_model=List[ProformaInvoice])
async def get_proforma_invoices(
    my_docs: bool = False,
    party_id: Optional[str] = None,
    user_id: Optional[str] = None,
    period: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    # User filter (Admin can filter by user, Sales User sees only their data)
    if current_user["role"] != "Admin":
        query["created_by_user_id"] = current_user["user_id"]
    elif user_id and user_id != "ALL":
        query["created_by_user_id"] = user_id
    
    # Party filter
    if party_id:
        query["party_id"] = party_id
    
    # Date filter based on period
    if period and period != "all_time":
        current_date = datetime.now(timezone.utc)
        
        if period == "weekly":
            start_date = current_date - timedelta(days=7)
        elif period == "monthly":
            start_date = current_date - timedelta(days=30)
        elif period == "ytd":
            current_year = current_date.year
            if current_date.month >= 4:
                start_date = datetime(current_year, 4, 1, tzinfo=timezone.utc)
            else:
                start_date = datetime(current_year - 1, 4, 1, tzinfo=timezone.utc)
        elif period == "custom" and from_date and to_date:
            start_date = datetime.fromisoformat(from_date).replace(tzinfo=timezone.utc)
            current_date = datetime.fromisoformat(to_date).replace(tzinfo=timezone.utc)
        else:
            start_date = None
        
        if start_date:
            query["date"] = {"$gte": start_date.isoformat(), "$lte": current_date.isoformat()}
    
    pis = await db.proforma_invoices.find(query, {"_id": 0}).to_list(1000)
    return pis

@api_router.get("/proforma-invoices/{pi_id}", response_model=ProformaInvoice)
async def get_proforma_invoice(pi_id: str, current_user: dict = Depends(get_current_user)):
    pi = await db.proforma_invoices.find_one({"pi_id": pi_id}, {"_id": 0})
    if not pi:
        raise HTTPException(status_code=404, detail="Proforma Invoice not found")
    return pi

@api_router.put("/proforma-invoices/{pi_id}", response_model=ProformaInvoice)
async def update_proforma_invoice(pi_id: str, pi_data: ProformaInvoiceCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.proforma_invoices.find_one({"pi_id": pi_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Proforma Invoice not found")
    
    pi_dict = pi_data.model_dump()
    await db.proforma_invoices.update_one({"pi_id": pi_id}, {"$set": pi_dict})
    
    # Log
    await log_document_action("PROFORMA_INVOICE", pi_id, "UPDATED", current_user["user_id"])
    
    pi_dict["pi_id"] = pi_id
    pi_dict["pi_no"] = existing["pi_no"]
    pi_dict["created_by_user_id"] = existing["created_by_user_id"]
    return pi_dict

@api_router.delete("/proforma-invoices/{pi_id}")
async def delete_proforma_invoice(pi_id: str, current_user: dict = Depends(get_current_user)):
    pi = await db.proforma_invoices.find_one({"pi_id": pi_id}, {"_id": 0})
    if not pi:
        raise HTTPException(status_code=404, detail="Proforma Invoice not found")
    
    # Delete the PI
    await db.proforma_invoices.delete_one({"pi_id": pi_id})
    
    # Log the deletion
    await log_document_action("PROFORMA_INVOICE", pi_id, "DELETED", current_user["user_id"])
    
    return {"message": "Proforma Invoice deleted successfully"}

@api_router.post("/proforma-invoices/{pi_id}/duplicate")
async def duplicate_proforma_invoice(pi_id: str, current_user: dict = Depends(get_current_user)):
    pi = await db.proforma_invoices.find_one({"pi_id": pi_id}, {"_id": 0})
    if not pi:
        raise HTTPException(status_code=404, detail="Proforma Invoice not found")
    
    new_pi_no = await get_next_number("pi")
    new_pi_id = f"PI{await db.proforma_invoices.count_documents({}) + 1:04d}"
    
    new_pi = pi.copy()
    new_pi["pi_id"] = new_pi_id
    new_pi["pi_no"] = new_pi_no
    new_pi["created_by_user_id"] = current_user["user_id"]
    new_pi["date"] = datetime.now(timezone.utc).isoformat()
    new_pi["is_locked"] = False
    new_pi["pi_status"] = "PI Submitted"
    
    await db.proforma_invoices.insert_one(new_pi)
    await log_document_action("PROFORMA_INVOICE", new_pi_id, "DUPLICATED", current_user["user_id"])
    
    return {"message": "Proforma Invoice duplicated successfully", "pi_id": new_pi_id, "pi_no": new_pi_no}

@api_router.post("/proforma-invoices/{pi_id}/lock")
async def lock_proforma_invoice(pi_id: str, current_user: dict = Depends(get_current_user)):
    pi = await db.proforma_invoices.find_one({"pi_id": pi_id}, {"_id": 0})
    if not pi:
        raise HTTPException(status_code=404, detail="Proforma Invoice not found")
    
    await db.proforma_invoices.update_one({"pi_id": pi_id}, {"$set": {"is_locked": True}})
    await log_document_action("PROFORMA_INVOICE", pi_id, "LOCKED", current_user["user_id"])
    
    return {"message": "Proforma Invoice locked successfully"}

@api_router.post("/proforma-invoices/{pi_id}/convert-to-soa")
async def convert_pi_to_soa(pi_id: str, current_user: dict = Depends(get_current_user)):
    pi = await db.proforma_invoices.find_one({"pi_id": pi_id}, {"_id": 0})
    if not pi:
        raise HTTPException(status_code=404, detail="Proforma Invoice not found")
    
    # Create SOA from PI
    soa_no = await get_next_number("soa")
    soa_id = f"SOA{await db.soa.count_documents({}) + 1:04d}"
    
    soa_dict = {
        "soa_id": soa_id,
        "soa_no": soa_no,
        "party_confirmation_ID": "",
        "party_id": pi["party_id"],
        "reference_document_id": pi_id,
        "date": datetime.now(timezone.utc).isoformat(),
        "terms_and_conditions": "",
        "items": pi.get("items", []),
        "created_by_user_id": current_user["user_id"]
    }
    
    await db.soa.insert_one(soa_dict)
    
    # Log
    await log_document_action("SOA", soa_id, "CREATED_FROM_PI", current_user["user_id"])
    
    return {"message": "Converted to SOA", "soa_id": soa_id, "soa_no": soa_no}

@api_router.post("/proforma-invoices/{pi_id}/convert-to-quotation")
async def convert_pi_to_quotation(pi_id: str, current_user: dict = Depends(get_current_user)):
    pi = await db.proforma_invoices.find_one({"pi_id": pi_id}, {"_id": 0})
    if not pi:
        raise HTTPException(status_code=404, detail="Proforma Invoice not found")
    
    # Create Quotation from PI
    base_quotation_no = await get_next_number("quotation")
    user_prefix = current_user["name"][:4].upper() if current_user.get("name") else "USER"
    quotation_no = f"{base_quotation_no}/{user_prefix}"
    quotation_id = f"QTN{await db.quotations.count_documents({}) + 1:04d}"
    
    quotation_dict = {
        "quotation_id": quotation_id,
        "quotation_no": quotation_no,
        "party_id": pi["party_id"],
        "reference_lead_id": None,
        "date": datetime.now(timezone.utc).isoformat(),
        "validity_days": pi.get("validity_days", 30),
        "payment_terms": pi.get("payment_terms", ""),
        "delivery_terms": pi.get("delivery_terms", ""),
        "quotation_status": None,
        "remarks": pi.get("remarks", ""),
        "items": pi.get("items", []),
        "created_by_user_id": current_user["user_id"]
    }
    
    await db.quotations.insert_one(quotation_dict)
    
    # Log
    await log_document_action("QUOTATION", quotation_id, "CREATED_FROM_PI", current_user["user_id"])
    
    return {"message": "Converted to Quotation", "quotation_id": quotation_id, "quotation_no": quotation_no}

# ==================== SOA ENDPOINTS ====================

@api_router.post("/soa", response_model=SOA)
async def create_soa(soa_data: SOACreate, current_user: dict = Depends(get_current_user)):
    soa_no = await get_next_number("soa")
    soa_id = f"SOA{await db.soa.count_documents({}) + 1:04d}"
    
    soa_dict = soa_data.model_dump()
    soa_dict["soa_id"] = soa_id
    soa_dict["soa_no"] = soa_no
    soa_dict["created_by_user_id"] = current_user["user_id"]
    
    await db.soa.insert_one(soa_dict)
    
    # Log
    await log_document_action("SOA", soa_id, "CREATED", current_user["user_id"])
    
    return soa_dict

@api_router.get("/soa", response_model=List[SOA])
async def get_soas(
    my_docs: bool = False,
    party_id: Optional[str] = None,
    user_id: Optional[str] = None,
    period: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    # User filter (Admin can filter by user, Sales User sees only their data)
    if current_user["role"] != "Admin":
        query["created_by_user_id"] = current_user["user_id"]
    elif user_id and user_id != "ALL":
        query["created_by_user_id"] = user_id
    
    # Party filter
    if party_id:
        query["party_id"] = party_id
    
    # Date filter based on period
    if period and period != "all_time":
        current_date = datetime.now(timezone.utc)
        
        if period == "weekly":
            start_date = current_date - timedelta(days=7)
        elif period == "monthly":
            start_date = current_date - timedelta(days=30)
        elif period == "ytd":
            current_year = current_date.year
            if current_date.month >= 4:
                start_date = datetime(current_year, 4, 1, tzinfo=timezone.utc)
            else:
                start_date = datetime(current_year - 1, 4, 1, tzinfo=timezone.utc)
        elif period == "custom" and from_date and to_date:
            start_date = datetime.fromisoformat(from_date).replace(tzinfo=timezone.utc)
            current_date = datetime.fromisoformat(to_date).replace(tzinfo=timezone.utc)
        else:
            start_date = None
        
        if start_date:
            query["date"] = {"$gte": start_date.isoformat(), "$lte": current_date.isoformat()}
    
    soas = await db.soa.find(query, {"_id": 0}).to_list(1000)
    return soas

@api_router.get("/soa/{soa_id}", response_model=SOA)
async def get_soa(soa_id: str, current_user: dict = Depends(get_current_user)):
    soa = await db.soa.find_one({"soa_id": soa_id}, {"_id": 0})
    if not soa:
        raise HTTPException(status_code=404, detail="SOA not found")
    return soa

@api_router.put("/soa/{soa_id}", response_model=SOA)
async def update_soa(soa_id: str, soa_data: SOACreate, current_user: dict = Depends(get_current_user)):
    existing = await db.soa.find_one({"soa_id": soa_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="SOA not found")
    
    soa_dict = soa_data.model_dump()
    await db.soa.update_one({"soa_id": soa_id}, {"$set": soa_dict})
    
    # Log
    await log_document_action("SOA", soa_id, "UPDATED", current_user["user_id"])
    
    soa_dict["soa_id"] = soa_id
    soa_dict["soa_no"] = existing["soa_no"]
    soa_dict["created_by_user_id"] = existing["created_by_user_id"]
    return soa_dict

@api_router.delete("/soa/{soa_id}")
async def delete_soa(soa_id: str, current_user: dict = Depends(get_current_user)):
    soa = await db.soa.find_one({"soa_id": soa_id}, {"_id": 0})
    if not soa:
        raise HTTPException(status_code=404, detail="SOA not found")
    
    # Delete the SOA
    await db.soa.delete_one({"soa_id": soa_id})
    
    # Log the deletion
    await log_document_action("SOA", soa_id, "DELETED", current_user["user_id"])
    
    return {"message": "SOA deleted successfully"}

@api_router.post("/soa/{soa_id}/duplicate")
async def duplicate_soa(soa_id: str, current_user: dict = Depends(get_current_user)):
    soa = await db.soa.find_one({"soa_id": soa_id}, {"_id": 0})
    if not soa:
        raise HTTPException(status_code=404, detail="SOA not found")
    
    new_soa_no = await get_next_number("soa")
    new_soa_id = f"SOA{await db.soa.count_documents({}) + 1:04d}"
    
    new_soa = soa.copy()
    new_soa["soa_id"] = new_soa_id
    new_soa["soa_no"] = new_soa_no
    new_soa["created_by_user_id"] = current_user["user_id"]
    new_soa["date"] = datetime.now(timezone.utc).isoformat()
    new_soa["is_locked"] = False
    new_soa["soa_status"] = "In Process"
    
    await db.soa.insert_one(new_soa)
    await log_document_action("SOA", new_soa_id, "DUPLICATED", current_user["user_id"])
    
    return {"message": "SOA duplicated successfully", "soa_id": new_soa_id, "soa_no": new_soa_no}

@api_router.post("/soa/{soa_id}/lock")
async def lock_soa(soa_id: str, current_user: dict = Depends(get_current_user)):
    soa = await db.soa.find_one({"soa_id": soa_id}, {"_id": 0})
    if not soa:
        raise HTTPException(status_code=404, detail="SOA not found")
    
    await db.soa.update_one({"soa_id": soa_id}, {"$set": {"is_locked": True}})
    await log_document_action("SOA", soa_id, "LOCKED", current_user["user_id"])
    
    return {"message": "SOA locked successfully"}

@api_router.post("/soa/{soa_id}/convert-to-quotation")
async def convert_soa_to_quotation(soa_id: str, current_user: dict = Depends(get_current_user)):
    soa = await db.soa.find_one({"soa_id": soa_id}, {"_id": 0})
    if not soa:
        raise HTTPException(status_code=404, detail="SOA not found")
    
    # Create Quotation from SOA
    base_quotation_no = await get_next_number("quotation")
    user_prefix = current_user["name"][:4].upper() if current_user.get("name") else "USER"
    quotation_no = f"{base_quotation_no}/{user_prefix}"
    quotation_id = f"QTN{await db.quotations.count_documents({}) + 1:04d}"
    
    quotation_dict = {
        "quotation_id": quotation_id,
        "quotation_no": quotation_no,
        "party_id": soa["party_id"],
        "reference_lead_id": None,
        "date": datetime.now(timezone.utc).isoformat(),
        "validity_days": 30,
        "payment_terms": "",
        "delivery_terms": "",
        "quotation_status": None,
        "remarks": soa.get("remarks", ""),
        "items": soa.get("items", []),
        "created_by_user_id": current_user["user_id"]
    }
    
    await db.quotations.insert_one(quotation_dict)
    
    # Log
    await log_document_action("QUOTATION", quotation_id, "CREATED_FROM_SOA", current_user["user_id"])
    
    return {"message": "Converted to Quotation", "quotation_id": quotation_id, "quotation_no": quotation_no}

@api_router.post("/soa/{soa_id}/convert-to-pi")
async def convert_soa_to_pi(soa_id: str, current_user: dict = Depends(get_current_user)):
    soa = await db.soa.find_one({"soa_id": soa_id}, {"_id": 0})
    if not soa:
        raise HTTPException(status_code=404, detail="SOA not found")
    
    # Create PI from SOA
    pi_no = await get_next_number("pi")
    pi_id = f"PI{await db.proforma_invoices.count_documents({}) + 1:04d}"
    
    pi_dict = {
        "pi_id": pi_id,
        "pi_no": pi_no,
        "party_id": soa["party_id"],
        "reference_document_id": soa_id,
        "date": datetime.now(timezone.utc).isoformat(),
        "validity_days": 30,
        "payment_terms": "",
        "delivery_terms": "",
        "pi_status": "PI Submitted",
        "remarks": soa.get("remarks", ""),
        "items": soa.get("items", []),
        "created_by_user_id": current_user["user_id"]
    }
    
    await db.proforma_invoices.insert_one(pi_dict)
    
    # Log
    await log_document_action("PROFORMA_INVOICE", pi_id, "CREATED_FROM_SOA", current_user["user_id"])
    
    return {"message": "Converted to Proforma Invoice", "pi_id": pi_id, "pi_no": pi_no}

# ==================== PDF GENERATION ====================

@api_router.get("/quotations/{quotation_id}/pdf")
async def generate_quotation_pdf(quotation_id: str, current_user: dict = Depends(get_current_user)):
    # CRITICAL: Fetch document fresh from DB by document_id
    quotation = await db.quotations.find_one({"quotation_id": quotation_id}, {"_id": 0})
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    # CRITICAL: Resolve party strictly by party_id - no fallback
    party = await db.parties.find_one({"party_id": quotation["party_id"]}, {"_id": 0})
    
    # Use party_name_snapshot if available (for data integrity), otherwise use fresh party lookup
    if quotation.get("party_name_snapshot") and party:
        party["party_name"] = quotation["party_name_snapshot"]
    
    # CRITICAL: Items must use stored values (UOM, item_name, etc.), not item master
    # Only fallback to item master if stored values are missing
    enriched_items = []
    for item in quotation["items"]:
        enriched_item = item.copy()
        
        # Use stored values first (IMMUTABLE data captured at save time)
        enriched_item['item_name'] = item.get('item_name', '')
        enriched_item['hsn'] = item.get('HSN', '')
        enriched_item['uom'] = item.get('UOM', 'Nos')  # CRITICAL: Use stored UOM
        enriched_item['description'] = item.get('description', '')
        
        # Only fetch from item master if stored values are empty (backward compatibility)
        if not enriched_item['item_name'] or not enriched_item['uom']:
            item_details = await db.items.find_one({"item_id": item["item_id"]}, {"_id": 0})
            if item_details:
                enriched_item['hsn'] = enriched_item['hsn'] or item_details.get('HSN', '')
                enriched_item['description'] = enriched_item['description'] or item_details.get('description', '')
                enriched_item['item_name'] = enriched_item['item_name'] or item_details.get('item_name', '')
                enriched_item['uom'] = enriched_item['uom'] or item_details.get('UOM', 'Nos')
        
        enriched_items.append(enriched_item)
    
    # Calculate totals
    subtotal = sum(item["taxable_amount"] for item in quotation["items"])
    tax_total = sum(item["tax_amount"] for item in quotation["items"])
    grand_total = sum(item["total_amount"] for item in quotation["items"])
    
    html_content = generate_document_html(
        doc_type="QUOTATION",
        doc_no=quotation["quotation_no"],
        doc_date=quotation["date"],
        party=party,
        items=enriched_items,
        subtotal=subtotal,
        tax_total=tax_total,
        grand_total=grand_total,
        remarks=quotation.get("remarks", ""),
        payment_terms=quotation.get("payment_terms", ""),
        delivery_terms=quotation.get("delivery_terms", ""),
        is_quotation=True
    )
    
    pdf = HTML(string=html_content).write_pdf()
    
    # Generate filename with username and timestamp
    username = current_user["name"].replace(" ", "_").lower()[:10]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    doc_no_safe = quotation['quotation_no'].replace("/", "_")
    filename = f"quotation_{doc_no_safe}_{username}_{timestamp}.pdf"
    
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/proforma-invoices/{pi_id}/pdf")
async def generate_pi_pdf(pi_id: str, current_user: dict = Depends(get_current_user)):
    # CRITICAL: Fetch document fresh from DB by document_id
    pi = await db.proforma_invoices.find_one({"pi_id": pi_id}, {"_id": 0})
    if not pi:
        raise HTTPException(status_code=404, detail="Proforma Invoice not found")
    
    # CRITICAL: Resolve party strictly by party_id - no fallback
    party = await db.parties.find_one({"party_id": pi["party_id"]}, {"_id": 0})
    
    # Use party_name_snapshot if available (for data integrity)
    if pi.get("party_name_snapshot") and party:
        party["party_name"] = pi["party_name_snapshot"]
    
    # CRITICAL: Items must use stored values (UOM, item_name, etc.)
    enriched_items = []
    for item in pi["items"]:
        enriched_item = item.copy()
        
        # Use stored values first (IMMUTABLE)
        enriched_item['item_name'] = item.get('item_name', '')
        enriched_item['hsn'] = item.get('HSN', '')
        enriched_item['uom'] = item.get('UOM', 'Nos')
        enriched_item['description'] = item.get('description', '')
        
        # Only fetch from item master if stored values are empty
        if not enriched_item['item_name'] or not enriched_item['uom']:
            item_details = await db.items.find_one({"item_id": item["item_id"]}, {"_id": 0})
            if item_details:
                enriched_item['hsn'] = enriched_item['hsn'] or item_details.get('HSN', '')
                enriched_item['description'] = enriched_item['description'] or item_details.get('description', '')
                enriched_item['item_name'] = enriched_item['item_name'] or item_details.get('item_name', '')
                enriched_item['uom'] = enriched_item['uom'] or item_details.get('UOM', 'Nos')
        
        enriched_items.append(enriched_item)
    
    # Calculate totals
    subtotal = sum(item["taxable_amount"] for item in pi["items"])
    tax_total = sum(item["tax_amount"] for item in pi["items"])
    grand_total = sum(item["total_amount"] for item in pi["items"])
    
    html_content = generate_document_html(
        doc_type="PROFORMA INVOICE",
        doc_no=pi["pi_no"],
        doc_date=pi["date"],
        party=party,
        items=enriched_items,
        subtotal=subtotal,
        tax_total=tax_total,
        grand_total=grand_total,
        remarks=pi.get("remarks", ""),
        payment_terms=pi.get("payment_terms", ""),
        delivery_terms=pi.get("delivery_terms", ""),
        is_quotation=False
    )
    
    pdf = HTML(string=html_content).write_pdf()
    
    # Generate filename with username and timestamp
    username = current_user["name"].replace(" ", "_").lower()[:10]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    doc_no_safe = pi['pi_no'].replace("/", "_")
    filename = f"proforma_invoice_{doc_no_safe}_{username}_{timestamp}.pdf"
    
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/soa/{soa_id}/pdf")
async def generate_soa_pdf(soa_id: str, current_user: dict = Depends(get_current_user)):
    soa = await db.soa.find_one({"soa_id": soa_id}, {"_id": 0})
    if not soa:
        raise HTTPException(status_code=404, detail="SOA not found")
    
    party = await db.parties.find_one({"party_id": soa["party_id"]}, {"_id": 0})
    
    # Enrich items with full details from item master (batch fetch to avoid N+1)
    item_ids = [item["item_id"] for item in soa["items"]]
    items_cursor = await db.items.find({"item_id": {"$in": item_ids}}, {"_id": 0}).to_list(1000)
    items_map = {i["item_id"]: i for i in items_cursor}
    
    enriched_items = []
    for item in soa["items"]:
        enriched_item = item.copy()
        item_details = items_map.get(item["item_id"])
        if item_details:
            enriched_item['hsn'] = item_details.get('HSN', '')
            enriched_item['description'] = item_details.get('description', '')
            enriched_item['item_name'] = item_details.get('item_name', '')
            enriched_item['uom'] = item_details.get('UOM', 'Nos')
        enriched_items.append(enriched_item)
    
    # Calculate totals
    subtotal = sum(item["taxable_amount"] for item in soa["items"])
    tax_total = sum(item["tax_amount"] for item in soa["items"])
    grand_total = sum(item["total_amount"] for item in soa["items"])
    
    html_content = generate_document_html(
        doc_type="SALES ORDER ACKNOWLEDGEMENT",
        doc_no=soa["soa_no"],
        doc_date=soa["date"],
        party=party,
        items=enriched_items,
        subtotal=subtotal,
        tax_total=tax_total,
        grand_total=grand_total,
        remarks=soa.get("remarks", ""),
        payment_terms=soa.get("payment_terms", ""),
        delivery_terms=soa.get("delivery_terms", ""),
        party_confirmation_id=soa.get("party_confirmation_ID", ""),
        is_soa=True,
        is_quotation=False
    )
    
    pdf = HTML(string=html_content).write_pdf()
    
    # Generate filename with username and timestamp
    username = current_user["name"].replace(" ", "_").lower()[:10]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    doc_no_safe = soa['soa_no'].replace("/", "_")
    filename = f"soa_{doc_no_safe}_{username}_{timestamp}.pdf"
    
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

async def get_item_details(item_id: str):
    """Fetch item details from database"""
    item = await db.items.find_one({"item_id": item_id}, {"_id": 0})
    return item if item else {}

def generate_document_html(
    doc_type: str,
    doc_no: str,
    doc_date: str,
    party: dict,
    items: List[dict],
    subtotal: float,
    tax_total: float,
    grand_total: float,
    remarks: str = "",
    payment_terms: str = "",
    delivery_terms: str = "",
    party_confirmation_id: str = "",
    is_soa: bool = False,
    is_quotation: bool = False
):
    # Intro paragraph - different for Quotation vs PI/SOA
    if is_quotation:
        intro_paragraph = "Dear Sir,<br>We thank you for your enquiry and we are pleased to submit our <strong>offer</strong> as detailed below."
    else:
        intro_paragraph = "Dear Sir,<br>We thank you for your enquiry and we are pleased to submit our <strong>order</strong> as detailed below."
    
    # Check if any item has discount > 0
    has_discount = any(item.get('discount_percent', 0) > 0 for item in items)
    
    # Build items table rows based on discount presence
    items_html = ""
    for idx, item in enumerate(items, 1):
        rate = item['rate']
        discount = item.get('discount_percent', 0)
        
        if has_discount:
            # Full table with List Price, Disc%, Rate columns
            list_price = rate / (1 - discount / 100) if discount > 0 else rate
            items_html += f"""
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 10px;">{idx}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">{item.get('item_name', item.get('item_id', ''))}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">{item.get('hsn', '')}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">{item.get('description', '')}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 10px;">{item['qty']:.1f} {item.get('uom', 'Nos')}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 10px;">₹{list_price:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 10px;">{discount:.2f}%</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 10px;">₹{rate:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 10px;"><strong>₹{item['taxable_amount']:.2f}</strong></td>
            </tr>
            """
        else:
            # Simplified table: Sr, Item, HSN/SAC, Description, Quantity, Rate, Amount
            items_html += f"""
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 10px;">{idx}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">{item.get('item_name', item.get('item_id', ''))}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">{item.get('hsn', '')}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">{item.get('description', '')}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 10px;">{item['qty']:.1f} {item.get('uom', 'Nos')}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 10px;">₹{rate:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 10px;"><strong>₹{item['taxable_amount']:.2f}</strong></td>
            </tr>
            """
    
    # Build tax table rows (group by HSN)
    hsn_groups = {}
    for item in items:
        hsn = item.get('hsn', 'HSN/SAC')
        if not hsn:
            hsn = 'HSN/SAC'
        if hsn not in hsn_groups:
            hsn_groups[hsn] = {
                'taxable': 0,
                'sgst': 0,
                'cgst': 0,
                'igst': 0,
                'tax_type': item['tax_type']
            }
        hsn_groups[hsn]['taxable'] += item['taxable_amount']
        
        if item['tax_type'] == 'CGST+SGST':
            hsn_groups[hsn]['sgst'] += item['tax_amount'] / 2
            hsn_groups[hsn]['cgst'] += item['tax_amount'] / 2
        else:
            hsn_groups[hsn]['igst'] += item['tax_amount']
    
    tax_rows_html = ""
    total_sgst = 0
    total_cgst = 0
    total_igst = 0
    
    for hsn, values in hsn_groups.items():
        if values['tax_type'] == 'CGST+SGST':
            sgst_rate = (values['sgst'] / values['taxable'] * 100) if values['taxable'] > 0 else 9.0
            cgst_rate = (values['cgst'] / values['taxable'] * 100) if values['taxable'] > 0 else 9.0
            tax_rows_html += f"""
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">{hsn}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 10px;">₹{values['taxable']:,.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px;">({sgst_rate:.1f}%) ₹{values['sgst']:,.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px;">({cgst_rate:.1f}%) ₹{values['cgst']:,.2f}</td>
            </tr>
            """
            total_sgst += values['sgst']
            total_cgst += values['cgst']
        else:
            igst_rate = (values['igst'] / values['taxable'] * 100) if values['taxable'] > 0 else 18.0
            tax_rows_html += f"""
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">{hsn}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 10px;">₹{values['taxable']:,.2f}</td>
                <td colspan="2" style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px;">IGST ({igst_rate:.1f}%) ₹{values['igst']:,.2f}</td>
            </tr>
            """
            total_igst += values['igst']
    
    confirmation_row = ""
    if is_soa and party_confirmation_id:
        confirmation_row = f"<p style='margin: 10px 0;'><strong>Party Confirmation ID:</strong> {party_confirmation_id}</p>"
    
    # Dynamic Terms & Conditions with defaults
    delivery_display = delivery_terms if delivery_terms else "At Earliest"
    payment_display = payment_terms if payment_terms else "100% Advance along with Techno commercially Signed and Stamped PO"
    remarks_line = f"<strong>REMARKS :</strong> {remarks}<br>" if remarks else ""
    
    terms_and_conditions_html = f"""
    <div style="margin-top: 20px; padding: 15px; border: 1px solid #ccc; background: #f9f9f9; font-size: 9px; line-height: 1.6;">
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 10px; border-bottom: 1px solid #999; padding-bottom: 5px;">TERMS & CONDITIONS :</div>
        <strong>PRICES :</strong> Net, EX-Our Nagaon (Shiroli - P) Godown, inclusive of final discounts.<br>
        <strong>GST :</strong> Extra at actuals, <strong>INSURANCE :</strong> To be arranged by you. <strong>FREIGHT :</strong> Tempo charges extra at actuals.<br>
        <strong>PACKING & FORWARDING :</strong> NIL in standard conditions.<br>
        <strong>INSPECTION :</strong> At our Shiroli Facility, Kolhapur.<br>
        <strong>DELIVERY :</strong> {delivery_display}<br>
        <strong>PAYMENTS :</strong> {payment_display}<br>
        <strong>JURISDICTION :</strong> All transactions arising out of this quotation shall be subject to Kolhapur Courts jurisdiction only.<br>
        <strong>VALIDITY :</strong> Our offer is valid up to 15 days subject to manufacturer's price revision.<br>
        {remarks_line}
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #999;">
            <strong>OUR BANK DETAILS :</strong><br>
            HDFC Bank Ltd<br>
            Account No. 50200012223900<br>
            IFSC HDFC0001274
        </div>
    </div>
    """
    
    # Footer for all documents - left aligned, single line format
    footer_html = """
    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #999; font-size: 9px; text-align: left;">
        <p style="margin: 0 0 5px 0;">Thank you for your opportunity! We now look forward to your continued support in our mutual interest.</p>
        <p style="margin: 0 0 5px 0;"><strong>Regards,</strong></p>
        <p style="margin: 0 0 8px 0;"><strong>Mahesh Engineering Services</strong></p>
        <p style="margin: 0; color: #333;">| Our Back Office Contact Details | Email : d@maheshengg.com | Assistance : 9049990950 | Help Desk : 9049990949 | Computer Generated Document, hence unsigned.</p>
    </div>
    """
    
    # Load letterhead image
    letterhead_base64 = ""
    try:
        import base64
        letterhead_path = Path(__file__).parent / 'letterhead.png'
        if letterhead_path.exists():
            with open(letterhead_path, 'rb') as f:
                letterhead_base64 = base64.b64encode(f.read()).decode('utf-8')
    except Exception as e:
        logger.error(f"Failed to load letterhead: {e}")
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page {{ size: A4; margin: 0.5cm 1cm; }}
            body {{ font-family: Arial, sans-serif; font-size: 10px; margin: 0; padding: 0; }}
            .header {{ margin-bottom: 10px; }}
            .header img {{ width: 100%; height: auto; max-height: 120px; object-fit: contain; }}
            .company-name {{ font-size: 16px; font-weight: bold; color: #000; margin-bottom: 5px; }}
            .company-details {{ font-size: 9px; color: #333; line-height: 1.4; }}
            .doc-title {{ font-size: 14px; font-weight: bold; color: #000; margin: 15px 0 10px; text-align: center; background: #f0f0f0; padding: 8px; }}
            .info-section {{ margin: 10px 0; font-size: 10px; }}
            table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
            th {{ background-color: #d0d0d0; color: #000; padding: 6px; border: 1px solid #999; text-align: left; font-size: 10px; font-weight: bold; }}
            td {{ padding: 6px; border: 1px solid #ddd; font-size: 10px; }}
            .items-table {{ margin-bottom: 15px; }}
            .below-items-section {{ display: flex; justify-content: space-between; margin-bottom: 20px; }}
            .terms-box {{ width: 55%; padding-right: 20px; }}
            .summary-box {{ width: 40%; border: 1px solid #999; padding: 10px; background: #f9f9f9; }}
            .summary-row {{ display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; }}
            .summary-row.total {{ font-weight: bold; border-top: 2px solid #333; padding-top: 8px; margin-top: 8px; font-size: 11px; }}
            .tax-section {{ margin-top: 20px; clear: both; }}
            .tax-table-title {{ font-weight: bold; margin-bottom: 10px; font-size: 11px; }}
            .clear {{ clear: both; }}
        </style>
    </head>
    <body>
        <div class="header">
            {f'<img src="data:image/png;base64,{letterhead_base64}" alt="Letterhead" />' if letterhead_base64 else '''
            <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">
                <div class="company-name">SUNSTORE KOLHAPUR</div>
                <div class="company-details">
                    Plot No. 1497, Shamrao Kapadi Complex, Opposite HDFC Bank, Konda Lane, Laxmipuri,<br>
                    Kolhapur - 416002, Maharashtra, India<br>
                    Phone: 0231 - 2644990 / 91 / 92 | Email: sales@sunstorekolhapur.com<br>
                    <strong>GST ID: 27ABAFM4283A1ZL</strong>
                </div>
            </div>
            '''}
        </div>
        
        <div class="doc-title">{doc_type}</div>
        
        <div class="info-section">
            <strong>{doc_type} No:</strong> {doc_no} &nbsp;&nbsp;&nbsp; <strong>Date:</strong> {doc_date[:10]}
            {f'<br><strong>Party Confirmation ID:</strong> {party_confirmation_id}' if is_soa and party_confirmation_id else ''}
        </div>
        
        <div class="info-section">
            <strong>To:</strong><br>
            <strong>{party['party_name']}</strong><br>
            {party['address']}<br>
            {party['city']}, {party['state']} - {party['pincode']}<br>
            <strong>GST:</strong> {party['GST_number']}<br>
            <strong>Contact:</strong> {party['contact_person']} | {party['mobile']}
        </div>
        
        <!-- Intro Paragraph -->
        <div style="margin: 15px 0; padding: 10px; font-size: 11px; line-height: 1.5;">
            {intro_paragraph}
        </div>
        
        <table class="items-table">
            <thead>
                <tr>
                    {f'''<th style="width: 4%;">Sr</th>
                    <th style="width: 10%;">Item</th>
                    <th style="width: 10%;">HSN/SAC</th>
                    <th style="width: 26%;">Description</th>
                    <th style="width: 10%; text-align: right;">Quantity</th>
                    <th style="width: 10%; text-align: right;">List Price</th>
                    <th style="width: 8%; text-align: right;">Disc%</th>
                    <th style="width: 10%; text-align: right;">Rate</th>
                    <th style="width: 12%; text-align: right;">Amount</th>''' if has_discount else '''<th style="width: 5%;">Sr</th>
                    <th style="width: 15%;">Item</th>
                    <th style="width: 12%;">HSN/SAC</th>
                    <th style="width: 33%;">Description</th>
                    <th style="width: 12%; text-align: right;">Quantity</th>
                    <th style="width: 11%; text-align: right;">Rate</th>
                    <th style="width: 12%; text-align: right;">Amount</th>'''}
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>
        
        <!-- Totals Summary Box -->
        <div style="display: flex; justify-content: flex-end; margin: 15px 0;">
            <div class="summary-box" style="width: 40%; border: 1px solid #999; padding: 10px; background: #f9f9f9;">
                <div class="summary-row" style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px;">
                    <span>Net Total</span>
                    <span>₹{subtotal:,.2f}</span>
                </div>
                {f'<div class="summary-row" style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px;"><span>SGST</span><span>₹{total_sgst:,.2f}</span></div>' if total_sgst > 0 else ''}
                {f'<div class="summary-row" style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px;"><span>CGST</span><span>₹{total_cgst:,.2f}</span></div>' if total_cgst > 0 else ''}
                {f'<div class="summary-row" style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px;"><span>IGST</span><span>₹{total_igst:,.2f}</span></div>' if total_igst > 0 else ''}
                <div class="summary-row total" style="display: flex; justify-content: space-between; font-weight: bold; border-top: 2px solid #333; padding-top: 8px; margin-top: 8px; font-size: 11px;">
                    <span>Grand Total</span>
                    <span>₹{grand_total:,.2f}</span>
                </div>
            </div>
        </div>
        
        <!-- Tax Table Below -->
        <div class="tax-section" style="margin-top: 15px;">
            <div class="tax-table-title" style="font-weight: bold; margin-bottom: 10px; font-size: 11px;">ITEM TAX TABLE</div>
            
            <table style="width: 70%;">
                <thead>
                    <tr>
                        <th style="width: 25%;">HSN/SAC</th>
                        <th style="width: 30%; text-align: right;">Taxable Amount</th>
                        <th style="width: 22%; text-align: right;">SGST</th>
                        <th style="width: 23%; text-align: right;">CGST</th>
                    </tr>
                </thead>
                <tbody>
                    {tax_rows_html}
                </tbody>
            </table>
        </div>
        
        <!-- Terms & Conditions -->
        {terms_and_conditions_html}
        
        <!-- Footer -->
        {footer_html}
    </body>
    </html>
    """

# ==================== SETTINGS ====================

@api_router.get("/settings", response_model=Settings)
async def get_settings(current_user: dict = Depends(get_current_user)):
    settings = await db.settings.find_one({"settings_id": "default"}, {"_id": 0})
    if not settings:
        settings = {
            "settings_id": "default",
            "quotation_prefix": "QTN",
            "pi_prefix": "PI",
            "soa_prefix": "SOA",
            "payment_terms": "",
            "delivery_terms": "",
            "terms_and_conditions": ""
        }
        await db.settings.insert_one(settings)
    return settings

@api_router.put("/settings", response_model=Settings)
async def update_settings(settings_data: SettingsBase, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can update settings")
    
    settings_dict = settings_data.model_dump()
    settings_dict["settings_id"] = "default"
    
    await db.settings.update_one(
        {"settings_id": "default"},
        {"$set": settings_dict},
        upsert=True
    )
    
    return settings_dict

# ==================== DASHBOARD ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(
    user_id: Optional[str] = None,
    period: Optional[str] = "weekly",
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Calculate date range based on period
    date_filter = {}
    if period and period != "all_time":
        current_date = datetime.now(timezone.utc)
        
        if period == "weekly":
            start_date = current_date - timedelta(days=7)
        elif period == "monthly":
            start_date = current_date - timedelta(days=30)
        elif period == "ytd":  # Financial Year: April 1 to today
            current_year = current_date.year
            if current_date.month >= 4:
                start_date = datetime(current_year, 4, 1, tzinfo=timezone.utc)
            else:
                start_date = datetime(current_year - 1, 4, 1, tzinfo=timezone.utc)
        elif period == "custom" and from_date and to_date:
            start_date = datetime.fromisoformat(from_date).replace(tzinfo=timezone.utc)
            current_date = datetime.fromisoformat(to_date).replace(tzinfo=timezone.utc)
        else:
            start_date = None
        
        if start_date:
            date_filter = {"$gte": start_date.isoformat(), "$lte": current_date.isoformat()}
    
    # Build query filter
    query_filter = {}
    
    # User filter (Admin can filter by user, Sales User sees only their data)
    if current_user["role"] != "Admin":
        query_filter["created_by_user_id"] = current_user["user_id"]
    elif user_id and user_id != "ALL":
        query_filter["created_by_user_id"] = user_id
    
    # Apply date filter to documents with dates
    lead_filter = query_filter.copy()
    if date_filter:
        lead_filter["lead_date"] = date_filter
    
    quotation_filter = query_filter.copy()
    if date_filter:
        quotation_filter["date"] = date_filter
    
    pi_filter = query_filter.copy()
    if date_filter:
        pi_filter["date"] = date_filter
    
    soa_filter = query_filter.copy()
    if date_filter:
        soa_filter["date"] = date_filter
    
    # Get status breakdowns
    leads_by_status = {
        "total": await db.leads.count_documents(lead_filter),
        "open": await db.leads.count_documents({**lead_filter, "status": "Open"}),
        "converted": await db.leads.count_documents({**lead_filter, "status": "Converted"}),
        "lost": await db.leads.count_documents({**lead_filter, "status": "Lost"})
    }
    
    quotations_by_status = {
        "total": await db.quotations.count_documents(quotation_filter),
        "successful": await db.quotations.count_documents({**quotation_filter, "quotation_status": "Successful"}),
        "lost": await db.quotations.count_documents({**quotation_filter, "quotation_status": "Lost"}),
        "in_process": await db.quotations.count_documents({**quotation_filter, "quotation_status": "In Process"}),
        "pending": await db.quotations.count_documents({**quotation_filter, "quotation_status": None})
    }
    
    pi_by_status = {
        "total": await db.proforma_invoices.count_documents(pi_filter),
        "pi_submitted": await db.proforma_invoices.count_documents({**pi_filter, "pi_status": "PI Submitted"}),
        "payment_recd": await db.proforma_invoices.count_documents({**pi_filter, "pi_status": "Payment Recd"})
    }
    
    soa_by_status = {
        "total": await db.soa.count_documents(soa_filter),
        "in_process": await db.soa.count_documents({**soa_filter, "soa_status": "In Process"}),
        "material_given": await db.soa.count_documents({**soa_filter, "soa_status": "Material Given"})
    }
    
    stats = {
        "parties": await db.parties.count_documents({}),
        "items": await db.items.count_documents({}),
        "leads": leads_by_status,
        "quotations": quotations_by_status,
        "proforma_invoices": pi_by_status,
        "soa": soa_by_status,
        "open_leads": leads_by_status["open"]
    }
    
    return stats

@api_router.get("/dashboard/activity")
async def get_recent_activity(
    user_id: Optional[str] = None,
    period: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query_filter = {}
    
    # User filter
    if current_user["role"] != "Admin":
        query_filter["updated_by"] = current_user["user_id"]
        # Sales user: fixed to last 30 days
        start_date = datetime.now(timezone.utc) - timedelta(days=30)
        query_filter["timestamp"] = {"$gte": start_date.isoformat()}
    else:
        # Admin can filter by user
        if user_id and user_id != "ALL":
            query_filter["updated_by"] = user_id
        
        # Admin: apply period filter
        if period and period != "all_time":
            current_date = datetime.now(timezone.utc)
            
            if period == "weekly":
                start_date = current_date - timedelta(days=7)
            elif period == "monthly":
                start_date = current_date - timedelta(days=30)
            elif period == "ytd":
                current_year = current_date.year
                if current_date.month >= 4:
                    start_date = datetime(current_year, 4, 1, tzinfo=timezone.utc)
                else:
                    start_date = datetime(current_year - 1, 4, 1, tzinfo=timezone.utc)
            elif period == "custom" and from_date and to_date:
                start_date = datetime.fromisoformat(from_date).replace(tzinfo=timezone.utc)
                current_date = datetime.fromisoformat(to_date).replace(tzinfo=timezone.utc)
            else:
                start_date = None
            
            if start_date:
                query_filter["timestamp"] = {"$gte": start_date.isoformat(), "$lte": current_date.isoformat()}
    
    activity = await db.document_logs.find(query_filter, {"_id": 0}).sort("timestamp", -1).limit(20).to_list(20)
    return activity

# ==================== DOCUMENT LOG ====================

async def log_document_action(doc_type: str, doc_id: str, action: str, user_id: str):
    log_count = await db.document_logs.count_documents({})
    log_id = f"LOG{str(log_count + 1).zfill(6)}"
    
    # Get current version
    version = await db.document_logs.count_documents({"document_id": doc_id}) + 1
    
    log_entry = {
        "log_id": log_id,
        "document_type": doc_type,
        "document_id": doc_id,
        "action": action,
        "updated_by": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version_no": version
    }
    
    await db.document_logs.insert_one(log_entry)

@api_router.get("/logs")
async def get_logs(current_user: dict = Depends(get_current_user)):
    logs = await db.document_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return logs

# ==================== REPORTS ====================

@api_router.get("/reports/item-wise-sales")
async def report_item_wise_sales(current_user: dict = Depends(get_current_user)):
    # Aggregate all items from quotations, PIs, and SOAs
    item_sales = {}
    
    for collection_name in ["quotations", "proforma_invoices", "soa"]:
        collection = db[collection_name]
        docs = await collection.find({}, {"_id": 0, "items": 1}).to_list(1000)
        for doc in docs:
            for item in doc.get("items", []):
                item_id = item["item_id"]
                if item_id not in item_sales:
                    item_sales[item_id] = {"item_id": item_id, "qty": 0, "amount": 0}
                item_sales[item_id]["qty"] += item["qty"]
                item_sales[item_id]["amount"] += item["total_amount"]
    
    return list(item_sales.values())

@api_router.get("/reports/party-wise-sales")
async def report_party_wise_sales(current_user: dict = Depends(get_current_user)):
    party_sales = {}
    
    for collection_name in ["quotations", "proforma_invoices", "soa"]:
        collection = db[collection_name]
        docs = await collection.find({}, {"_id": 0, "party_id": 1, "items": 1}).to_list(1000)
        for doc in docs:
            party_id = doc["party_id"]
            if party_id not in party_sales:
                party_sales[party_id] = {"party_id": party_id, "amount": 0, "doc_count": 0}
            doc_total = sum(item["total_amount"] for item in doc.get("items", []))
            party_sales[party_id]["amount"] += doc_total
            party_sales[party_id]["doc_count"] += 1
    
    return list(party_sales.values())

@api_router.get("/reports/user-wise-sales")
async def report_user_wise_sales(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can view this report")
    
    user_sales = {}
    
    for collection_name in ["quotations", "proforma_invoices", "soa"]:
        collection = db[collection_name]
        docs = await collection.find({}, {"_id": 0, "created_by_user_id": 1, "items": 1}).to_list(1000)
        for doc in docs:
            user_id = doc["created_by_user_id"]
            if user_id not in user_sales:
                user_sales[user_id] = {"user_id": user_id, "amount": 0, "doc_count": 0}
            doc_total = sum(item["total_amount"] for item in doc.get("items", []))
            user_sales[user_id]["amount"] += doc_total
            user_sales[user_id]["doc_count"] += 1
    
    return list(user_sales.values())

@api_router.get("/reports/lead-conversion")
async def report_lead_conversion(current_user: dict = Depends(get_current_user)):
    total_leads = await db.leads.count_documents({})
    converted_leads = await db.leads.count_documents({"status": "Converted"})
    open_leads = await db.leads.count_documents({"status": "Open"})
    lost_leads = await db.leads.count_documents({"status": "Lost"})
    
    return {
        "total_leads": total_leads,
        "converted_leads": converted_leads,
        "open_leads": open_leads,
        "lost_leads": lost_leads,
        "conversion_rate": (converted_leads / total_leads * 100) if total_leads > 0 else 0
    }

@api_router.get("/reports/pending-leads")
async def report_pending_leads(current_user: dict = Depends(get_current_user)):
    query_filter = {"status": "Open"}
    if current_user["role"] != "Admin":
        query_filter["created_by_user_id"] = current_user["user_id"]
    
    leads = await db.leads.find(query_filter, {"_id": 0}).to_list(1000)
    return leads

@api_router.get("/reports/quotation-aging")
async def report_quotation_aging(current_user: dict = Depends(get_current_user)):
    query_filter = {}
    if current_user["role"] != "Admin":
        query_filter["created_by_user_id"] = current_user["user_id"]
    
    quotations = await db.quotations.find(query_filter, {"_id": 0}).to_list(1000)
    
    aging_data = []
    current_date = datetime.now(timezone.utc)
    
    for qtn in quotations:
        qtn_date = datetime.fromisoformat(qtn["date"])
        age_days = (current_date - qtn_date).days
        aging_data.append({
            "quotation_no": qtn["quotation_no"],
            "party_id": qtn["party_id"],
            "date": qtn["date"],
            "age_days": age_days,
            "validity_days": qtn.get("validity_days", 30),
            "is_expired": age_days > qtn.get("validity_days", 30)
        })
    
    return aging_data

@api_router.get("/reports/gst-summary")
async def report_gst_summary(current_user: dict = Depends(get_current_user)):
    cgst_total = 0
    sgst_total = 0
    igst_total = 0
    
    for collection_name in ["quotations", "proforma_invoices", "soa"]:
        collection = db[collection_name]
        docs = await collection.find({}, {"_id": 0, "items": 1}).to_list(1000)
        for doc in docs:
            for item in doc.get("items", []):
                tax_amount = item["tax_amount"]
                if item["tax_type"] == "CGST+SGST":
                    cgst_total += tax_amount / 2
                    sgst_total += tax_amount / 2
                else:
                    igst_total += tax_amount
    
    return {
        "CGST": round(cgst_total, 2),
        "SGST": round(sgst_total, 2),
        "IGST": round(igst_total, 2),
        "total_tax": round(cgst_total + sgst_total + igst_total, 2)
    }

# ==================== USERS (Admin only) ====================

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can view users")
    
    users = await db.users.find({}, {"_id": 0, "password_hashed": 0}).to_list(1000)
    return users

@api_router.put("/users/{user_id}/status")
async def update_user_status(user_id: str, status: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can update user status")
    
    result = await db.users.update_one({"user_id": user_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User status updated"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
