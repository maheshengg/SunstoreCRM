import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

export const LeadForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    party_name: '',
    party_address: '',
    party_gst: '',
    party_city: '',
    contact_name: '',
    contact_mobile: '',
    requirement_summary: '',
    referred_by: '',
    notes: '',
    status: 'Open'
  });

  useEffect(() => {
    if (id) fetchLead();
  }, [id]);

  const fetchLead = async () => {
    try {
      const response = await api.getLead(id);
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to load lead');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.party_name || !formData.contact_name || !formData.requirement_summary) {
      toast.error('Please fill in required fields: Party Name, Contact Name, and Requirement');
      return;
    }
    
    try {
      if (id) {
        await api.updateLead(id, formData);
        toast.success('Lead updated');
      } else {
        await api.createLead(formData);
        toast.success('Lead created');
      }
      navigate('/leads');
    } catch (error) {
      toast.error('Failed to save lead');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{id ? 'Edit' : 'New'} Lead</h1>
      
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Party Information - Free Text */}
            <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-700">Party Information (Free Text)</h3>
              
              <div>
                <Label>Party Name *</Label>
                <Input
                  value={formData.party_name}
                  onChange={(e) => setFormData({...formData, party_name: e.target.value})}
                  placeholder="Enter party/company name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.party_city}
                    onChange={(e) => setFormData({...formData, party_city: e.target.value})}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label>GST Number (Optional)</Label>
                  <Input
                    value={formData.party_gst}
                    onChange={(e) => setFormData({...formData, party_gst: e.target.value.toUpperCase()})}
                    placeholder="e.g., 27AABCU9603R1ZM"
                  />
                </div>
              </div>
              
              <div>
                <Label>Address</Label>
                <Textarea
                  value={formData.party_address}
                  onChange={(e) => setFormData({...formData, party_address: e.target.value})}
                  placeholder="Full address"
                  rows={2}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Name *</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  placeholder="Contact person name"
                />
              </div>
              <div>
                <Label>Contact Mobile</Label>
                <Input
                  value={formData.contact_mobile}
                  onChange={(e) => setFormData({...formData, contact_mobile: e.target.value})}
                  placeholder="Mobile number"
                />
              </div>
            </div>

            <div>
              <Label>Requirement Summary *</Label>
              <Textarea
                value={formData.requirement_summary}
                onChange={(e) => setFormData({...formData, requirement_summary: e.target.value})}
                placeholder="Describe the customer's requirements..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Referred By</Label>
                <Input
                  value={formData.referred_by}
                  onChange={(e) => setFormData({...formData, referred_by: e.target.value})}
                  placeholder="Referral source"
                />
              </div>
              {id && (
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Converted">Converted</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">Save Lead</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/leads')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadForm;
