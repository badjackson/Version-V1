export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sand-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-ocean-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
      </div>
    </div>
  );
}