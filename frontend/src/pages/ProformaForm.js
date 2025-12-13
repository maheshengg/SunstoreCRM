import React from 'react';
import { useNavigate } from 'react-router-dom';

export const ProformaForm = () => {
  const navigate = useNavigate();
  return <div><h1 className="text-3xl font-bold">Proforma Invoice Form</h1><p>Similar to Quotation Form</p></div>;
};
