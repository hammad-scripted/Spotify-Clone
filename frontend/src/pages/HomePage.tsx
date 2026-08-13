import { Show, SignInButton, UserButton, useAuth, useUser } from '@clerk/react';
import {
  ArrowRight, ChevronLeft, ChevronRight, Clock3, Disc3, Heart, Home, Library,
  ListMusic, Maximize2, MessageCircle, MoreHorizontal, Pause, Play, Radio,
  Repeat2, Search, Send, Shuffle, SkipBack, SkipForward, Sparkles, Users,
  Volume2, X, Zap, ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import axios from 'axios';
import { axiosInstance } from '../lib/axios';
import { cn } from '../lib/utils';

type Song = { _id: string; title: string; artist: string; imageUrl?: string; audioUrl?: string; duration?: number; isPreview?: boolean; sourceUrl?: string };
type ChatUser = { _id: string; clerkId: string; fullName: string; imageUrl: string };
type Message = { _id: string; senderId: string; receiverId: string; content: string; createdAt: string };
type Album = { _id: string; title: string; artist: string; imageUrl: string; releaseYear: number; songs?: string[] };

const demoSongs: Song[] = [
  { _id: 'demo-1', title: 'Afterglow', artist: 'Luna Park', duration: 214 },
  { _id: 'demo-2', title: 'Midnight Drive', artist: 'Neon Hours', duration: 187 },
  { _id: 'demo-3', title: 'Velvet Sky', artist: 'Mira Lane', duration: 243 },
  { _id: 'demo-4', title: 'Slow Motion', artist: 'The Coastline', duration: 201 },
  { _id: 'demo-5', title: 'Daydream', artist: 'June & Atlas', duration: 196 },
  { _id: 'demo-6', title: 'Soft Focus', artist: 'Paper Planes', duration: 229 },
];

const coverClasses = [
  'from-violet-950 via-violet-700 to-fuchsia-400', 'from-orange-950 via-rose-700 to-orange-300',
  'from-cyan-950 via-teal-700 to-emerald-300', 'from-rose-950 via-pink-700 to-rose-300',
  'from-lime-950 via-emerald-700 to-lime-300', 'from-amber-950 via-orange-700 to-amber-300',
];
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const formatTime = (seconds = 0) => Number.isFinite(seconds)
  ? `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}` : '0:00';

const loadLikedIds = () => {
  try {
    const value = JSON.parse(localStorage.getItem('soundwave-liked') || '[]');
    return new Set<string>(Array.isArray(value) ? value : []);
  } catch { return new Set<string>(); }
};

function Cover({ song, index, className }: { song: Song; index: number; className?: string }) {
  return <div className={cn('relative grid shrink-0 place-items-center overflow-hidden bg-gradient-to-br shadow-2xl', coverClasses[Math.abs(index) % coverClasses.length], className)}>
    {song.imageUrl ? <img className="h-full w-full object-cover transition duration-700 group-hover:scale-105" src={song.imageUrl} alt="" /> : <><Disc3 className="size-1/3 text-white/40" /><span className="absolute font-serif text-xl italic text-white/90">{song.title.slice(0, 2).toUpperCase()}</span></>}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10" />
  </div>;
}

function SongCard({ song, index, active, playing, liked, onPlay, onLike }: {
  song: Song; index: number; active: boolean; playing: boolean; liked: boolean; onPlay: () => void; onLike: () => void;
}) {
  return <article className="group relative min-w-0">
    <button className="block w-full text-left" onClick={onPlay} aria-label={`${active && playing ? 'Pause' : 'Play'} ${song.title}`}>
      <div className="relative mb-3 overflow-hidden rounded-[20px] ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-white/25 group-hover:shadow-[0_20px_50px_-20px_rgba(167,139,250,.7)]">
        <Cover song={song} index={index} className="aspect-square w-full" />
        <span className="absolute bottom-3 right-3 grid size-11 translate-y-2 place-items-center rounded-full bg-lime-300 text-black opacity-0 shadow-xl transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          {active && playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4 translate-x-px" fill="currentColor" />}
        </span>
        {song.isPreview && <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.16em] text-white/80 backdrop-blur-xl">Preview</span>}
      </div>
      <strong className={cn('block truncate text-sm font-semibold tracking-tight transition', active ? 'text-lime-300' : 'text-white group-hover:text-violet-200')}>{song.title}</strong>
      <span className="mt-1 block truncate text-xs text-zinc-500">{song.artist}</span>
    </button>
    <button className={cn('absolute bottom-0 right-0 grid size-7 place-items-center rounded-full text-zinc-600 transition hover:bg-white/5 hover:text-white group-hover:opacity-100 max-sm:opacity-100', liked ? 'text-lime-300 opacity-100' : 'opacity-0')} onClick={onLike} aria-label={`${liked ? 'Remove' : 'Add'} ${song.title} ${liked ? 'from' : 'to'} liked songs`} aria-pressed={liked}>
      <Heart className="size-3.5" fill={liked ? 'currentColor' : 'none'} />
    </button>
  </article>;
}

