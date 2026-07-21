# Chatter

Chatter is a full-stack, real-time chat application for community communication. It uses Socket.IO instead of repeated HTTP polling, allowing messages, presence updates, and typing indicators to reach connected users immediately.

## Features

- User registration and login with JWT authentication
- One-to-one conversations
- Real-time messaging with Socket.IO rooms
- Online and offline presence
- Typing indicators
- Read-message tracking
- Persistent message history in PostgreSQL
- Cursor-based message pagination (50 messages by default)
- Conversation-level authorization for reading and sending messages
- Responsive React interface

## Technology stack

### Client

- React 19
- Vite
- Socket.IO Client
- CSS

### Server

- Node.js and Express 5
- Socket.IO
- PostgreSQL
- JSON Web Tokens
- bcrypt

## Project structure

```text
.
|-- client/                 React and Vite frontend
|   |-- src/APIs/           REST API helpers
|   |-- src/components/     Reusable interface components
|   |-- src/pages/          Login and chat pages
|   `-- src/utils/sockets/  Client-side socket events
|-- server/                 Express and Socket.IO backend
|   |-- controllers/        Request handlers
|   |-- middleware/         Authentication and security
|   |-- migrations/         PostgreSQL schema migrations
|   |-- models/             Database queries
|   |-- routes/             REST API routes
|   `-- utils/sockets/      Server-side socket events
`-- README.md
```

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL

## Local setup

### 1. Configure the server

Create `server/.env`:

```env
PORT=3000
CLIENT_ORIGINS=http://localhost:5173

JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=1h

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_NAME=chatter

# Optional settings
MESSAGE_MAX_LENGTH=4000
MESSAGE_PAGE_SIZE=50
DB_POOL_MAX=10
DB_CONNECTION_TIMEOUT_MS=5000
DB_IDLE_TIMEOUT_MS=30000
DB_SSL=false
```

Create the PostgreSQL database named in `DB_NAME`, then install the server dependencies and apply the schema:

```bash
cd server
npm install
npm run migrate
npm run dev
```

The API and Socket.IO server run at `http://localhost:3000` by default.

### 2. Configure the client

The client uses the local server by default. To override its address, create `client/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

In another terminal, install and start the client:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` in a browser.

## Available scripts

Run these commands inside the relevant directory.

### Server

| Command | Description |
| --- | --- |
| `npm run dev` | Start the server in watch mode |
| `npm start` | Start the server normally |
| `npm run migrate` | Apply pending database migrations |
| `npm run check` | Check the server source files |
| `npm test` | Run the Node.js tests |

### Client

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

## Authentication and authorization

After login, the client sends its JWT in the `Authorization: Bearer <token>` header for protected REST requests. It also supplies the token during the Socket.IO handshake.

The server verifies the token and derives the user ID from it; it does not trust a user ID submitted by the client. Message queries check the `conversation_participants` table, and message creation combines the participant check and database insertion in one atomic SQL statement.

## Real-time messaging flow

1. The client connects to Socket.IO with a valid JWT.
2. When a conversation opens, the socket joins a room named for its conversation ID.
3. The server verifies that the authenticated user is a participant.
4. A sent message is authorized and stored in PostgreSQL.
5. The saved message is emitted to the conversation room and the recipient's private user room.
6. After reconnection, the client rejoins the conversation and can retrieve persisted history from the REST API.

## REST API overview

All protected endpoints require a bearer token.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/register` | Register a user |
| `POST` | `/login` | Log in and receive a JWT |
| `GET` | `/` | List users |
| `GET` | `/me` | Get the current user |
| `PUT` | `/me` | Update the current user |
| `PUT` | `/me/password` | Change the current password |
| `DELETE` | `/me` | Delete the current user |
| `POST` | `/api/conversations` | Start a conversation |
| `GET` | `/api/conversations` | List the current user's conversations |
| `GET` | `/api/conversations/:conversationId` | Get one conversation |
| `GET` | `/api/conversations/:conversationId/messages` | Get a page of messages |
| `POST` | `/api/conversations/:conversationId/messages` | Send a message over HTTP |
| `PATCH` | `/api/conversations/:conversationId/messages/read` | Mark received messages as read |
| `GET` | `/health/live` | Check whether the server is running |
| `GET` | `/health/ready` | Check server and database readiness |

Older message pages can be requested with the `beforeId` query parameter. The server returns at most `MESSAGE_PAGE_SIZE` messages per request.

## Security notes

- Use a long, random `JWT_SECRET` and never commit `.env` files.
- Restrict `CLIENT_ORIGINS` to trusted frontend addresses in production.
- Enable `DB_SSL` when required by the production database provider.
- Passwords are hashed with bcrypt before storage.
- Authentication endpoints are rate-limited.
- Socket connections and protected REST endpoints validate JWTs server-side.

## Future improvements

- Load each older 50-message page automatically when the user scrolls upward
- Add automated integration and end-to-end tests
- Add group conversations, attachments, and message search
- Add deployment and container configuration

## License

This project currently uses the ISC license declared by the server package.
