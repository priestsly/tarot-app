
export const getApiUrl = (path: string) => {
    // If it starts with http, it's already absolute
    if (path.startsWith('http')) return path;
    
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // In development or when running on the web, relative paths work
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || !window.location.hostname.includes('capacitor'))) {
        return normalizedPath;
    }
    
    // For Mobile (Capacitor), we need the absolute domain where the API is hosted
    // Change this to your live Railway/Vercel URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tarot-app.railway.app';
    return `${baseUrl}${normalizedPath}`;
};
