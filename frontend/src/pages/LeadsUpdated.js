import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Plus, FileDown, Filter, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

export const Leads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [parties, setParties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Filter states
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState('all_time');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  
  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [partiesRes, usersRes] = await Promise.all([
        api.getParties(),
        user?.role === 'Admin' ? api.getUsers() : Promise.resolve({ data: [] })
      ]);
      setParties(partiesRes.data);
      setUsers(usersRes.data);
      await fetchLeads();
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
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
      setCurrentPage(1);
    } catch (error) {
      toast.error('Failed to load leads');
    }
  };

  const handleApplyFilter = () => {
    fetchLeads();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await api.deleteLead(id);
      toast.success('Lead deleted successfully');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to delete lead');
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getPartyName = (partyId) => {
    const party = parties.find(p => p.party_id === partyId);
    return party?.party_name || 'Unknown';
  };

  const getUserName = (userId) => {
    const foundUser = users.find(u => u.user_id === userId);
    return foundUser?.name || userId || 'N/A';
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength);
  };

  // Sort leads
  const sortedLeads = [...leads].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aVal, bVal;
    
    if (sortConfig.key === 'party_name') {
      aVal = getPartyName(a.party_id);
      bVal = getPartyName(b.party_id);
    } else if (sortConfig.key === 'created_by') {
      aVal = getUserName(a.created_by_user_id);
      bVal = getUserName(b.created_by_user_id);
    } else {
      aVal = a[sortConfig.key] || '';
      bVal = b[sortConfig.key] || '';
    }
    
    if (sortConfig.direction === 'asc') {
      return aVal.toString().localeCompare(bVal.toString());
    } else {
      return bVal.toString().localeCompare(aVal.toString());
    }
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedLeads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Leads</h1>
          <Button onClick={() => navigate('/leads/new')}><Plus size={16} className="mr-2" />Add Lead</Button>
        </div>

        {/* Filters */}
        <Card className="bg-slate-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
              
              <div className={selectedPeriod === 'custom' ? '' : 'md:col-start-' + (user?.role === 'Admin' ? '3' : '2')}>
                <Button onClick={handleApplyFilter} className="w-full gap-2">
                  <Filter size={16} />
                  Apply Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('lead_id')}>
                        <div className="flex items-center gap-2">
                          Lead Ref <ArrowUpDown size={14} />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('lead_date')}>
                        <div className="flex items-center gap-2">
                          Date <ArrowUpDown size={14} />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('party_name')}>
                        <div className="flex items-center gap-2">
                          Party Name <ArrowUpDown size={14} />
                        </div>
                      </TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('created_by')}>
                        <div className="flex items-center gap-2">
                          Created By <ArrowUpDown size={14} />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((lead) => {
                      const partyName = getPartyName(lead.party_id);
                      const displayName = truncateText(partyName, 20);
                      
                      return (
                        <TableRow key={lead.lead_id}>
                          <TableCell className="font-medium">{lead.lead_id}</TableCell>
                          <TableCell>{new Date(lead.lead_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {partyName.length > 20 ? (
                              <Tooltip>
                                <TooltipTrigger>{displayName}...</TooltipTrigger>
                                <TooltipContent>{partyName}</TooltipContent>
                              </Tooltip>
                            ) : (
                              displayName
                            )}
                          </TableCell>
                          <TableCell>N/A</TableCell>
                          <TableCell>{getUserName(lead.created_by_user_id)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" onClick={() => navigate(`/leads/${lead.lead_id}`)}>
                                <Edit size={14} />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(lead.lead_id)}>
                                <FileDown size={14} />
                              </Button>
                              {lead.status === 'Open' && (
                                <Button size="sm" onClick={() => handleConvert(lead.lead_id)}>
                                  Convert
                                </Button>
                              )}
                              {user?.role === 'Admin' && (
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(lead.lead_id)}>
                                  <Trash2 size={14} />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {currentItems.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    No leads found for the selected filters.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {sortedLeads.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Items per page:</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedLeads.length)} of {sortedLeads.length}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
};
