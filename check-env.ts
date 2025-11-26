import "dotenv/config";

console.log("Checking Environment Variables...");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("AUTH_SECRET exists:", !!process.env.AUTH_SECRET);
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);
