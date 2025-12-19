import { useState } from 'react';

export default function ItemCustomizationModal({ item, isOpen, onClose, onAdd }) {
  // Determine available temperature options
  const canSelectHot = item?.temperatureOption === 'hot' || item?.temperatureOption === 'both';
  const canSelectIced = item?.temperatureOption === 'iced' || item?.temperatureOption === 'iced-only' || item?.temperatureOption === 'both';
  const isIcedOnly = item?.temperatureOption === 'iced-only';
  
  // Set initial temperature based on available options
  const initialTemperature = isIcedOnly || (!canSelectHot && canSelectIced) ? 'iced' : 'hot';
  
  const [temperature, setTemperature] = useState(initialTemperature);
  const [extraEspresso, setExtraEspresso] = useState(false);
  const [oatMilk, setOatMilk] = useState(false);

  if (!isOpen || !item) return null;


  // Calculate price with add-ons
  let itemPrice = item.price;
  // Only add iced surcharge if it's not iced-only (iced-only has no surcharge)
  if (temperature === 'iced' && !isIcedOnly) {
    itemPrice += 20; // Iced surcharge
  }
  if (extraEspresso && item.allowExtraEspresso) {
    itemPrice += 30; // Extra espresso
  }
  if (oatMilk && item.allowOatMilk) {
    itemPrice += 40; // Oat milk
  }

  const handleAdd = () => {
    onAdd({
      menuItemId: item._id,
      name: item.name,
      price: itemPrice,
      quantity: 1,
      temperature: canSelectHot || canSelectIced ? temperature : undefined,
      extraEspresso: extraEspresso && item.allowExtraEspresso,
      oatMilk: oatMilk && item.allowOatMilk,
    });
    // Reset form
    setTemperature(initialTemperature);
    setExtraEspresso(false);
    setOatMilk(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-espro-dark">{item.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {item.description && (
            <p className="text-gray-600 mb-4">{item.description}</p>
          )}

          {/* Temperature Selection */}
          {(canSelectHot || canSelectIced) && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-espro-dark mb-2">
                Temperature
              </label>
              <div className="flex gap-2">
                {canSelectHot && (
                  <button
                    onClick={() => setTemperature('hot')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                      temperature === 'hot'
                        ? 'bg-espro-orange text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Hot
                  </button>
                )}
                {canSelectIced && (
                  <button
                    onClick={() => setTemperature('iced')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                      temperature === 'iced'
                        ? 'bg-espro-orange text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {isIcedOnly ? 'Cold' : 'Cold (+₱20)'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Extra Espresso Option */}
          {item.allowExtraEspresso && (
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={extraEspresso}
                  onChange={(e) => setExtraEspresso(e.target.checked)}
                  className="w-5 h-5 text-espro-orange rounded focus:ring-espro-orange"
                />
                <span className="text-sm font-semibold text-espro-dark">
                  Extra Espresso Shot (+₱30)
                </span>
              </label>
            </div>
          )}

          {/* Oat Milk Option */}
          {item.allowOatMilk && (
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={oatMilk}
                  onChange={(e) => setOatMilk(e.target.checked)}
                  className="w-5 h-5 text-espro-orange rounded focus:ring-espro-orange"
                />
                <span className="text-sm font-semibold text-espro-dark">
                  Oat Milk Substitute (+₱40)
                </span>
              </label>
            </div>
          )}

          {/* Price Display */}
          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-espro-dark">Total Price:</span>
              <span className="text-2xl font-bold text-espro-orange">
                ₱{itemPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 bg-espro-orange text-white px-4 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

