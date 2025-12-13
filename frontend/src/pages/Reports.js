import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { api } from '../utils/api';
import { toast } from 'sonner';

export const Reports = () => {
  const [reports, setReports] = useState({});

  const fetchReport = async (type) => {
    try {
      let response;
      switch(type) {
        case 'item': response = await api.getItemWiseSales(); break;
        case 'party': response = await api.getPartyWiseSales(); break;
        case 'user': response = await api.getUserWiseSales(); break;
        case 'lead': response = await api.getLeadConversion(); break;
        case 'gst': response = await api.getGSTSummary(); break;
        default: return;
      }
      setReports({ ...reports, [type]: response.data });
    } catch (error) {
      toast.error('Failed to fetch report');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>
      
      <Tabs defaultValue="item" className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          <TabsTrigger value="item" onClick={() => fetchReport('item')}>Item Sales</TabsTrigger>
          <TabsTrigger value="party" onClick={() => fetchReport('party')}>Party Sales</TabsTrigger>
          <TabsTrigger value="user" onClick={() => fetchReport('user')}>User Sales</TabsTrigger>
          <TabsTrigger value="lead" onClick={() => fetchReport('lead')}>Lead Conversion</TabsTrigger>
          <TabsTrigger value="gst" onClick={() => fetchReport('gst')}>GST Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="item">
          <Card>
            <CardHeader><CardTitle>Item-wise Sales Report</CardTitle></CardHeader>
            <CardContent>
              {reports.item ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr><th>Item ID</th><th>Qty</th><th>Amount</th></tr></thead>
                    <tbody>{reports.item.map(i => <tr key={i.item_id}><td>{i.item_id}</td><td>{i.qty}</td><td>₹{i.amount.toFixed(2)}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : <p>No data</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gst">
          <Card>
            <CardHeader><CardTitle>GST Summary</CardTitle></CardHeader>
            <CardContent>
              {reports.gst && (
                <div className="space-y-2">
                  <p>CGST: ₹{reports.gst.CGST}</p>
                  <p>SGST: ₹{reports.gst.SGST}</p>
                  <p>IGST: ₹{reports.gst.IGST}</p>
                  <p className="font-bold">Total: ₹{reports.gst.total_tax}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
