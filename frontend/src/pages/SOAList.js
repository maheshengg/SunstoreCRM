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
import { Plus, FileDown, Edit, Filter, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

export const SOAList = () => {
  const { user } = useAuth();
  const [soas, setSoas] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersMap, setUsersMap] = useState({});
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
      // Create a map for quick lookup
      const map = {};
      response.data.forEach(u => { map[u.user_id] = u.name; });
      setUsersMap(map);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const fetchSOAs = async () => {
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
      
      const response = await api.getSOAs(params);
      setSoas(response.data);
    } catch (error) {
      toast.error('Failed to load SOAs');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSOAs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilter = () => {
    fetchSOAs();
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this SOA?')) return;
    
    try {
      await api.deleteSOA(id);
      toast.success('SOA deleted successfully');
      fetchSOAs();
    } catch (error) {
      toast.error('Failed to delete SOA');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sales Order Acknowledgement</h1>
        <Button onClick={() => navigate('/soa/new')}><Plus size={16} className="mr-2" />New SOA</Button>
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
        {soas.map(soa => (
          <Card key={soa.soa_id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{soa.soa_no}</CardTitle>
                <Badge variant={soa.soa_status === 'Material Given' ? 'default' : 'secondary'}>
                  {soa.soa_status || 'In Process'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Date: {new Date(soa.date).toLocaleDateString()}</p>
              <p className="text-sm">Confirmation: {soa.party_confirmation_ID}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <User size={14} />
                <span>{usersMap[soa.created_by_user_id] || 'Unknown'}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/soa/${soa.soa_id}`)}>
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(soa.soa_id, soa.soa_no)}>
                  <FileDown size={14} className="mr-1" />
                  PDF
                </Button>
                {user?.role === 'Admin' && (
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(soa.soa_id)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {soas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No SOAs found for the selected filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
