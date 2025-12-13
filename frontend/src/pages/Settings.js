import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

export const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    quotation_prefix: 'QTN', pi_prefix: 'PI', soa_prefix: 'SOA',
    payment_terms: '', delivery_terms: '', terms_and_conditions: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.getSettings();
      setSettings(response.data);
    } catch (error) {
      toast.error('Failed to load settings');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.role !== 'Admin') {
      toast.error('Only Admin can update settings');
      return;
    }

    try {
      await api.updateSettings(settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Card>
        <CardHeader><CardTitle>Number Series Prefixes</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Quotation Prefix</Label><Input value={settings.quotation_prefix} onChange={e => setSettings({...settings, quotation_prefix: e.target.value})} /></div>
              <div><Label>PI Prefix</Label><Input value={settings.pi_prefix} onChange={e => setSettings({...settings, pi_prefix: e.target.value})} /></div>
              <div><Label>SOA Prefix</Label><Input value={settings.soa_prefix} onChange={e => setSettings({...settings, soa_prefix: e.target.value})} /></div>
            </div>
            <div><Label>Payment Terms</Label><Input value={settings.payment_terms} onChange={e => setSettings({...settings, payment_terms: e.target.value})} /></div>
            <div><Label>Delivery Terms</Label><Input value={settings.delivery_terms} onChange={e => setSettings({...settings, delivery_terms: e.target.value})} /></div>
            <div><Label>Terms & Conditions</Label><Input value={settings.terms_and_conditions} onChange={e => setSettings({...settings, terms_and_conditions: e.target.value})} /></div>
            {user?.role === 'Admin' && <Button type="submit" className="w-full">Save Settings</Button>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
