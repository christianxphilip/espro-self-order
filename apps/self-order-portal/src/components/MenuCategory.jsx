import MenuItemCard from './MenuItemCard';

export default function MenuCategory({ category, items, onAddItem }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-espro-dark mb-4">{category}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <MenuItemCard key={item._id} item={item} onAddItem={onAddItem} />
        ))}
      </div>
    </div>
  );
}
