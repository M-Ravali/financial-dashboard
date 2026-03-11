# 📈 Real-Time Financial Dashboard

A full-stack financial dashboard with live stock prices, portfolio management, and real-time data streaming — built with the MERN stack and deployed on Railway + Vercel.

🔗 **Live Demo:** https://financial-dashboard-three-lac.vercel.app  
🔗 **Backend API:** financial-dashboard-production-7f82.up.railway.app 
🔗 **GitHub:** https://github.com/M-Ravali/financial-dashboard

---

## ✨ Features

- 🔐 JWT Authentication — Register, login, and protected routes
- 📊 Live Stock Prices — Real-time data from Finnhub API (AAPL, GOOGL, MSFT, AMZN, TSLA)
- ⚡ Real-Time Streaming — Socket.io WebSocket price updates every 30 seconds
- 📈 Interactive Charts — Live Recharts line graph on the dashboard
- 🚨 Price Alerts — Banner alert for stocks moving more than 2%
- 💼 Portfolio Management — Buy stocks and track holdings
- 🧾 Transaction History — Full history with summary stats
- 🗄️ Redis Caching — Reduced Finnhub API calls with graceful fallback
- 🐳 Docker Support — One-command local setup with docker-compose
- 🚀 CI/CD Pipeline — GitHub Actions for automated build and test

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React.js + Vite | UI framework |
| Tailwind CSS | Styling |
| Recharts | Data visualization |
| Socket.io-client | Real-time WebSocket connection |
| Axios | HTTP requests |
| React Router | Client-side routing |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database |
| Socket.io | Real-time WebSocket server |
| JWT + bcryptjs | Authentication & security |
| Finnhub API | Live stock market data |
| Redis (Upstash) | Caching layer |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker + docker-compose | Containerization |
| GitHub Actions | CI/CD pipeline |
| Railway | Backend deployment |
| Vercel | Frontend deployment |
| MongoDB Atlas | Cloud database |
| Upstash Redis | Cloud Redis |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account
- Finnhub API key (free at [finnhub.io](https://finnhub.io))
- Upstash Redis account (free at [upstash.com](https://upstash.com))

### 1. Clone the Repository

```bash
git clone https://github.com/M-Ravali/financial-dashboard
cd financial-dashboard
```

### 2. Set Up Environment Variables

Create `backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
FINNHUB_API_KEY=your_finnhub_api_key
REDIS_URL=your_upstash_redis_url
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Run with Docker (Recommended)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### 4. Run Manually

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
financial-dashboard/
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions CI/CD pipeline
├── backend/
│   ├── config/
│   │   └── redis.js           # Safe Redis wrapper with graceful fallback
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT authentication middleware
│   ├── models/
│   │   ├── User.js            # User schema with portfolio
│   │   └── Transaction.js     # Transaction schema
│   ├── routes/
│   │   ├── auth.js            # Register, login, profile
│   │   ├── stocks.js          # Finnhub stock data + Redis cache
│   │   └── transactions.js    # CRUD + summary
│   ├── socket/
│   │   └── stockStream.js     # Real-time price streaming
│   ├── server.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useSocket.js   # Socket.io connection hook
│   │   ├── pages/
│   │   │   ├── Login.jsx      # Auth page (login + register)
│   │   │   ├── Dashboard.jsx  # Live stocks + charts + alerts
│   │   │   ├── Portfolio.jsx  # Holdings + buy stock form
│   │   │   └── Transactions.jsx
│   │   └── App.jsx            # Routes + PrivateRoute guard
│   ├── vercel.json            # Vercel SPA routing config
│   └── Dockerfile
└── docker-compose.yml
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/profile` | Get user profile (protected) |

### Stocks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stocks/prices` | Get live prices for tracked stocks |
| GET | `/api/stocks/:symbol` | Get data for specific stock |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get all transactions (protected) |
| POST | `/api/transactions` | Create transaction (buy/sell) |
| GET | `/api/transactions/summary` | Get portfolio summary |

---

## 🐳 Docker

Run the entire stack with one command:

```bash
docker-compose up --build
```

Services:
- `backend` — Node.js API on port 5000
- `frontend` — React app on port 3000
- `redis` — Local Redis on port 6379

---

## ⚙️ CI/CD Pipeline

GitHub Actions automatically runs on every push to `main`:

1. test-backend — Installs dependencies and verifies server starts
2. build-frontend — Installs dependencies and builds React app
3. docker-build — Builds all Docker images (runs after tests pass)

---

## 🌐 Deployment

### Backend → Railway
1. Connect your GitHub repo to Railway
2. Add all environment variables from `backend/.env`
3. Railway auto-deploys on every push to `main`

### Frontend → Vercel
1. Connect your GitHub repo to Vercel
2. Set `VITE_API_URL` to your Railway backend URL
3. Vercel auto-deploys on every push to `main`

---

## 🔑 Environment Variables Reference

| Variable | Where | Description |
|----------|-------|-------------|
| `MONGO_URI` | Backend | MongoDB Atlas connection string |
| `JWT_SECRET` | Backend | Secret key for JWT signing |
| `PORT` | Backend | Server port (default 5000) |
| `FINNHUB_API_KEY` | Backend | API key from finnhub.io |
| `REDIS_URL` | Backend | Upstash Redis connection URL |
| `VITE_API_URL` | Frontend | Backend API base URL |

---

## 📊 Architecture Overview

```
                    ┌─────────────────┐
                    │  React Frontend  │
                    │    (Vercel)      │
                    └────────┬────────┘
                             │ HTTP / WebSocket
                    ┌────────▼────────┐
                    │   Express API   │
                    │   (Railway)     │
                    └──┬──────────┬──┘
                       │          │
              ┌────────▼───┐  ┌───▼────────┐
              │  MongoDB   │  │   Redis    │
              │   Atlas    │  │ (Upstash)  │
              └────────────┘  └────────────┘
                       │
              ┌────────▼───────┐
              │  Finnhub API   │
              │  (Stock Data)  │
              └────────────────┘
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

> ⭐ If you found this project helpful, please give it a star on GitHub!
