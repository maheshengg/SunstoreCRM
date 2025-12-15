import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Plus, FileDown, Edit, Filter, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const ProformaInvoices = () => {
  const { user } = useAuth();
  const [pis, setPis] = useState([]);
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
    fetchPIs();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const fetchPIs = async () => {
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
      
      const response = await api.getProformaInvoices(params);
      setPis(response.data);
    } catch (error) {
      toast.error('Failed to load proforma invoices');
    }
  };

  const handleApplyFilter = () => {
    fetchPIs();
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this proforma invoice?')) return;
    
    try {
      await api.deleteProformaInvoice(id);
      toast.success('Proforma Invoice deleted successfully');
      fetchPIs();
    } catch (error) {
      toast.error('Failed to delete proforma invoice');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Proforma Invoices</h1>
        <Button onClick={() => navigate('/proforma-invoices/new')}><Plus size={16} className="mr-2" />New PI</Button>
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
                {user?.role === 'Admin' && (
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(pi.pi_id)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {pis.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No proforma invoices found for the selected filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
