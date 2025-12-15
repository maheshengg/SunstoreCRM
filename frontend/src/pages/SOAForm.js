import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { SearchableSelect } from '../components/SearchableSelect';
import { ItemSelectorModal } from '../components/ItemSelectorModal';
import { Card, CardContent } from '../components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const SOAForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    party_id: '', date: new Date().toISOString().split('T')[0],
    terms_and_conditions: '', remarks: '', items: []
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
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to load SOA');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { item_id: '', qty: 1, rate: 0, discount_percent: 0, taxable_amount: 0, tax_type: 'CGST+SGST', tax_amount: 0, total_amount: 0 }]
    });
  };

  const calculateItemTotals = (item, party) => {
    const taxable = item.rate * item.qty * (1 - item.discount_percent / 100);
    const selectedItem = items.find(i => i.item_id === item.item_id);
    const gstPercent = selectedItem ? selectedItem.GST_percent : 18;
    const tax_type = party?.state === 'Maharashtra' ? 'CGST+SGST' : 'IGST';
    const tax_amount = taxable * (gstPercent / 100);
    return { ...item, taxable_amount: taxable, tax_type, tax_amount, total_amount: taxable + tax_amount };
  };

  const updateItem = (index, field, value) => {
    const party = parties.find(p => p.party_id === formData.party_id);
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'item_id') {
      const selectedItem = items.find(i => i.item_id === value);
      if (selectedItem) newItems[index].rate = selectedItem.rate;
    }
    newItems[index] = calculateItemTotals(newItems[index], party);
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
      <h1 className="text-3xl font-bold">{id ? 'Edit' : 'New'} Sales Order Acknowledgement</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Party *</Label>
                <SearchableSelect
                  options={parties.map(p => ({ value: p.party_id, label: `${p.party_name} (${p.city})` }))}
                  value={formData.party_id}
                  onChange={v => setFormData({...formData, party_id: v})}
                  placeholder="Select party..."
                  searchPlaceholder="Search parties..."
                />
              </div>
              <div><Label>Date</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
            </div>

            <div className="space-y-2">
              <Label>Items</Label>
              {formData.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 items-end">
                  <SearchableSelect
                    options={items.map(i => ({ value: i.item_id, label: `${i.item_name} (${i.item_code})` }))}
                    value={item.item_id}
                    onChange={v => updateItem(idx, 'item_id', v)}
                    placeholder="Select item..."
                    searchPlaceholder="Search items..."
                  />
                  <Input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(idx, 'qty', parseFloat(e.target.value))} />
                  <Input type="number" placeholder="Rate" value={item.rate} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value))} />
                  <Input type="number" placeholder="Disc%" value={item.discount_percent} onChange={e => updateItem(idx, 'discount_percent', parseFloat(e.target.value))} />
                  <div className="text-sm">Tax: ₹{item.tax_amount.toFixed(2)}</div>
                  <div className="text-sm font-bold">Total: ₹{item.total_amount.toFixed(2)}</div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addItem}>Add Item</Button>
            </div>

            <div><Label>Terms and Conditions</Label><Textarea value={formData.terms_and_conditions} onChange={e => setFormData({...formData, terms_and_conditions: e.target.value})} rows={4} /></div>
            <div><Label>Remarks</Label><Input value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} /></div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">Save SOA</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/soa')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
