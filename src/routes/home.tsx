import Logo from "@/components/icons/logo";
import { Link } from "@radix-ui/themes";
import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";

export const Route = createFileRoute("/home")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 py-24">
      <Logo className="w-[260px] max-w-full" />
      <p className="text-gray-11 max-w-xl text-center">
        AnySearch lets you search across Notion, GitHub, Google Drive, and Gmail
        from one place. Connect your accounts and find anything in seconds.
      </p>
      <p className="text-gray-9">
        <Link asChild>
          <RouterLink to="/">Go to search</RouterLink>
        </Link>
      </p>

      <p className="text-2 text-gray-9 absolute bottom-3">
        &copy; {new Date().getFullYear()} ambe ·{" "}
        <Link asChild>
          <RouterLink to="/terms">Terms</RouterLink>
        </Link>{" "}
        ·{" "}
        <Link asChild>
          <RouterLink to="/privacy">Privacy</RouterLink>
        </Link>
      </p>
    </div>
  );
}
