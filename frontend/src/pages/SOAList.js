import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export const SOAList = () => {
  const [soas, setSoas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSOAs();
  }, []);

  const fetchSOAs = async () => {
    try {
      const response = await api.getSOAs({});
      setSoas(response.data);
    } catch (error) {
      toast.error('Failed to load SOAs');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Statement of Accounts</h1>
        <Button onClick={() => navigate('/soa/new')}><Plus size={16} className="mr-2" />New SOA</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {soas.map(soa => (
          <Card key={soa.soa_id}>
            <CardHeader><CardTitle>{soa.soa_no}</CardTitle></CardHeader>
            <CardContent><p className="text-sm">Date: {new Date(soa.date).toLocaleDateString()}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
