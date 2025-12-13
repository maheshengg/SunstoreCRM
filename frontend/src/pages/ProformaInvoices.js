import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export const ProformaInvoices = () => {
  const [pis, setPis] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPIs();
  }, []);

  const fetchPIs = async () => {
    try {
      const response = await api.getProformaInvoices({});
      setPis(response.data);
    } catch (error) {
      toast.error('Failed to load proforma invoices');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Proforma Invoices</h1>
        <Button onClick={() => navigate('/proforma-invoices/new')}><Plus size={16} className="mr-2" />New PI</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pis.map(pi => (
          <Card key={pi.pi_id}>
            <CardHeader><CardTitle>{pi.pi_no}</CardTitle></CardHeader>
            <CardContent><p className="text-sm">Date: {new Date(pi.date).toLocaleDateString()}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
