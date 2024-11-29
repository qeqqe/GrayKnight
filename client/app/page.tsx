import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="container mx-auto flex h-16 items-center px-4">
          <div className="text-xl font-bold">GrayKnight</div>
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
          <h1 className="animate-fade-up text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Connect Your Music Journey
          </h1>
          <p className="mt-4 max-w-[42rem] animate-fade-up text-muted-foreground sm:text-xl">
            Track your music taste, discover new artists, and connect with other
            music lovers. Sign up now to start your personalized music
            experience.
          </p>
          <div className="mt-8 flex gap-4 animate-fade-up">
            <Button size="lg" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
