import { Show, SignInButton, UserButton, useAuth, useUser } from '@clerk/react';
import {
  ChevronLeft, ChevronRight, Clock3, Disc3, Heart, Home, Library,
  ListMusic, Maximize2, MessageCircle, MoreHorizontal, Pause, Play,
  Repeat2, Search, Send, Shuffle, SkipBack, SkipForward, Users, Volume2, X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { axiosInstance } from '../lib/axios';

type Song = { _id: string; title: string; artist: string; imageUrl?: string; audioUrl?: string; duration?: number; isPreview?: boolean; sourceUrl?: string };
type ChatUser = { _id: string; clerkId: string; fullName: string; imageUrl: string };
type Message = { _id: string; senderId: string; receiverId: string; content: string; createdAt: string };

const demoSongs: Song[] = [
  { _id: 'demo-1', title: 'Afterglow', artist: 'Luna Park', duration: 214 },
  { _id: 'demo-2', title: 'Midnight Drive', artist: 'Neon Hours', duration: 187 },
  { _id: 'demo-3', title: 'Velvet Sky', artist: 'Mira Lane', duration: 243 },
  { _id: 'demo-4', title: 'Slow Motion', artist: 'The Coastline', duration: 201 },
  { _id: 'demo-5', title: 'Daydream', artist: 'June & Atlas', duration: 196 },
  { _id: 'demo-6', title: 'Soft Focus', artist: 'Paper Planes', duration: 229 },
];

const coverClasses = ['cover-violet', 'cover-sunset', 'cover-ocean', 'cover-rose', 'cover-lime', 'cover-amber'];
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds)) return '0:00';
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
};

const loadLikedIds = () => {
  try {
    const value = JSON.parse(localStorage.getItem('soundwave-liked') || '[]');
    return new Set<string>(Array.isArray(value) ? value : []);
  } catch {
    return new Set<string>();
  }
};

function Cover({ song, index, large = false }: { song: Song; index: number; large?: boolean }) {
  return <div className={`cover ${coverClasses[Math.abs(index) % coverClasses.length]} ${large ? 'cover-large' : ''}`}>
    {song.imageUrl ? <img src={song.imageUrl} alt="" /> : <><Disc3 /><span>{song.title.slice(0, 2).toUpperCase()}</span></>}
  </div>;
}

