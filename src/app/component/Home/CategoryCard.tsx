import Image from 'next/image';
import Link from 'next/link';

interface CategoryCardProps {
  id: string;
  name: string;
  imageUrl: string;
  itemCount: number;
}

export default function CategoryCard({ id, name, imageUrl, itemCount }: CategoryCardProps) {
  return (
    <Link href={`/categories/${id}`}>
      <div className="group relative overflow-hidden rounded-lg shadow-md transition transform hover:scale-105 hover:shadow-lg duration-300">
        <div className="relative h-64 w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent group-hover:from-black/80"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-semibold group-hover:text-indigo-300 transition-colors">{name}</h3>
          <p className="text-sm text-gray-300">{itemCount} products</p>
        </div>
      </div>
    </Link>
  );
}
