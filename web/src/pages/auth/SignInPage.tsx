import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { signIn } from '../../api/auth';
import logo from '../../assets/app.png'
import { useTranslation } from 'react-i18next';
import { toast } from '../../stores/toast';
import TextInput from '../../components/textinput/TextInput';
import SubmitButton from '../../components/submitbutton/SubmitButton';
import { Telescope } from 'lucide-react';

const SignIn: React.FC = () => {
    const {t} = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const signInMutation = useMutation({
        mutationFn: signIn,
        onSuccess: async (data) => {
            console.log('Sign in successful:', data);
            navigate('/')
        },
        onError: (error) => {
            console.log(error)
            toast.error(t("messages.signInFailed"));
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        signInMutation.mutate({ username, password });
    };

    return (
        <div className="min-h-dvh bg-neutral-100 dark:bg-neutral-900 flex justify-center pt-24">
            <div className="w-80 flex flex-col gap-2 pb-5">
                <div className='flex items-center justify-center flex-col sm:flex-row select-none '>
                    <img src={logo} className='w-40' alt="logo" />
                </div>
                <form onSubmit={handleSubmit} className='px-3 sm:px-0'>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                            {t("form.username")}
                        </label>
                        <TextInput
                            id="username"
                            value={username}
                            title='username'
                            onChange={(e) => setUsername(e.target.value)}
                            required={true}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                            {t("form.password")}
                        </label>
                        <TextInput
                            id="password"
                            type="password"
                            title='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required={true}
                        />
                    </div>
                    <div className="flex flex-col items-center gap-5 justify-between">
                        <SubmitButton
                            disabled={signInMutation.isPending}
                        >
                            {t('actions.signin')}
                        </SubmitButton>
                        <Link
                            to="/signup"
                            className="inline-block align-baseline text-right font-bold text-sm text-yellow-600 hover:text-yellow-800"
                        >
                            {t("pages.signin.noAccount")}
                        </Link>
                        <Link
                            to="/explore/notes"
                            className="flex gap-2 items-center text-right font-bold text-sm text-yellow-600 hover:text-yellow-800"
                        >
                            <Telescope size={20} />
                            {t("menu.explore")}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignIn;