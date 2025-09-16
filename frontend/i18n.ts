import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config  
const locales = ['en', 'zh'];

export default getRequestConfig(async (params) => {
  // Use the new next-intl 3.22+ API with await
  let locale;
  if ('requestLocale' in params) {
    locale = await params.requestLocale;
  } else if ('locale' in params) {
    locale = params.locale;
  } else {
    locale = 'en'; // fallback
  }
  
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
