import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { api } from '../utils/api';

export const QuickCreateItemModal = ({ open, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    description: '',
    UOM: 'Nos',
    rate: '',
    HSN: '',
    GST_percent: '18',
    brand: '',
    category: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.item_code || !formData.item_name) {
      toast.error('Item Code and Item Name are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        rate: parseFloat(formData.rate) || 0,
        GST_percent: parseFloat(formData.GST_percent) || 18
      };
      const response = await api.createItem(payload);
      toast.success('Item created successfully');
      onCreated(response.data);
      onClose();
      // Reset form
      setFormData({
        item_code: '',
        item_name: '',
        description: '',
        UOM: 'Nos',
        rate: '',
        HSN: '',
        GST_percent: '18',
        brand: '',
        category: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Quick Create Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Item Code *</Label>
              <Input
                value={formData.item_code}
                onChange={(e) => setFormData({...formData, item_code: e.target.value})}
                placeholder="e.g., SM-AX-590"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">HSN/SAC</Label>
              <Input
                value={formData.HSN}
                onChange={(e) => setFormData({...formData, HSN: e.target.value})}
                placeholder="e.g., 85414011"
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Item Name *</Label>
            <Input
              value={formData.item_name}
              onChange={(e) => setFormData({...formData, item_name: e.target.value})}
              placeholder="Enter item name"
              className="text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Full description"
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Rate (₹)</Label>
              <Input
                type="number"
                value={formData.rate}
                onChange={(e) => setFormData({...formData, rate: e.target.value})}
                placeholder="0.00"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">GST %</Label>
              <Input
                type="number"
                value={formData.GST_percent}
                onChange={(e) => setFormData({...formData, GST_percent: e.target.value})}
                placeholder="18"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">UOM</Label>
              <Input
                value={formData.UOM}
                onChange={(e) => setFormData({...formData, UOM: e.target.value})}
                placeholder="Nos"
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Brand</Label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                placeholder="Brand name"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Category"
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickCreateItemModal;
