import { SignInButton, useAuth, useUser } from '@clerk/react';
import { CheckCircle2, Disc3, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import { ThemeToggle } from '../components/ThemeToggle';

export const AuthCallBackPage = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    axiosInstance.post('/auth/callback', {
      id: user.id,
      firstName: user.firstName || 'Music',
      lastName: user.lastName || 'Listener',
      imageUrl: user.imageUrl,
    }).then(() => setTimeout(() => navigate('/', { replace: true }), 600))
      .catch(() => setError('We could not finish syncing your Soundwave profile.'));
  }, [isLoaded, isSignedIn, navigate, user]);

  return <div className="app-shell motion-page grid min-h-screen place-content-center justify-items-center bg-[#07070a] px-6 text-center text-white">
    <ThemeToggle className="fixed right-5 top-5" />
    <span className="relative mb-6 grid size-16 place-items-center rounded-[22px] bg-lime-300 text-black"><Disc3 className="size-7" />{!error && isSignedIn && <CheckCircle2 className="absolute -bottom-1 -right-1 size-6 rounded-full bg-[#07070a] p-1 text-lime-300" />}</span>
    {!isLoaded ? <><LoaderCircle className="size-5 animate-spin text-violet-300" /><h1 className="mt-4 text-lg font-semibold">Finishing sign in</h1></> : !isSignedIn ? <><h1 className="text-lg font-semibold">Sign in to Soundwave</h1><p className="mt-2 text-xs text-zinc-600">Your profile will be synchronized with the listening room.</p><SignInButton mode="modal"><button className="mt-6 rounded-full bg-lime-300 px-5 py-2.5 text-xs font-bold text-black">Continue</button></SignInButton></> : error ? <><h1 className="text-lg font-semibold">Profile sync failed</h1><p className="mt-2 max-w-sm text-xs text-rose-300">{error}</p><Link to="/" className="mt-6 text-xs text-zinc-500 hover:text-white">Return home</Link></> : <><h1 className="text-lg font-semibold">You’re in</h1><p className="mt-2 text-xs text-zinc-600">Tuning your personal Soundwave signal…</p><LoaderCircle className="mt-5 size-4 animate-spin text-violet-300" /></>}
  </div>;
};
