export default function CartItem({ item, onRemove, onUpdateQuantity }) {
  // Build modifiers string
  const modifiers = [];
  if (item.temperature) {
    modifiers.push(item.temperature === 'iced' ? 'Iced' : 'Hot');
  }
  if (item.extraEspresso) {
    modifiers.push('Extra Espresso');
  }
  if (item.oatMilk) {
    modifiers.push('Oat Milk');
  }
  const modifiersText = modifiers.length > 0 ? ` (${modifiers.join(', ')})` : '';

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-espro-dark">
            {item.name}{modifiersText}
          </h3>
          <p className="text-espro-orange font-bold">₱{item.price.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
            >
              -
            </button>
            <span className="w-8 text-center font-semibold">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
            >
              +
            </button>
          </div>
          <button
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 px-2"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="mt-2 text-right">
        <span className="font-semibold text-espro-dark">
          ₱{(item.price * item.quantity).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