export const HomePage = () => {
  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const [songs, setSongs] = useState<Song[]>(demoSongs);
  const [madeForYou, setMadeForYou] = useState<Song[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [query, setQuery] = useState('');
  const [current, setCurrent] = useState<Song>(demoSongs[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(current.duration || 0);
  const [chatOpen, setChatOpen] = useState(false);
  const [people, setPeople] = useState<ChatUser[]>([]);
  const [activePerson, setActivePerson] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(loadLikedIds);
  const [showLiked, setShowLiked] = useState(false);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [showFullQueue, setShowFullQueue] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatOn, setRepeatOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.allSettled([
      axiosInstance.get('/songs'),
      axiosInstance.get('/songs/featured'),
      axiosInstance.get('/songs/made-for-you'),
      axiosInstance.get('/songs/trending-songs'),
      axiosInstance.get('/albums'),
    ]).then(([all, featured, made, trending, albumResponse]) => {
      const catalog = all.status === 'fulfilled' ? all.value.data.data || [] : [];
      if (catalog.length) setSongs(catalog); else setNotice('The server is offline, so this is a visual demo mix.');
      if (made.status === 'fulfilled') setMadeForYou(made.value.data.data || []);
      if (trending.status === 'fulfilled') setTrendingSongs(trending.value.data.data || []);
      if (albumResponse.status === 'fulfilled') setAlbums(albumResponse.value.data.data || []);
      const firstSong = featured.status === 'fulfilled' ? featured.value.data.data?.[0] || catalog[0] : catalog[0];
      if (firstSong) setCurrent(firstSong);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    axiosInstance.post('/auth/callback', { id: user.id, firstName: user.firstName || 'Music', lastName: user.lastName || 'Listener', imageUrl: user.imageUrl }).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    getToken().then((token) => {
      if (!token) return;
      axiosInstance.get('/users').then(({ data }) => { setPeople(data.data || []); setActivePerson((person) => person || data.data?.[0] || null); }).catch(() => undefined);
      const socket = io(apiUrl.replace('/api/v1', ''), {
        auth: (callback) => getToken().then((freshToken) => callback({ token: freshToken })),
      });
      socket.on('message:new', (message: Message) => {
        if ([message.senderId, message.receiverId].includes(userId)) setMessages((items) => items.some((item) => item._id === message._id) ? items : [...items, message]);
      });
      socketRef.current = socket;
    });
    return () => { socketRef.current?.disconnect(); socketRef.current = null; };
  }, [getToken, userId]);

  useEffect(() => {
    if (!activePerson) return;
    const controller = new AbortController();
    axiosInstance.get(`/messages/${activePerson.clerkId}`, { signal: controller.signal })
      .then(({ data }) => setMessages(data.data || []))
      .catch((error) => { if (!axios.isCancel(error)) setMessages([]); });
    return () => controller.abort();
  }, [activePerson]);

  useEffect(() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setChatOpen(false);
    document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close);
  }, []);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current.audioUrl) return;
    if (audio.src !== current.audioUrl) audio.src = current.audioUrl;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false)); else audio.pause();
  }, [current, isPlaying]);

  const filteredSongs = useMemo(() => songs.filter((song) => `${song.title} ${song.artist}`.toLowerCase().includes(query.trim().toLowerCase())), [songs, query]);
  const rapSongs = useMemo(() => songs.filter((song) => /kr\$na|raftaar|ikka|honey singh/i.test(song.artist)), [songs]);
  const likedSongs = useMemo(() => songs.filter((song) => likedIds.has(song._id)), [songs, likedIds]);
  const discoverySongs = useMemo(() => {
    if (query) return filteredSongs;
    const unique = new Map([...madeForYou, ...songs].map((song) => [song._id, song]));
    return [...unique.values()];
  }, [filteredSongs, madeForYou, query, songs]);

  const toggleLike = (id: string) => setLikedIds((ids) => {
    const next = new Set(ids); if (next.has(id)) next.delete(id); else next.add(id);
    localStorage.setItem('soundwave-liked', JSON.stringify([...next])); return next;
  });
  const playSong = (song: Song) => {
    if (!song.audioUrl) { setNotice(`${song.title} is unavailable while the server is offline.`); return; }
    if (current._id === song._id) setIsPlaying((value) => !value); else { setCurrent(song); setProgress(0); setIsPlaying(true); }
  };
  const togglePlay = () => {
    if (!current.audioUrl) { setNotice('Connect the server to play this track.'); return; }
    setIsPlaying((value) => !value);
  };
  const skip = (direction: number) => {
    if (!songs.length) return;
    const index = songs.findIndex((song) => song._id === current._id);
    const nextIndex = shuffleOn && direction > 0 ? Math.floor(Math.random() * songs.length) : (index + direction + songs.length) % songs.length;
    setCurrent(songs[nextIndex]); setProgress(0); setIsPlaying(true);
  };
  const handleEnded = () => {
    if (repeatOn && audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => setIsPlaying(false)); } else skip(1);
  };
  const sendMessage = async () => {
    const content = draft.trim(); if (!content || !activePerson) return; setDraft('');
    try {
      const { data } = await axiosInstance.post('/messages', { receiverId: activePerson.clerkId, content });
      setMessages((items) => items.some((item) => item._id === data.data._id) ? items : [...items, data.data]);
    } catch { setDraft(content); setNotice('Message could not be sent. Please try again.'); }
  };
  const songCard = (song: Song, index: number) => <SongCard key={song._id} song={song} index={index} active={current._id === song._id} playing={isPlaying} liked={likedIds.has(song._id)} onPlay={() => playSong(song)} onLike={() => toggleLike(song._id)} />;

  return <div className="min-h-screen overflow-x-hidden bg-[#07070a] pb-36 text-white selection:bg-lime-300 selection:text-black md:pl-[244px] md:pb-28">
    <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_75%_0%,rgba(124,58,237,.14),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(190,242,100,.06),transparent_28%)]" />

    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[244px] flex-col border-r border-white/[.07] bg-[#09090c]/95 px-5 py-7 backdrop-blur-2xl md:flex">
      <a className="mb-10 flex items-center gap-3 px-2 text-[17px] font-bold tracking-[-.04em]" href="#top"><span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-black shadow-[0_0_35px_rgba(190,242,100,.25)]"><Radio className="size-4" /></span>soundwave<span className="text-lime-300">°</span></a>
      <span className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-zinc-600">Explore</span>
      <nav className="space-y-1 text-sm">
        {[['#top', Home, 'Home'], ['#discover', Search, 'Discover'], ['#library', Library, 'Your library']].map(([href, Icon, label], index) => <a key={label as string} href={href as string} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/[.05] hover:text-white', index === 0 ? 'bg-white/[.06] text-white' : 'text-zinc-500')}><Icon className="size-[17px]" />{label as string}</a>)}
      </nav>
      <div className="my-6 h-px bg-white/[.06]" />
      <button onClick={() => { setShowLiked(true); requestAnimationFrame(() => document.getElementById('liked')?.scrollIntoView()); }} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-white/[.05]', showLiked ? 'text-lime-300' : 'text-zinc-500')}><span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-lime-300 text-white"><Heart className="size-3.5" fill="currentColor" /></span>Liked songs<span className="ml-auto text-[10px] text-zinc-600">{likedIds.size}</span></button>
      <Link to="/admin" className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-white/[.05] hover:text-white"><span className="grid size-7 place-items-center rounded-lg border border-white/10 bg-white/[.04]"><ShieldCheck className="size-3.5" /></span>Admin studio</Link>
      <div className="mt-auto rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-lime-300"><Zap className="size-3" />Live catalog</div>
        <p className="text-2xl font-semibold tracking-[-.05em]">{songs.length}<span className="ml-1 text-xs font-normal text-zinc-600">tracks</span></p>
        <p className="mt-1 text-[10px] leading-4 text-zinc-600">Fresh signals from India’s hip-hop frequency.</p>
      </div>
    </aside>

    <main id="top" className="relative z-10 mx-auto max-w-[1500px] px-4 sm:px-7 lg:px-10">
      <header className="sticky top-0 z-30 grid h-[76px] grid-cols-[1fr_auto] items-center gap-4 border-b border-white/[.06] bg-[#07070a]/80 backdrop-blur-2xl lg:grid-cols-[auto_minmax(300px,500px)_1fr]">
        <div className="hidden gap-2 lg:flex"><button onClick={() => history.back()} className="grid size-9 place-items-center rounded-full border border-white/10 text-zinc-500 transition hover:bg-white/5 hover:text-white" aria-label="Go back"><ChevronLeft className="size-4" /></button><button onClick={() => history.forward()} className="grid size-9 place-items-center rounded-full border border-white/10 text-zinc-500 transition hover:bg-white/5 hover:text-white" aria-label="Go forward"><ChevronRight className="size-4" /></button></div>
        <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }}>
          <label className="flex h-11 items-center gap-3 rounded-full border border-white/[.08] bg-white/[.055] px-4 text-zinc-500 transition focus-within:border-violet-400/50 focus-within:bg-white/[.08] focus-within:ring-4 focus-within:ring-violet-500/10"><Search className="size-4" /><input className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" value={query} onFocus={() => setSearchOpen(true)} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} onKeyDown={(event) => { if (event.key === 'Enter' && filteredSongs[0]) { playSong(filteredSongs[0]); setSearchOpen(false); } if (event.key === 'Escape') { setQuery(''); setSearchOpen(false); } }} placeholder="Search the frequency" aria-label="Search songs and artists" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X className="size-3.5" /></button>}</label>
          {searchOpen && query && <div className="absolute left-0 right-0 top-[52px] max-h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-[#151419]/95 p-2 shadow-2xl backdrop-blur-2xl">
            {filteredSongs.length ? filteredSongs.slice(0, 8).map((song, index) => <button key={song._id} onClick={() => { playSong(song); setSearchOpen(false); }} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[.06]"><Cover song={song} index={index} className="size-11 rounded-lg" /><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{song.title}</strong><small className="mt-1 block truncate text-[10px] text-zinc-500">{song.artist}</small></span><Play className="size-3.5 text-lime-300" fill="currentColor" /></button>) : <div className="grid place-items-center gap-2 px-5 py-10 text-center text-xs text-zinc-500"><Search className="size-5" />No signal found for “{query}”</div>}
          </div>}
        </div>
        <div className="flex items-center justify-end gap-2"><button onClick={() => setChatOpen(true)} className="hidden h-9 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-semibold text-zinc-300 transition hover:bg-white/[.06] sm:flex"><Users className="size-3.5" />Listening room</button><Show when="signed-out"><SignInButton mode="modal"><button className="h-9 rounded-full bg-white px-5 text-xs font-bold text-black transition hover:bg-lime-300">Log in</button></SignInButton></Show><Show when="signed-in"><UserButton /></Show></div>
      </header>

      <section className="relative mt-5 min-h-[470px] overflow-hidden rounded-[32px] border border-white/[.08] bg-[#111014] p-7 shadow-[0_40px_100px_-50px_rgba(124,58,237,.6)] sm:p-10 lg:grid lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(168,85,247,.35),transparent_32%),radial-gradient(circle_at_45%_120%,rgba(190,242,100,.12),transparent_35%)]" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-lime-300"><Sparkles className="size-3.5" />Curated for this moment</div>
          <h1 className="max-w-xl text-[clamp(3.4rem,7vw,7.2rem)] font-semibold leading-[.82] tracking-[-.075em]">Turn up<br /><span className="font-serif font-normal italic text-violet-300">the feeling.</span></h1>
          <p className="mt-7 max-w-md text-sm leading-6 text-zinc-400">A living mix of sharp bars, late-night bass and electric nostalgia. Twenty-two tracks, one uninterrupted signal.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3"><button onClick={() => playSong(current)} className="flex h-12 items-center gap-2 rounded-full bg-lime-300 px-6 text-xs font-extrabold text-black shadow-[0_12px_40px_-12px_rgba(190,242,100,.8)] transition hover:scale-[1.03] hover:bg-lime-200">{isPlaying ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}{isPlaying ? 'Pause signal' : 'Play the mix'}</button><button onClick={() => toggleLike(current._id)} className={cn('grid size-12 place-items-center rounded-full border border-white/10 bg-black/20 transition hover:bg-white/10', likedIds.has(current._id) && 'border-lime-300/30 text-lime-300')} aria-label="Like current song"><Heart className="size-4" fill={likedIds.has(current._id) ? 'currentColor' : 'none'} /></button></div>
        </div>
        <div className="relative mt-12 h-[290px] lg:mt-0 lg:h-[360px]">
          <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/50 blur-[80px]" />
          <div className="absolute left-[10%] top-[8%] hidden w-[42%] -rotate-12 rounded-[28px] border border-white/10 bg-white/[.04] p-3 opacity-45 shadow-2xl backdrop-blur md:block"><Cover song={songs[1] || current} index={1} className="aspect-square rounded-[20px]" /></div>
          <div className="group absolute left-1/2 top-1/2 w-[min(250px,70%)] -translate-x-1/2 -translate-y-1/2 rotate-3 rounded-[30px] border border-white/15 bg-white/[.08] p-3 shadow-[0_40px_80px_-20px_rgba(0,0,0,.9)] backdrop-blur-xl transition duration-500 hover:rotate-0 hover:scale-105"><Cover song={current} index={songs.findIndex((song) => song._id === current._id)} className="aspect-square rounded-[22px]" /><div className="flex items-center gap-3 px-2 pb-1 pt-3"><span className="grid size-8 place-items-center rounded-full bg-lime-300 text-black"><Disc3 className={cn('size-4', isPlaying && 'animate-spin [animation-duration:3s]')} /></span><span className="min-w-0"><strong className="block truncate text-xs">{current.title}</strong><small className="mt-0.5 block truncate text-[9px] text-zinc-500">{current.artist}</small></span></div></div>
          <div className="absolute bottom-[8%] right-[3%] rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl"><span className="block text-[9px] uppercase tracking-[.18em] text-zinc-500">On air</span><strong className="mt-1 block text-sm text-lime-300">{isPlaying ? 'Live now' : 'Ready'}</strong></div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><span className="text-[9px] uppercase tracking-[.18em] text-zinc-600">Catalog</span><strong className="mt-1 block text-xl tracking-tight">{songs.length} tracks</strong></div><div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><span className="text-[9px] uppercase tracking-[.18em] text-zinc-600">Your collection</span><strong className="mt-1 block text-xl tracking-tight">{likedIds.size} liked</strong></div><button onClick={() => setChatOpen(true)} className="flex items-center justify-between rounded-2xl border border-violet-400/15 bg-violet-500/[.07] p-4 text-left transition hover:bg-violet-500/[.12]"><span><small className="block text-[9px] uppercase tracking-[.18em] text-violet-300">Listening room</small><strong className="mt-1 block text-sm">Share the signal</strong></span><ArrowRight className="size-4 text-violet-300" /></button></div>

      {notice && <div className="mt-5 flex items-center justify-between rounded-2xl border border-amber-300/15 bg-amber-300/[.06] px-4 py-3 text-xs text-amber-100"><span>{notice}</span><button onClick={() => setNotice('')}><X className="size-3.5" /></button></div>}

      {showLiked && <section id="liked" className="mt-16 scroll-mt-24 rounded-[28px] border border-lime-300/10 bg-lime-300/[.025] p-6 sm:p-8">
        <SectionTitle eyebrow="Your collection" title="Liked songs" action={<button onClick={() => setShowLiked(false)} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white">Close <X className="size-3.5" /></button>} />
        {likedSongs.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">{likedSongs.map(songCard)}</div> : <EmptyState icon={Heart} title="Nothing saved yet" copy="Tap any heart and your favorites will live here." />}
      </section>}

      <section id="discover" className="mt-20 scroll-mt-24">
        <SectionTitle eyebrow="Made for you" title={query ? `Results for “${query}”` : 'Fresh frequencies'} action={discoverySongs.length > 6 ? <button onClick={() => setShowAllSongs((value) => !value)} className="flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-white">{showAllSongs ? 'Show less' : 'Explore all'} <ArrowRight className="size-3.5" /></button> : undefined} />
        {discoverySongs.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">{discoverySongs.slice(0, showAllSongs || query ? discoverySongs.length : 6).map(songCard)}</div> : <EmptyState icon={Search} title="No signal found" copy="Try KR$NA, Raftaar, Ikka or Honey Singh." action={() => setQuery('')} />}
      </section>

      {trendingSongs.length > 0 && !query && <section className="mt-20">
        <SectionTitle eyebrow="Trending now" title="Moving through the city" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{trendingSongs.map((song, index) => <button key={song._id} onClick={() => playSong(song)} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-3 text-left transition hover:-translate-y-0.5 hover:bg-white/[.05]"><Cover song={song} index={index + 3} className="size-14 rounded-xl" /><span className="min-w-0 flex-1"><strong className="block truncate text-xs group-hover:text-lime-300">{song.title}</strong><small className="mt-1 block truncate text-[9px] text-zinc-600">{song.artist}</small></span><span className="grid size-8 place-items-center rounded-full bg-white/[.06] text-zinc-500 group-hover:bg-lime-300 group-hover:text-black"><Play className="size-3" fill="currentColor" /></span></button>)}</div>
      </section>}

      {albums.length > 0 && <section className="mt-20">
        <SectionTitle eyebrow="Releases" title="Album shelf" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">{albums.map((album) => <Link key={album._id} to={`/albums/${album._id}`} className="group"><div className="relative mb-3 aspect-square overflow-hidden rounded-[22px] border border-white/10 bg-white/[.03] shadow-xl transition duration-300 group-hover:-translate-y-1 group-hover:shadow-violet-950/50"><img className="h-full w-full object-cover transition duration-700 group-hover:scale-105" src={album.imageUrl} alt="" /><div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" /><span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-lime-300 text-black opacity-0 transition group-hover:opacity-100"><ArrowRight className="size-4" /></span></div><strong className="block truncate text-sm">{album.title}</strong><span className="mt-1 block truncate text-[10px] text-zinc-600">{album.artist} · {album.releaseYear}</span></Link>)}</div>
      </section>}

      {rapSongs.length > 0 && <section className="relative mt-20 overflow-hidden rounded-[30px] border border-white/[.07] bg-gradient-to-br from-violet-950/40 via-[#111014] to-[#111014] p-6 sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 size-72 rounded-full bg-violet-600/10 blur-3xl" />
        <SectionTitle eyebrow="Desi hip-hop" title="Bars on repeat" action={<span className="rounded-full border border-white/10 px-3 py-1 text-[9px] uppercase tracking-[.15em] text-zinc-500">Official previews</span>} />
        <div className="relative grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">{rapSongs.map((song, index) => songCard(song, index + 2))}</div>
      </section>}

      <section id="library" className="mb-12 mt-20 scroll-mt-24">
        <SectionTitle eyebrow="Your rotation" title="Up next" action={<button onClick={() => setShowFullQueue((value) => !value)} className="flex items-center gap-2 text-xs text-zinc-500 transition hover:text-white">{showFullQueue ? 'Short queue' : 'View full queue'} <ListMusic className="size-3.5" /></button>} />
        <div className="overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.02]">
          <div className="grid grid-cols-[38px_1fr_70px] items-center border-b border-white/[.06] px-4 py-3 text-[9px] font-bold uppercase tracking-[.16em] text-zinc-600 md:grid-cols-[38px_1.4fr_1fr_70px]"><span>#</span><span>Track</span><span className="hidden md:block">Type</span><Clock3 className="ml-auto size-3" /></div>
          {filteredSongs.slice(0, showFullQueue ? filteredSongs.length : 6).map((song, index) => <button key={song._id} onClick={() => playSong(song)} className="group grid w-full grid-cols-[38px_1fr_70px] items-center border-b border-white/[.045] px-4 py-2.5 text-left transition last:border-0 hover:bg-white/[.045] md:grid-cols-[38px_1.4fr_1fr_70px]"><span className={cn('text-xs text-zinc-600', current._id === song._id && 'text-lime-300')}>{current._id === song._id && isPlaying ? <span className="inline-flex h-3 items-end gap-0.5"><i className="h-2 w-0.5 animate-pulse bg-lime-300" /><i className="h-3 w-0.5 animate-pulse bg-lime-300 [animation-delay:150ms]" /><i className="h-1.5 w-0.5 animate-pulse bg-lime-300 [animation-delay:300ms]" /></span> : String(index + 1).padStart(2, '0')}</span><span className="flex min-w-0 items-center gap-3"><Cover song={song} index={index} className="size-11 rounded-lg" /><span className="min-w-0"><strong className={cn('block truncate text-xs', current._id === song._id ? 'text-lime-300' : 'text-zinc-200')}>{song.title}</strong><small className="mt-1 block truncate text-[10px] text-zinc-600">{song.artist}</small></span></span><span className="hidden text-[10px] text-zinc-600 md:block">{song.isPreview ? 'Official preview' : 'Full track'}</span><span className="ml-auto text-[10px] text-zinc-600">{formatTime(song.duration)}</span></button>)}
        </div>
      </section>
    </main>

    {chatOpen && <ChatPanel people={people} activePerson={activePerson} setActivePerson={setActivePerson} messages={messages} userId={userId} draft={draft} setDraft={setDraft} sendMessage={sendMessage} close={() => setChatOpen(false)} messageEndRef={messageEndRef} />}
    <button onClick={() => setChatOpen(true)} className="fixed bottom-[142px] right-4 z-30 grid size-12 place-items-center rounded-full bg-violet-500 shadow-[0_14px_40px_-10px_rgba(139,92,246,.9)] md:bottom-24 lg:hidden" aria-label="Open listening room"><MessageCircle className="size-4" /><span className="absolute right-0.5 top-0.5 size-2.5 rounded-full border-2 border-[#07070a] bg-lime-300" /></button>

    <footer className="fixed bottom-[62px] left-0 right-0 z-50 grid h-[74px] grid-cols-[1fr_auto] items-center border-t border-white/[.08] bg-[#0c0b0f]/90 px-3 shadow-2xl backdrop-blur-2xl md:bottom-0 md:left-[244px] md:h-[88px] md:grid-cols-[1fr_1.25fr_1fr] md:px-6">
      <div className="flex min-w-0 items-center gap-3"><Cover song={current} index={songs.findIndex((song) => song._id === current._id)} className="size-12 rounded-xl" /><span className="min-w-0"><strong className="block truncate text-xs">{current.title}</strong><small className="mt-1 block truncate text-[10px] text-zinc-500">{current.artist}</small></span><button className={cn('ml-1 hidden text-zinc-600 transition hover:text-white sm:block', likedIds.has(current._id) && 'text-lime-300')} onClick={() => toggleLike(current._id)} aria-label="Like current song"><Heart className="size-3.5" fill={likedIds.has(current._id) ? 'currentColor' : 'none'} /></button></div>
      <div className="flex flex-col items-center gap-2"><div className="flex items-center gap-4"><PlayerIcon active={shuffleOn} onClick={() => setShuffleOn((value) => !value)} label="Shuffle"><Shuffle /></PlayerIcon><PlayerIcon className="hidden md:grid" onClick={() => skip(-1)} label="Previous"><SkipBack fill="currentColor" /></PlayerIcon><button onClick={togglePlay} className="grid size-10 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-105 hover:bg-lime-300" aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4 translate-x-px" fill="currentColor" />}</button><PlayerIcon className="hidden md:grid" onClick={() => skip(1)} label="Next"><SkipForward fill="currentColor" /></PlayerIcon><PlayerIcon active={repeatOn} onClick={() => setRepeatOn((value) => !value)} label="Repeat"><Repeat2 /></PlayerIcon></div><div className="hidden w-full grid-cols-[32px_1fr_32px] items-center gap-2 text-[8px] text-zinc-600 md:grid"><span>{formatTime(progress)}</span><input className="sound-range" aria-label="Song progress" type="range" min="0" max={duration || current.duration || 1} value={progress} onChange={(event) => { const value = Number(event.target.value); setProgress(value); if (audioRef.current) audioRef.current.currentTime = value; }} /><span>{formatTime(duration || current.duration)}</span></div></div>
      <div className="hidden items-center justify-end gap-3 text-zinc-500 md:flex"><button onClick={() => document.getElementById('library')?.scrollIntoView()} aria-label="View queue"><ListMusic className="size-3.5" /></button><Volume2 className="size-3.5" /><input className="sound-range max-w-20" aria-label="Volume" type="range" min="0" max="1" step="0.05" defaultValue="0.75" onChange={(event) => { if (audioRef.current) audioRef.current.volume = Number(event.target.value); }} /><button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()} aria-label="Toggle full screen"><Maximize2 className="size-3.5" /></button></div>
      <audio ref={audioRef} onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onEnded={handleEnded} onError={() => { setIsPlaying(false); setNotice(`Could not play ${current.title}. Try another track.`); }} />
    </footer>

    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[62px] items-center justify-around border-t border-white/[.08] bg-[#0b0a0d]/95 backdrop-blur-2xl md:hidden">{[[Home, 'Home', '#top'], [Search, 'Discover', '#discover'], [Library, 'Library', '#library']].map(([Icon, label, href], index) => <a key={label as string} href={href as string} className={cn('flex flex-col items-center gap-1 text-[9px]', index === 0 ? 'text-lime-300' : 'text-zinc-600')}><Icon className="size-[18px]" />{label as string}</a>)}</nav>
  </div>;
};

function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex items-end justify-between gap-4"><div><span className="text-[9px] font-bold uppercase tracking-[.22em] text-violet-400">{eyebrow}</span><h2 className="mt-2 text-2xl font-semibold tracking-[-.045em] sm:text-3xl">{title}</h2></div>{action}</div>;
}

function EmptyState({ icon: Icon, title, copy, action }: { icon: typeof Heart; title: string; copy: string; action?: () => void }) {
  return <div className="grid min-h-48 place-content-center justify-items-center rounded-2xl border border-dashed border-white/10 text-center"><Icon className="mb-3 size-7 text-violet-400" /><strong className="text-sm">{title}</strong><span className="mt-2 text-xs text-zinc-600">{copy}</span>{action && <button onClick={action} className="mt-4 rounded-full bg-white px-4 py-2 text-[10px] font-bold text-black">Clear search</button>}</div>;
}

function PlayerIcon({ children, label, active, className, onClick }: { children: React.ReactNode; label: string; active?: boolean; className?: string; onClick: () => void }) {
  return <button onClick={onClick} className={cn('relative grid size-6 place-items-center text-zinc-600 transition hover:text-white [&_svg]:size-3.5', active && 'text-lime-300 after:absolute after:-bottom-1 after:size-1 after:rounded-full after:bg-lime-300', className)} aria-label={label} aria-pressed={active}>{children}</button>;
}

function ChatPanel({ people, activePerson, setActivePerson, messages, userId, draft, setDraft, sendMessage, close, messageEndRef }: {
  people: ChatUser[]; activePerson: ChatUser | null; setActivePerson: (person: ChatUser) => void; messages: Message[]; userId: string | null | undefined; draft: string; setDraft: (value: string) => void; sendMessage: () => void; close: () => void; messageEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return <><button className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm" onClick={close} aria-label="Close listening room" /><aside className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-[380px] animate-[slide-in_.25s_ease-out] flex-col border-l border-white/10 bg-[#100f13]/95 shadow-2xl backdrop-blur-2xl" role="dialog" aria-modal="true" aria-label="Listening room">
    <div className="flex h-20 items-center justify-between border-b border-white/[.07] px-5"><div className="flex items-center gap-3"><span className="relative grid size-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><MessageCircle className="size-4" /><i className="absolute right-0 top-0 size-2 rounded-full bg-lime-300" /></span><span><strong className="block text-sm">Listening room</strong><small className="mt-1 block text-[9px] text-zinc-600">{people.length ? `${people.length} friends online` : 'Music is better together'}</small></span></div><button onClick={close} className="grid size-9 place-items-center rounded-full text-zinc-500 transition hover:bg-white/5 hover:text-white" aria-label="Close chat"><X className="size-4" /></button></div>
    <Show when="signed-out"><div className="grid flex-1 place-content-center justify-items-center px-8 text-center"><MessageCircle className="mb-5 size-10 text-violet-400" /><h3 className="text-lg font-semibold">Share the moment</h3><p className="mb-6 mt-2 max-w-56 text-xs leading-5 text-zinc-500">Sign in to chat with friends while the music keeps moving.</p><SignInButton mode="modal"><button className="rounded-full bg-lime-300 px-5 py-2.5 text-xs font-bold text-black">Sign in to chat</button></SignInButton></div></Show>
    <Show when="signed-in">{people.length ? <><div className="flex gap-3 overflow-x-auto border-b border-white/[.06] p-4">{people.map((person) => <button onClick={() => setActivePerson(person)} key={person.clerkId} className={cn('grid shrink-0 justify-items-center gap-1.5 text-[9px] text-zinc-600', activePerson?.clerkId === person.clerkId && 'text-white')}><img className={cn('size-10 rounded-full object-cover ring-2 ring-transparent', activePerson?.clerkId === person.clerkId && 'ring-violet-400')} src={person.imageUrl} alt="" />{person.fullName.split(' ')[0]}</button>)}</div><div className="flex items-center gap-3 bg-white/[.025] px-5 py-3"><img className="size-9 rounded-full object-cover" src={activePerson?.imageUrl} alt="" /><span className="flex-1"><strong className="block text-xs">{activePerson?.fullName}</strong><small className="mt-1 block text-[9px] text-lime-300">Active now</small></span><MoreHorizontal className="size-4 text-zinc-600" /></div><div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">{messages.filter((message) => activePerson && [message.senderId, message.receiverId].includes(activePerson.clerkId)).map((message) => <div key={message._id} className={cn('max-w-[82%] self-start', message.senderId === userId && 'self-end text-right')}><span className={cn('block rounded-2xl rounded-tl-sm bg-white/[.07] px-3 py-2.5 text-left text-xs leading-5', message.senderId === userId && 'rounded-tl-2xl rounded-tr-sm bg-violet-600')}>{message.content}</span><small className="mx-1 mt-1 block text-[8px] text-zinc-700">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div>)}<div ref={messageEndRef} /></div><div className="m-4 flex items-center rounded-full border border-white/10 bg-white/[.06] p-1 pl-4 focus-within:border-violet-400/50"><input className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-600" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} placeholder={`Message ${activePerson?.fullName.split(' ')[0] || ''}`} /><button onClick={sendMessage} disabled={!draft.trim()} className="grid size-9 place-items-center rounded-full bg-violet-500 disabled:opacity-30" aria-label="Send message"><Send className="size-3.5" /></button></div></> : <div className="grid flex-1 place-content-center justify-items-center px-8 text-center"><Users className="mb-4 size-9 text-zinc-700" /><h3 className="text-sm font-semibold">Your room is quiet</h3><p className="mt-2 text-xs text-zinc-600">Friends will appear here when they join.</p></div>}</Show>
  </aside></>;
}
