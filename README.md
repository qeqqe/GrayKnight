# Last.fm Music Tracker Application (Still in very early development stages ⚠️)

## Project Overview

This application provides a seamless music tracking experience by allowing users to authenticate with their Last.fm account and retrieve their music listening history.

## Features

- User registration and authentication
- Secure JWT-based authentication
- Last.fm account connection
- Music listening data retrieval

## Tech Stack

- Backend: Node.js
- Database: MongoDB
- Authentication:
  - Local registration
  - Passport.js for Last.fm OAuth
- Frontend: Next.js (with shadcn)

## Getting Started

### Prerequisites

- Node.js
- MongoDB
- Last.fm Developer Account

### Installation

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Set up environment variables
4. Run the application
   ```bash
   npm start
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

## Acknowledgments

- Passport.js
- Last.fm API
- MongoDB

(older commits were removed due to some issue)
