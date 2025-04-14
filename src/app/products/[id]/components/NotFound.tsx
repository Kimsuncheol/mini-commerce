import { AppRouterInstance } from "next/dist/shared/lib/app-router-context";

interface NotFoundProps {
  router: AppRouterInstance;
}

export default function NotFound({ router }: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="mb-4 text-2xl font-bold">Product Not Found</h1>
      <button
        onClick={() => router.push('/products')}
        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
      >
        View All Products
      </button>
    </div>
  );
}
