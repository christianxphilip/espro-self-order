import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { tablesAPI } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');
const SELF_ORDER_URL = import.meta.env.VITE_SELF_ORDER_URL || 'http://localhost:8084';

export default function Tables() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    location: '',
    isActive: true,
    customRedirectEnabled: false,
    customRedirectUrl: '',
  });

  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tablesAPI.getAll().then((res) => res.data.tables),
  });

  const createMutation = useMutation({
    mutationFn: (data) => tablesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tables']);
      setShowModal(false);
      setFormData({ tableNumber: '', location: '', isActive: true, customRedirectEnabled: false, customRedirectUrl: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tablesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tables']);
      setShowModal(false);
      setEditingTable(null);
      setFormData({ tableNumber: '', location: '', isActive: true, customRedirectEnabled: false, customRedirectUrl: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => tablesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tables']);
    },
  });

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      location: table.location || '',
      isActive: table.isActive,
      customRedirectEnabled: table.customRedirectEnabled || false,
      customRedirectUrl: table.customRedirectUrl || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTable) {
      updateMutation.mutate({ id: editingTable._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this table?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-espro-dark">Tables Management</h1>
          <button
            onClick={() => {
              setEditingTable(null);
              setFormData({ tableNumber: '', location: '', isActive: true, customRedirectEnabled: false, customRedirectUrl: '' });
              setShowModal(true);
            }}
            className="bg-espro-orange text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Add Table
          </button>
        </div>

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tables?.map((table) => (
                  <tr key={table._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {table.tableNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.location || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          table.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {table.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {table.qrCodeUrl ? (
                        <div className="flex items-center space-x-3">
                          <img
                            src={table.qrCodeUrl.startsWith('http') ? table.qrCodeUrl : `${BACKEND_URL}${table.qrCodeUrl}`}
                            alt={`QR Code for ${table.tableNumber}`}
                            className="w-20 h-20 object-contain border border-gray-200 rounded bg-white p-1"
                            onError={(e) => {
                              console.error('Failed to load QR code image:', e);
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="flex flex-col space-y-1">
                            <a
                              href={table.qrCodeUrl.startsWith('http') ? table.qrCodeUrl : `http://localhost:8086${table.qrCodeUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-espro-orange hover:underline text-sm"
                            >
                              View Full Size
                            </a>
                            {table.qrCode && (
                              <button
                                onClick={() => {
                                  // Use backend redirect endpoint to respect custom redirect settings
                                  const redirectUrl = `${BACKEND_URL}/api/tables/redirect?table=${encodeURIComponent(table.tableNumber)}`;
                                  window.open(redirectUrl, '_blank');
                                }}
                                className="text-blue-600 hover:text-blue-800 hover:underline text-sm text-left"
                                title={`Open self-order portal for ${table.tableNumber}`}
                              >
                                Open Self-Order
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Generating...</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(table)}
                        className="text-espro-orange hover:text-orange-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(table._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {editingTable ? 'Edit Table' : 'Add Table'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Number
                  </label>
                  <input
                    type="text"
                    value={formData.tableNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, tableNumber: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Active</label>
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={formData.customRedirectEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, customRedirectEnabled: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Redirect to specific URL
                    </label>
                  </div>
                  {formData.customRedirectEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Redirect URL
                      </label>
                      <input
                        type="url"
                        value={formData.customRedirectUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, customRedirectUrl: e.target.value })
                        }
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        When enabled, QR code scans will redirect to this URL instead of the self-order portal.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-espro-orange text-white py-2 rounded-lg hover:bg-orange-600"
                  >
                    {editingTable ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTable(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
