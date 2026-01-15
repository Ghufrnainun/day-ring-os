import fs from 'fs';
import path from 'path';

export default async function EmailPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>; // await the promise
}) {
  const resolvedSearchParams = await searchParams; // Need to resolve in Next.js 15? Or use hook?
  // Server Component: props are Promises in newer Next.js versions? Let's check docs or assume standard.
  // Actually, in standard Next.js 14/15 server components, searchParams is prop.
  // But let's handle it safely.

  const type = resolvedSearchParams.type || 'confirm_signup';

  const templates = [
    'confirm_signup',
    'invite_user',
    'magic_link',
    'change_email',
    'reset_password',
    'reauthentication',
  ];

  const filePath = path.join(
    process.cwd(),
    `docs/email_templates/${type}.html`
  );
  let htmlContent = '';

  try {
    htmlContent = fs.readFileSync(filePath, 'utf8');

    // Mock replacing Supabase variables for preview
    htmlContent = htmlContent
      .replace('{{ .ConfirmationURL }}', '#')
      .replace('{{ .SiteURL }}', 'http://localhost:3000')
      .replace('{{ .Code }}', '123456')
      .replace('{{ .Token }}', '123 456');
  } catch (e) {
    htmlContent = '<h1>Template not found.</h1>';
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for selection */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex-shrink-0">
        <h2 className="text-lg font-bold mb-4">Email Templates</h2>
        <ul className="space-y-2">
          {templates.map((t) => (
            <li key={t}>
              <a
                href={`/email-preview?type=${t}`}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  type === t
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.replace('_', ' ')}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <h3 className="font-semibold text-gray-700 capitalize">
            {type.replace('_', ' ')} Preview
          </h3>
          <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">
            docs/email_templates/{type}.html
          </span>
        </div>
        <div className="flex-1 p-8 overflow-auto flex justify-center bg-gray-100">
          <div className="shadow-xl rounded-xl overflow-hidden max-w-[500px] w-full bg-white h-fit">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        </div>
      </div>
    </div>
  );
}
