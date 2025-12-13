import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, FileDown, Edit } from 'lucide-react';
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

  const handleDownloadPDF = async (id, pi_no) => {
    try {
      const response = await api.downloadPIPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `proforma_invoice_${pi_no}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
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
            <CardContent className="space-y-2">
              <p className="text-sm">Date: {new Date(pi.date).toLocaleDateString()}</p>
              <p className="text-sm">Validity: {pi.validity_days} days</p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/proforma-invoices/${pi.pi_id}`)}>
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(pi.pi_id, pi.pi_no)}>
                  <FileDown size={14} className="mr-1" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
