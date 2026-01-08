import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, FileDown, Filter, Trash2, User, Grid, List } from 'lucide-react';
import { toast } from 'sonner';

export const Quotations = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [partiesMap, setPartiesMap] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const navigate = useNavigate();
  
  // Filter states
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState('all_time');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.data);
      const map = {};
      response.data.forEach(u => { map[u.user_id] = u.name; });
      setUsersMap(map);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const fetchParties = async () => {
    try {
      const response = await api.getParties();
      const map = {};
      response.data.forEach(p => { map[p.party_id] = p.party_name; });
      setPartiesMap(map);
    } catch (error) {
      console.error('Failed to fetch parties');
    }
  };

  const fetchQuotations = async () => {
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
      
      const response = await api.getQuotations(params);
      setQuotations(response.data);
    } catch (error) {
      toast.error('Failed to load quotations');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchParties();
    fetchQuotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilter = () => {
    fetchQuotations();
  };

  const getPartyShortName = (partyId) => {
    const partyName = partiesMap[partyId] || '';
    return partyName.substring(0, 5).toUpperCase();
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    
    try {
      await api.deleteQuotation(id);
      toast.success('Quotation deleted successfully');
      fetchQuotations();
    } catch (error) {
      toast.error('Failed to delete quotation');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quotations</h1>
        <Button onClick={() => navigate('/quotations/new')}><Plus size={16} className="mr-2" />New Quotation</Button>
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
        {quotations.map(qtn => (
          <Card key={qtn.quotation_id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{qtn.quotation_no}</CardTitle>
                <Badge variant={
                  qtn.quotation_status === 'Successful' ? 'default' :
                  qtn.quotation_status === 'Lost' ? 'destructive' :
                  qtn.quotation_status === 'In Process' ? 'outline' : 'secondary'
                }>
                  {qtn.quotation_status || 'Pending'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Date: {new Date(qtn.date).toLocaleDateString()}</p>
              <p className="text-sm">Validity: {qtn.validity_days} days</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <User size={14} />
                <span>{usersMap[qtn.created_by_user_id] || 'Unknown'}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/quotations/${qtn.quotation_id}`)}>Edit</Button>
                <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(qtn.quotation_id)}><FileDown size={14} /></Button>
                {user?.role === 'Admin' && (
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(qtn.quotation_id)}><Trash2 size={14} /></Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {quotations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No quotations found for the selected filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
