import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Upload, Edit, Trash2, ArrowUpDown, Download } from 'lucide-react';
import { toast } from 'sonner';

export const Items = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await api.deleteItem(id);
      toast.success('Item deleted successfully');
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to delete');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) return;
    
    try {
      await Promise.all(selectedItems.map(id => api.deleteItem(id)));
      toast.success(`${selectedItems.length} items deleted successfully`);
      setSelectedItems([]);
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete items');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.exportItemsCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'items.csv');
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
      await api.uploadItemsCSV(file);
      toast.success('Items uploaded successfully');
      fetchItems();
    } catch (error) {
      toast.error('Failed to upload items');
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
      setSelectedItems(filteredItems.map(i => i.item_id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const filteredItems = items.filter(item =>
    item.item_name.toLowerCase().includes(search.toLowerCase()) ||
    item.item_code.toLowerCase().includes(search.toLowerCase()) ||
    item.HSN?.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
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
        <h1 className="text-3xl font-bold tracking-tight">Items</h1>
        <div className="flex gap-2 flex-wrap">
          {user?.role === 'Admin' && selectedItems.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} className="gap-2">
              <Trash2 size={16} />
              Delete Selected ({selectedItems.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download size={16} />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('file-upload').click()} className="gap-2">
            <Upload size={16} />
            Import CSV
          </Button>
          <input id="file-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          <Button onClick={() => navigate('/items/new')} className="gap-2">
            <Plus size={16} />
            Add Item
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
        <Input
          placeholder="Search by item name, code or HSN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyUp={fetchItems}
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
                        checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead className="cursor-pointer" onClick={() => handleSort('item_id')}>
                    <div className="flex items-center gap-2">
                      Item ID <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('description')}>
                    <div className="flex items-center gap-2">
                      Description <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('item_code')}>
                    <div className="flex items-center gap-2">
                      Item Code <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead>HSN</TableHead>
                  <TableHead>GST %</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => (
                  <TableRow key={item.item_id}>
                    {user?.role === 'Admin' && (
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(item.item_id)}
                          onCheckedChange={(checked) => handleSelectItem(item.item_id, checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{item.item_id}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="whitespace-normal break-words">
                        {item.description || item.item_name || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>{item.item_code}</TableCell>
                    <TableCell>{item.HSN || 'N/A'}</TableCell>
                    <TableCell>{item.GST_percent}%</TableCell>
                    <TableCell>{item.created_by_user_id || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/items/${item.item_id}`)}
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                        {user?.role === 'Admin' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.item_id)}
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
            {sortedItems.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No items found.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
