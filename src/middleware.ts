import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isOriginAllowed } from '@/utils/cors';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Only apply CORS middleware to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    // For all other requests, add CORS headers to the response
    const response = NextResponse.next();
    const origin = request.headers.get('origin');
    
    if (origin && isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
  
  // Don't apply CORS to non-API routes
  return NextResponse.next();
}

// Handle OPTIONS requests for CORS preflight
function handleOptions(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  const origin = request.headers.get('origin');
  
  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

// Configure the middleware to run only for API routes
export const config = {
  matcher: '/api/:path*',
};
