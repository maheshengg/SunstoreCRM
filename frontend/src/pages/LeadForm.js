import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { SearchableSelect } from '../components/SearchableSelect';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

export const LeadForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [formData, setFormData] = useState({
    party_id: '', contact_name: '', requirement_summary: '', referred_by: '', notes: ''
  });

  useEffect(() => {
    fetchParties();
    if (id) fetchLead();
  }, [id]);

  const fetchParties = async () => {
    try {
      const response = await api.getParties();
      setParties(response.data);
    } catch (error) {
      toast.error('Failed to load parties');
    }
  };

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
      <h1 className="text-3xl font-bold">{id ? 'Edit' : 'Add'} Lead</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Party *</Label>
              <SearchableSelect
                options={parties.map(p => ({ value: p.party_id, label: `${p.party_name} (${p.city})` }))}
                value={formData.party_id}
                onChange={v => setFormData({...formData, party_id: v})}
                placeholder="Select party..."
                searchPlaceholder="Search parties..."
              />
            </div>
            <div><Label>Contact Name *</Label><Input value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} required /></div>
            <div><Label>Requirement Summary *</Label><Textarea value={formData.requirement_summary} onChange={e => setFormData({...formData, requirement_summary: e.target.value})} required /></div>
            <div><Label>Referred By</Label><Input value={formData.referred_by} onChange={e => setFormData({...formData, referred_by: e.target.value})} /></div>
            <div><Label>Notes</Label><Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
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
