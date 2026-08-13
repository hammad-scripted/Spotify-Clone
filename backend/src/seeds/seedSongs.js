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
  {
    title: 'WOH', artist: 'Ikka, Dino James & Badshah', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d0/e9/f7/d0e9f7b2-407b-825f-8926-eb378bf33042/mzaf_12889415901515769533.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/7b/e0/62/7be0628c-5d7c-6e62-5408-34c1cdbf6421/22UM1IM37700.rgb.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/woh/1656665346?i=1656665787',
  },
  {
    title: 'Bajre Da Sitta', artist: 'Rashmeet Kaur, Deep Kalsi & Ikka', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/98/7b/5e/987b5ec9-e561-e39a-27e5-986932fcd199/mzaf_2822095399414442850.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/24/90/c2/2490c276-8e45-e619-f175-3059dc70e580/886448967415.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/bajre-da-sitta/1545366953?i=1545366955',
  },
  {
    title: 'Oh Ho Ho Ho (Remix)', artist: 'Sukhbir, Ikka & Abhijit Vaghani', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/77/9d/b5/779db5f8-a22f-8605-cf3d-b4cde2386a43/mzaf_14099919617788239545.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/bd/25/9a/bd259a04-aee2-9b60-0631-a7de4e3cfa4a/8902894358989_cover.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/oh-ho-ho-ho-remix/1229021041?i=1229021049',
  },
  {
    title: 'Badri Ki Dulhania', artist: 'Dev Negi, Neha Kakkar, Monali Thakur & Ikka', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/1a/b4/48/1ab448a5-fff5-8865-d48f-e765f4c03368/mzaf_941812621715835474.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/7c/6e/e7/7c6ee7c8-c1f3-e40f-1ec7-7ff96d0776f8/8902894358804_cover.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/badri-ki-dulhania-title-track/1205913413?i=1205913430',
  },
  {
    title: 'Millionaire', artist: 'Yo Yo Honey Singh', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/0f/01/62/0f0162b4-dbb9-b60c-ad0e-c08a6bb4f139/mzaf_5877799491150961870.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/e3/9c/11e39c6d-0ac9-8728-cb9e-94197f645bfd/8903431012173_cover.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/millionaire/1763807339?i=1763807340',
  },
  {
    title: 'Dheere Dheere', artist: 'Yo Yo Honey Singh', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/b2/a9/5c/b2a95c7c-45d9-5402-097c-8914231cfc0b/mzaf_11470489494488922036.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/a8/2b/38/a82b38ac-432f-32b7-0587-864b733855ef/8903431608901_cover.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/dheere-dheere/1071078535?i=1071078538',
  },
  {
    title: 'Blue Eyes', artist: 'Yo Yo Honey Singh', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/1a/44/fb/1a44fbe0-5172-ddad-8e53-5510ad7dcff9/mzaf_11119624523547880630.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music71/v4/81/0b/a4/810ba47e-952c-8818-ad3c-9899b4928cd4/8902894354943_cover.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/blue-eyes/1167342785?i=1167342870',
  },
  {
    title: 'Sunny Sunny', artist: 'Yo Yo Honey Singh & Neha Kakkar', duration: 30, isPreview: true,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/23/98/e9/2398e9d9-6819-dba1-4059-f7bc12abb750/mzaf_211750905149945877.plus.aac.p.m4a',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/b1/df/5a/b1df5a4f-64cc-a1f7-fb12-dad245a097c0/8902894354998_cover.jpg/600x600bb.jpg',
    sourceUrl: 'https://music.apple.com/in/album/sunny-sunny/1116109565?i=1116109818',
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
