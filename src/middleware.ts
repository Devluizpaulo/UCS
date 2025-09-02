
import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// This is a dummy service account key. The real one should be stored securely.
// In a real production environment, you would use environment variables.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : {
      type: 'service_account',
      project_id: 'ucs-index-tracker',
      private_key_id: 'dummypk',
      private_key: '-----BEGIN PRIVATE KEY-----\n-----END PRIVATE KEY-----\n',
      client_email: 'dummy@ucs-index-tracker.iam.gserviceaccount.com',
      client_id: 'dummy',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk.json',
    };

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebaseIdToken')?.value;

  // Paths that are public and don't require authentication
  const publicPaths = ['/login', '/image/login.jpg'];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // API route for scheduled jobs needs a different kind of auth
  if (pathname.startsWith('/api/scheduled-job')) {
    return NextResponse.next();
  }

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the token
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    // Check if token is expired. The verifyIdToken method does this automatically.
    // We can add more checks here if needed, like checking user roles.
    if (!decodedToken) {
      throw new Error('Invalid token');
    }
    return NextResponse.next();
  } catch (error) {
    console.error('Token verification failed:', error);
    // If token is invalid or expired, redirect to login and clear the cookie
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('firebaseIdToken');
    return response;
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, but we want to protect some of them)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
