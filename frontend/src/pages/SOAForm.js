import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { SearchableSelect } from '../components/SearchableSelect';
import { ItemSelectorModal } from '../components/ItemSelectorModal';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Trash2, Plus, ArrowRightLeft, User } from 'lucide-react';
import { toast } from 'sonner';

export const SOAForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(null);
  const [createdByUser, setCreatedByUser] = useState(null);
  const [convertTarget, setConvertTarget] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [formData, setFormData] = useState({
    party_id: '', date: new Date().toISOString().split('T')[0],
    terms_and_conditions: '', remarks: '', soa_status: 'In Process', items: []
  });

  useEffect(() => {
    fetchData();
    if (id) fetchSOA();
  }, [id]);

  const fetchData = async () => {
    try {
      const [partiesRes, itemsRes] = await Promise.all([api.getParties(), api.getItems({})]);
      setParties(partiesRes.data);
      setItems(itemsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const fetchSOA = async () => {
    try {
      const response = await api.getSOA(id);
      const soaData = response.data;
      
      // Enrich items with full details from items master
      const itemsRes = await api.getItems({});
      const itemsMap = {};
      itemsRes.data.forEach(item => { itemsMap[item.item_id] = item; });
      
      if (soaData.items && soaData.items.length > 0) {
        soaData.items = soaData.items.map(item => {
          const masterItem = itemsMap[item.item_id];
          if (masterItem) {
            return {
              ...item,
              item_name: masterItem.item_name || item.item_name || '',
              item_code: masterItem.item_code || item.item_code || '',
              HSN: masterItem.HSN || item.HSN || '',
              GST_percent: masterItem.GST_percent || item.GST_percent || 0
            };
          }
          return item;
        });
      }
      
      setFormData(soaData);
      // Fetch user who created this SOA
      if (soaData.created_by_user_id) {
        try {
          const usersRes = await api.getUsers();
          const creator = usersRes.data.find(u => u.user_id === soaData.created_by_user_id);
          setCreatedByUser(creator);
        } catch (err) { console.error('Failed to fetch user'); }
      }
    } catch (error) {
      toast.error('Failed to load SOA');
    }
  };

  const handleConvert = async () => {
    if (!convertTarget || !id) return;
    setIsConverting(true);
    try {
      if (convertTarget === 'quotation') {
        const res = await api.convertSOAToQuotation(id);
        toast.success('Converted to Quotation');
        navigate(`/quotations/${res.data.quotation_id}`);
      } else if (convertTarget === 'pi') {
        const res = await api.convertSOAToPI(id);
        toast.success('Converted to Proforma Invoice');
        navigate(`/proforma-invoices/${res.data.pi_id}`);
      }
    } catch (error) {
      toast.error('Failed to convert document');
    } finally {
      setIsConverting(false);
    }
  };

  const addItem = () => {
    const newIndex = formData.items.length;
    setFormData({
      ...formData,
      items: [...formData.items, { 
        item_id: '', 
        item_name: '',
        item_code: '',
        HSN: '',
        GST_percent: 0,
        qty: 1, 
        rate: 0, 
        discount_percent: 0, 
        taxable_amount: 0, 
        tax_type: 'CGST+SGST', 
        tax_amount: 0, 
        total_amount: 0 
      }]
    });
    setCurrentItemIndex(newIndex);
    setIsItemModalOpen(true);
  };

  const openItemSelector = (index) => {
    setCurrentItemIndex(index);
    setIsItemModalOpen(true);
  };

  const handleItemSelect = (selectedItem) => {
    if (currentItemIndex === null) return;
    
    const party = parties.find(p => p.party_id === formData.party_id);
    const newItems = [...formData.items];
    
    newItems[currentItemIndex] = {
      ...newItems[currentItemIndex],
      item_id: selectedItem.item_id,
      item_name: selectedItem.item_name,
      item_code: selectedItem.item_code,
      HSN: selectedItem.HSN,
      GST_percent: selectedItem.GST_percent,
      rate: selectedItem.rate,
    };
    
    newItems[currentItemIndex] = calculateItemTotals(newItems[currentItemIndex], party);
    setFormData({ ...formData, items: newItems });
  };

  const calculateItemTotals = (item, party) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const discount = parseFloat(item.discount_percent) || 0;
    const taxable = rate * qty * (1 - discount / 100);
    const gstPercent = parseFloat(item.GST_percent) || 18;
    
    // Check GST number prefix - if starts with "27", it's Maharashtra (CGST+SGST)
    const gstNumber = party?.GST_number || '';
    const tax_type = gstNumber.startsWith('27') ? 'CGST+SGST' : 'IGST';
    
    const tax_amount = taxable * (gstPercent / 100);
    return { ...item, taxable_amount: taxable, tax_type, tax_amount, total_amount: taxable + tax_amount };
  };

  const updateItem = (index, field, value) => {
    const party = parties.find(p => p.party_id === formData.party_id);
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index] = calculateItemTotals(newItems[index], party);
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await api.updateSOA(id, formData);
        toast.success('SOA updated');
      } else {
        await api.createSOA(formData);
        toast.success('SOA created');
      }
      navigate('/soa');
    } catch (error) {
      toast.error('Failed to save SOA');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">{id ? 'Edit' : 'New'} Sales Order Acknowledgement</h1>
        {id && (
          <div className="flex flex-wrap items-center gap-3">
            {/* User & Status Info */}
            {createdByUser && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <User size={14} />
                <span>{createdByUser.name}</span>
              </div>
            )}
            <Badge variant={formData.soa_status === 'Material Given' ? 'default' : 'secondary'}>
              {formData.soa_status || 'In Process'}
            </Badge>
            {/* Convert Document */}
            <div className="flex items-center gap-2">
              <Select value={convertTarget} onValueChange={setConvertTarget}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Convert to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quotation">Quotation</SelectItem>
                  <SelectItem value="pi">Proforma Invoice</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleConvert} 
                disabled={!convertTarget || isConverting}
                className="gap-1"
              >
                <ArrowRightLeft size={14} />
                Convert
              </Button>
            </div>
          </div>
        )}
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Party *</Label>
                <SearchableSelect
                  options={parties.map(p => ({ value: p.party_id, label: `${p.party_name} (${p.city})` }))}
                  value={formData.party_id}
                  onChange={v => setFormData({...formData, party_id: v})}
                  placeholder="Select party..."
                  searchPlaceholder="Search parties..."
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Items</Label>
                <Button type="button" onClick={addItem} className="gap-2">
                  <Plus size={16} />
                  Add Item
                </Button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  No items added yet. Click "Add Item" to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, idx) => (
                    <Card key={idx} className="p-4 bg-slate-50">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex-1">
                            <div 
                              className="text-sm font-medium cursor-pointer text-primary hover:underline"
                              onClick={() => openItemSelector(idx)}
                            >
                              {item.item_name || 'Click to select item'}
                              {item.item_code && ` (${item.item_code})`}
                            </div>
                          </div>
                          <Button type="button" size="sm" variant="destructive" onClick={() => removeItem(idx)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Qty</Label>
                            <Input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)} className="h-9" />
                          </div>
                          <div>
                            <Label className="text-xs">Rate</Label>
                            <Input type="number" placeholder="Rate" value={item.rate} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)} className="h-9" />
                          </div>
                          <div>
                            <Label className="text-xs">Discount %</Label>
                            <Input type="number" placeholder="Disc%" value={item.discount_percent} onChange={e => updateItem(idx, 'discount_percent', parseFloat(e.target.value) || 0)} className="h-9" />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <Label className="text-xs">HSN</Label>
                            <Input value={item.HSN || 'N/A'} readOnly className="h-9 bg-gray-100 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs">GST %</Label>
                            <Input value={`${item.GST_percent || 0}%`} readOnly className="h-9 bg-gray-100 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs">Tax</Label>
                            <Input value={`₹${(parseFloat(item.tax_amount) || 0).toFixed(2)}`} readOnly className="h-9 bg-gray-100 text-sm font-medium" />
                          </div>
                          <div>
                            <Label className="text-xs">Line Total</Label>
                            <Input value={`₹${(parseFloat(item.total_amount) || 0).toFixed(2)}`} readOnly className="h-9 bg-green-100 text-sm font-bold" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {formData.items.length > 0 && (
                <div className="flex justify-end">
                  <div className="w-64 space-y-2 p-4 bg-slate-100 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{formData.items.reduce((sum, item) => sum + (parseFloat(item.taxable_amount) || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Tax:</span>
                      <span>₹{formData.items.reduce((sum, item) => sum + (parseFloat(item.tax_amount) || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Grand Total:</span>
                      <span>₹{formData.items.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>Terms and Conditions</Label>
              <Textarea value={formData.terms_and_conditions} onChange={e => setFormData({...formData, terms_and_conditions: e.target.value})} rows={4} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Remarks</Label>
                <Input value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
              </div>
              <div>
                <Label>SOA Status</Label>
                <Select value={formData.soa_status} onValueChange={v => setFormData({...formData, soa_status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Process">In Process</SelectItem>
                    <SelectItem value="Material Given">Material Given</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">Save SOA</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/soa')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ItemSelectorModal
        open={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        items={items}
        onSelectItem={handleItemSelect}
      />
    </div>
  );
};
