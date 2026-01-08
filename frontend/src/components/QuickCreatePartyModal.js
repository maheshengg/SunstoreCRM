import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { api } from '../utils/api';

export const QuickCreatePartyModal = ({ open, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    party_name: '',
    address: '',
    city: '',
    state: 'MAHARASHTRA',
    pincode: '',
    GST_number: '',
    contact_person: '',
    mobile: '',
    email: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.party_name || !formData.GST_number) {
      toast.error('Party Name and GST Number are required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.createParty(formData);
      toast.success('Party created successfully');
      onCreated(response.data);
      onClose();
      // Reset form
      setFormData({
        party_name: '',
        address: '',
        city: '',
        state: 'MAHARASHTRA',
        pincode: '',
        GST_number: '',
        contact_person: '',
        mobile: '',
        email: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create party');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Quick Create Party</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Party Name *</Label>
            <Input
              value={formData.party_name}
              onChange={(e) => setFormData({...formData, party_name: e.target.value})}
              placeholder="Enter party name"
              className="text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">GST Number *</Label>
            <Input
              value={formData.GST_number}
              onChange={(e) => setFormData({...formData, GST_number: e.target.value.toUpperCase()})}
              placeholder="e.g., 27AABCU9603R1ZM"
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="City"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                placeholder="State"
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Full address"
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Contact Person</Label>
              <Input
                value={formData.contact_person}
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                placeholder="Contact name"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Mobile</Label>
              <Input
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                placeholder="Mobile number"
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Party'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickCreatePartyModal;
