import express from 'express';
import http from 'node:http';
import chalk from 'chalk';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'node:path';
import fileupload from 'express-fileupload';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { verifyToken } from '@clerk/backend';
import { Server } from 'socket.io';
import { connectDB } from './db/connect.js';
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import adminRouter from './routes/admin.route.js';
import statsRouter from './routes/stats.route.js';
import songRouter from './routes/song.route.js';
import albumRouter from './routes/album.route.js';
import messageRouter from './routes/message.route.js';
import helloRouter from './routes/hello.route.js';
import errorHandler from './errors/errorHandler.js';
import { notFound } from './errors/notFound.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigins, credentials: true } });

app.set('io', io);
app.use(morgan('tiny'));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware({ secretKey: process.env.CLERK_SECRET_KEY }));
app.use(fileupload({
  useTempFiles: true,
  tempFileDir: path.join(process.cwd(), 'temp'),
  limits: { fileSize: 10 * 1024 * 1024 },
  abortOnLimit: true,
}));

app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/songs', songRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/albums', albumRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/messages', messageRouter);
app.use('/api/v1/hello', helloRouter);
app.use(notFound);
app.use(errorHandler);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    socket.userId = payload.sub;
    return next();
  } catch {
    return next(new Error('Invalid authentication token'));
  }
});

io.on('connection', (socket) => socket.join(`user:${socket.userId}`));

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(chalk.magenta.italic(`Server is listening on port ${PORT}`));
    });
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
};

startServer();

export { app, server };
