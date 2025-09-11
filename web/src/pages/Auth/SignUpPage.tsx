import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { signUp } from '../../api/auth';
import logo from '../../assets/app.png'
import logotext from '../../assets/applogo_text.png'
import { useTranslation } from 'react-i18next';
import { toast } from '../../stores/toast';

const SignUp: React.FC = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const signUpMutation = useMutation({
    mutationFn: signUp,
    onSuccess: (data) => {
      console.log('Sign up successful:', data);
      navigate('/signin'); // Redirect to sign-in page
    },
    onError: (error: any) => {
      console.error('Sign up failed:', error);
      toast.error(`Sign up failed, ${error.response.data.error}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    signUpMutation.mutate({ username, email, password });
  };

  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-900 flex justify-center pt-24">
      <div className="w-80 flex flex-col gap-10 pb-5">
        <div className='flex items-center justify-center flex-col gap-3 sm:flex-row select-none '>
          <img src={logo} className='w-14' alt="logo" />
          <img src={logotext} className='w-32' alt="logo" />
        </div>
        <form onSubmit={handleSubmit} className='px-3 sm:px-0'>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              {t("form.email")}
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              {t("form.username")}
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="username"
              type="text"
              title='username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              {t("form.password")}
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="confirmPassword">
              {t("form.comfirmPassword")}
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col items-center gap-5 justify-between">
            <button
              className=" w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline disabled:opacity-50"
              type="submit"
              disabled={signUpMutation.isPending}
            >
              {t("actions.signup")}
            </button>
            <Link
              to="/signin"
              className="inline-block align-baseline font-bold text-sm text-amber-500 hover:text-amber-800"
            >
              {t("pages.signup.alreadyHaveAccount")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;