function SongCard({ song, index, active, playing, liked, onPlay, onLike }: {
  song: Song; index: number; active: boolean; playing: boolean; liked: boolean;
  onPlay: () => void; onLike: () => void;
}) {
  return <article className="album-card">
    <button className="album-card-main" onClick={onPlay} aria-label={`${active && playing ? 'Pause' : 'Play'} ${song.title}`}>
      <div className="cover-wrap"><Cover song={song} index={index} large /><span className="card-play">{active && playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</span></div>
      <strong>{song.title}</strong><span>{song.isPreview ? `Official preview · ${song.artist}` : song.artist}</span>
    </button>
    <button className={`card-like ${liked ? 'is-liked' : ''}`} onClick={onLike} aria-label={`${liked ? 'Remove' : 'Add'} ${song.title} ${liked ? 'from' : 'to'} liked songs`} aria-pressed={liked}><Heart fill={liked ? 'currentColor' : 'none'} /></button>
  </article>;
}

export const HomePage = () => {
  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const [songs, setSongs] = useState<Song[]>(demoSongs);
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
  const [apiNotice, setApiNotice] = useState('');
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
    axiosInstance.get('/songs').then(({ data }) => {
      if (data.data?.length) {
        setSongs(data.data);
        setCurrent(data.data[0]);
      }
    }).catch(() => setApiNotice('Showing your offline mix — connect the server for your library.'));
  }, []);

  useEffect(() => {
    if (!user) return;
    axiosInstance.post('/auth/callback', {
      id: user.id, firstName: user.firstName || 'Music', lastName: user.lastName || 'Listener', imageUrl: user.imageUrl,
    }).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    getToken().then((token) => {
      if (!token) return;
      axiosInstance.get('/users').then(({ data }) => {
        setPeople(data.data || []);
        setActivePerson((person) => person || data.data?.[0] || null);
      }).catch(() => undefined);
      const socket = io(apiUrl.replace('/api/v1', ''), { auth: { token } });
      socket.on('message:new', (message: Message) => {
        if ([message.senderId, message.receiverId].includes(userId)) {
          setMessages((items) => items.some((item) => item._id === message._id) ? items : [...items, message]);
        }
      });
      socketRef.current = socket;
    });
    return () => { socketRef.current?.disconnect(); socketRef.current = null; };
  }, [getToken, userId]);

  useEffect(() => {
    if (!activePerson) return;
    axiosInstance.get(`/messages/${activePerson.clerkId}`)
      .then(({ data }) => setMessages(data.data || []))
      .catch(() => setMessages([]));
  }, [activePerson]);

  useEffect(() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  useEffect(() => {
    const closeChat = (event: KeyboardEvent) => event.key === 'Escape' && setChatOpen(false);
    document.addEventListener('keydown', closeChat);
    return () => document.removeEventListener('keydown', closeChat);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current.audioUrl) return;
    if (audio.src !== current.audioUrl) audio.src = current.audioUrl;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [current, isPlaying]);

  const filteredSongs = useMemo(() => songs.filter((song) =>
    `${song.title} ${song.artist}`.toLowerCase().includes(query.trim().toLowerCase())), [songs, query]);
  const rapSongs = useMemo(() => songs.filter((song) => /kr\$na|raftaar/i.test(song.artist)), [songs]);
  const likedSongs = useMemo(() => songs.filter((song) => likedIds.has(song._id)), [songs, likedIds]);

  const toggleLike = (songId: string) => {
    setLikedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(songId)) nextIds.delete(songId);
      else nextIds.add(songId);
      localStorage.setItem('soundwave-liked', JSON.stringify([...nextIds]));
      return nextIds;
    });
  };

  const playSong = (song: Song) => {
    if (!song.audioUrl) {
      setApiNotice(`${song.title} is unavailable while the server is offline.`);
      return;
    }
    if (current._id === song._id) setIsPlaying((playing) => !playing);
    else { setCurrent(song); setProgress(0); setIsPlaying(true); }
  };

  const togglePlay = () => {
    if (!current.audioUrl) {
      setApiNotice('Connect the server to play this offline placeholder.');
      return;
    }
    const next = !isPlaying;
    setIsPlaying(next);
    if (next) audioRef.current?.play().catch(() => setIsPlaying(false));
    else audioRef.current?.pause();
  };

  const skip = (direction: number) => {
    if (!songs.length) return;
    const index = songs.findIndex((song) => song._id === current._id);
    const nextIndex = shuffleOn && direction > 0
      ? Math.floor(Math.random() * songs.length)
      : (index + direction + songs.length) % songs.length;
    setCurrent(songs[nextIndex]); setProgress(0); setIsPlaying(true);
  };

  const handleEnded = () => {
    if (repeatOn && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else skip(1);
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !activePerson) return;
    setDraft('');
    try {
      const { data } = await axiosInstance.post('/messages', { receiverId: activePerson.clerkId, content });
      setMessages((items) => items.some((item) => item._id === data.data._id) ? items : [...items, data.data]);
    } catch {
      setDraft(content);
      setApiNotice('Message could not be sent. Please try again.');
    }
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#top" aria-label="Soundwave home"><span className="brand-mark"><Disc3 /></span><span>soundwave</span></a>
      <nav className="main-nav" aria-label="Main navigation">
        <a className="active" href="#top"><Home />Home</a>
        <a href="#discover"><Search />Discover</a>
        <a href="#library"><Library />Your Library</a>
      </nav>
      <div className="nav-divider" />
      <nav className="main-nav compact">
        <button className={showLiked ? 'active' : ''} onClick={() => {
          setShowLiked(true);
          requestAnimationFrame(() => document.getElementById('liked')?.scrollIntoView());
        }}><span className="square-icon liked"><Heart /></span>Liked songs <small>{likedIds.size}</small></button>
      </nav>
    </aside>

    <main className="content" id="top">
      <header className="topbar">
        <div className="history-buttons"><button onClick={() => history.back()} aria-label="Go back"><ChevronLeft /></button><button onClick={() => history.forward()} aria-label="Go forward"><ChevronRight /></button></div>
        <div className="search-wrap" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }}>
          <label className="search-box"><Search /><input value={query} onFocus={() => setSearchOpen(true)} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} onKeyDown={(event) => {
            if (event.key === 'Enter' && filteredSongs[0]) { playSong(filteredSongs[0]); setSearchOpen(false); }
            if (event.key === 'Escape') { setQuery(''); setSearchOpen(false); }
          }} placeholder="Search songs and artists" aria-label="Search songs and artists" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X /></button>}</label>
          {searchOpen && query && <div className="search-results" role="listbox" aria-label="Search results">
            {filteredSongs.length ? filteredSongs.slice(0, 8).map((song, index) => <button key={song._id} onClick={() => { playSong(song); setSearchOpen(false); }}><Cover song={song} index={index} /><span><strong>{song.title}</strong><small>{song.artist}</small></span><Play fill="currentColor" /></button>) : <div className="search-empty"><Search /><span>No songs found for “{query}”</span></div>}
          </div>}
        </div>
        <div className="account-actions"><button className="friends-button" onClick={() => setChatOpen(true)}><Users />Friends</button>
          <Show when="signed-out"><SignInButton mode="modal"><button className="login-button">Log in</button></SignInButton></Show>
          <Show when="signed-in"><UserButton /></Show>
        </div>
      </header>

      <section className="hero-panel">
        <div><span className="eyebrow">Your daily soundtrack</span><h1>Feel every<br /><em>frequency.</em></h1><p>A handpicked flow of songs for slow mornings, loud afternoons, and everything after dark.</p>
          <div className="hero-actions"><button className="primary-action" onClick={() => playSong(current)}>{isPlaying ? <Pause /> : <Play fill="currentColor" />}{isPlaying ? 'Pause' : 'Play your mix'}</button><button className={`round-action ${likedIds.has(current._id) ? 'is-liked' : ''}`} onClick={() => toggleLike(current._id)} aria-label={`${likedIds.has(current._id) ? 'Remove from' : 'Add to'} liked songs`} aria-pressed={likedIds.has(current._id)}><Heart fill={likedIds.has(current._id) ? 'currentColor' : 'none'} /></button></div>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="orb orb-one" /><div className="orb orb-two" /><div className="orb orb-three" /><div className="hero-disc"><Disc3 /></div><span className="soundwave-lines" /></div>
      </section>

      {apiNotice && <div className="notice">{apiNotice}<button onClick={() => setApiNotice('')} aria-label="Dismiss"><X /></button></div>}

      {showLiked && <section className="section liked-section" id="liked">
        <div className="section-heading"><div><span className="eyebrow">Your collection</span><h2>Liked songs</h2></div><button onClick={() => setShowLiked(false)}>Close <X /></button></div>
        {likedSongs.length ? <div className="album-grid">{likedSongs.map((song, index) => <SongCard key={song._id} song={song} index={index} active={current._id === song._id} playing={isPlaying} liked onPlay={() => playSong(song)} onLike={() => toggleLike(song._id)} />)}</div> : <div className="empty-library"><Heart /><strong>No liked songs yet</strong><span>Use a heart button on any song to save it here.</span></div>}
      </section>}

      <section className="section" id="discover">
        <div className="section-heading"><div><span className="eyebrow">Made for you</span><h2>{query ? `Results for “${query}”` : 'Fresh frequencies'}</h2></div>{filteredSongs.length > 6 && <button onClick={() => setShowAllSongs((value) => !value)}>{showAllSongs ? 'Show less' : 'Show all'} <ChevronRight /></button>}</div>
        {filteredSongs.length ? <div className="album-grid">{filteredSongs.slice(0, showAllSongs || query ? filteredSongs.length : 6).map((song, index) => <SongCard key={song._id} song={song} index={index} active={current._id === song._id} playing={isPlaying} liked={likedIds.has(song._id)} onPlay={() => playSong(song)} onLike={() => toggleLike(song._id)} />)}</div> : <div className="empty-library"><Search /><strong>No matching songs</strong><span>Try a song title or artist such as KR$NA or Raftaar.</span><button onClick={() => setQuery('')}>Clear search</button></div>}
      </section>

      {rapSongs.length > 0 && <section className="section rap-section">
        <div className="section-heading"><div><span className="eyebrow">Desi hip-hop</span><h2>Bars on repeat</h2></div><span className="preview-note">Official 30-second previews</span></div>
        <div className="album-grid">{rapSongs.map((song, index) => <SongCard key={song._id} song={song} index={index + 2} active={current._id === song._id} playing={isPlaying} liked={likedIds.has(song._id)} onPlay={() => playSong(song)} onLike={() => toggleLike(song._id)} />)}</div>
      </section>}

      <section className="section chart-section" id="library">
        <div className="section-heading"><div><span className="eyebrow">Right now</span><h2>Your rotation</h2></div><button onClick={() => setShowFullQueue((value) => !value)}>{showFullQueue ? 'Short queue' : 'View queue'} <ListMusic /></button></div>
        <div className="track-list">
          <div className="track-row track-head"><span>#</span><span>Title</span><span>Album</span><span><Clock3 /></span></div>
          {filteredSongs.slice(0, showFullQueue ? filteredSongs.length : 5).map((song, index) => <button className={`track-row ${current._id === song._id ? 'current' : ''}`} key={song._id} onClick={() => playSong(song)}>
            <span className="track-number">{current._id === song._id && isPlaying ? <span className="equalizer"><i /><i /><i /></span> : index + 1}</span>
            <span className="track-title"><Cover song={song} index={index} /><span><strong>{song.title}</strong><small>{song.artist}</small></span></span>
            <span className="track-album">{song.isPreview ? 'Official preview' : `Daily Mix ${index + 1}`}</span><span>{formatTime(song.duration)}</span>
          </button>)}
        </div>
      </section>
    </main>

    {chatOpen && <><button className="chat-backdrop" onClick={() => setChatOpen(false)} aria-label="Close chat" /><aside className="chat-panel open" role="dialog" aria-modal="true" aria-label="Listening room">
      <div className="chat-header"><div><span className="status-dot" /><div><strong>Listening room</strong><small>{people.length ? `${people.length} friends online` : 'Music is better together'}</small></div></div><button onClick={() => setChatOpen(false)} aria-label="Close chat"><X /></button></div>
      <Show when="signed-out"><div className="chat-empty"><MessageCircle /><h3>Share the moment</h3><p>Sign in to chat with friends while you listen.</p><SignInButton mode="modal"><button className="primary-action">Sign in to chat</button></SignInButton></div></Show>
      <Show when="signed-in">{people.length > 0 ? <>
        <div className="people-strip">{people.map((person) => <button className={activePerson?.clerkId === person.clerkId ? 'active' : ''} onClick={() => setActivePerson(person)} key={person.clerkId}><img src={person.imageUrl} alt="" /><span>{person.fullName.split(' ')[0]}</span></button>)}</div>
        <div className="conversation-label"><img src={activePerson?.imageUrl} alt="" /><span><strong>{activePerson?.fullName}</strong><small>Active now</small></span><button aria-label="Conversation options"><MoreHorizontal /></button></div>
        <div className="messages">{messages.filter((message) => activePerson && [message.senderId, message.receiverId].includes(activePerson.clerkId)).map((message) => <div className={`message ${message.senderId === userId ? 'mine' : ''}`} key={message._id}><span>{message.content}</span><small>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div>)}<div ref={messageEndRef} /></div>
        <div className="message-input"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} placeholder={`Message ${activePerson?.fullName.split(' ')[0] || ''}`} /><button onClick={sendMessage} disabled={!draft.trim()} aria-label="Send message"><Send /></button></div>
      </> : <div className="chat-empty"><MessageCircle /><h3>Your room is quiet</h3><p>When other listeners join, they’ll appear here.</p></div>}</Show>
    </aside></>}

    <button className="mobile-chat" onClick={() => setChatOpen(true)} aria-label="Open chat"><MessageCircle /><span className="status-dot" /></button>

    <footer className="player">
      <div className="now-playing"><Cover song={current} index={songs.findIndex((song) => song._id === current._id)} /><span><strong>{current.title}</strong><small>{current.artist}</small></span><button className={likedIds.has(current._id) ? 'is-liked' : ''} onClick={() => toggleLike(current._id)} aria-label={`${likedIds.has(current._id) ? 'Remove from' : 'Add to'} liked songs`} aria-pressed={likedIds.has(current._id)}><Heart fill={likedIds.has(current._id) ? 'currentColor' : 'none'} /></button></div>
      <div className="player-center"><div className="transport"><button className={shuffleOn ? 'is-active' : ''} onClick={() => setShuffleOn((value) => !value)} aria-label="Shuffle" aria-pressed={shuffleOn}><Shuffle /></button><button onClick={() => skip(-1)} aria-label="Previous"><SkipBack fill="currentColor" /></button><button className="play-button" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button><button onClick={() => skip(1)} aria-label="Next"><SkipForward fill="currentColor" /></button><button className={repeatOn ? 'is-active' : ''} onClick={() => setRepeatOn((value) => !value)} aria-label="Repeat current song" aria-pressed={repeatOn}><Repeat2 /></button></div>
        <div className="progress-row"><span>{formatTime(progress)}</span><input aria-label="Song progress" type="range" min="0" max={duration || current.duration || 1} value={progress} onChange={(event) => { const value = Number(event.target.value); setProgress(value); if (audioRef.current) audioRef.current.currentTime = value; }} /><span>{formatTime(duration || current.duration)}</span></div>
      </div>
      <div className="player-tools"><button onClick={() => document.getElementById('library')?.scrollIntoView()} aria-label="View queue"><ListMusic /></button><Volume2 /><input aria-label="Volume" type="range" min="0" max="1" step="0.05" defaultValue="0.75" onChange={(event) => { if (audioRef.current) audioRef.current.volume = Number(event.target.value); }} /><button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()} aria-label="Toggle full screen"><Maximize2 /></button></div>
      <audio ref={audioRef} onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onEnded={handleEnded} onError={() => { setIsPlaying(false); setApiNotice(`Could not play ${current.title}. Try another song.`); }} />
    </footer>
  </div>;
};
