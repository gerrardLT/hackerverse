import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('common');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{t('notFound', { fallback: 'Page Not Found' })}</h1>
      <p className="text-gray-600 mb-4">{t('notFoundDesc', { fallback: 'The page you are looking for does not exist.' })}</p>
      <a href="/" className="text-blue-600 hover:underline">{t('backHome', { fallback: 'Back to Home' })}</a>
    </div>
  );
}
