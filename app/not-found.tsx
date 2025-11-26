export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-slate-900">404</h1>
                <p className="mt-4 text-xl text-slate-600">Page not found</p>
                <a
                    href="/"
                    className="mt-6 inline-block rounded-md bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700"
                >
                    Go back home
                </a>
            </div>
        </div>
    );
}
