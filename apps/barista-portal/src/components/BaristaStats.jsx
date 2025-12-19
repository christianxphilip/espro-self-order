export default function BaristaStats({ stats, onStatClick, selectedFilter }) {
  const handleClick = (filter) => {
    if (onStatClick) {
      // Toggle filter - if already selected, clear it
      onStatClick(selectedFilter === filter ? null : filter);
    }
  };

  const getCardClasses = (filter) => {
    const baseClasses = "bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg";
    const selectedClasses = selectedFilter === filter 
      ? "ring-2 ring-espro-orange ring-offset-2" 
      : "";
    return `${baseClasses} ${selectedClasses}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div 
        className={getCardClasses('all')}
        onClick={() => handleClick('all')}
      >
        <p className="text-sm text-gray-600 mb-1">All</p>
        <p className="text-2xl font-bold text-espro-dark">{stats.all || 0}</p>
        {selectedFilter === 'all' && (
          <p className="text-xs text-espro-orange mt-1">Click to filter</p>
        )}
      </div>
      <div 
        className={getCardClasses('pending')}
        onClick={() => handleClick('pending')}
      >
        <p className="text-sm text-gray-600 mb-1">Pending</p>
        <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
        {selectedFilter === 'pending' && (
          <p className="text-xs text-espro-orange mt-1">Click to filter</p>
        )}
      </div>
      <div 
        className={getCardClasses('preparing')}
        onClick={() => handleClick('preparing')}
      >
        <p className="text-sm text-gray-600 mb-1">Preparing</p>
        <p className="text-2xl font-bold text-blue-600">{stats.preparing || 0}</p>
        {selectedFilter === 'preparing' && (
          <p className="text-xs text-espro-orange mt-1">Click to filter</p>
        )}
      </div>
      <div 
        className={getCardClasses('ready')}
        onClick={() => handleClick('ready')}
      >
        <p className="text-sm text-gray-600 mb-1">Ready</p>
        <p className="text-2xl font-bold text-green-600">{stats.ready || 0}</p>
        {selectedFilter === 'ready' && (
          <p className="text-xs text-espro-orange mt-1">Click to filter</p>
        )}
      </div>
      <div 
        className={getCardClasses('completed')}
        onClick={() => handleClick('completed')}
      >
        <p className="text-sm text-gray-600 mb-1">Completed</p>
        <p className="text-2xl font-bold text-purple-600">{stats.completed || 0}</p>
        {selectedFilter === 'completed' && (
          <p className="text-xs text-espro-orange mt-1">Click to filter</p>
        )}
      </div>
      <div 
        className={getCardClasses('today')}
        onClick={() => handleClick('today')}
      >
        <p className="text-sm text-gray-600 mb-1">Total Today</p>
        <p className="text-2xl font-bold text-espro-dark">{stats.totalToday || 0}</p>
        {selectedFilter === 'today' && (
          <p className="text-xs text-espro-orange mt-1">Click to filter</p>
        )}
      </div>
    </div>
  );
}
