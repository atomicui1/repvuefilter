# RepVue Cybersecurity Company Scraper

A Tampermonkey userscript that scrapes publicly traded B2B cybersecurity companies from [RepVue](https://www.repvue.com), sorted by lowest quota attainment.

## Features

- Scrapes all pages of publicly traded software companies from RepVue
- Filters for B2B cybersecurity companies using keyword matching and known security vendors
- Sorts results by lowest quota attainment first (worst performers at top)
- Floating UI panel with real-time scraping progress
- Export to CSV or JSON
- Shows hiring status for each company

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click on the Tampermonkey icon and select "Create a new script"
3. Copy the contents of `repvue-cybersecurity-scraper.user.js` and paste it
4. Save the script (Ctrl+S / Cmd+S)

## Usage

1. Navigate to RepVue with the desired filters:
   ```
   https://www.repvue.com/companies?sort_key=quota_attainment&sort_direction=asc&industries.name=Software&per_page=100&funding_source=Public
   ```

2. A floating panel will appear in the top-right corner
3. Click "Start Scraping" to begin
4. Once complete, view results in the panel or export via CSV/JSON buttons

## Detected Cybersecurity Companies

The script identifies cybersecurity companies by:

- **Known vendors**: CrowdStrike, Zscaler, Okta, SailPoint, Palo Alto, Fortinet, Trend Micro, Netskope, CyberArk, Qualys, Rapid7, Tenable, Varonis, Cloudflare, and more
- **Keywords in descriptions**: cybersecurity, identity, authentication, zero trust, endpoint, threat detection, SIEM, IAM, data protection, etc.

## Output Fields

| Field | Description |
|-------|-------------|
| Company Name | Name of the company |
| Quota Attainment | Percentage of reps hitting quota |
| RepVue Score | Overall company rating |
| Ratings | Number of employee ratings |
| Hiring | Current hiring status |
| URL | Link to RepVue company page |
| Description | Company description snippet |

## License

MIT
