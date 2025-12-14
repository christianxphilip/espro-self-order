export default function CartSummary({ itemCount, total, onViewCart }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Cart</p>
            <p className="text-lg font-bold text-espro-dark">
              {itemCount} item{itemCount !== 1 ? 's' : ''} • ₱{total.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onViewCart}
            className="bg-espro-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            View Cart
          </button>
        </div>
      </div>
    </div>
  );
}
