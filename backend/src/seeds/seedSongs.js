import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../db/connect.js';
import { Song } from '../models/song.model.js';

dotenv.config();

const songs = [
  {
    title: 'Neon Horizons',
    artist: 'SoundHelix',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
    duration: 372,
  },
  {
    title: 'Electric Bloom',
    artist: 'SoundHelix',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop',
    duration: 425,
  },
  {
    title: 'Midnight Frequency',
    artist: 'SoundHelix',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop',
    duration: 343,
  },
  {
    title: 'Violet Avenue',
    artist: 'SoundHelix',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&auto=format&fit=crop',
    duration: 312,
  },
  {
    title: 'Golden Echoes',
    artist: 'SoundHelix',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1521337581100-8ca9a73a5f79?w=800&auto=format&fit=crop',
    duration: 356,
  },
  {
    title: 'After Hours',
    artist: 'SoundHelix',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop',
    duration: 398,
  },
  {
    title: 'I Guess', artist: 'KR$NA', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c7/5c/68/c75c68ce-1eea-c2c9-ed81-505afe695ea0/mzaf_690900378708172363.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d2/5e/7e/d25e7e4c-f25d-3770-54ae-d89821b7b26c/3617052451949.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/i-guess/6776936952?i=6776936956',
  },
  {
    title: 'Joota Japani', artist: 'KR$NA', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/6d/69/99/6d699923-1067-2c29-9e5e-6e0979276a86/mzaf_15649771530962531936.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/53/6e/3d/536e3d41-fe71-9b51-d242-239d3050d66a/197190909999.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/joota-japani/1726345624?i=1726345634',
  },
  {
    title: 'Freeverse Feast', artist: 'KR$NA', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/3e/cd/8e/3ecd8ee9-1613-f74c-f61f-50320d15d432/mzaf_18273429831919976559.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/4c/ef/c2/4cefc23c-ccb1-6b03-83fc-1fd482d923eb/cover.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/freeverse-feast/1549668911?i=1549668913',
  },
  {
    title: 'Say My Name', artist: 'KR$NA', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/31/a9/b6/31a9b6aa-cf55-8171-d829-cb326b9b55fb/mzaf_15100525427384702263.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/8c/7e/0d/8c7e0d4b-404b-b012-33de-e112b5ef329b/cover.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/say-my-name/1548512566?i=1548512856',
  },
  {
    title: 'Ghana Kasoota', artist: 'Raftaar & Rashmeet Kaur', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ae/bd/ee/aebdeed4-d679-c9e6-98e6-94bb20da62aa/mzaf_6038690431578587291.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/e5/2d/5e/e52d5e9e-a1c5-fdaf-8102-58ad44d2f735/886449712588.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/ghana-kasoota-feat-surbhi-jyoti/1592956481?i=1592956489',
  },
  {
    title: 'All Black', artist: 'Raftaar & Sukh-E', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/df/e6/11/dfe61193-9990-735c-9789-89df7eb0bcac/mzaf_3187809107151877736.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music71/v4/f6/73/ae/f673ae3f-cac0-0acd-05e3-8bab693f5a36/8903431609014_cover.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/all-black/1159600836?i=1159600837',
  },
  {
    title: 'Sheikh Chilli', artist: 'Raftaar', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/45/08/04/450804b3-8259-4831-0d3f-efef7276da1d/mzaf_14520732809974718147.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/5c/32/9d/5c329d14-5df6-5a3f-2855-ef67e57028d6/cover.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/sheikh-chilli/1549668864?i=1549668872',
  },
  {
    title: 'Swag Mera Desi', artist: 'Raftaar & Manj Musik', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/de/3b/ec/de3bec36-aff4-9c29-05ec-8e12f4cab13b/mzaf_15522660492119638810.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/2f/cf/90/2fcf9081-f431-4fa4-7711-4e6d98b9123e/dj.lyppxrfg.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/swag-mera-desi/951006348?i=951006393',
  },
];

const seedSongs = async () => {
  try {
    await connectDB();
    const operations = songs.map((song) => ({
      updateOne: {
        filter: { audioUrl: song.audioUrl },
        update: { $set: song },
        upsert: true,
      },
    }));
    const result = await Song.bulkWrite(operations);
    console.log(`Song catalog ready: ${result.upsertedCount} added, ${result.modifiedCount} updated.`);
  } catch (error) {
    console.error('Unable to seed songs:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedSongs();
