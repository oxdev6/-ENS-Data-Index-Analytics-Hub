# ENS Data Index & Analytics Hub

An open-source platform that democratizes access to ENS adoption data through clean APIs, interactive dashboards, and exportable datasets. Built as a public good to make ENS activity transparent and developer-friendly.

## 🌟 Features

### 📊 Interactive Dashboard
- Real-time registration and renewal metrics
- Cross-chain adoption analytics
- Whale tracking and governance insights
- Advanced filtering and CSV export

### 🔌 Comprehensive APIs
- **REST API** with pagination, filtering, and rate limiting
- **GraphQL** endpoint with flexible queries
- **WebSocket** support for real-time updates
- **Bulk operations** for data management

### 🏗️ Production Ready
- Docker containerization with multi-stage builds
- Nginx reverse proxy with rate limiting
- PostgreSQL with optimized indexing
- In-memory caching layer
- CI/CD pipeline with security scanning

### 🌐 Multi-Chain Support
- Ethereum Mainnet
- Optimism
- Polygon
- Arbitrum
- Base
- Linea

## 🚀 Quick Start

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/oxdev6/-ENS-Data-Index-Analytics-Hub
   cd ENS-Data-Index-Analytics-Hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Start PostgreSQL (using Docker or local installation)
   # Update .env with your DATABASE_URL
   
   cd packages/db
   npx prisma generate
   npx prisma db push
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: API server
   npm --workspace apps/api run dev
   
   # Terminal 2: Web dashboard
   npm --workspace apps/web run dev
   
   # Terminal 3: Data ingestion (optional)
   npm --workspace apps/ingest run dev
   ```

5. **Access the applications**
   - Web Dashboard: http://localhost:3001
   - API Documentation: http://localhost:4000/docs
   - GraphQL Playground: http://localhost:4000/graphql

### Production Deployment

1. **Using Docker Compose**
   ```bash
   # Build and start all services
   docker compose -f docker-compose.prod.yml up -d
   
   # View logs
   docker compose -f docker-compose.prod.yml logs -f
   ```

2. **Environment Configuration**
   ```bash
   # Copy and configure environment variables
   cp .env.example .env
   # Edit .env with your production settings
   ```

## 📁 Project Structure

```
ENS-Data-Index-Analytics-Hub/
├── apps/
│   ├── api/              # Fastify API server
│   ├── web/              # Next.js dashboard
│   └── ingest/           # ETL data pipeline
├── packages/
│   └── db/               # Prisma schema & migrations
├── .github/workflows/    # CI/CD pipeline
└── docker-compose.yml    # Development orchestration
```

## 🔧 Technology Stack

- **Backend**: Fastify, TypeScript, Prisma ORM
- **Frontend**: Next.js, React, Tailwind CSS, Recharts
- **Database**: PostgreSQL with optimized indexes
- **Infrastructure**: Docker, Nginx, GitHub Actions
- **APIs**: REST, GraphQL, WebSocket

## 📊 API Endpoints

### REST API
- `GET /registrations` - List ENS registrations with filtering
- `GET /renewals` - List ENS renewals
- `GET /names` - List ENS names
- `GET /export/{type}.csv` - Export data as CSV
- `POST /bulk/registrations` - Bulk operations
- `GET /ws` - WebSocket endpoint for real-time updates

### GraphQL
- Query registrations, renewals, and names
- Real-time subscriptions
- Type-safe schema with introspection

## 🎯 Use Cases

### For Developers
- **Easy Integration**: Clean APIs eliminate need to scrape blockchain data
- **Real-time Updates**: WebSocket connections for live data
- **Flexible Queries**: GraphQL for precise data fetching

### For Researchers
- **Open Dataset**: Free access to comprehensive ENS data
- **Export Options**: CSV downloads for analysis
- **Historical Data**: Time-series analysis capabilities

### For DAOs & Projects
- **Dashboard Embedding**: Integrate ENS metrics into governance dashboards
- **Adoption Tracking**: Monitor ENS usage across different chains
- **Whale Analysis**: Track large-scale ENS activity

## 🔒 Security Features

- Rate limiting with configurable thresholds
- API key authentication
- CORS configuration
- Input validation with Zod schemas
- Security headers via Nginx
- Container security scanning

## 🎨 Dashboard Features

### Overview Page
- Daily registration/renewal metrics
- Cross-chain distribution charts
- Recent activity tables with pagination

### Names Search
- Individual ENS name lookup
- Complete registration/renewal history
- Transaction links to block explorers

### Advanced Analytics
- Whale address tracking (>1 ETH spent)
- Registration cost distribution
- Activity patterns by time of day

### L2 Adoption
- Cross-chain comparison metrics
- L1 vs L2 adoption rates
- Chain-specific performance data

## 🌍 Benefits for ENS Ecosystem

### Transparency & Measurability
- Makes ENS adoption visible with real metrics
- Provides data for informed governance decisions
- Demonstrates ecosystem growth publicly

### Developer Enablement
- Reduces barrier to building ENS analytics
- Provides reliable, clean data sources
- Enables new use cases and integrations

### Research Support
- Academic and industry research datasets
- Open access to historical ENS data
- Standardized metrics for comparison

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (if applicable)
5. Submit a pull request

### Reporting Issues
- Use GitHub Issues for bug reports
- Include reproduction steps and environment details
- Check existing issues before creating new ones

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- ENS DAO for building the foundational identity infrastructure
- The Graph Protocol for decentralized data indexing
- Open source community for tools and libraries

## 📞 Support

- **Documentation**: Check our [Wiki](https://github.com/oxdev6/-ENS-Data-Index-Analytics-Hub/wiki)
- **Issues**: [GitHub Issues](https://github.com/oxdev6/-ENS-Data-Index-Analytics-Hub/issues)
- **Community**: Join our [Discord](https://discord.gg/ens-hub)

---

**Built with ❤️ for the ENS community as a public good.**