export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-slate-600 mb-4">Page not found</p>
        <a href="/dashboard" className="text-blue-600 underline">Go to Dashboard</a>
      </div>
    </div>
  );
}
