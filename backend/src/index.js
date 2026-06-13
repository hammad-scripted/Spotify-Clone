import express from 'express';
import chalk from 'chalk';
import dotenv from 'dotenv';
import morgan from 'morgan';
dotenv.config();
const PORT = process.env.PORT || 5000;
import userRouter from "./routes/user.route.js"
import authRouter from "./routes/auth.route.js"
import adminRouter from "./routes/admin.route.js"
import statRouter from "./routes/stats.route.js"
import songRouter from "./routes/song.route.js"
import albumRouter from "./routes/album.route.js"

const app = express();

app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/users",userRouter)
app.use("/api/v1/auth",authRouter)
app.use("/api/v1/songs",songRouter)
app.use("/api/v1/admin",adminRouter)
app.use("/api/v1/albums",albumRouter)
app.use("/api/v1/stats",statsRouter)

app.listen(PORT, () =>
  console.log(chalk.magentaBright.italic(`Server is running on port ${PORT}`)),
);
