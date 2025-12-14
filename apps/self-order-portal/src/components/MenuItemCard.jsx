export default function MenuItemCard({ item, onAddItem }) {
  const handleAdd = () => {
    onAddItem({
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-espro-dark mb-1">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
        )}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-espro-orange">
            ₱{item.price.toFixed(2)}
          </span>
          <button
            onClick={handleAdd}
            className="bg-espro-orange text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
