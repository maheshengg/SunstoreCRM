import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Plus, X } from 'lucide-react';

export const MobileSelectModal = ({
  isOpen,
  onClose,
  title,
  options,
  onSelect,
  onQuickCreate,
  quickCreateLabel,
  searchPlaceholder = "Search...",
  renderOption,
  searchFields = ['label']
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions(options);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = options.filter(option => {
      return searchFields.some(field => {
        const value = option[field];
        return value && value.toString().toLowerCase().includes(term);
      });
    });
    setFilteredOptions(filtered);
  }, [searchTerm, options, searchFields]);

  const handleSelect = (option) => {
    onSelect(option);
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-[85vh] max-w-full sm:max-w-lg mx-0 sm:mx-auto p-0 flex flex-col">
        <DialogHeader className="p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          {onQuickCreate && (
            <Button 
              variant="outline" 
              className="mt-2 w-full gap-2" 
              onClick={() => {
                onQuickCreate();
                onClose();
              }}
            >
              <Plus size={16} />
              {quickCreateLabel || 'Create New'}
            </Button>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-2">
          {filteredOptions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No results found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredOptions.map((option, index) => (
                <div
                  key={option.value || index}
                  className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
                  onClick={() => handleSelect(option)}
                >
                  {renderOption ? renderOption(option) : (
                    <div className="text-sm font-medium">{option.label}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileSelectModal;
