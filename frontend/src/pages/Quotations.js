import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, FileDown } from 'lucide-react';
import { toast } from 'sonner';

export const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await api.getQuotations({});
      setQuotations(response.data);
    } catch (error) {
      toast.error('Failed to load quotations');
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      const response = await api.downloadQuotationPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quotation_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quotations</h1>
        <Button onClick={() => navigate('/quotations/new')}><Plus size={16} className="mr-2" />New Quotation</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotations.map(qtn => (
          <Card key={qtn.quotation_id}>
            <CardHeader>
              <CardTitle>{qtn.quotation_no}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Date: {new Date(qtn.date).toLocaleDateString()}</p>
              <p className="text-sm">Validity: {qtn.validity_days} days</p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/quotations/${qtn.quotation_id}`)}>Edit</Button>
                <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(qtn.quotation_id)}><FileDown size={14} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
