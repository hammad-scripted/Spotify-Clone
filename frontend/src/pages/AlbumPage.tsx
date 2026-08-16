import { ArrowLeft, Clock3, Disc3, LoaderCircle, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';
import { cn } from '../lib/utils';
import { ThemeToggle } from '../components/ThemeToggle';

type Song = { _id: string; title: string; artist: string; imageUrl?: string; audioUrl: string; duration?: number; isPreview?: boolean };
type Album = { _id: string; title: string; artist: string; imageUrl: string; releaseYear: number; songs: Song[] };

const formatTime = (seconds = 0) => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}` : '0:00';

export const AlbumPage = () => {
  const { albumId } = useParams();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState<Song | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    axiosInstance.get(`/albums/${albumId}`).then(({ data }) => {
      setAlbum(data.data); setCurrent(data.data.songs?.[0] || null);
    }).catch(() => setError('This album could not be found.')).finally(() => setLoading(false));
  }, [albumId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.src !== current.audioUrl) audio.src = current.audioUrl;
    if (playing) audio.play().catch(() => setPlaying(false)); else audio.pause();
  }, [current, playing]);

  const playSong = (song: Song) => {
    if (song._id === current?._id) setPlaying((value) => !value);
    else { setCurrent(song); setProgress(0); setPlaying(true); }
  };
  const skip = (direction: number) => {
    if (!album?.songs.length || !current) return;
    const index = album.songs.findIndex((song) => song._id === current._id);
    setCurrent(album.songs[(index + direction + album.songs.length) % album.songs.length]); setProgress(0); setPlaying(true);
  };

  if (loading) return <AlbumState icon={LoaderCircle} spin title="Loading release" copy="Pulling the album from the catalog." />;
  if (error || !album) return <AlbumState icon={Disc3} title="Album unavailable" copy={error || 'This release is no longer available.'} />;

  return <div className="app-shell motion-page min-h-screen bg-[#07070a] pb-28 text-white selection:bg-lime-300 selection:text-black">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,.2),transparent_32%),radial-gradient(circle_at_90%_70%,rgba(190,242,100,.05),transparent_25%)]" />
    <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-8">
      <header className="flex h-20 items-center justify-between border-b border-white/[.07]"><Link to="/" className="flex items-center gap-2 text-xs text-zinc-500 transition hover:text-white"><span className="grid size-9 place-items-center rounded-full border border-white/10"><ArrowLeft className="size-4" /></span>Back to Soundwave</Link><span className="flex items-center gap-3"><ThemeToggle /><span className="hidden items-center gap-2 text-sm font-bold tracking-tight sm:flex"><span className="grid size-8 place-items-center rounded-xl bg-lime-300 text-black"><Disc3 className="size-3.5" /></span>soundwave°</span></span></header>
      <section className="grid gap-9 py-12 md:grid-cols-[280px_1fr] md:items-end lg:py-16"><div className="group relative mx-auto w-full max-w-[280px]"><div className="absolute inset-5 rounded-full bg-violet-500/30 blur-[60px]" /><img className="relative aspect-square w-full rounded-[30px] object-cover shadow-[0_35px_80px_-25px_rgba(0,0,0,.9)] ring-1 ring-white/15" src={album.imageUrl} alt={`${album.title} cover`} /></div><div><span className="text-[9px] font-bold uppercase tracking-[.22em] text-lime-300">Album · {album.releaseYear}</span><h1 className="mt-4 text-5xl font-semibold leading-none tracking-[-.065em] sm:text-7xl">{album.title}</h1><p className="mt-5 text-sm text-zinc-400">{album.artist}</p><p className="mt-2 text-xs text-zinc-600">{album.songs.length} {album.songs.length === 1 ? 'track' : 'tracks'}</p>{current && <button onClick={() => setPlaying((value) => !value)} className="mt-7 flex h-12 items-center gap-2 rounded-full bg-lime-300 px-6 text-xs font-bold text-black shadow-[0_14px_40px_-16px_rgba(190,242,100,.9)]">{playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}{playing ? 'Pause album' : 'Play album'}</button>}</div></section>
      <section className="overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.02]"><div className="grid grid-cols-[42px_1fr_60px] border-b border-white/[.06] px-4 py-3 text-[9px] font-bold uppercase tracking-[.16em] text-zinc-600"><span>#</span><span>Track</span><Clock3 className="ml-auto size-3" /></div>{album.songs.length ? album.songs.map((song, index) => <button key={song._id} onClick={() => playSong(song)} className="group grid w-full grid-cols-[42px_1fr_60px] items-center border-b border-white/[.05] px-4 py-3 text-left last:border-0 hover:bg-white/[.04]"><span className={cn('text-xs text-zinc-600', current?._id === song._id && 'text-lime-300')}>{current?._id === song._id && playing ? <Pause className="size-3" fill="currentColor" /> : String(index + 1).padStart(2, '0')}</span><span className="min-w-0"><strong className={cn('block truncate text-xs', current?._id === song._id ? 'text-lime-300' : 'text-zinc-200')}>{song.title}</strong><small className="mt-1 block truncate text-[9px] text-zinc-600">{song.artist}{song.isPreview ? ' · Official preview' : ''}</small></span><span className="ml-auto text-[10px] text-zinc-600">{formatTime(song.duration)}</span></button>) : <div className="grid min-h-48 place-content-center justify-items-center text-center"><Disc3 className="mb-3 size-7 text-zinc-700" /><strong className="text-sm">No tracks yet</strong><p className="mt-2 text-xs text-zinc-600">Songs assigned to this album will appear here.</p></div>}</section>
    </main>
    {current && <footer className="fixed bottom-0 left-0 right-0 z-30 grid h-[86px] grid-cols-[1fr_auto] items-center border-t border-white/[.08] bg-[#0c0b0f]/90 px-4 backdrop-blur-2xl sm:grid-cols-[1fr_1.2fr_1fr] sm:px-7"><div className="flex min-w-0 items-center gap-3"><img className="size-12 rounded-xl object-cover" src={current.imageUrl || album.imageUrl} alt="" /><span className="min-w-0"><strong className="block truncate text-xs">{current.title}</strong><small className="mt-1 block truncate text-[9px] text-zinc-600">{current.artist}</small></span></div><div className="grid gap-2"><div className="flex items-center justify-center gap-5"><button onClick={() => skip(-1)}><SkipBack className="size-4 text-zinc-500" fill="currentColor" /></button><button onClick={() => setPlaying((value) => !value)} className="grid size-10 place-items-center rounded-full bg-white text-black hover:bg-lime-300">{playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}</button><button onClick={() => skip(1)}><SkipForward className="size-4 text-zinc-500" fill="currentColor" /></button></div><div className="hidden grid-cols-[30px_1fr_30px] items-center gap-2 text-[8px] text-zinc-700 sm:grid"><span>{formatTime(progress)}</span><input className="sound-range" type="range" min="0" max={duration || 1} value={progress} onChange={(event) => { const value = Number(event.target.value); setProgress(value); if (audioRef.current) audioRef.current.currentTime = value; }} /><span>{formatTime(duration)}</span></div></div><div className="hidden items-center justify-end gap-3 sm:flex"><Volume2 className="size-4 text-zinc-600" /><input className="sound-range max-w-20" type="range" min="0" max="1" step="0.05" defaultValue="0.75" onChange={(event) => { if (audioRef.current) audioRef.current.volume = Number(event.target.value); }} /></div><audio ref={audioRef} onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onEnded={() => skip(1)} /></footer>}
  </div>;
};

function AlbumState({ icon: Icon, title, copy, spin }: { icon: typeof Disc3; title: string; copy: string; spin?: boolean }) { return <div className="app-shell motion-page grid min-h-screen place-content-center justify-items-center bg-[#07070a] px-6 text-center text-white"><ThemeToggle className="fixed right-5 top-5" /><span className="mb-5 grid size-14 place-items-center rounded-2xl bg-white/[.04] text-violet-300 ring-1 ring-white/10"><Icon className={cn('size-6', spin && 'animate-spin')} /></span><h1 className="text-lg font-semibold">{title}</h1><p className="mt-2 text-xs text-zinc-600">{copy}</p><Link to="/" className="mt-6 text-xs text-zinc-500 hover:text-white">Return home</Link></div>; }
