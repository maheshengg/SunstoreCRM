import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus, FileDown } from 'lucide-react';
import { toast } from 'sonner';

export const Leads = () => {
  const [leads, setLeads] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await api.getLeads({});
      setLeads(response.data);
    } catch (error) {
      toast.error('Failed to load leads');
    }
  };

  const handleConvert = async (id) => {
    try {
      await api.convertLead(id);
      toast.success('Lead converted to quotation');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to convert lead');
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      const response = await api.downloadLeadPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lead_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const getStatusColor = (status) => {
    const colors = { Open: 'bg-green-100 text-green-800', Converted: 'bg-blue-100 text-blue-800', Lost: 'bg-red-100 text-red-800' };
    return colors[status] || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Button onClick={() => navigate('/leads/new')}><Plus size={16} className="mr-2" />Add Lead</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.map(lead => (
          <Card key={lead.lead_id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{lead.contact_name}</CardTitle>
                <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{lead.requirement_summary}</p>
              <p className="text-xs">Date: {new Date(lead.lead_date).toLocaleDateString()}</p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/leads/${lead.lead_id}`)}>Edit</Button>
                <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(lead.lead_id)}>
                  <FileDown size={14} />
                </Button>
                {lead.status === 'Open' && (
                  <Button size="sm" onClick={() => handleConvert(lead.lead_id)}>Convert</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
