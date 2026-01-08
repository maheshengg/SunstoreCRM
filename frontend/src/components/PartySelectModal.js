import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, X, Plus } from 'lucide-react';

export const PartySelectModal = ({ open, onClose, parties, onSelectParty, onQuickCreate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredParties, setFilteredParties] = useState([]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredParties(parties);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = parties.filter(party =>
      party.party_name?.toLowerCase().includes(query) ||
      party.city?.toLowerCase().includes(query) ||
      party.GST_number?.toLowerCase().includes(query) ||
      party.contact_person?.toLowerCase().includes(query) ||
      party.mobile?.includes(query)
    );
    setFilteredParties(filtered);
  }, [searchQuery, parties]);

  const handleSelectParty = (party) => {
    onSelectParty(party);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-[85vh] max-w-full sm:max-w-lg mx-0 sm:mx-auto p-0 flex flex-col">
        <DialogHeader className="p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-lg">Select Party</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search by name, city, GST, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
              autoFocus
            />
          </div>

          {/* Quick Create Button */}
          {onQuickCreate && (
            <Button 
              variant="outline" 
              className="mt-2 w-full gap-2 text-primary" 
              onClick={onQuickCreate}
            >
              <Plus size={16} />
              Create New Party
            </Button>
          )}

          <div className="text-xs text-gray-500 mt-2">
            Showing {filteredParties.length} of {parties.length} parties
          </div>
        </DialogHeader>

        {/* Results Section - Scrollable */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3">
          {filteredParties.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No parties found. Try a different search.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredParties.map(party => (
                <div
                  key={party.party_id}
                  onClick={() => handleSelectParty(party)}
                  className="p-2 sm:p-3 border rounded-lg cursor-pointer hover:bg-slate-50 hover:border-primary active:bg-slate-100 transition-all"
                >
                  <div className="font-medium text-sm leading-tight">
                    {party.party_name}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {party.city}, {party.state}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    GST: {party.GST_number || 'N/A'} • {party.contact_person} • {party.mobile}
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

export default PartySelectModal;
