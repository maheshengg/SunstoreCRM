import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, X, Plus, Filter } from 'lucide-react';

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

  const hasActiveFilters = selectedBrand !== 'ALL' || selectedCategory !== 'ALL';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] h-[90vh] max-w-full sm:max-w-lg mx-auto p-0 flex flex-col rounded-lg overflow-hidden">
        {/* Input Area - 15% height */}
        <div className="h-[15%] min-h-[100px] p-2 border-b bg-white flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-800">Select Item</span>
            <div className="flex items-center gap-1">
              {onQuickCreate && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 px-2 text-xs text-primary" 
                  onClick={onQuickCreate}
                >
                  <Plus size={14} className="mr-1" />
                  New
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
                <X size={18} />
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <Input
              placeholder="Search name, code, brand, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
              autoFocus
            />
          </div>

          {/* Compact Filters Row */}
          <div className="flex items-center gap-1 mt-1">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="text-[10px] h-6 flex-1 px-2">
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
              <SelectTrigger className="text-[10px] h-6 flex-1 px-2">
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

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-6 px-2 text-[10px]">
                <X size={12} />
              </Button>
            )}
            
            <span className="text-[10px] text-gray-500 whitespace-nowrap">
              {filteredItems.length}/{items.length}
            </span>
          </div>
        </div>

        {/* Results Area - 85% height */}
        <div className="h-[85%] overflow-y-auto bg-gray-50">
          {filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-gray-500">
              No items found
            </div>
          ) : (
            <div className="p-1">
              {filteredItems.map(item => (
                <div
                  key={item.item_id}
                  onClick={() => handleSelectItem(item)}
                  className="p-2 mb-1 bg-white border rounded cursor-pointer hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 transition-all"
                >
                  <div className="font-medium text-xs text-gray-900 leading-tight truncate">
                    {item.item_name || item.description}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-gray-600 truncate flex-1">
                      {item.brand || ''} {item.category ? `• ${item.category}` : ''} {item.item_code ? `• ${item.item_code}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-gray-500">
                      HSN: {item.HSN || 'N/A'} • GST: {item.GST_percent}%
                    </span>
                    <span className="text-[10px] font-semibold text-green-700">
                      ₹{item.rate}
                    </span>
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
