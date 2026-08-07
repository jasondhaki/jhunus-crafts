import Link from "next/link";
import { Container } from "@/components/ui/container";

export default function Forbidden() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="font-serif text-8xl text-jute/40">403</p>
      <h1 className="mt-4 font-serif text-4xl text-bark">
        This Room Isn&rsquo;t Open to You
      </h1>
      <p className="mt-4 max-w-md text-jute">
        You don&rsquo;t have permission to view this page. If you think
        that&rsquo;s wrong, sign in with an account that has access.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-terracotta px-6 text-base font-medium text-cream transition-colors duration-200 ease-out hover:bg-terracotta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
      >
        Back to Home
      </Link>
    </Container>
  );
}
