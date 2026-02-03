# FutPlot 🎯

A full-stack football analytics and visualization platform built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 📊 **Interactive Data Visualization** - Powered by Nivo charts
- 🗄️ **PostgreSQL Database** - Robust data storage and querying
- 🤖 **Automated Scraping** - Weekly data updates via GitHub Actions
- 🎨 **Modern UI** - Dark theme with neon green accents
- ⚡ **Next.js App Router** - Fast, server-side rendering

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Nivo** for data visualization

### Backend
- **Next.js API Routes**
- **PostgreSQL** database
- **pg** (node-postgres) for database connection

### Scraping
- **Python 3.11+**
- **Beautiful Soup 4** for HTML parsing
- **Requests** for HTTP requests
- **Selenium** for dynamic content

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd futplot
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Python dependencies:
```bash
cd scripts
pip install -r requirements.txt
cd ..
```

4. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your PostgreSQL connection string:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/futplot_db
```

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

Create your PostgreSQL database and tables:

```sql
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  position VARCHAR(50),
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  minutes_played INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Running the Scraper

Manually run the scraper:
```bash
cd scripts
python scraper.py
```

The scraper will automatically run every Monday via GitHub Actions.

## Project Structure

```
futplot/
├── app/
│   ├── api/
│   │   └── players/
│   │       └── route.ts        # API endpoint for player data
│   ├── globals.css              # Global styles with Michroma font
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/
│   ├── PlayerSelector.tsx       # Player selection dropdown
│   ├── ScatterPlot.tsx          # Nivo scatter plot component
│   └── StatsCard.tsx            # Statistics card component
├── scripts/
│   ├── scraper.py               # Python web scraper
│   ├── requirements.txt         # Python dependencies
│   └── README.md                # Scraper documentation
├── .github/
│   └── workflows/
│       └── weekly_update.yml    # GitHub Actions workflow
├── .env.example                 # Environment variables template
├── package.json                 # Node.js dependencies
└── tailwind.config.ts           # Tailwind configuration
```

## GitHub Actions Setup

To enable automated weekly scraping:

1. Go to your repository Settings → Secrets and variables → Actions
2. Add a new secret: `DATABASE_URL` with your PostgreSQL connection string
3. The workflow will run every Monday at 00:00 UTC

You can also manually trigger the workflow from the Actions tab.

## Customization

### Styling
- Colors and theme: Edit [app/globals.css](app/globals.css)
- Tailwind config: Edit [tailwind.config.ts](tailwind.config.ts)

### Scraper
- Add data sources: Edit [scripts/scraper.py](scripts/scraper.py)
- Adjust schedule: Edit [.github/workflows/weekly_update.yml](.github/workflows/weekly_update.yml)

### Database
- Schema changes: Update [app/api/players/route.ts](app/api/players/route.ts)
- Add new endpoints: Create files in `app/api/`

## Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

Make sure to:
1. Add `DATABASE_URL` environment variable in Vercel dashboard
2. Connect your GitHub repository for automatic deployments

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
