import express from 'express';
import chalk from 'chalk';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'node:path';
import fileupload from 'express-fileupload';
import { clerkMiddleware } from '@clerk/express';
import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { connectDB } from './db/connect.js';
dotenv.config();
const PORT = process.env.PORT || 5000;
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import adminRouter from './routes/admin.route.js';
import statsRouter from './routes/stats.route.js';
import songRouter from './routes/song.route.js';
import albumRouter from './routes/album.route.js';
import errorHandler from './errors/errorHandler.js';
import helloRouter from './routes/hello.route.js';
import { notFound } from './errors/notFound.js';
const app = express();
const __dirname = path.resolve();

// * MIDDLEWARES
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware({ secretKey: process.env.CLERK_SECRET_KEY })); //! this is a middleware for authentication in clerk,this will add auth to req object
app.use(
  fileupload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'temp'),
    limits: {
      files: 10 * 1024 * 1024,
    },
  }),
);

// * ROUTES
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/songs', songRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/albums', albumRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/hello', helloRouter);
app.use(notFound);
app.use(errorHandler);

// * SERVER
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(chalk.magenta.italic(`Server is listening on port ${PORT}`));
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
