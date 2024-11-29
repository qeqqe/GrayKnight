import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiLastdotfm, SiMongodb, SiNextdotjs, SiSpotify } from "react-icons/si";
import { MdSecurity } from "react-icons/md";
import { FaCode } from "react-icons/fa";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary/10 py-16">
      <div className="container relative max-w-5xl">
        <div className="mb-12 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            About GrayKnight
          </h1>
        </div>

        <div className="space-y-12">
          <section className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Project Overview
            </h2>
            <p className="text-xl text-muted-foreground">
              GrayKnight is a music analytics platform that connects with
              Last.fm and Spotify to provide personalized insights into your
              music listening habits.
            </p>
          </section>

          <div className="grid gap-8 md:grid-cols-2">
            <Card className="relative overflow-hidden transition-shadow hover:shadow-lg">
              <div className="absolute right-4 top-4">
                <SiLastdotfm
                  size={48}
                  color="#ef4444"
                  // ↓ fuck this error
                  className="opacity-80 drop-shadow-[0_0_1rem_#ef444480]"
                />
              </div>
              <CardHeader>
                <CardTitle>Authentication Flow</CardTitle>
                <CardDescription>How the login process works</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>1. Register with email and password</p>
                <p>2. Secure JWT token stored in localStorage</p>
                <p>3. Connect your Last.fm account</p>
                <p>4. Access your personalized dashboard</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden transition-shadow hover:shadow-lg">
              <div className="absolute right-4 top-4">
                <MdSecurity
                  size={48}
                  color="#10b981"
                  className="opacity-80 drop-shadow-[0_0_1rem_#10b98180]"
                />
              </div>
              <CardHeader>
                <CardTitle>Integration Details</CardTitle>
                <CardDescription>Technical implementation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>• MongoDB for user data storage</p>
                <p>• Last.fm API integration</p>
                <p>• JWT for secure authentication</p>
                <p>• Real-time music data fetching</p>
              </CardContent>
            </Card>
          </div>

          <Card className="relative overflow-hidden transition-shadow hover:shadow-lg">
            <div className="absolute right-4 top-4">
              <FaCode
                size={48}
                color="#3b82f6"
                className="opacity-80 drop-shadow-[0_0_1rem_#3b82f680]"
              />
            </div>
            <CardHeader>
              <CardTitle>Technical Stack</CardTitle>
              <CardDescription>
                The technologies powering GrayKnight
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <SiNextdotjs className="h-5 w-5" />
                    Frontend
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Next.js for routing and SSR</li>
                    <li>Shadcn/ui for components</li>
                    <li>TailwindCSS for styling</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <SiMongodb className="h-5 w-5 text-green-500" />
                    Backend
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>MongoDB for data storage</li>
                    <li>Last.fm API integration</li>
                    <li>JWT for authentication</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="mx-auto max-w-3xl space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              Developer Notes
            </h2>
            <div className="prose dark:prose-invert max-w-none rounded-lg bg-card p-6">
              <p>
                The authentication flow uses standard JWT-based authentication
                initially, followed by Last.fm's API authentication. The Last.fm
                API provides an authentication token that we store securely in
                our database, linked to the user's account.
              </p>
              <p className="text-muted-foreground mt-2">
                Note: While we initially considered Passport.js, direct API
                integration with Last.fm provides a simpler and more
                maintainable solution for our specific needs.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
