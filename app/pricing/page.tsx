import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { FileText } from "lucide-react"

export const metadata = {
    title: "Pricing | DataRoom",
    description: "Simple, transparent pricing for secure document sharing",
}

export default function PricingPage() {
    return (
        <main className="min-h-screen">
            {/* Header */}
            <header className="border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">DataRoom</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/auth/login">
                                <Button variant="ghost">Sign In</Button>
                            </Link>
                            <Link href="/auth/signup">
                                <Button className="bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Pricing Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-gray-500">
                        Choose the plan that's right for your team
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Starter Plan */}
                    <PricingCard
                        name="Starter"
                        price={29}
                        interval="month"
                        description="Perfect for small teams getting started"
                        features={[
                            "Up to 5 team members",
                            "10 GB storage",
                            "Unlimited documents",
                            "Basic analytics",
                            "Email support",
                            "7-day free trial",
                        ]}
                    />

                    {/* Professional Plan */}
                    <PricingCard
                        name="Professional"
                        price={79}
                        interval="month"
                        description="For growing teams with advanced needs"
                        features={[
                            "Up to 25 team members",
                            "100 GB storage",
                            "Unlimited documents & data rooms",
                            "Advanced analytics & insights",
                            "Priority email support",
                            "Custom branding",
                            "14-day free trial",
                        ]}
                        highlighted
                    />

                    {/* Enterprise Plan */}
                    <PricingCard
                        name="Enterprise"
                        price={null}
                        interval="month"
                        description="For large organizations"
                        features={[
                            "Unlimited team members",
                            "Unlimited storage",
                            "Unlimited everything",
                            "Advanced security features",
                            "24/7 priority support",
                            "Custom integrations",
                            "Dedicated account manager",
                            "SLA guarantee",
                        ]}
                    />
                </div>

                {/* FAQ Section */}
                <div className="mt-20 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Can I change plans later?</h3>
                            <p className="text-gray-600">
                                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
                            <p className="text-gray-600">
                                We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Is there a free trial?</h3>
                            <p className="text-gray-600">
                                Yes! We offer a 7-day free trial for Starter, 14-day for Professional, and custom trials for Enterprise.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Can I cancel anytime?</h3>
                            <p className="text-gray-600">
                                Absolutely. You can cancel your subscription at any time with no cancellation fees.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-500">
                            © {new Date().getFullYear()} DataRoom. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm text-gray-500">
                            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
                            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
                            <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    )
}

function PricingCard({
    name,
    price,
    interval,
    description,
    features,
    highlighted = false,
}: {
    name: string
    price: number | null
    interval: string
    description: string
    features: string[]
    highlighted?: boolean
}) {
    return (
        <div
            className={`rounded-xl border p-8 ${highlighted
                    ? "border-emerald-600 shadow-lg ring-2 ring-emerald-600 relative"
                    : "border-gray-200"
                }`}
        >
            {highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                    </span>
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{name}</h2>
                <p className="text-sm text-gray-600">{description}</p>
            </div>

            <div className="mb-6">
                {price === null ? (
                    <div className="text-4xl font-bold text-gray-900">Contact Us</div>
                ) : (
                    <div>
                        <span className="text-4xl font-bold text-gray-900">${price}</span>
                        <span className="text-gray-600 ml-2">/ {interval}</span>
                    </div>
                )}
            </div>

            <Link href="/auth/signup">
                <Button
                    className={`w-full mb-6 ${highlighted
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-gray-900 hover:bg-gray-800"
                        }`}
                >
                    {price === null ? "Contact Sales" : "Start Free Trial"}
                </Button>
            </Link>

            <ul className="space-y-3">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
