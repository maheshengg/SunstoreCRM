import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Search, Download, Edit, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export const Parties = () => {
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
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

  const filteredParties = parties.filter(party =>
    party.party_name.toLowerCase().includes(search.toLowerCase()) ||
    party.GST_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Parties</h1>
        <div className="flex gap-2">
          <Button data-testid="export-csv-btn" variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download size={16} />
            Export CSV
          </Button>
          <Button 
            data-testid="import-csv-btn" 
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
          <Button data-testid="add-party-btn" onClick={() => navigate('/parties/new')} className="gap-2">
            <Plus size={16} />
            Add Party
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
        <Input
          data-testid="search-input"
          placeholder="Search by name or GST..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredParties.map((party) => (
            <Card key={party.party_id} data-testid={`party-card-${party.party_id}`} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{party.party_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{party.city}, {party.state}</p>
                <p className="text-sm"><span className="font-medium">GST:</span> {party.GST_number}</p>
                <p className="text-sm"><span className="font-medium">Contact:</span> {party.contact_person}</p>
                <p className="text-sm">{party.mobile}</p>
                <div className="flex gap-2 pt-4">
                  <Button
                    data-testid={`edit-party-${party.party_id}`}
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/parties/${party.party_id}`)}
                    className="flex-1 gap-2"
                  >
                    <Edit size={14} />
                    Edit
                  </Button>
                  <Button
                    data-testid={`delete-party-${party.party_id}`}
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(party.party_id)}
                    className="gap-2"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredParties.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No parties found. Create your first party!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
