import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { billingGroupsAPI, billsAPI } from '../services/api';

export default function Bills() {
  const queryClient = useQueryClient();
  const [selectedBillingGroup, setSelectedBillingGroup] = useState(null);
  const [viewType, setViewType] = useState('summary'); // 'summary' or 'detailed'

  const { data: billingGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ['billingGroups'],
    queryFn: () => billingGroupsAPI.getAll().then((res) => res.data.billingGroups),
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['billSummary', selectedBillingGroup],
    queryFn: () => billsAPI.getSummary(selectedBillingGroup).then((res) => res.data),
    enabled: !!selectedBillingGroup && viewType === 'summary',
  });

  const { data: detailedData, isLoading: detailedLoading } = useQuery({
    queryKey: ['billDetailed', selectedBillingGroup],
    queryFn: () => billsAPI.getDetailed(selectedBillingGroup).then((res) => res.data),
    enabled: !!selectedBillingGroup && viewType === 'detailed',
  });

  const summary = summaryData?.bill;
  const detailed = detailedData?.bill;

  const closeMutation = useMutation({
    mutationFn: (id) => billingGroupsAPI.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['billingGroups']);
      queryClient.invalidateQueries(['billSummary', selectedBillingGroup]);
      queryClient.invalidateQueries(['billDetailed', selectedBillingGroup]);
    },
  });

  const handleViewBill = (billingGroupId) => {
    setSelectedBillingGroup(billingGroupId);
    setViewType('summary');
  };

  const handleClose = (billingGroupId) => {
    if (confirm('Close this billing group? This will mark it as paid/completed and disable ordering.')) {
      closeMutation.mutate(billingGroupId);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-content {
            background: white;
            padding: 20px;
          }
          .print-content .bg-gray-50 {
            background: #f9fafb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-content .border {
            border: 1px solid #e5e7eb !important;
          }
          .print-content .border-t {
            border-top: 1px solid #e5e7eb !important;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
      <Layout>
        <div className="px-4 py-6 sm:px-0 print-content">
          <div className="flex justify-between items-center mb-6 no-print">
            <h1 className="text-3xl font-bold text-espro-dark">Bills</h1>
            {selectedBillingGroup && (
              <button
                onClick={handlePrint}
                className="bg-espro-orange text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Bill
              </button>
            )}
          </div>
          {!selectedBillingGroup && (
            <h1 className="text-3xl font-bold text-espro-dark mb-6 no-print">Bills</h1>
          )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 no-print">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-espro-dark mb-4">Select Billing Group</h2>
              {groupsLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-2">
                  {billingGroups?.map((group) => (
                    <button
                      key={group._id}
                      onClick={() => handleViewBill(group._id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition ${
                        selectedBillingGroup === group._id
                          ? 'border-espro-orange bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-semibold text-espro-dark">{group.name}</p>
                      <p className="text-sm text-gray-500">
                        {group.orderCount || 0} orders • ₱{group.totalAmount?.toFixed(2) || '0.00'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {group.isActive && (
                          <span className="text-xs text-green-600 font-medium">Active</span>
                        )}
                        {!group.isActive && group.endDate && (
                          <span className="text-xs text-gray-500 font-medium">Closed</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedBillingGroup ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6 no-print">
                  <h2 className="text-xl font-bold text-espro-dark">Bill Details</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewType('summary')}
                      className={`px-4 py-2 rounded-lg ${
                        viewType === 'summary'
                          ? 'bg-espro-orange text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Summary
                    </button>
                    <button
                      onClick={() => setViewType('detailed')}
                      className={`px-4 py-2 rounded-lg ${
                        viewType === 'detailed'
                          ? 'bg-espro-orange text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Detailed
                    </button>
                    {summary && summary.status === 'active' && (
                      <button
                        onClick={() => handleClose(selectedBillingGroup)}
                        disabled={closeMutation.isLoading}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
                        title="Mark as paid and close"
                      >
                        {closeMutation.isLoading ? 'Closing...' : 'Close & Mark Paid'}
                      </button>
                    )}
                  </div>
                </div>

                {viewType === 'summary' ? (
                  <div>
                    {summaryLoading ? (
                      <p>Loading summary...</p>
                    ) : summary ? (
                      <div className="space-y-4">
                        <div className="text-center mb-4 print-only" style={{ display: 'none' }}>
                          <h1 className="text-2xl font-bold text-espro-dark">{summary.billingName}</h1>
                          <p className="text-gray-600">Bill Summary</p>
                          <p className="text-sm text-gray-500">Printed on {new Date().toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-espro-dark mb-4">
                            Bill Summary
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Billing Group:</span>
                              <span className="font-semibold">{summary.billingName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Orders:</span>
                              <span className="font-semibold">{summary.orderCount || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Amount:</span>
                              <span className="font-semibold text-espro-orange text-xl">
                                ₱{summary.totalAmount?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className={`font-semibold ${
                                summary.status === 'active' ? 'text-green-600' : 'text-gray-600'
                              }`}>
                                {summary.status === 'active' ? 'Active' : 'Completed'}
                              </span>
                            </div>
                            {summary.startDate && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Start Date:</span>
                                <span className="font-semibold">
                                  {new Date(summary.startDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {summary.endDate && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">End Date:</span>
                                <span className="font-semibold">
                                  {new Date(summary.endDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p>No summary data available</p>
                    )}
                  </div>
                ) : (
                  <div>
                    {detailedLoading ? (
                      <p>Loading detailed bill...</p>
                    ) : detailed ? (
                      <div className="space-y-4">
                        <div className="text-center mb-4 print-only" style={{ display: 'none' }}>
                          <h1 className="text-2xl font-bold text-espro-dark">{detailed.billingName}</h1>
                          <p className="text-gray-600">Detailed Bill</p>
                          <p className="text-sm text-gray-500">Printed on {new Date().toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6 mb-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-semibold text-espro-dark">
                                {detailed.billingName}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Total: ₱{detailed.totalAmount?.toFixed(2) || '0.00'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Status: <span className={detailed.status === 'active' ? 'text-green-600' : 'text-gray-600'}>
                                  {detailed.status === 'active' ? 'Active' : 'Completed'}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Orders</p>
                              <p className="text-xl font-bold text-espro-orange">
                                {detailed.orderCount || 0}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {detailed.orders?.map((order) => (
                            <div key={order._id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold text-espro-dark">
                                    Order #{order.orderNumber}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Customer: {order.customerName}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Table: {order.tableNumber || 'N/A'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-espro-orange">
                                    ₱{order.totalAmount?.toFixed(2) || '0.00'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(order.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                                <ul className="space-y-1">
                                  {order.items?.map((item, idx) => (
                                    <li key={idx} className="text-sm text-gray-600">
                                      {item.quantity}x {item.name} - ₱
                                      {item.subtotal?.toFixed(2) || (item.price * item.quantity).toFixed(2)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p>No detailed data available</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 no-print">
                <p className="text-gray-500 text-center py-8">
                  Select a billing group to view bills
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </Layout>
    </>
  );
}
