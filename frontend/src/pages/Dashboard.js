import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Users, Package, FileText, File, FileCheck, FileBarChart, TrendingUp, Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
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
      
      // Only add user_id for Admin
      if (user?.role === 'Admin' && selectedUser !== 'ALL') {
        params.user_id = selectedUser;
      }
      
      // Add custom date range if selected
      if (selectedPeriod === 'custom' && customFromDate && customToDate) {
        params.from_date = customFromDate;
        params.to_date = customToDate;
      }
      
      const [statsRes, activityRes] = await Promise.all([
        api.getDashboardStats(params),
        api.getRecentActivity(params)
      ]);
      setStats(statsRes.data);
      setActivity(activityRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Parties', value: stats?.parties || 0, icon: Users, color: 'bg-blue-500', path: '/parties' },
    { title: 'Items', value: stats?.items || 0, icon: Package, color: 'bg-green-500', path: '/items' },
    { title: 'Leads', value: stats?.leads || 0, icon: FileText, color: 'bg-amber-500', path: '/leads' },
    { title: 'Quotations', value: stats?.quotations || 0, icon: File, color: 'bg-purple-500', path: '/quotations' },
    { title: 'Proforma', value: stats?.proforma_invoices || 0, icon: FileCheck, color: 'bg-pink-500', path: '/proforma-invoices' },
    { title: 'SOA', value: stats?.soa || 0, icon: FileBarChart, color: 'bg-indigo-500', path: '/soa' },
    { title: 'Open Leads', value: stats?.open_leads || 0, icon: TrendingUp, color: 'bg-red-500', path: '/leads' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">{user?.role} Dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="create-lead-btn" onClick={() => navigate('/leads/new')} className="gap-2">
            <Plus size={16} />
            New Lead
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            data-testid={`stat-card-${stat.title.toLowerCase()}`}
            className="hover:shadow-lg transition-shadow cursor-pointer border-l-4"
            style={{ borderLeftColor: stat.color.replace('bg-', '') }}
            onClick={() => navigate(stat.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.color} p-2 rounded-lg text-white`}>
                <stat.icon size={20} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Button data-testid="quick-add-party" variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate('/parties/new')}>
              <Users size={24} />
              <span className="text-sm">Add Party</span>
            </Button>
            <Button data-testid="quick-add-item" variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate('/items/new')}>
              <Package size={24} />
              <span className="text-sm">Add Item</span>
            </Button>
            <Button data-testid="quick-new-quotation" variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate('/quotations/new')}>
              <File size={24} />
              <span className="text-sm">New Quote</span>
            </Button>
            <Button data-testid="quick-view-reports" variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate('/reports')}>
              <FileBarChart size={24} />
              <span className="text-sm">Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {user?.role === 'Admin' && activity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.slice(0, 10).map((log, index) => (
                <div key={index} data-testid={`activity-${index}`} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-sm">{log.action} - {log.document_type}</p>
                    <p className="text-xs text-muted-foreground">Document: {log.document_id}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
