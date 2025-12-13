import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, FileDown, Edit } from 'lucide-react';
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

  const handleDownloadPDF = async (id, soa_no) => {
    try {
      const response = await api.downloadSOAPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `soa_${soa_no}.pdf`);
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
        <h1 className="text-3xl font-bold">Statement of Accounts</h1>
        <Button onClick={() => navigate('/soa/new')}><Plus size={16} className="mr-2" />New SOA</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {soas.map(soa => (
          <Card key={soa.soa_id}>
            <CardHeader><CardTitle>{soa.soa_no}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Date: {new Date(soa.date).toLocaleDateString()}</p>
              <p className="text-sm">Confirmation: {soa.party_confirmation_ID}</p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/soa/${soa.soa_id}`)}>
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(soa.soa_id, soa.soa_no)}>
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
