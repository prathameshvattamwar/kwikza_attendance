import PageHeader from '@/components/common/PageHeader';

function PageWrapper({ title, subtitle, action, children }) {
  return (
    <div className="min-h-[calc(100vh-64px)] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {title && (
          <PageHeader title={title} subtitle={subtitle} action={action} />
        )}
        {children}
      </div>
    </div>
  );
}

export default PageWrapper;
