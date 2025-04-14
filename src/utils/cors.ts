// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://mini-commerce-284cf.web.app',
  // Add your production domains here
];

// Function to check if origin is allowed
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin) || origin.startsWith('http://localhost:');
}

// CORS headers to use in API responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, set this to specific origins
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours in seconds
};

// Middleware function for handling CORS
export function applyCorsHeaders(req: Request, headers = new Headers()): Headers {
  const origin = req.headers.get('origin');
  
  if (origin && isOriginAllowed(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else {
    headers.set('Access-Control-Allow-Origin', '*'); // Fallback to allow any origin in development
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return headers;
}
