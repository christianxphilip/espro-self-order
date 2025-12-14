import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { tablesAPI, menuAPI, billingGroupsAPI } from '../services/api';

export default function Dashboard() {
  const { data: tables } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tablesAPI.getAll().then((res) => res.data.tables),
  });

  const { data: menuItems } = useQuery({
    queryKey: ['menu'],
    queryFn: () => menuAPI.getAll().then((res) => res.data.menuItems),
  });

  const { data: billingGroups } = useQuery({
    queryKey: ['billingGroups'],
    queryFn: () => billingGroupsAPI.getAll().then((res) => res.data.billingGroups),
  });

  const activeBillingGroup = billingGroups?.find((bg) => bg.isActive);
  const activeTables = tables?.filter((t) => t.isActive) || [];
  const availableMenuItems = menuItems?.filter((m) => m.isAvailable) || [];

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-espro-dark mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tables</h3>
            <p className="text-3xl font-bold text-espro-orange">{tables?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-1">{activeTables.length} active</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Menu Items</h3>
            <p className="text-3xl font-bold text-espro-orange">{menuItems?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-1">{availableMenuItems.length} available</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Billing Groups</h3>
            <p className="text-3xl font-bold text-espro-orange">{billingGroups?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-1">
              {activeBillingGroup ? '1 active' : 'None active'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">System Status</h3>
            <p className="text-2xl font-bold text-green-600">Online</p>
            <p className="text-sm text-gray-500 mt-1">All services running</p>
          </div>
        </div>

        {activeBillingGroup && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-espro-dark mb-4">Active Billing Group</h2>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Name:</span> {activeBillingGroup.name}
              </p>
              <p>
                <span className="font-semibold">Total Amount:</span> ₱
                {activeBillingGroup.totalAmount?.toFixed(2) || '0.00'}
              </p>
              <p>
                <span className="font-semibold">Order Count:</span> {activeBillingGroup.orderCount || 0}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-espro-dark mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/tables"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-espro-orange transition text-center"
            >
              <p className="font-semibold text-espro-dark">Manage Tables</p>
              <p className="text-sm text-gray-500">Create and manage table QR codes</p>
            </a>
            <a
              href="/menu"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-espro-orange transition text-center"
            >
              <p className="font-semibold text-espro-dark">Manage Menu</p>
              <p className="text-sm text-gray-500">Add and edit menu items</p>
            </a>
            <a
              href="/billing-groups"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-espro-orange transition text-center"
            >
              <p className="font-semibold text-espro-dark">Billing Groups</p>
              <p className="text-sm text-gray-500">Create and activate events</p>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
