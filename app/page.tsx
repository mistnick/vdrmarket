import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Terminal } from "@/components/ui/terminal"
import { ArrowRight, Shield, BarChart3, Users, FileText, Database } from "lucide-react"

export default async function Home() {
  const session = await getSession()

  // Redirect authenticated users to dashboard  
  if (session) {
    redirect("/dashboard")
  }

  return (
    <main>
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Secure Document Sharing
                <span className="block text-emerald-600">Made Simple</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Share confidential documents securely with advanced tracking, granular permissions,
                and audit trails. Perfect for M&A, fundraising, and due diligence.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0 flex gap-4">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="text-lg rounded-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg rounded-full"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white">
                <Shield className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Bank-Level Security
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  End-to-end encryption, password protection, and domain restrictions
                  ensure your documents stay secure.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Real-Time Analytics
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Know exactly who viewed your documents, when, and for how long
                  with detailed analytics dashboards.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white">
                <Users className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Team Collaboration
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Invite team members, assign roles, and collaborate seamlessly
                  with workspace sharing and permission management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white">
                <FileText className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Virtual Data Rooms
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Organize documents into data rooms with folder structures perfect
                  for due diligence and fundraising processes.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white">
                <Database className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Complete Audit Trail
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Comprehensive activity logs track every action for compliance
                  and security requirements with immutable audit trails.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white">
                <Shield className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  GDPR Compliant
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Built-in compliance with data export, account deletion, and consent
                  management for global privacy regulations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to secure your documents?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Join thousands of companies using DataRoom for secure document sharing
                and comprehensive tracking. Start your free trial today.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end gap-4">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="text-lg rounded-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Start Free Trial
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg rounded-full"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">DataRoom</span>
              </div>
              <p className="text-sm text-gray-500">
                Secure document sharing for modern teams.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="#features" className="hover:text-gray-900 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link></li>
                <li><Link href="#security" className="hover:text-gray-900 transition-colors">Security</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/about" className="hover:text-gray-900 transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-gray-900 transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} DataRoom. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="#" className="hover:text-gray-900 transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">GitHub</Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">LinkedIn</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
