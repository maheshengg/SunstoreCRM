import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

export const ItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    item_code: '', item_name: '', description: '', UOM: 'Nos', rate: 0,
    HSN: '', GST_percent: 18, brand: '', category: ''
  });

  useEffect(() => {
    if (id) fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await api.getItem(id);
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to load item');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await api.updateItem(id, formData);
        toast.success('Item updated');
      } else {
        await api.createItem(formData);
        toast.success('Item created');
      }
      navigate('/items');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save item');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{id ? 'Edit' : 'Add'} Item</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Item Code *</Label><Input value={formData.item_code} onChange={e => setFormData({...formData, item_code: e.target.value})} required /></div>
              <div><Label>Item Name *</Label><Input value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} required /></div>
              <div><Label>UOM</Label><Input value={formData.UOM} onChange={e => setFormData({...formData, UOM: e.target.value})} /></div>
              <div><Label>Rate *</Label><Input type="number" step="0.01" value={formData.rate} onChange={e => setFormData({...formData, rate: parseFloat(e.target.value)})} required /></div>
              <div><Label>HSN</Label><Input value={formData.HSN} onChange={e => setFormData({...formData, HSN: e.target.value})} /></div>
              <div><Label>GST %</Label><Input type="number" step="0.01" value={formData.GST_percent} onChange={e => setFormData({...formData, GST_percent: parseFloat(e.target.value)})} /></div>
              <div><Label>Brand</Label><Input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} /></div>
              <div><Label>Category</Label><Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} /></div>
            </div>
            <div><Label>Description</Label><Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <div className="flex gap-4">
              <Button type="submit" className="flex-1">Save Item</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/items')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
