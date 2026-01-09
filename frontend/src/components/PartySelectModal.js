import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
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
      <DialogContent className="w-[95vw] h-[90vh] max-w-full sm:max-w-lg mx-auto p-0 flex flex-col rounded-lg overflow-hidden">
        {/* Input Area - 15% height */}
        <div className="h-[15%] min-h-[80px] p-2 border-b bg-white flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-800">Select Party</span>
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
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <Input
              placeholder="Search name, city, GST, contact, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
              autoFocus
            />
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {filteredParties.length} of {parties.length} parties
          </div>
        </div>

        {/* Results Area - 85% height */}
        <div className="h-[85%] overflow-y-auto bg-gray-50">
          {filteredParties.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-gray-500">
              No parties found
            </div>
          ) : (
            <div className="p-1">
              {filteredParties.map(party => (
                <div
                  key={party.party_id}
                  onClick={() => handleSelectParty(party)}
                  className="p-2 mb-1 bg-white border rounded cursor-pointer hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 transition-all"
                >
                  <div className="font-medium text-xs text-gray-900 leading-tight truncate">
                    {party.party_name}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-0.5 truncate">
                    {party.city}{party.state ? `, ${party.state}` : ''}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                    {party.GST_number || 'No GST'} • {party.contact_person || ''} • {party.mobile || ''}
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
