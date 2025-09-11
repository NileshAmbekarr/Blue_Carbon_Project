# Blue Carbon Backend API

Backend API for Blue Carbon Project - A comprehensive carbon credit management system with hybrid storage architecture.

## 🌱 Overview

This backend serves as the central hub for the Blue Carbon Project, managing carbon credit lifecycle, MRV (Measurement, Reporting, Verification) processes, and blockchain integration for transparency and immutability.

## 🏗️ Architecture

### Hybrid Storage Approach
- **PostgreSQL + PostGIS**: Relational data, geospatial queries, credits registry
- **MongoDB**: File metadata, MRV reports, monitoring events (flexible JSON schema)
- **AWS S3**: Primary file storage (photos, drone data, PDFs, baseline docs)
- **IPFS**: Immutable hash anchoring for tamper-proofing
- **Blockchain (Polygon)**: Carbon credit lifecycle events

### Key Features
- 🔐 JWT + OAuth2 + Web3 wallet authentication
- 👥 Role-based access control (Admin, Auditor, Developer, Public)
- 🗺️ Geospatial validation with PostGIS
- 📊 MRV calculation engine integration
- ⛓️ Blockchain anchoring for transparency
- 📱 REST APIs for frontend/mobile communication
- 📚 Comprehensive API documentation with Swagger

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL 17 with PostGIS extension
- MongoDB Atlas account
- Local IPFS node (optional, for development)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Environment Setup:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup:**
```bash
# PostgreSQL with PostGIS
createdb blue_carbon_db
psql -d blue_carbon_db -c "CREATE EXTENSION postgis;"

# Run migrations
npm run migration:run
```

4. **Start Development Server:**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`
API Documentation: `http://localhost:3000/api/docs`

## 📋 Environment Variables

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=blue_carbon_db

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blue_carbon

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# IPFS Configuration
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http

# Blockchain Configuration (Polygon Mumbai Testnet)
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=your_contract_address_here

# API Configuration
PORT=3000
API_PREFIX=api/v1
FRONTEND_URL=http://localhost:5173

# Python MRV Service
MRV_SERVICE_URL=http://localhost:8000
```

## 🔑 User Roles & Permissions

### Admin (NCCR)
- Full system access
- User management
- Project approval/rejection
- Credit issuance/revocation
- System configuration

### Auditor
- Review and verify MRV reports
- Approve/reject projects
- Access audit trails
- Quality assurance

### Developer (NGOs/Panchayats)
- Create and manage projects
- Upload monitoring data
- Submit projects for review
- View own project analytics

### Public
- Read-only access to transparency portal
- View active/completed projects
- Access public carbon credit data

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/refresh` - Refresh token

### Projects
- `GET /api/v1/projects` - List projects (role-filtered)
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details
- `PATCH /api/v1/projects/:id/submit` - Submit for review
- `PATCH /api/v1/projects/:id/approve` - Approve project

### MRV (Measurement, Reporting, Verification)
- `GET /api/v1/mrv/reports` - List MRV reports
- `POST /api/v1/mrv/reports` - Create MRV report
- `PATCH /api/v1/mrv/reports/:id/verify` - Verify report
- `GET /api/v1/mrv/reports/carbon/:projectId` - Carbon calculations

### Carbon Credits
- `GET /api/v1/credits` - List credits (role-filtered)
- `POST /api/v1/credits` - Create credit batch
- `PATCH /api/v1/credits/:id/issue` - Issue credits
- `PATCH /api/v1/credits/:id/retire` - Retire credits

### Files & Media
- `POST /api/v1/files/upload` - Upload files
- `GET /api/v1/files` - List file metadata
- `GET /api/v1/files/stats` - File statistics
- `PATCH /api/v1/files/:id/verify` - Verify file

### Blockchain
- `GET /api/v1/blockchain/network` - Network info
- `POST /api/v1/blockchain/anchor/project` - Anchor project
- `POST /api/v1/blockchain/credits/issue` - Issue credits on-chain

## 🗄️ Database Schema

### PostgreSQL Tables
- `users` - User accounts and authentication
- `roles` - User roles and permissions
- `organizations` - NGOs, Panchayats, etc.
- `projects` - Carbon credit projects
- `plots` - Geospatial project areas (PostGIS)
- `credits` - Carbon credit registry
- `audit_logs` - System audit trail

### MongoDB Collections
- `filemetadata` - File upload metadata
- `mrvreports` - MRV calculation results
- `monitoringevents` - Field monitoring activities

## 🔧 Development

### Available Scripts
```bash
npm run start:dev      # Development server with hot reload
npm run build          # Build for production
npm run start:prod     # Production server
npm run test           # Run tests
npm run lint           # Lint code
npm run migration:generate  # Generate database migration
npm run migration:run       # Run pending migrations
```

### Code Structure
```
src/
├── common/           # Shared utilities and enums
├── config/           # Database and app configuration
├── entities/         # PostgreSQL entities (TypeORM)
├── schemas/          # MongoDB schemas (Mongoose)
├── modules/          # Feature modules
│   ├── auth/         # Authentication & authorization
│   ├── users/        # User management
│   ├── projects/     # Project management
│   ├── credits/      # Carbon credit lifecycle
│   ├── mrv/          # MRV reports and monitoring
│   ├── files/        # File upload and metadata
│   └── blockchain/   # Blockchain integration
└── main.ts           # Application entry point
```

## 🔗 Integration Points

### Python MRV Microservice
- Separate service for biomass/NDVI analysis
- Processes drone and satellite imagery
- Returns carbon calculations
- Communication via REST/gRPC

### Frontend Integration
- React dashboard for web interface
- Mobile app for field data collection
- Real-time updates via WebSocket (future)

### Blockchain Integration
- Polygon testnet for development
- Smart contracts for credit lifecycle
- IPFS for immutable data storage
- MetaMask/WalletConnect support

## 📈 Monitoring & Logging

- Structured logging with Winston
- Health check endpoints
- Performance monitoring
- Error tracking and alerting

## 🔒 Security

- JWT token-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting and CORS protection
- Secure file upload handling

## 🚀 Deployment

### Docker Support (Coming Soon)
```bash
docker build -t blue-carbon-backend .
docker run -p 3000:3000 blue-carbon-backend
```

### Production Checklist
- [ ] Set up production PostgreSQL with PostGIS
- [ ] Configure MongoDB Atlas production cluster
- [ ] Set up AWS S3 bucket and IAM roles
- [ ] Deploy IPFS node or use Pinata/Infura
- [ ] Configure production blockchain network
- [ ] Set up SSL certificates
- [ ] Configure monitoring and logging
- [ ] Set up CI/CD pipeline

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/api/docs`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Blue Carbon Project** - Revolutionizing carbon credit management through technology 🌱⛓️
