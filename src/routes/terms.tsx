import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex min-h-screen justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-2xl rounded-xl border border-y-0 border-gray-200 bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Terms of Service
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          <strong className="font-semibold text-gray-700">
            Effective Date:
          </strong>{" "}
          August 13, 2025
        </p>
        <p className="mb-6 text-gray-700">
          These Terms of Service (
          <span className="italic">&ldquo;Terms&rdquo;</span>) govern your use
          of AnySearch (
          <span className="italic">
            &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;
          </span>
          ). By accessing or using AnySearch, you agree to these Terms. If you
          do not agree, you may not use the service.
        </p>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          1. Service Description
        </h2>
        <p className="mb-6 text-gray-700">
          AnySearch is a search aggregation tool that allows you to connect
          third-party platforms (e.g., Notion, GitHub, Google Drive, Gmail) and
          search across them from a single interface.
        </p>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          2. Eligibility
        </h2>
        <p className="mb-6 text-gray-700">
          You must be at least 13 years old (or the legal age in your
          jurisdiction) to use AnySearch. By using the service, you confirm that
          you meet this requirement.
        </p>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          3. Account Connections
        </h2>
        <ul className="mb-6 list-inside list-disc space-y-1 text-gray-700">
          <li>
            You may connect AnySearch to supported third-party services via
            OAuth authentication.
          </li>
          <li>
            You are responsible for maintaining the security of your connected
            accounts and revoking access when necessary.
          </li>
          <li>You may not use another person’s accounts without permission.</li>
        </ul>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          4. Acceptable Use
        </h2>
        <p className="mb-2 text-gray-700">You agree not to:</p>
        <ul className="mb-2 list-inside list-disc space-y-1 text-gray-700">
          <li>Use AnySearch for unlawful, harmful, or abusive purposes</li>
          <li>
            Attempt to gain unauthorized access to AnySearch systems or other
            users’ data
          </li>
          <li>
            Reverse-engineer, decompile, or otherwise tamper with the service
          </li>
          <li>
            Use automated scripts or bots that overload or disrupt the service
          </li>
        </ul>
        <p className="mb-6 text-gray-700">
          We may suspend or terminate your access if we believe you have
          violated these terms.
        </p>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          5. Data Handling
        </h2>
        <p className="mb-6 text-gray-700">
          Our{" "}
          <a
            href="https://anysearch.ambe.dev/privacy"
            className="text-blue-600 underline hover:text-blue-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>{" "}
          explains how we collect, use, and store information. By using
          AnySearch, you agree to our data practices as described there.
        </p>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          6. Third-Party Services
        </h2>
        <p className="mb-2 text-gray-700">
          AnySearch connects to external platforms via their public APIs. We are
          not responsible for:
        </p>
        <ul className="mb-2 list-inside list-disc space-y-1 text-gray-700">
          <li>
            The availability, security, or functionality of third-party services
          </li>
          <li>
            Changes to their APIs or terms that may affect your use of AnySearch
          </li>
        </ul>
        <p className="mb-6 text-gray-700">
          You are bound by the terms of service of each third-party service you
          connect.
        </p>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          7. Disclaimer of Warranties
        </h2>
        <p className="mb-6 text-gray-700">
          AnySearch is provided &ldquo;as is&rdquo; without warranties of any
          kind, whether express or implied, including but not limited to
          warranties of merchantability, fitness for a particular purpose, or
          non-infringement.
        </p>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          8. Limitation of Liability
        </h2>
        <p className="mb-6 text-gray-700">
          To the maximum extent permitted by law, AnySearch shall not be liable
          for any indirect, incidental, or consequential damages, including loss
          of data, profits, or business, arising from your use of the service.
        </p>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          9. Changes to These Terms
        </h2>
        <p className="mb-6 text-gray-700">
          We may update these Terms at any time. If we make material changes, we
          will notify you through the application or by other appropriate means.
          Continued use of AnySearch after changes take effect constitutes
          acceptance of the updated Terms.
        </p>
        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          10. Contact Us
        </h2>
        <p className="mb-2 text-gray-700">
          If you have questions about these Terms, contact us at:
        </p>
        <ul className="mb-2 list-none space-y-1 text-gray-700">
          <li>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:legal@ambe.dev"
              className="text-blue-600 underline hover:text-blue-800"
            >
              legal@ambe.dev
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
