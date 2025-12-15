import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Download, Edit, Trash2, Upload, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

export const Parties = () => {
  const { user } = useAuth();
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedParties, setSelectedParties] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      const response = await api.getParties();
      setParties(response.data);
    } catch (error) {
      toast.error('Failed to load parties');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this party?')) return;
    
    try {
      await api.deleteParty(id);
      toast.success('Party deleted successfully');
      fetchParties();
    } catch (error) {
      toast.error('Failed to delete party');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedParties.length === 0) {
      toast.error('Please select parties to delete');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedParties.length} parties?`)) return;
    
    try {
      await Promise.all(selectedParties.map(id => api.deleteParty(id)));
      toast.success(`${selectedParties.length} parties deleted successfully`);
      setSelectedParties([]);
      fetchParties();
    } catch (error) {
      toast.error('Failed to delete parties');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.exportPartiesCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'parties.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await api.uploadPartiesCSV(file);
      toast.success(response.data.message);
      fetchParties();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload parties CSV');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedParties(filteredParties.map(p => p.party_id));
    } else {
      setSelectedParties([]);
    }
  };

  const handleSelectParty = (partyId, checked) => {
    if (checked) {
      setSelectedParties([...selectedParties, partyId]);
    } else {
      setSelectedParties(selectedParties.filter(id => id !== partyId));
    }
  };

  const filteredParties = parties.filter(party =>
    party.party_name.toLowerCase().includes(search.toLowerCase()) ||
    party.GST_number.toLowerCase().includes(search.toLowerCase()) ||
    party.party_id.toLowerCase().includes(search.toLowerCase())
  );

  const sortedParties = [...filteredParties].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aVal = a[sortConfig.key] || '';
    const bVal = b[sortConfig.key] || '';
    
    if (sortConfig.direction === 'asc') {
      return aVal.toString().localeCompare(bVal.toString());
    } else {
      return bVal.toString().localeCompare(aVal.toString());
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Parties</h1>
        <div className="flex gap-2 flex-wrap">
          {user?.role === 'Admin' && selectedParties.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} className="gap-2">
              <Trash2 size={16} />
              Delete Selected ({selectedParties.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download size={16} />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('party-csv-upload').click()} 
            className="gap-2"
          >
            <Upload size={16} />
            Import CSV
          </Button>
          <input
            id="party-csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <Button onClick={() => navigate('/parties/new')} className="gap-2">
            <Plus size={16} />
            Add Party
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
        <Input
          placeholder="Search by Party ID, name or GST..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {user?.role === 'Admin' && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedParties.length === filteredParties.length && filteredParties.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead className="cursor-pointer" onClick={() => handleSort('party_id')}>
                    <div className="flex items-center gap-2">
                      Party ID <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('party_name')}>
                    <div className="flex items-center gap-2">
                      Party Name <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('GST_number')}>
                    <div className="flex items-center gap-2">
                      GST Number <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedParties.map((party) => (
                  <TableRow key={party.party_id}>
                    {user?.role === 'Admin' && (
                      <TableCell>
                        <Checkbox
                          checked={selectedParties.includes(party.party_id)}
                          onCheckedChange={(checked) => handleSelectParty(party.party_id, checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{party.party_id}</TableCell>
                    <TableCell>{party.party_name}</TableCell>
                    <TableCell>{party.GST_number}</TableCell>
                    <TableCell>{party.created_by_user_id || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/parties/${party.party_id}`)}
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                        {user?.role === 'Admin' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(party.party_id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {sortedParties.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No parties found.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
