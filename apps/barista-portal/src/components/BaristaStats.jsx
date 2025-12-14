export default function BaristaStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-md p-4">
        <p className="text-sm text-gray-600 mb-1">Pending</p>
        <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4">
        <p className="text-sm text-gray-600 mb-1">Preparing</p>
        <p className="text-2xl font-bold text-blue-600">{stats.preparing || 0}</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4">
        <p className="text-sm text-gray-600 mb-1">Ready</p>
        <p className="text-2xl font-bold text-green-600">{stats.ready || 0}</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4">
        <p className="text-sm text-gray-600 mb-1">Total Today</p>
        <p className="text-2xl font-bold text-espro-dark">{stats.totalToday || 0}</p>
      </div>
    </div>
  );
}
