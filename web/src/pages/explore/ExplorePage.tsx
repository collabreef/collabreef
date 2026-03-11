import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getPublicNotes } from '@/api/note';
import NoteMasonry from '@/components/notecard/NoteMasonry';
import NoteMasonrySkeleton from '@/components/notecard/NoteMasonrySkeleton';
import logo from '@/assets/app.png';

const ExplorePage: React.FC = () => {
    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['explore-notes'],
        queryFn: () => getPublicNotes(1, 20),
    });

    return (
        <div className="min-h-dvh bg-neutral-100 dark:bg-neutral-900">
            <div className="max-w-5xl mx-auto px-4 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3 select-none">
                        <img src={logo} className="w-10" alt="logo" />
                        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Explore</span>
                    </div>
                    <Link
                        to="/signin"
                        className="font-bold text-sm text-primary"
                    >
                        Sign in
                    </Link>
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
