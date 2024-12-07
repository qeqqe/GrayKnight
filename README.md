# Last.fm Music Tracker Application (Still in very early development stages ⚠️)

## Project Overview

This application provides a seamless music tracking experience by allowing users to authenticate with their Last.fm/Spotify account and retrieve their music listening history.

## Features

- User registration and authentication
- Secure JWT-based authentication
- Last.fm/Spotify account connection
- Music listening data retrieval

## Tech Stack

- Backend: Node.js, express
- ODM: Mongoose
- Database: MongoDB
- Authentication:
  - Local registration
  - Passport.js for Last.fm/Spotify OAuth
- Frontend: Next.js (with shadcn)

## Getting Started

### Prerequisites

- Node.js
- MongoDB
- Last.fm/Spotify Developer Account

### Installation

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Set up environment variables (check .env.example for all requirements in backend)
4. Start development server
   ```bash
   npm run dev
   ```

## Authentication Notes

- Passport.js is an authentication middleware for Node.js
- Supports multiple authentication strategies
- Free and open-source

## Future Roadmap

- Spotify authentication integration
- Enhanced music data visualization
- Cross-platform listening history tracking

## Contributing

Contributions are welcome! Please read the contributing guidelines before getting started though.

## License

LICENSE.md

## Current Progress

### Spotify Integration (Primary Focus)

- ✅ Full Spotify OAuth implementation
- ✅ Real-time music playback control
  - Direct track playing from within the app
  - Context-aware playlist playback
  - Queue management
- ✅ Current track display with:
  - Progress bar
  - Album artwork
  - Track metadata
  - Playback controls
- ✅ Recently played tracks history
- ✅ User playlists management
  - Playlist viewing
  - Track listing
  - Infinite scroll for large playlists
- ✅ Device management and playback control
- 🔄 User listening statistics (In Progress)

### Last.fm Integration (Limited Scope)

- ✅ Basic Last.fm OAuth implementation
- ✅ Scrobble history display
- ✅ User profile information
- ✅ Top artists and tracks
- ❌ Advanced features (Limited by Last.fm API capabilities)

### Technical Achievements

- ✅ Real-time data updates using polling
- ✅ Responsive UI with Tailwind CSS
- ✅ Modern component architecture using shadcn/ui
- ✅ Type-safe implementation with TypeScript
- ✅ Secure token management
- ✅ Error handling and recovery
- 🔄 Performance optimizations (Ongoing)

### Next Steps

1. Enhance error handling for playback failures
2. Add music recommendation system
3. Implement collaborative playlist features
4. Add audio visualizations
5. Integrate with more music services
6. Improve mobile responsiveness
7. Add offline capabilities

Note: Development is now primarily focused on Spotify integration due to its more comprehensive API capabilities.
