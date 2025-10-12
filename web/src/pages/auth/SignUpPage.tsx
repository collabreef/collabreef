import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { signUp } from '../../api/auth';
import logo from '../../assets/app.png'
import { useTranslation } from 'react-i18next';
import { toast } from '../../stores/toast';
import TextInput from '../../components/textinput/TextInput';
import SubmitButton from '../../components/submitbutton/SubmitButton';

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
      toast.error(t("messages.signUpFailed", { error: error }));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t("messages.passwordDoNotMatch"));
      return;
    }
    signUpMutation.mutate({ username, email, password });
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
              {t("form.email")}
            </label>
            <TextInput
              id="email"
              type="email"
              title='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              {t("form.username")}
            </label>
            <TextInput
              id="username"
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
            <TextInput
              id="password"
              type="password"
              title='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="confirmPassword">
              {t("form.comfirmPassword")}
            </label>
            <TextInput
              id="confirmPassword"
              type="password"
              title='confirm password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col items-center gap-5 justify-between">
            <SubmitButton
              disabled={signUpMutation.isPending}
            >
              {t("actions.signup")}
            </SubmitButton>
            <Link
              to="/signin"
              className="inline-block align-baseline font-bold text-sm text-yellow-600 hover:text-yellow-800"
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