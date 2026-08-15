import { SignInButton, UserButton, useAuth } from '@clerk/react';
import axios from 'axios';
import {
  AlertTriangle, ArrowLeft, BarChart3, CheckCircle2, Disc3, DiscAlbum,
  Image, LoaderCircle, Mic2, Music2, Plus, ShieldCheck, Trash2, Upload,
  Users, X,
} from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import { cn } from '../lib/utils';
import { ThemeToggle } from '../components/ThemeToggle';

type Song = { _id: string; title: string; artist: string; imageUrl?: string; duration?: number; isPreview?: boolean };
type Album = { _id: string; title: string; artist: string; imageUrl: string; releaseYear: number; songs?: string[] };
type Stats = { totalSongs: number; totalAlbums: number; totalUsers: number; totalArtists: number };
type View = 'overview' | 'catalog' | 'upload';

const fieldClass = 'h-11 w-full rounded-xl border border-white/[.08] bg-white/[.045] px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/10';

const errorMessage = (error: unknown) => axios.isAxiosError(error)
  ? error.response?.data?.message || error.message : 'Something went wrong';

export const AdminPage = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied' | 'error'>('checking');
  const [view, setView] = useState<View>('overview');
  const [stats, setStats] = useState<Stats>({ totalSongs: 0, totalAlbums: 0, totalUsers: 0, totalArtists: 0 });
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const refresh = useCallback(async () => {
    const [statsResult, songsResult, albumsResult] = await Promise.allSettled([
      axiosInstance.get('/stats'), axiosInstance.get('/songs'), axiosInstance.get('/albums'),
    ]);
    if (statsResult.status === 'fulfilled') setStats(statsResult.value.data.data);
    if (songsResult.status === 'fulfilled') setSongs(songsResult.value.data.data || []);
    if (albumsResult.status === 'fulfilled') setAlbums(albumsResult.value.data.data || []);
    const failedResult = [statsResult, songsResult, albumsResult].find((result) => result.status === 'rejected');
    if (failedResult?.status === 'rejected') throw failedResult.reason;
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    axiosInstance.get('/admin/checkAdmin').then(async () => {
      setAccess('allowed');
      try { await refresh(); } catch (error) { setFeedback({ tone: 'error', message: errorMessage(error) }); }
    }).catch((error) => setAccess(axios.isAxiosError(error) && [401, 403].includes(error.response?.status || 0) ? 'denied' : 'error'));
  }, [isLoaded, isSignedIn, refresh]);

  const uploadSong = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy('song'); setFeedback(null);
    const form = event.currentTarget;
    try {
      await axiosInstance.post('/admin/songs', new FormData(form));
      form.reset(); await refresh(); setFeedback({ tone: 'success', message: 'Song published to the catalog.' });
    } catch (error) { setFeedback({ tone: 'error', message: errorMessage(error) }); }
    finally { setBusy(''); }
  };

  const uploadAlbum = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy('album'); setFeedback(null);
    const form = event.currentTarget;
    try {
      await axiosInstance.post('/admin/albums', new FormData(form));
      form.reset(); await refresh(); setFeedback({ tone: 'success', message: 'Album created successfully.' });
    } catch (error) { setFeedback({ tone: 'error', message: errorMessage(error) }); }
    finally { setBusy(''); }
  };

  const removeItem = async (kind: 'song' | 'album', id: string, name: string) => {
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
    setBusy(id); setFeedback(null);
    try {
      await axiosInstance.delete(`/admin/${kind}s/${id}`);
      await refresh(); setFeedback({ tone: 'success', message: `${kind === 'song' ? 'Song' : 'Album'} deleted.` });
    } catch (error) { setFeedback({ tone: 'error', message: errorMessage(error) }); }
    finally { setBusy(''); }
  };

  if (!isLoaded || (isSignedIn && access === 'checking')) return <AdminState icon={LoaderCircle} spin title="Checking studio access" copy="Verifying your administrator account." />;
  if (!isSignedIn || access === 'denied') return <div className="min-h-screen bg-[#07070a] text-white"><AdminState icon={ShieldCheck} title={isSignedIn ? 'Studio access required' : 'Sign in to continue'} copy={isSignedIn ? 'This account is not listed as a Soundwave administrator.' : 'Use the administrator account configured for this project.'} action={!isSignedIn ? <SignInButton mode="modal"><button className="rounded-full bg-lime-300 px-5 py-2.5 text-xs font-bold text-black">Sign in</button></SignInButton> : undefined} /></div>;
  if (access === 'error') return <AdminState icon={AlertTriangle} title="Studio is unavailable" copy="The permission check could not be completed. Make sure the backend is running." />;

  return <div className="app-shell motion-page min-h-screen bg-[#07070a] text-white selection:bg-lime-300 selection:text-black">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(124,58,237,.15),transparent_28%),radial-gradient(circle_at_90%_80%,rgba(190,242,100,.06),transparent_24%)]" />
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-white/[.07] bg-[#0a090d]/95 p-5 backdrop-blur-2xl lg:flex">
      <Link to="/" className="mb-9 flex items-center gap-3 px-2 text-[17px] font-bold tracking-[-.04em]"><span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-black"><Disc3 className="size-4" /></span>soundwave<span className="text-lime-300">°</span></Link>
      <span className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-zinc-600">Admin studio</span>
      <nav className="space-y-1">{([['overview', BarChart3, 'Overview'], ['catalog', Music2, 'Catalog'], ['upload', Upload, 'Add music']] as const).map(([id, Icon, label]) => <button key={id} onClick={() => setView(id)} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition', view === id ? 'bg-white/[.07] text-white' : 'text-zinc-500 hover:bg-white/[.04] hover:text-white')}><Icon className="size-4" />{label}</button>)}</nav>
      <div className="mt-auto rounded-2xl border border-lime-300/10 bg-lime-300/[.035] p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-lime-300"><ShieldCheck className="size-3.5" />Protected</div><p className="mt-2 text-[10px] leading-4 text-zinc-600">Every mutation is verified by the backend against the configured admin email.</p></div>
    </aside>

    <main className="relative z-10 mx-auto max-w-[1500px] px-4 pb-16 lg:ml-[250px] lg:px-10">
      <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-white/[.07] bg-[#07070a]/80 backdrop-blur-2xl"><div className="flex items-center gap-3"><Link to="/" className="grid size-9 place-items-center rounded-full border border-white/10 text-zinc-500 hover:text-white"><ArrowLeft className="size-4" /></Link><div><span className="text-[9px] font-bold uppercase tracking-[.2em] text-violet-400">Soundwave</span><h1 className="text-sm font-semibold">Admin studio</h1></div></div><div className="flex items-center gap-3"><ThemeToggle /><UserButton /></div></header>

      <div className="py-10"><div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-lime-300"><span className="size-1.5 rounded-full bg-lime-300" />System online</div><h2 className="text-4xl font-semibold tracking-[-.055em] sm:text-5xl">Control the<br /><span className="font-serif font-normal italic text-violet-300">frequency.</span></h2></div><button onClick={() => setView('upload')} className="flex h-11 items-center justify-center gap-2 rounded-full bg-lime-300 px-5 text-xs font-bold text-black shadow-[0_12px_35px_-14px_rgba(190,242,100,.8)]"><Plus className="size-4" />Add new music</button></div>

        {feedback && <div className={cn('mb-7 flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs', feedback.tone === 'success' ? 'border-lime-300/15 bg-lime-300/[.06] text-lime-100' : 'border-rose-400/15 bg-rose-400/[.06] text-rose-100')}>{feedback.tone === 'success' ? <CheckCircle2 className="size-4 text-lime-300" /> : <AlertTriangle className="size-4 text-rose-300" />}<span className="flex-1">{feedback.message}</span><button onClick={() => setFeedback(null)}><X className="size-3.5" /></button></div>}

        {view === 'overview' && <Overview stats={stats} songs={songs} albums={albums} onOpenCatalog={() => setView('catalog')} />}
        {view === 'catalog' && <Catalog songs={songs} albums={albums} busy={busy} removeItem={removeItem} />}
        {view === 'upload' && <UploadStudio albums={albums} busy={busy} uploadSong={uploadSong} uploadAlbum={uploadAlbum} />}
      </div>
    </main>
  </div>;
};

function Overview({ stats, songs, albums, onOpenCatalog }: { stats: Stats; songs: Song[]; albums: Album[]; onOpenCatalog: () => void }) {
  const cards = [[Music2, 'Songs', stats.totalSongs], [DiscAlbum, 'Albums', stats.totalAlbums], [Users, 'Listeners', stats.totalUsers], [Mic2, 'Artists', stats.totalArtists]] as const;
  return <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([Icon, label, value], index) => <div key={label} className="relative overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.025] p-5"><span className={cn('mb-7 grid size-9 place-items-center rounded-xl', index === 0 ? 'bg-lime-300/10 text-lime-300' : 'bg-violet-500/10 text-violet-300')}><Icon className="size-4" /></span><strong className="block text-3xl tracking-[-.05em]">{value}</strong><span className="mt-1 block text-[10px] uppercase tracking-[.15em] text-zinc-600">{label}</span></div>)}</div><div className="mt-7 grid gap-7 xl:grid-cols-[1.3fr_.7fr]"><div className="rounded-2xl border border-white/[.07] bg-white/[.02]"><div className="flex items-center justify-between border-b border-white/[.06] p-5"><div><h3 className="text-sm font-semibold">Recent catalog</h3><p className="mt-1 text-[10px] text-zinc-600">Latest music available to listeners</p></div><button onClick={onOpenCatalog} className="text-[10px] text-violet-300">Manage all</button></div><div>{songs.slice(0, 6).map((song, index) => <div key={song._id} className="flex items-center gap-3 border-b border-white/[.045] px-5 py-3 last:border-0"><span className="w-5 text-[10px] text-zinc-700">{String(index + 1).padStart(2, '0')}</span><img className="size-10 rounded-lg object-cover" src={song.imageUrl} alt="" /><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{song.title}</strong><small className="mt-1 block truncate text-[9px] text-zinc-600">{song.artist}</small></span><span className="rounded-full border border-white/[.07] px-2 py-1 text-[8px] uppercase tracking-wider text-zinc-600">{song.isPreview ? 'Preview' : 'Full'}</span></div>)}</div></div><div className="rounded-2xl border border-white/[.07] bg-gradient-to-br from-violet-950/40 to-white/[.02] p-6"><span className="text-[9px] font-bold uppercase tracking-[.18em] text-violet-300">Album shelf</span><strong className="mt-3 block text-5xl tracking-[-.07em]">{albums.length}</strong><p className="mt-3 text-xs leading-5 text-zinc-500">Curated releases grouping your catalog into complete listening experiences.</p><div className="mt-8 flex -space-x-3">{albums.slice(0, 5).map((album) => <img key={album._id} className="size-12 rounded-full border-2 border-[#121015] object-cover" src={album.imageUrl} alt="" />)}</div></div></div></>;
}

function Catalog({ songs, albums, busy, removeItem }: { songs: Song[]; albums: Album[]; busy: string; removeItem: (kind: 'song' | 'album', id: string, name: string) => void }) {
  return <div className="space-y-10"><AdminSection title="Songs" count={songs.length}><div className="overflow-hidden rounded-2xl border border-white/[.07]">{songs.map((song) => <div key={song._id} className="flex items-center gap-3 border-b border-white/[.05] bg-white/[.018] px-4 py-3 last:border-0 hover:bg-white/[.035]"><img className="size-11 rounded-lg object-cover" src={song.imageUrl} alt="" /><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{song.title}</strong><small className="mt-1 block truncate text-[9px] text-zinc-600">{song.artist}</small></span><span className="hidden text-[9px] uppercase tracking-wider text-zinc-600 sm:block">{song.isPreview ? 'Preview' : 'Full track'}</span><button disabled={busy === song._id} onClick={() => removeItem('song', song._id, song.title)} className="grid size-9 place-items-center rounded-full text-zinc-600 transition hover:bg-rose-400/10 hover:text-rose-300 disabled:opacity-30" aria-label={`Delete ${song.title}`}>{busy === song._id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</button></div>)}</div></AdminSection><AdminSection title="Albums" count={albums.length}>{albums.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{albums.map((album) => <article key={album._id} className="flex gap-4 rounded-2xl border border-white/[.07] bg-white/[.02] p-4"><img className="size-20 rounded-xl object-cover" src={album.imageUrl} alt="" /><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{album.title}</strong><small className="mt-1 block truncate text-[10px] text-zinc-600">{album.artist} · {album.releaseYear}</small><button disabled={busy === album._id} onClick={() => removeItem('album', album._id, album.title)} className="mt-4 flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-zinc-600 hover:text-rose-300"><Trash2 className="size-3" />Delete</button></span></article>)}</div> : <EmptyAdmin icon={DiscAlbum} text="No albums have been created yet." />}</AdminSection></div>;
}

function UploadStudio({ albums, busy, uploadSong, uploadAlbum }: { albums: Album[]; busy: string; uploadSong: (event: FormEvent<HTMLFormElement>) => void; uploadAlbum: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="grid gap-6 xl:grid-cols-2"><UploadCard icon={Music2} eyebrow="New track" title="Publish a song" copy="Upload audio and artwork to Cloudinary, then add the track to the public catalog."><form onSubmit={uploadSong} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Title"><input className={fieldClass} name="title" required placeholder="Track title" /></Field><Field label="Artist"><input className={fieldClass} name="artist" required placeholder="Artist name" /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Duration (seconds)"><input className={fieldClass} name="duration" type="number" min="1" required placeholder="240" /></Field><Field label="Album (optional)"><select className={fieldClass} name="albumId" defaultValue=""><option value="">Standalone single</option>{albums.map((album) => <option value={album._id} key={album._id}>{album.title}</option>)}</select></Field></div><FileField label="Audio file" name="audioFile" accept="audio/*" /><FileField label="Cover artwork" name="imageFile" accept="image/*" /><SubmitButton busy={busy === 'song'} label="Publish song" /></form></UploadCard><UploadCard icon={DiscAlbum} eyebrow="New release" title="Create an album" copy="Build a release shell now, then assign new tracks to it as you upload."><form onSubmit={uploadAlbum} className="space-y-4"><Field label="Album title"><input className={fieldClass} name="title" required placeholder="Album title" /></Field><Field label="Artist"><input className={fieldClass} name="artist" required placeholder="Artist name" /></Field><Field label="Release year"><input className={fieldClass} name="releaseYear" type="number" min="1900" max="2100" required defaultValue={new Date().getFullYear()} /></Field><FileField label="Album artwork" name="imageFile" accept="image/*" /><SubmitButton busy={busy === 'album'} label="Create album" /></form></UploadCard></div>;
}

function AdminSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) { return <section><div className="mb-4 flex items-end justify-between"><div><span className="text-[9px] font-bold uppercase tracking-[.18em] text-violet-400">Catalog</span><h3 className="mt-1 text-2xl font-semibold tracking-[-.04em]">{title}</h3></div><span className="text-xs text-zinc-600">{count} total</span></div>{children}</section>; }
function UploadCard({ icon: Icon, eyebrow, title, copy, children }: { icon: typeof Music2; eyebrow: string; title: string; copy: string; children: React.ReactNode }) { return <section className="rounded-[26px] border border-white/[.07] bg-white/[.025] p-6 sm:p-7"><span className="mb-6 grid size-11 place-items-center rounded-2xl bg-violet-500/10 text-violet-300"><Icon className="size-5" /></span><span className="text-[9px] font-bold uppercase tracking-[.18em] text-lime-300">{eyebrow}</span><h3 className="mt-2 text-2xl font-semibold tracking-[-.04em]">{title}</h3><p className="mb-7 mt-2 max-w-md text-xs leading-5 text-zinc-600">{copy}</p>{children}</section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[10px] font-semibold text-zinc-500">{label}</span>{children}</label>; }
function FileField({ label, name, accept }: { label: string; name: string; accept: string }) { return <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[.025] p-4 transition hover:border-violet-400/30"><span className="grid size-9 place-items-center rounded-xl bg-white/[.05] text-zinc-500"><Image className="size-4" /></span><span className="flex-1"><strong className="block text-xs">{label}</strong><small className="mt-1 block text-[9px] text-zinc-600">Choose a file · maximum 10 MB</small></span><input className="max-w-24 text-[9px] text-zinc-600 file:hidden" type="file" name={name} accept={accept} required /></label>; }
function SubmitButton({ busy, label }: { busy: boolean; label: string }) { return <button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-lime-300 text-xs font-bold text-black transition hover:bg-lime-200 disabled:opacity-50">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}{busy ? 'Uploading…' : label}</button>; }
function EmptyAdmin({ icon: Icon, text }: { icon: typeof DiscAlbum; text: string }) { return <div className="grid min-h-40 place-content-center justify-items-center rounded-2xl border border-dashed border-white/10 text-center"><Icon className="mb-3 size-7 text-zinc-700" /><span className="text-xs text-zinc-600">{text}</span></div>; }
function AdminState({ icon: Icon, title, copy, action, spin }: { icon: typeof ShieldCheck; title: string; copy: string; action?: React.ReactNode; spin?: boolean }) { return <div className="grid min-h-screen place-content-center justify-items-center bg-[#07070a] px-6 text-center text-white"><span className="mb-5 grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-violet-300"><Icon className={cn('size-6', spin && 'animate-spin')} /></span><h1 className="text-xl font-semibold tracking-tight">{title}</h1><p className="mb-6 mt-2 max-w-sm text-xs leading-5 text-zinc-600">{copy}</p>{action}<Link to="/" className="mt-5 text-[10px] text-zinc-600 hover:text-white">Return to Soundwave</Link></div>; }
