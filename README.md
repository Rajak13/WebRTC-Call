# WebRTC Connect - Video Chat Application

A modern, real-time video chat application built with React, WebRTC, and Supabase for signaling.

## Features

- 🎥 High-quality peer-to-peer video calls
- 🔄 Screen sharing capabilities
- 🔒 End-to-end encrypted communications
- 🌐 No account required to start or join calls
- 📱 Responsive design for desktop and mobile
- 📋 Easy room sharing with unique IDs

## Tech Stack

- **Frontend**: React, React Router, TailwindCSS
- **Real-time Communication**: WebRTC
- **Signaling**: Supabase Realtime
- **Bundler**: Vite
- **Styling**: TailwindCSS with custom animations

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/my-webrtc-app.git
   cd my-webrtc-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser to see the application.

### Supabase Setup

1. Create a new Supabase project
2. Create the following tables:

   **webrtc_signaling**:
   ```sql
   create table webrtc_signaling (
     id uuid default uuid_generate_v4() primary key,
     room_id text not null,
     type text not null,
     data jsonb not null,
     sender_id uuid,
     created_at timestamp with time zone default now()
   );
   ```

   **call_rooms**:
   ```sql
   create table call_rooms (
     id uuid default uuid_generate_v4() primary key,
     created_at timestamp with time zone default now()
   );
   ```

3. Set up Supabase Realtime by enabling it in your project settings

## Usage

1. Start a new call from the homepage
2. Share the generated room ID with others
3. Others can join by entering the room ID
4. Use the call controls to toggle audio/video, share screen, or end the call

## Deployment

The app can be easily deployed to platforms like Vercel, Netlify, or GitHub Pages. Make sure to set your environment variables in your deployment configuration.

```bash
# Build the app for production
npm run build
# or
yarn build
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [WebRTC.org](https://webrtc.org/) for the real-time communication technology
- [Supabase](https://supabase.com/) for the real-time database and signaling functionality
- [TailwindCSS](https://tailwindcss.com/) for the styling framework
