import { Show, SignInButton, UserButton, useAuth, useUser } from '@clerk/react';
import {
  Bell, ChevronLeft, ChevronRight, Clock3, Disc3, Heart, Home, Library,
  ListMusic, Maximize2, MessageCircle, Mic2, MoreHorizontal, Pause, Play,
  Plus, Repeat2, Search, Send, Shuffle, SkipBack, SkipForward, Users, Volume2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { axiosInstance } from '../lib/axios';

type Song = { _id: string; title: string; artist: string; imageUrl?: string; audioUrl?: string; duration?: number };
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

function Cover({ song, index, large = false }: { song: Song; index: number; large?: boolean }) {
  return (
    <div className={`cover ${coverClasses[index % coverClasses.length]} ${large ? 'cover-large' : ''}`}>
      {song.imageUrl ? <img src={song.imageUrl} alt="" /> : <><Disc3 /><span>{song.title.slice(0, 2).toUpperCase()}</span></>}
    </div>
  );
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
      id: user.id,
      firstName: user.firstName || 'Music',
      lastName: user.lastName || 'Listener',
      imageUrl: user.imageUrl,
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
    const audio = audioRef.current;
    if (!audio || !current.audioUrl) return;
    audio.src = current.audioUrl;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
  }, [current, isPlaying]);

  const filteredSongs = useMemo(() => songs.filter((song) =>
    `${song.title} ${song.artist}`.toLowerCase().includes(query.toLowerCase())), [songs, query]);

  const playSong = (song: Song) => {
    if (current._id === song._id) setIsPlaying((playing) => !playing);
    else { setCurrent(song); setProgress(0); setIsPlaying(true); }
  };

  const togglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    if (current.audioUrl) {
      if (next) audioRef.current?.play().catch(() => setIsPlaying(false));
      else audioRef.current?.pause();
    }
  };

  const skip = (direction: number) => {
    const index = songs.findIndex((song) => song._id === current._id);
    const nextIndex = (index + direction + songs.length) % songs.length;
    setCurrent(songs[nextIndex]); setProgress(0); setIsPlaying(true);
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !activePerson) return;
    setDraft('');
    try {
      const { data } = await axiosInstance.post('/messages', { receiverId: activePerson.clerkId, content });
      setMessages((items) => items.some((item) => item._id === data.data._id) ? items : [...items, data.data]);
    } catch { setDraft(content); }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Soundwave home"><span className="brand-mark"><Disc3 /></span><span>soundwave</span></a>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="active" href="#top"><Home />Home</a>
          <a href="#discover"><Search />Discover</a>
          <a href="#library"><Library />Your Library</a>
        </nav>
        <div className="nav-divider" />
        <nav className="main-nav compact">
          <a href="#create"><span className="square-icon"><Plus /></span>Create playlist</a>
          <a href="#liked"><span className="square-icon liked"><Heart /></span>Liked songs</a>
        </nav>
        <div className="playlists">
          <span>Playlists</span><button aria-label="Add playlist"><Plus /></button>
          <a href="#focus">Deep Focus</a><a href="#night">Night Drives</a><a href="#discoveries">Weekly Discoveries</a>
        </div>
        <button className="install-pill"><span>↓</span> Install app</button>
      </aside>

      <main className="content" id="top">
        <header className="topbar">
          <div className="history-buttons"><button aria-label="Go back"><ChevronLeft /></button><button aria-label="Go forward"><ChevronRight /></button></div>
          <label className="search-box"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What do you want to listen to?" /></label>
          <div className="account-actions"><button className="icon-button" aria-label="Notifications"><Bell /></button><button className="friends-button" onClick={() => setChatOpen(true)}><Users />Friends</button>
            <Show when="signed-out"><SignInButton mode="modal"><button className="login-button">Log in</button></SignInButton></Show>
            <Show when="signed-in"><UserButton /></Show>
          </div>
        </header>

        <section className="hero-panel">
          <div><span className="eyebrow">Your daily soundtrack</span><h1>Feel every<br /><em>frequency.</em></h1><p>A handpicked flow of songs for slow mornings, loud afternoons, and everything after dark.</p>
            <div className="hero-actions"><button className="primary-action" onClick={() => playSong(songs[0])}>{isPlaying ? <Pause /> : <Play fill="currentColor" />}Play your mix</button><button className="round-action" aria-label="Save mix"><Heart /></button><button className="round-action" aria-label="More options"><MoreHorizontal /></button></div>
          </div>
          <div className="hero-art" aria-hidden="true"><div className="orb orb-one" /><div className="orb orb-two" /><div className="orb orb-three" /><div className="hero-disc"><Disc3 /></div><span className="soundwave-lines" /></div>
        </section>

        {apiNotice && <div className="notice">{apiNotice}<button onClick={() => setApiNotice('')} aria-label="Dismiss"><X /></button></div>}

        <section className="section" id="discover">
          <div className="section-heading"><div><span className="eyebrow">Made for you</span><h2>{query ? `Results for “${query}”` : 'Fresh frequencies'}</h2></div><button>Show all <ChevronRight /></button></div>
          <div className="album-grid">
            {filteredSongs.slice(0, 6).map((song, index) => <button className="album-card" key={song._id} onClick={() => playSong(song)}>
              <div className="cover-wrap"><Cover song={song} index={index} large /><span className="card-play">{current._id === song._id && isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</span></div>
              <strong>{song.title}</strong><span>{song.artist}</span>
            </button>)}
          </div>
        </section>

        <section className="section chart-section" id="library">
          <div className="section-heading"><div><span className="eyebrow">Right now</span><h2>Your rotation</h2></div><button>View queue <ListMusic /></button></div>
          <div className="track-list">
            <div className="track-row track-head"><span>#</span><span>Title</span><span>Album</span><span><Clock3 /></span></div>
            {filteredSongs.slice(0, 5).map((song, index) => <button className={`track-row ${current._id === song._id ? 'current' : ''}`} key={song._id} onClick={() => playSong(song)}>
              <span className="track-number">{current._id === song._id && isPlaying ? <span className="equalizer"><i /><i /><i /></span> : index + 1}</span>
              <span className="track-title"><Cover song={song} index={index} /><span><strong>{song.title}</strong><small>{song.artist}</small></span></span>
              <span className="track-album">Daily Mix {index + 1}</span><span>{formatTime(song.duration)}</span>
            </button>)}
          </div>
        </section>
      </main>

      <aside className={`chat-panel ${chatOpen ? 'open' : ''}`}>
        <div className="chat-header"><div><span className="status-dot" /><div><strong>Listening room</strong><small>{people.length ? `${people.length} friends online` : 'Music is better together'}</small></div></div><button onClick={() => setChatOpen(false)} aria-label="Close chat"><X /></button></div>
        <Show when="signed-out"><div className="chat-empty"><MessageCircle /><h3>Share the moment</h3><p>Sign in to chat with friends while you listen.</p><SignInButton mode="modal"><button className="primary-action">Sign in to chat</button></SignInButton></div></Show>
        <Show when="signed-in">
          {people.length > 0 ? <>
            <div className="people-strip">{people.map((person) => <button className={activePerson?.clerkId === person.clerkId ? 'active' : ''} onClick={() => setActivePerson(person)} key={person.clerkId}><img src={person.imageUrl} alt="" /><span>{person.fullName.split(' ')[0]}</span></button>)}</div>
            <div className="conversation-label"><img src={activePerson?.imageUrl} alt="" /><span><strong>{activePerson?.fullName}</strong><small>Active now</small></span><button aria-label="Conversation options"><MoreHorizontal /></button></div>
            <div className="messages">{messages.filter((message) => activePerson && [message.senderId, message.receiverId].includes(activePerson.clerkId)).map((message) => <div className={`message ${message.senderId === userId ? 'mine' : ''}`} key={message._id}><span>{message.content}</span><small>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div>)}<div ref={messageEndRef} /></div>
            <div className="message-input"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} placeholder={`Message ${activePerson?.fullName.split(' ')[0] || ''}`} /><button onClick={sendMessage} disabled={!draft.trim()} aria-label="Send message"><Send /></button></div>
          </> : <div className="chat-empty"><MessageCircle /><h3>Your room is quiet</h3><p>When other listeners join, they’ll appear here.</p></div>}
        </Show>
      </aside>

      <button className="mobile-chat" onClick={() => setChatOpen(true)} aria-label="Open chat"><MessageCircle /><span className="status-dot" /></button>

      <footer className="player">
        <div className="now-playing"><Cover song={current} index={songs.findIndex((song) => song._id === current._id)} /><span><strong>{current.title}</strong><small>{current.artist}</small></span><button aria-label="Like song"><Heart /></button></div>
        <div className="player-center"><div className="transport"><button aria-label="Shuffle"><Shuffle /></button><button onClick={() => skip(-1)} aria-label="Previous"><SkipBack fill="currentColor" /></button><button className="play-button" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button><button onClick={() => skip(1)} aria-label="Next"><SkipForward fill="currentColor" /></button><button aria-label="Repeat"><Repeat2 /></button></div>
          <div className="progress-row"><span>{formatTime(progress)}</span><input type="range" min="0" max={duration || current.duration || 1} value={progress} onChange={(event) => { const value = Number(event.target.value); setProgress(value); if (audioRef.current) audioRef.current.currentTime = value; }} /><span>{formatTime(duration || current.duration)}</span></div>
        </div>
        <div className="player-tools"><button aria-label="Lyrics"><Mic2 /></button><button aria-label="Queue"><ListMusic /></button><Volume2 /><input type="range" min="0" max="1" step="0.05" defaultValue="0.75" onChange={(event) => { if (audioRef.current) audioRef.current.volume = Number(event.target.value); }} /><button aria-label="Full screen"><Maximize2 /></button></div>
        <audio ref={audioRef} onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onEnded={() => skip(1)} />
      </footer>
    </div>
  );
};
