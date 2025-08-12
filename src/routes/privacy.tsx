import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex min-h-screen justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-2xl rounded-xl border border-y-0 border-gray-200 bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Privacy Policy
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          <strong className="font-semibold text-gray-700">
            Effective Date:
          </strong>{" "}
          August 13, 2025
        </p>
        <p className="mb-6 text-gray-700">
          AnySearch (
          <span className="italic">
            &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;
          </span>
          ) respects your privacy and is committed to protecting your personal
          information. This Privacy Policy explains what information we collect,
          how we use it, and the choices you have.
        </p>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          1. Information We Collect
        </h2>
        <p className="mb-2 text-gray-700">
          When you use AnySearch, we only collect the following information:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
          <li>
            <strong>Usernames</strong> from each connected platform (e.g.,
            Notion, GitHub, Google Drive, Gmail)
          </li>
          <li>
            <strong>Access tokens</strong> required to connect your accounts and
            perform searches
          </li>
        </ul>
        <p className="mb-2 text-gray-700">
          We do <strong>not</strong> collect or store:
        </p>
        <ul className="mb-6 list-inside list-disc space-y-1 text-gray-700">
          <li>Email addresses</li>
          <li>Passwords</li>
          <li>
            File contents, emails, or other personal data from your connected
            services (beyond what is needed to display search results during
            your active session)
          </li>
        </ul>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          2. How We Use Your Information
        </h2>
        <p className="mb-2 text-gray-700">
          We use your collected information solely to:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
          <li>Authenticate your account connections</li>
          <li>Perform searches across your connected platforms</li>
          <li>Display results to you in the application</li>
        </ul>
        <p className="mb-6 text-gray-700">
          We do not use your information for advertising, analytics, or
          profiling.
        </p>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          3. Data Storage &amp; Security
        </h2>
        <ul className="mb-6 list-inside list-disc space-y-1 text-gray-700">
          <li>
            Access tokens are stored <strong>securely</strong> in your browser
            or encrypted storage to maintain active connections.
          </li>
          <li>No sensitive data is permanently stored on our servers.</li>
          <li>
            We implement industry-standard security measures to protect your
            information against unauthorized access or disclosure.
          </li>
        </ul>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          4. Sharing Your Information
        </h2>
        <p className="mb-6 text-gray-700">
          We do not sell, trade, or share your information with third parties,
          except when required by law or to comply with legal processes.
        </p>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          5. Your Choices
        </h2>
        <p className="mb-2 text-gray-700">
          You can revoke AnySearch’s access to your connected accounts at any
          time by:
        </p>
        <ul className="mb-6 list-inside list-disc space-y-1 text-gray-700">
          <li>Disconnecting the service from within the application, or</li>
          <li>
            Managing connected app permissions in your platform account settings
            (e.g., Google Account, GitHub)
          </li>
        </ul>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          6. Changes to This Policy
        </h2>
        <p className="mb-6 text-gray-700">
          We may update this Privacy Policy from time to time. If we make
          significant changes, we will notify you through the application or by
          other appropriate means.
        </p>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          7. Contact Us
        </h2>
        <p className="mb-2 text-gray-700">
          If you have questions about this Privacy Policy or our data practices,
          you can contact us at:
        </p>
        <ul className="mb-2 list-none space-y-1 text-gray-700">
          <li>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:privacy@ambe.dev"
              className="text-blue-600 underline hover:text-blue-800"
            >
              privacy@ambe.dev
            </a>
          </li>
          <li>
            <strong>Website:</strong>{" "}
            <a
              href="https://anysearch.ambe.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              anysearch.ambe.dev
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
