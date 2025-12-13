import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';

export const Items = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.getItems({ search });
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to load items');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await api.uploadItemsCSV(file);
      toast.success('Items uploaded successfully');
      fetchItems();
    } catch (error) {
      toast.error('Failed to upload items');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Items</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => document.getElementById('file-upload').click()}>
            <Upload size={16} className="mr-2" />
            Upload CSV
          </Button>
          <input id="file-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          <Button onClick={() => navigate('/items/new')}>
            <Plus size={16} className="mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} />
        <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyUp={fetchItems} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <Card key={item.item_id} className="cursor-pointer hover:shadow-lg transition" onClick={() => navigate(`/items/${item.item_id}`)}>
            <CardHeader>
              <CardTitle>{item.item_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Code: {item.item_code}</p>
              <p className="text-sm">Rate: ₹{item.rate}</p>
              <p className="text-sm">HSN: {item.HSN}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
