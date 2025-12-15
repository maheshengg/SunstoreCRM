import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, X } from 'lucide-react';

export const ItemSelectorModal = ({ open, onClose, items, onSelectItem }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [filteredItems, setFilteredItems] = useState([]);

  // Extract unique brands and categories
  const brands = ['ALL', ...new Set(items.map(item => item.brand).filter(Boolean))];
  const categories = ['ALL', ...new Set(items.map(item => item.category).filter(Boolean))];

  useEffect(() => {
    if (!open) {
      // Reset filters when modal closes
      setSearchQuery('');
      setSelectedBrand('ALL');
      setSelectedCategory('ALL');
    }
  }, [open]);

  useEffect(() => {
    // Filter items based on search query, brand, and category
    let results = items;

    // Filter by brand
    if (selectedBrand !== 'ALL') {
      results = results.filter(item => item.brand === selectedBrand);
    }

    // Filter by category
    if (selectedCategory !== 'ALL') {
      results = results.filter(item => item.category === selectedCategory);
    }

    // Filter by search query (search across multiple fields)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item =>
        item.item_name.toLowerCase().includes(query) ||
        item.item_code.toLowerCase().includes(query) ||
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
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Item</DialogTitle>
        </DialogHeader>

        {/* Filters Section */}
        <div className="space-y-4 py-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-3">
              <Label htmlFor="search">Search Items</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="search"
                  placeholder="Search by name, code, brand, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <Label htmlFor="brand-filter">Brand</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger id="brand-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {brands.map(brand => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <Label htmlFor="category-filter">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <Button variant="outline" onClick={handleClearFilters} className="w-full gap-2">
                <X size={16} />
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredItems.length} of {items.length} items
          </div>
        </div>

        {/* Results Section */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No items found. Try adjusting your filters.
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.item_id}
                onClick={() => handleSelectItem(item)}
                className="p-4 border rounded-lg cursor-pointer hover:bg-slate-50 hover:border-primary transition-all"
              >
                <div className="font-medium text-base">
                  {item.item_name} – {item.brand || 'N/A'} – {item.category || 'N/A'} ({item.item_code})
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  HSN: {item.HSN || 'N/A'} | GST: {item.GST_percent}% | Rate: ₹{item.rate}
                </div>
                {item.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {item.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
