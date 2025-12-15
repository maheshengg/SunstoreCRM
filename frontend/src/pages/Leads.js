import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Plus, FileDown, Filter } from 'lucide-react';
import { toast } from 'sonner';

export const Leads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  
  // Filter states
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState('all_time');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchUsers();
    }
    fetchLeads();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const fetchLeads = async () => {
    try {
      const params = {
        period: selectedPeriod
      };
      
      if (user?.role === 'Admin' && selectedUser !== 'ALL') {
        params.user_id = selectedUser;
      }
      
      if (selectedPeriod === 'custom' && customFromDate && customToDate) {
        params.from_date = customFromDate;
        params.to_date = customToDate;
      }
      
      const response = await api.getLeads(params);
      setLeads(response.data);
    } catch (error) {
      toast.error('Failed to load leads');
    }
  };

  const handleApplyFilter = () => {
    fetchLeads();
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

      {/* Filters */}
      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* User Filter - Only for Admin */}
            {user?.role === 'Admin' && (
              <div className="space-y-2">
                <Label htmlFor="user-filter">Select User:</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="user-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">ALL (default)</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Period Filter */}
            <div className="space-y-2">
              <Label htmlFor="period-filter">Period:</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger id="period-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Last 7 days</SelectItem>
                  <SelectItem value="monthly">Last 30 days</SelectItem>
                  <SelectItem value="ytd">Year-to-Date (Apr 1 - Today)</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Custom Date Range */}
            {selectedPeriod === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="from-date">From Date:</Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to-date">To Date:</Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                  />
                </div>
              </>
            )}
            
            {/* Apply Filter Button */}
            <div className={selectedPeriod === 'custom' ? '' : 'md:col-start-' + (user?.role === 'Admin' ? '3' : '2')}>
              <Button onClick={handleApplyFilter} className="w-full gap-2">
                <Filter size={16} />
                Apply Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
      
      {leads.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No leads found for the selected filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
