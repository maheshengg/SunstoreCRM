import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, X, Plus } from 'lucide-react';

export const ItemSelectorModal = ({ open, onClose, items, onSelectItem, onQuickCreate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [filteredItems, setFilteredItems] = useState([]);

  // Extract unique brands and categories
  const brands = ['ALL', ...new Set(items.map(item => item.brand).filter(Boolean))];
  const categories = ['ALL', ...new Set(items.map(item => item.category).filter(Boolean))];

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedBrand('ALL');
      setSelectedCategory('ALL');
    }
  }, [open]);

  useEffect(() => {
    let results = items;

    if (selectedBrand !== 'ALL') {
      results = results.filter(item => item.brand === selectedBrand);
    }

    if (selectedCategory !== 'ALL') {
      results = results.filter(item => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item =>
        item.item_name?.toLowerCase().includes(query) ||
        item.item_code?.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    setFilteredItems(results);
  }, [searchQuery, selectedBrand, selectedCategory, items]);

  const handleSelectItem = (item) => {
    onSelectItem(item);
    onClose();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedBrand('ALL');
    setSelectedCategory('ALL');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-[90vh] max-w-full sm:max-w-3xl mx-0 sm:mx-auto p-0 flex flex-col">
        <DialogHeader className="p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-lg">Select Item</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search name, code, brand, category, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
              autoFocus
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand} className="text-xs">
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category} className="text-xs">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleClearFilters} className="text-xs h-9">
              <X size={14} className="mr-1" />
              Clear
            </Button>

            {onQuickCreate && (
              <Button variant="outline" size="sm" onClick={onQuickCreate} className="text-xs h-9 text-primary">
                <Plus size={14} className="mr-1" />
                New Item
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-500 mt-2">
            Showing {filteredItems.length} of {items.length} items
          </div>
        </DialogHeader>

        {/* Results Section - Scrollable */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No items found. Try adjusting your filters.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map(item => (
                <div
                  key={item.item_id}
                  onClick={() => handleSelectItem(item)}
                  className="p-2 sm:p-3 border rounded-lg cursor-pointer hover:bg-slate-50 hover:border-primary active:bg-slate-100 transition-all"
                >
                  <div className="font-medium text-sm leading-tight">
                    {item.item_name || item.description}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {item.brand || 'N/A'} | {item.category || 'N/A'} | {item.item_code}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    HSN: {item.HSN || 'N/A'} • GST: {item.GST_percent}% • ₹{item.rate}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
