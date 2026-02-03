# FutPlot Scraper Scripts

This directory contains Python scripts for scraping football player statistics.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
   - Copy `.env.example` to `.env` in the root directory
   - Add your `DATABASE_URL`

## Usage

Run the scraper manually:
```bash
python scraper.py
```

## Automated Runs

The scraper is configured to run automatically every Monday via GitHub Actions.
See `.github/workflows/weekly_update.yml` for details.

## Customization

Edit `scraper.py` to:
- Add your specific data sources
- Customize the scraping logic
- Adjust database schema and queries
