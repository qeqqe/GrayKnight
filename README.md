# GrayKnight Music Analytics

A comprehensive music analytics dashboard that integrates with Spotify to provide detailed insights into your listening habits through interactive visualizations.

![Screenshot 2024-12-16 085231](https://github.com/user-attachments/assets/0a6d5d19-aefa-4456-b7a7-3e438f7cbcef)

## Features

- 🎵 Real-time Spotify integration
- 📊 Advanced music analytics
- 📈 Interactive data visualizations
- 🎧 Playback controls
- 📱 Device management
- 📋 Playlist management
- 📉 Listening statistics

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT, Spotify OAuth

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
## License

LICENSE.md

## Current Progress
![Screenshot 2024-12-16 085312](https://github.com/user-attachments/assets/6c813312-6d79-4301-bca8-875dd5705bc8)
![Screenshot 2024-12-16 085359](https://github.com/user-attachments/assets/7e18c1ec-c321-48ff-a9e0-e744f8428c80)
![Screenshot 2024-12-16 085421](https://github.com/user-attachments/assets/d7e5cf4f-7291-44a2-9908-570d0b227f44)

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
  - Infinite scroll (paginated) for large playlists
- ✅ Device management and playback control
- ✅ User listening statistics (In Progress)

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

1. Enhance data analytics visualization
   - Genre distribution charts
   - Listening patterns by time/day
   - Artist diversity metrics
   - Mood analysis graphs
2. Implement music taste analysis
   - Genre preference tracking
   - Listening habit insights
   - Discovery rate metrics
3. Add comparative analytics
   - Compare different time periods
   - Cross-platform listening patterns
   - Genre evolution over time
4. Create personalized insights
   - Custom listening reports
   - Music taste evolution
   - Activity-based recommendations
5. Develop social features
   - Share listening insights
   - Compare with friends
   - Collaborative playlists
6. Improve data export options
   - Data visualization exports
   - Raw data access

![Screenshot 2024-12-16 090201](https://github.com/user-attachments/assets/314c1de5-28db-4cb4-a82c-d347be8190ed)

Note: Development is now primarily focused on Spotify integration due to its more comprehensive API capabilities.

