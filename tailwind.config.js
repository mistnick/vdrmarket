module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
        },
    },
    safelist: [
        "grid",
        "grid-cols-1",
        "sm:grid-cols-2",
        "lg:grid-cols-4",
        "gap-4",
        "bg-emerald-50/50",
        "border-emerald-100",
    ],
    plugins: [],
};
