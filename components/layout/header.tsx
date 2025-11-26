'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface HeaderProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Documents', href: '/documents' },
    { name: 'Data Rooms', href: '/datarooms' },
    { name: 'Links', href: '/links' },
    { name: 'Teams', href: '/teams' },
    { name: 'Settings', href: '/settings' },
];

export function Header({ user }: HeaderProps) {
    const pathname = usePathname();

    const getUserInitials = () => {
        if (!user?.name) return 'U';
        return user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
            <div className="container flex h-16 items-center">
                {/* Logo */}
                <Link href="/dashboard" className="mr-8 flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-lg font-bold text-white">D</span>
                    </div>
                    <span className="hidden font-semibold sm:inline-block text-foreground">
                        DataRoom
                    </span>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center space-x-1 flex-1">
                    {navigation.map((item) => {
                        const isActive = pathname?.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                    isActive
                                        ? 'text-primary bg-primary/10'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                )}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right side */}
                <div className="flex items-center space-x-2">
                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" strokeWidth={1.5} />
                        <span className="sr-only">Notifications</span>
                    </Button>

                    {/* User menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center space-x-2 px-2"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.image || undefined} />
                                    <AvatarFallback className="bg-primary text-white text-xs">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings/profile">Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings/billing">Billing</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings">Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/auth/logout">Sign out</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
