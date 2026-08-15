export default function Dashboard() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome back! Manage your e-cards below.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Total Cards Created</h2>
          <p className="text-4xl font-extrabold text-blue-600">12</p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Active Campaigns</h2>
          <p className="text-4xl font-extrabold text-green-600">3</p>
        </div>
      </div>
    </div>
  );
}
