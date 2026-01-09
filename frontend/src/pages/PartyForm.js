import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Save, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const PartyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    party_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    GST_number: '',
    contact_person: '',
    mobile: '',
    email: ''
  });

  useEffect(() => {
    if (id) {
      fetchParty();
    }
  }, [id]);

  const fetchParty = async () => {
    try {
      const response = await api.getParty(id);
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to load party');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        await api.updateParty(id, formData);
        toast.success('Party updated successfully');
      } else {
        await api.createParty(formData);
        toast.success('Party created successfully');
      }
      navigate('/parties');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save party');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!id) return;
    try {
      const response = await api.duplicateParty(id);
      toast.success('Party duplicated successfully');
      navigate(`/parties/${response.data.party_id}`);
    } catch (error) {
      toast.error('Failed to duplicate party');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this party? This action cannot be undone.')) return;
    try {
      await api.deleteParty(id);
      toast.success('Party deleted successfully');
      navigate('/parties');
    } catch (error) {
      toast.error('Failed to delete party');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button data-testid="back-btn" variant="ghost" size="sm" onClick={() => navigate('/parties')}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold">{id ? 'Edit' : 'Add'} Party</h1>
        </div>
        {id && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleDuplicate} className="gap-1">
              <Copy size={14} /> Duplicate
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={handleDelete} className="gap-1">
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Party Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="party_name">Party Name *</Label>
              <Input
                id="party_name"
                data-testid="party-name-input"
                value={formData.party_name}
                onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                data-testid="address-input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  data-testid="city-input"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  data-testid="state-input"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  data-testid="pincode-input"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="GST_number">GST Number *</Label>
                <Input
                  id="GST_number"
                  data-testid="gst-input"
                  value={formData.GST_number}
                  onChange={(e) => setFormData({ ...formData, GST_number: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person *</Label>
              <Input
                id="contact_person"
                data-testid="contact-person-input"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile *</Label>
                <Input
                  id="mobile"
                  data-testid="mobile-input"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  data-testid="email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button data-testid="save-party-btn" type="submit" disabled={loading} className="flex-1 gap-2">
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Party'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/parties')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
