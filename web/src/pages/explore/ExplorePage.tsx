import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getPublicNotes } from '@/api/note';
import NoteMasonry from '@/components/notecard/NoteMasonry';
import NoteMasonrySkeleton from '@/components/notecard/NoteMasonrySkeleton';
import logo from '@/assets/app.png';
import { LogIn, House } from 'lucide-react';
import { useCurrentUserStore } from '@/stores/current-user';

const ExplorePage: React.FC = () => {
    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['explore-notes'],
        queryFn: () => getPublicNotes(1, 20),
    });

    const { user, fetchUser } = useCurrentUserStore();
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        fetchUser().finally(() => setAuthChecked(true));
    }, []);

    return (
        <div className="min-h-dvh bg-neutral-100 dark:bg-neutral-900">
            <div className="max-w-5xl mx-auto px-3 py-4 sm:px-6 sm:py-8">
                <div className="flex items-center justify-between mb-4 sm:mb-8">
                    <div className="flex items-center gap-3 select-none">
                        <img src={logo} className="w-10" alt="logo" />
                        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Explore</span>
                    </div>
                    {authChecked && (
                        user ? (
                            <Link
                                to="/"
                                className="text-primary hover:text-primary/80 transition-colors"
                                title="Back to workspace"
                            >
                                <House size={20} strokeWidth={2.5} />
                            </Link>
                        ) : (
                            <Link
                                to="/signin"
                                className="text-primary hover:text-primary/80 transition-colors"
                                title="Sign in"
                            >
                                <LogIn size={20} strokeWidth={2.5} />
                            </Link>
                        )
                    )}
                </div>

                {isLoading ? (
                    <NoteMasonrySkeleton />
                ) : notes.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-20">
                        No public notes yet.
                    </div>
                ) : (
                    <NoteMasonry notes={notes} showLink={false} />
                )}
            </div>
        </div>
    );
};

export default ExplorePage;
