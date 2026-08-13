import { useAuth } from '@clerk/react';
import { Loader } from 'lucide-react';
import { useLayoutEffect } from 'react';
import { axiosInstance } from '../lib/axios';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, isLoaded } = useAuth();
  useLayoutEffect(() => {
    if (!isLoaded) return;
    const interceptor = axiosInstance.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      else delete config.headers.Authorization;
      return config;
    });
    return () => axiosInstance.interceptors.request.eject(interceptor);
  }, [getToken, isLoaded]);

  if (!isLoaded) return <div className="grid min-h-screen place-items-center bg-[#07070a]"><Loader className="size-7 animate-spin text-lime-300" /></div>;
  return <>{children}</>;
};
