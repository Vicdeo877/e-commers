import HomePageClient from "./home-client";

/** Server shell so Tailwind + layout paint on first HTML response (avoids unstyled home until client nav). */
export default function HomePage() {
  return (
    <div className="w-full min-h-0 flex-1 bg-gray-50">
      <HomePageClient />
    </div>
  );
}
