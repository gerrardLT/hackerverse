import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'zh'],

  // Used when no locale matches
  defaultLocale: 'en',
  
  // Prefix the default locale
  localePrefix: 'always'
});

export const config = {
  // Match only internationalized pathnames, exclude API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
