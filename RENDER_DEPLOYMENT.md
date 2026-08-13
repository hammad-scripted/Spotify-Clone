# Deploying Soundwave on Render

The repository includes a root `render.yaml` Blueprint that creates:

- `spotify-clone-api-hammad`: the Express, MongoDB, Clerk, Cloudinary, and Socket.IO backend
- `spotify-clone-web-hammad`: the Vite React static frontend

Both services deploy from this monorepo and redeploy automatically when their folder changes on the `main` branch.

## 1. Prepare MongoDB Atlas

Use the existing Atlas database or create one. In Atlas Network Access, allow connections from Render. For a quick first deployment you can temporarily allow `0.0.0.0/0`, but use Atlas credentials with a strong password and narrow access when possible.

Copy the Atlas connection string for `MONGO_URI`.

## 2. Create the Render Blueprint

1. Push this repository to GitHub.
2. Open the Render Dashboard and select **New > Blueprint**.
3. Connect `hammad-scripted/Spotify-Clone`.
4. Render detects `render.yaml`. Enter the prompted environment values and apply the Blueprint.

Backend values:

- `MONGO_URI`: MongoDB Atlas connection string
- `CLERK_SECRET_KEY`: Clerk secret key (`sk_...`)
- `ADMIN_EMAIL`: the Clerk account email that should access `/admin`
- `CLOUDINARY_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

Frontend value:

- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk publishable key (`pk_...`)

Do not add `PORT`; Render assigns it automatically. Never commit secret values to this repository.

## 3. Configure Clerk

In the Clerk Dashboard, add the deployed frontend URL:

`https://spotify-clone-web-hammad.onrender.com`

to the production application's allowed origins/redirect URLs if Clerk prompts for it. Use matching publishable and secret keys from the same Clerk instance.

## 4. Verify the deployment

- Frontend: `https://spotify-clone-web-hammad.onrender.com`
- API health: `https://spotify-clone-api-hammad.onrender.com/api/v1/health`
- Admin: `https://spotify-clone-web-hammad.onrender.com/admin`

Sign in with the exact address configured as `ADMIN_EMAIL`. Test a song, like/unlike, search, chat, and an admin upload. The free backend may take a short time to wake after being idle.

If Render changes either generated hostname, update both:

- Backend `CLIENT_URL` to the actual frontend origin (no trailing slash)
- Frontend `VITE_API_URL` to the actual backend URL plus `/api/v1`

Then redeploy both services.
