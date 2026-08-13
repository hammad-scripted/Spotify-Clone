import { lazy, Suspense } from 'react';
import { Disc3, LoaderCircle } from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })));
const AlbumPage = lazy(() => import('./pages/AlbumPage').then((module) => ({ default: module.AlbumPage })));
const AuthCallBackPage = lazy(() => import('./pages/AuthCallBackPage').then((module) => ({ default: module.AuthCallBackPage })));

const PageLoader = () => <div className="grid min-h-screen place-content-center justify-items-center bg-[#07070a] text-white"><span className="relative grid size-14 place-items-center rounded-2xl bg-lime-300 text-black"><Disc3 className="size-6" /><LoaderCircle className="absolute -inset-2 size-[72px] animate-spin text-violet-400" /></span><span className="mt-6 text-[10px] font-bold uppercase tracking-[.22em] text-zinc-600">Tuning the signal</span></div>;

function App() {
  return <Suspense fallback={<PageLoader />}><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/albums/:albumId" element={<AlbumPage />} />
    <Route path="/admin" element={<AdminPage />} />
    <Route path="/auth-callback" element={<AuthCallBackPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>;
}

export default App;
