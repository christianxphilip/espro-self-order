import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { billingGroupsAPI } from '../services/api';

export default function BillingGroups() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });

  const { data: billingGroups, isLoading } = useQuery({
    queryKey: ['billingGroups'],
    queryFn: () => billingGroupsAPI.getAll().then((res) => res.data.billingGroups),
  });

  const createMutation = useMutation({
    mutationFn: (data) => billingGroupsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['billingGroups']);
      setShowModal(false);
      setFormData({ name: '', startDate: '', endDate: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => billingGroupsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['billingGroups']);
      setShowModal(false);
      setEditingGroup(null);
      setFormData({ name: '', startDate: '', endDate: '' });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id) => billingGroupsAPI.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['billingGroups']);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => billingGroupsAPI.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['billingGroups']);
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id) => billingGroupsAPI.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['billingGroups']);
    },
  });

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      startDate: group.startDate ? new Date(group.startDate).toISOString().split('T')[0] : '',
      endDate: group.endDate ? new Date(group.endDate).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    };
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleActivate = (id) => {
    if (confirm('Activate this billing group? This will enable self-service ordering.')) {
      activateMutation.mutate(id);
    }
  };

  const handleDeactivate = (id) => {
    if (confirm('Deactivate this billing group? This will disable self-service ordering.')) {
      deactivateMutation.mutate(id);
    }
  };

  const handleClose = (id) => {
    if (confirm('Close this billing group? This will mark it as paid/completed and disable ordering.')) {
      closeMutation.mutate(id);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-espro-dark">Billing Groups</h1>
          <button
            onClick={() => {
              setEditingGroup(null);
              setFormData({ name: '', startDate: '', endDate: '' });
              setShowModal(true);
            }}
            className="bg-espro-orange text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Create Billing Group
          </button>
        </div>

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billingGroups?.map((group) => (
                  <tr key={group._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {group.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {group.startDate
                        ? new Date(group.startDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {group.endDate ? new Date(group.endDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₱{group.totalAmount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {group.orderCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          group.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {group.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(group)}
                        className="text-espro-orange hover:text-orange-600"
                      >
                        Edit
                      </button>
                      {group.isActive ? (
                        <>
                          <button
                            onClick={() => handleDeactivate(group._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Deactivate
                          </button>
                          <button
                            onClick={() => handleClose(group._id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Close and mark as paid"
                          >
                            Close
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleActivate(group._id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Activate
                        </button>
                      )}
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
                {editingGroup ? 'Edit Billing Group' : 'Create Billing Group'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Name (Event Name)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Company Event 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-espro-orange text-white py-2 rounded-lg hover:bg-orange-600"
                  >
                    {editingGroup ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingGroup(null);
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
