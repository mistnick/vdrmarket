'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateTeamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
    });

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        // Auto-generate slug from name if slug hasn't been manually edited
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        setFormData(prev => ({
            ...prev,
            name,
            slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                ? slug
                : prev.slug
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create team');
            }

            router.push(`/teams/${data.data.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl py-10">
            <div className="mb-6">
                <Link
                    href="/teams"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Teams
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Create New Team</CardTitle>
                    </div>
                    <CardDescription>
                        Create a team to collaborate on documents and data rooms.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Team Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Acme Corp"
                                value={formData.name}
                                onChange={handleNameChange}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">Team URL Slug</Label>
                            <div className="flex items-center">
                                <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-muted-foreground text-sm">
                                    dataroom.com/teams/
                                </span>
                                <Input
                                    id="slug"
                                    className="rounded-l-none"
                                    placeholder="acme-corp"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This will be used in your team's URL. Use only lowercase letters, numbers, and hyphens.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Team'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
