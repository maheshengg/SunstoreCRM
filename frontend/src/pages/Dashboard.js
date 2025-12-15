import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Inbox, FileText, FileCheck, Package as PackageIcon, Flag, Users, Layers, Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  
  // Filter states
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchUsers();
    }
    fetchDashboardData();
  }, [selectedUser, selectedPeriod, customFromDate, customToDate]);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const fetchDashboardData = async () => {
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
      
      const statsRes = await api.getDashboardStats(params);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Status color mapping
  const statusColors = {
    // Leads
    open: 'text-blue-600',
    converted: 'text-green-600',
    lost: 'text-red-600',
    // Quotations
    successful: 'text-teal-600',
    quotLost: 'text-red-600',
    pending: 'text-gray-500',
    // Proforma
    pi_submitted: 'text-amber-600',
    payment_recd: 'text-green-600',
    // SOA
    in_process: 'text-blue-600',
    material_given: 'text-green-600'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Here's an overview of your business</p>
      </div>

      {/* Filters */}
      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {user?.role === 'Admin' && (
              <div className="space-y-2">
                <Label htmlFor="user-filter" data-testid="user-filter-label">Select User:</Label>
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
            
            <div className="space-y-2">
              <Label htmlFor="period-filter" data-testid="period-filter">Period:</Label>
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
          </div>
        </CardContent>
      </Card>

      {/* FIRST ROW - Primary Document Flow (4 boxes with status breakdown) */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Document Flow</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Leads */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/leads')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Leads</CardTitle>
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.leads?.total || 0}</div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className={statusColors.open}>Open:</span>
                  <span className={`font-semibold ${statusColors.open}`}>{stats?.leads?.open || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className={statusColors.converted}>Converted:</span>
                  <span className={`font-semibold ${statusColors.converted}`}>{stats?.leads?.converted || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className={statusColors.lost}>Lost:</span>
                  <span className={`font-semibold ${statusColors.lost}`}>{stats?.leads?.lost || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quotations */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/quotations')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Quotations</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.quotations?.total || 0}</div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className={statusColors.successful}>Successful:</span>
                  <span className={`font-semibold ${statusColors.successful}`}>{stats?.quotations?.successful || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className={statusColors.quotLost}>Lost:</span>
                  <span className={`font-semibold ${statusColors.quotLost}`}>{stats?.quotations?.lost || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className={statusColors.pending}>Pending:</span>
                  <span className={`font-semibold ${statusColors.pending}`}>{stats?.quotations?.pending || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proforma */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/proforma-invoices')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Proforma</CardTitle>
              <FileCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.proforma_invoices?.total || 0}</div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className={statusColors.pi_submitted}>PI Submitted:</span>
                  <span className={`font-semibold ${statusColors.pi_submitted}`}>{stats?.proforma_invoices?.pi_submitted || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className={statusColors.payment_recd}>Payment Recd:</span>
                  <span className={`font-semibold ${statusColors.payment_recd}`}>{stats?.proforma_invoices?.payment_recd || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SOA */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/soa')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">SOA</CardTitle>
              <PackageIcon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.soa?.total || 0}</div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className={statusColors.in_process}>In Process:</span>
                  <span className={`font-semibold ${statusColors.in_process}`}>{stats?.soa?.in_process || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className={statusColors.material_given}>Material Given:</span>
                  <span className={`font-semibold ${statusColors.material_given}`}>{stats?.soa?.material_given || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECOND ROW - Master Data (3 boxes) */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Master Data</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Open Leads */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/leads')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Leads</CardTitle>
              <Flag className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.open_leads || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Active leads requiring attention</p>
            </CardContent>
          </Card>

          {/* Parties */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/parties')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Parties</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.parties || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Total registered parties</p>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/items')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Items</CardTitle>
              <Layers className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.items || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Product catalog items</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* THIRD ROW - Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button onClick={() => navigate('/parties/new')} className="h-20 flex flex-col gap-2">
            <Plus size={20} />
            <span>Add Party</span>
          </Button>
          <Button onClick={() => navigate('/items/new')} className="h-20 flex flex-col gap-2">
            <Plus size={20} />
            <span>Add Item</span>
          </Button>
          <Button onClick={() => navigate('/quotations/new')} className="h-20 flex flex-col gap-2">
            <Plus size={20} />
            <span>New Quote</span>
          </Button>
          <Button onClick={() => navigate('/reports')} variant="outline" className="h-20 flex flex-col gap-2">
            <Zap size={20} />
            <span>Reports</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
