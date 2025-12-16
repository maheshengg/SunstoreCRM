import React from 'react';
import { Badge } from './ui/badge';

export const StatusBadge = ({ type, status }) => {
  const getStatusConfig = () => {
    // Lead statuses
    if (type === 'lead') {
      switch (status) {
        case 'Open':
          return { className: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Open' };
        case 'Converted':
          return { className: 'bg-green-100 text-green-800 border-green-300', label: 'Converted' };
        case 'Lost':
          return { className: 'bg-red-100 text-red-800 border-red-300', label: 'Lost' };
        default:
          return { className: 'bg-gray-100 text-gray-800 border-gray-300', label: status || 'N/A' };
      }
    }
    
    // Quotation statuses
    if (type === 'quotation') {
      switch (status) {
        case 'Successful':
          return { className: 'bg-teal-100 text-teal-800 border-teal-300', label: 'Successful' };
        case 'Lost':
          return { className: 'bg-red-100 text-red-800 border-red-300', label: 'Lost' };
        case null:
        case undefined:
          return { className: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Pending' };
        default:
          return { className: 'bg-gray-100 text-gray-800 border-gray-300', label: status };
      }
    }
    
    // Proforma statuses
    if (type === 'proforma') {
      switch (status) {
        case 'PI Submitted':
          return { className: 'bg-amber-100 text-amber-800 border-amber-300', label: 'PI Submitted' };
        case 'Payment Recd':
          return { className: 'bg-green-100 text-green-800 border-green-300', label: 'Payment Recd' };
        default:
          return { className: 'bg-gray-100 text-gray-800 border-gray-300', label: status || 'N/A' };
      }
    }
    
    // SOA statuses
    if (type === 'soa') {
      switch (status) {
        case 'In Process':
          return { className: 'bg-blue-100 text-blue-800 border-blue-300', label: 'In Process' };
        case 'Material Given':
          return { className: 'bg-green-100 text-green-800 border-green-300', label: 'Material Given' };
        default:
          return { className: 'bg-gray-100 text-gray-800 border-gray-300', label: status || 'N/A' };
      }
    }
    
    return { className: 'bg-gray-100 text-gray-800 border-gray-300', label: status || 'N/A' };
  };
  
  const config = getStatusConfig();
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};
