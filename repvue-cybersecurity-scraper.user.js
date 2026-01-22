// ==UserScript==
// @name         RepVue Cybersecurity Company Scraper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Scrapes publicly traded B2B cybersecurity companies from RepVue, sorted by lowest quota attainment
// @author       You
// @match        https://www.repvue.com/companies*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Cybersecurity-related keywords to identify relevant companies
    const CYBERSECURITY_KEYWORDS = [
        'cybersecurity', 'cyber security', 'security', 'identity', 'authentication',
        'zero trust', 'endpoint', 'threat', 'malware', 'ransomware', 'firewall',
        'encryption', 'vulnerability', 'penetration', 'siem', 'soc', 'incident response',
        'data protection', 'privacy', 'compliance', 'access management', 'iam',
        'network security', 'cloud security', 'application security', 'devsecops',
        'antivirus', 'anti-virus', 'intrusion', 'detection', 'prevention',
        'forensics', 'breach', 'phishing', 'fraud', 'risk management'
    ];

    // Known cybersecurity companies (publicly traded, B2B focused)
    const KNOWN_CYBERSECURITY_COMPANIES = [
        'crowdstrike', 'zscaler', 'palo alto', 'fortinet', 'okta', 'sailpoint',
        'cyberark', 'qualys', 'rapid7', 'tenable', 'varonis', 'proofpoint',
        'sentinelone', 'cloudflare', 'trend micro', 'netskope', 'mimecast',
        'knowbe4', 'ping identity', 'beyondtrust', 'one identity', 'saviynt',
        'secureworks', 'mandiant', 'fireeye', 'carbonblack', 'carbon black',
        'symantec', 'mcafee', 'norton', 'avast', 'kaspersky', 'bitdefender',
        'f5', 'check point', 'checkpoint', 'sophos', 'barracuda', 'forcepoint',
        'imperva', 'thales', 'entrust', 'venafi', 'digicert', 'sectigo',
        'darktrace', 'exabeam', 'logrhythm', 'splunk', 'sumo logic', 'elastic',
        'datadog', 'dynatrace', 'new relic', 'pagerduty', 'nuix', 'avepoint',
        'intellicheck', 'veritone', 'fastly'
    ];

    let allCompanies = [];
    let currentPage = 1;
    let totalPages = 1;
    let isScrapingInProgress = false;

    function createUI() {
        const container = document.createElement('div');
        container.id = 'cybersec-scraper-ui';
        container.innerHTML = `
            <style>
                #cybersec-scraper-ui {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    z-index: 10000;
                    background: #1a1a2e;
                    color: #eee;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    width: 350px;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                #cybersec-scraper-ui h3 {
                    margin: 0 0 10px 0;
                    color: #00d4ff;
                    font-size: 14px;
                }
                #cybersec-scraper-ui button {
                    background: #00d4ff;
                    color: #1a1a2e;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    margin-right: 5px;
                    margin-bottom: 5px;
                }
                #cybersec-scraper-ui button:hover {
                    background: #00b8e6;
                }
                #cybersec-scraper-ui button:disabled {
                    background: #555;
                    cursor: not-allowed;
                }
                #cybersec-scraper-ui .status {
                    margin: 10px 0;
                    padding: 8px;
                    background: #2a2a4e;
                    border-radius: 4px;
                    font-size: 12px;
                }
                #cybersec-scraper-ui .results {
                    margin-top: 10px;
                    max-height: 400px;
                    overflow-y: auto;
                }
                #cybersec-scraper-ui .company-item {
                    padding: 8px;
                    margin: 5px 0;
                    background: #2a2a4e;
                    border-radius: 4px;
                    font-size: 11px;
                }
                #cybersec-scraper-ui .company-item .name {
                    font-weight: bold;
                    color: #00d4ff;
                }
                #cybersec-scraper-ui .company-item .quota {
                    color: #ff6b6b;
                }
                #cybersec-scraper-ui .company-item .score {
                    color: #4ecdc4;
                }
                #cybersec-scraper-ui textarea {
                    width: 100%;
                    height: 150px;
                    margin-top: 10px;
                    background: #2a2a4e;
                    color: #eee;
                    border: 1px solid #444;
                    border-radius: 4px;
                    padding: 8px;
                    font-size: 10px;
                    font-family: monospace;
                }
                #cybersec-scraper-ui .close-btn {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: transparent;
                    color: #888;
                    font-size: 18px;
                    padding: 0;
                    margin: 0;
                }
                #cybersec-scraper-ui .close-btn:hover {
                    color: #fff;
                    background: transparent;
                }
            </style>
            <button class="close-btn" id="close-scraper">×</button>
            <h3>RepVue Cybersecurity Scraper</h3>
            <div>
                <button id="start-scrape">Start Scraping</button>
                <button id="export-csv">Export CSV</button>
                <button id="export-json">Export JSON</button>
            </div>
            <div class="status" id="scrape-status">Ready. Click "Start Scraping" to begin.</div>
            <div class="results" id="results-container"></div>
            <textarea id="raw-output" placeholder="Results will appear here..."></textarea>
        `;
        document.body.appendChild(container);

        document.getElementById('close-scraper').addEventListener('click', () => {
            container.style.display = container.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('start-scrape').addEventListener('click', startScraping);
        document.getElementById('export-csv').addEventListener('click', exportCSV);
        document.getElementById('export-json').addEventListener('click', exportJSON);
    }

    function updateStatus(message) {
        document.getElementById('scrape-status').textContent = message;
    }

    function isCybersecurityCompany(name, description) {
        const lowerName = name.toLowerCase();
        const lowerDesc = (description || '').toLowerCase();

        // Check if it's a known cybersecurity company
        for (const known of KNOWN_CYBERSECURITY_COMPANIES) {
            if (lowerName.includes(known)) {
                return true;
            }
        }

        // Check for cybersecurity keywords in description
        for (const keyword of CYBERSECURITY_KEYWORDS) {
            if (lowerDesc.includes(keyword)) {
                return true;
            }
        }

        return false;
    }

    function parseCompaniesFromPage(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const companies = [];

        // Find all company cards/links
        const companyLinks = doc.querySelectorAll('a[href^="/companies/"]');

        companyLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href === '/companies') return;

            const text = link.textContent || '';

            // Extract company name (appears multiple times, get unique)
            const nameMatch = text.match(/\*\*([^*]+)\*\*/);
            let name = '';

            // Try to find bold text pattern or just get first significant text
            const boldElements = link.querySelectorAll('strong, b');
            if (boldElements.length > 0) {
                name = boldElements[0].textContent.trim();
            } else {
                // Fallback: extract from text content
                const lines = text.split('\n').filter(l => l.trim());
                name = lines[0]?.trim() || '';
            }

            // Extract quota attainment
            const quotaMatch = text.match(/Quota Attainment\s*(\d+)%/);
            const quota = quotaMatch ? parseInt(quotaMatch[1]) : null;

            // Extract RepVue score
            const scoreMatch = text.match(/(\d+\.\d+)\s*\n/);
            const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

            // Extract ratings count
            const ratingsMatch = text.match(/(\d+(?:,\d+)?)\s*Ratings/);
            const ratings = ratingsMatch ? parseInt(ratingsMatch[1].replace(',', '')) : null;

            // Extract description
            const descLines = text.split('\n').filter(l => l.trim() && l.length > 50);
            const description = descLines.length > 0 ? descLines[0].trim() : '';

            // Check if hiring
            const isHiring = text.includes('HIRING');

            if (name && quota !== null) {
                companies.push({
                    name: name,
                    url: 'https://www.repvue.com' + href,
                    quotaAttainment: quota,
                    repvueScore: score,
                    ratings: ratings,
                    description: description,
                    isHiring: isHiring
                });
            }
        });

        return companies;
    }

    function scrapeCurrentPage() {
        const companies = [];

        // Select all company card links
        const companyCards = document.querySelectorAll('a[href^="/companies/"]');

        companyCards.forEach(card => {
            const href = card.getAttribute('href');
            if (!href || href === '/companies' || href.includes('?')) return;

            const cardText = card.innerText || card.textContent || '';

            // Extract company name
            let name = '';
            const strongEl = card.querySelector('strong');
            if (strongEl) {
                name = strongEl.textContent.trim();
            }

            if (!name) {
                // Try getting from the structure
                const textParts = cardText.split('\n').filter(p => p.trim());
                if (textParts.length > 0) {
                    name = textParts[0].trim();
                }
            }

            // Extract quota attainment
            const quotaMatch = cardText.match(/Quota Attainment\s*(\d+)%/i);
            const quota = quotaMatch ? parseInt(quotaMatch[1]) : null;

            // Extract score (number with decimal before "Ratings")
            const scoreMatch = cardText.match(/(\d+\.\d+)\s*\n?\s*\d/);
            const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

            // Extract ratings
            const ratingsMatch = cardText.match(/([\d,]+)\s*Ratings/i);
            const ratings = ratingsMatch ? parseInt(ratingsMatch[1].replace(/,/g, '')) : null;

            // Get description (longer text segment)
            const descMatch = cardText.match(/Software\s*\n\s*Quota Attainment\s*\d+%\s*\n\s*(.+?)\s*\n\s*\d+\.\d+/s);
            const description = descMatch ? descMatch[1].trim() : '';

            // Check hiring status
            const isHiring = cardText.includes('HIRING');

            if (name && quota !== null) {
                companies.push({
                    name: name,
                    url: 'https://www.repvue.com' + href,
                    quotaAttainment: quota,
                    repvueScore: score,
                    ratings: ratings,
                    description: description,
                    isHiring: isHiring
                });
            }
        });

        // Deduplicate by URL
        const seen = new Set();
        return companies.filter(c => {
            if (seen.has(c.url)) return false;
            seen.add(c.url);
            return true;
        });
    }

    async function fetchPage(pageNum) {
        const baseUrl = new URL(window.location.href);
        baseUrl.searchParams.set('page', pageNum);

        const response = await fetch(baseUrl.toString());
        return await response.text();
    }

    function getTotalPages() {
        // Look for pagination info
        const paginationText = document.body.innerText;
        const totalMatch = paginationText.match(/All Companies\s*(\d+)/);
        if (totalMatch) {
            const total = parseInt(totalMatch[1]);
            return Math.ceil(total / 100); // 100 per page
        }
        return 3; // Default assumption
    }

    async function startScraping() {
        if (isScrapingInProgress) return;

        isScrapingInProgress = true;
        allCompanies = [];
        document.getElementById('start-scrape').disabled = true;

        totalPages = getTotalPages();
        updateStatus(`Starting scrape... Found ${totalPages} pages to process.`);

        for (let page = 1; page <= totalPages; page++) {
            updateStatus(`Scraping page ${page} of ${totalPages}...`);

            try {
                if (page === 1) {
                    // Current page
                    const pageCompanies = scrapeCurrentPage();
                    allCompanies = allCompanies.concat(pageCompanies);
                } else {
                    // Fetch other pages
                    const html = await fetchPage(page);
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    // Parse from fetched HTML
                    const pageCompanies = [];
                    const cards = doc.querySelectorAll('a[href^="/companies/"]');

                    cards.forEach(card => {
                        const href = card.getAttribute('href');
                        if (!href || href === '/companies' || href.includes('?')) return;

                        const cardText = card.innerText || card.textContent || '';

                        let name = '';
                        const strongEl = card.querySelector('strong');
                        if (strongEl) {
                            name = strongEl.textContent.trim();
                        }

                        const quotaMatch = cardText.match(/Quota Attainment\s*(\d+)%/i);
                        const quota = quotaMatch ? parseInt(quotaMatch[1]) : null;

                        const scoreMatch = cardText.match(/(\d+\.\d+)\s*\n?\s*\d/);
                        const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

                        const ratingsMatch = cardText.match(/([\d,]+)\s*Ratings/i);
                        const ratings = ratingsMatch ? parseInt(ratingsMatch[1].replace(/,/g, '')) : null;

                        const descMatch = cardText.match(/Software\s*\n\s*Quota Attainment\s*\d+%\s*\n\s*(.+?)\s*\n\s*\d+\.\d+/s);
                        const description = descMatch ? descMatch[1].trim() : '';

                        const isHiring = cardText.includes('HIRING');

                        if (name && quota !== null) {
                            pageCompanies.push({
                                name: name,
                                url: 'https://www.repvue.com' + href,
                                quotaAttainment: quota,
                                repvueScore: score,
                                ratings: ratings,
                                description: description,
                                isHiring: isHiring
                            });
                        }
                    });

                    // Deduplicate
                    const seen = new Set(allCompanies.map(c => c.url));
                    const newCompanies = pageCompanies.filter(c => !seen.has(c.url));
                    allCompanies = allCompanies.concat(newCompanies);
                }

                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`Error scraping page ${page}:`, error);
                updateStatus(`Error on page ${page}: ${error.message}`);
            }
        }

        // Filter for cybersecurity companies
        const cybersecCompanies = allCompanies.filter(c =>
            isCybersecurityCompany(c.name, c.description)
        );

        // Sort by quota attainment (ascending - worst first)
        cybersecCompanies.sort((a, b) => a.quotaAttainment - b.quotaAttainment);

        // Display results
        displayResults(cybersecCompanies);

        updateStatus(`Complete! Found ${cybersecCompanies.length} cybersecurity companies out of ${allCompanies.length} total.`);

        document.getElementById('start-scrape').disabled = false;
        isScrapingInProgress = false;
    }

    function displayResults(companies) {
        const container = document.getElementById('results-container');
        const textarea = document.getElementById('raw-output');

        let html = '';
        let text = 'PUBLICLY TRADED B2B CYBERSECURITY COMPANIES (Sorted by Lowest Quota Attainment)\n';
        text += '='.repeat(80) + '\n\n';

        companies.forEach((company, index) => {
            html += `
                <div class="company-item">
                    <div class="name">${index + 1}. ${company.name}</div>
                    <div><span class="quota">Quota: ${company.quotaAttainment}%</span> | <span class="score">Score: ${company.repvueScore || 'N/A'}</span> | Ratings: ${company.ratings || 'N/A'}</div>
                    <div style="font-size:10px;color:#888;margin-top:3px;">${company.isHiring ? '🟢 HIRING' : ''}</div>
                </div>
            `;

            text += `${index + 1}. ${company.name}\n`;
            text += `   Quota Attainment: ${company.quotaAttainment}%\n`;
            text += `   RepVue Score: ${company.repvueScore || 'N/A'}\n`;
            text += `   Ratings: ${company.ratings || 'N/A'}\n`;
            text += `   Hiring: ${company.isHiring ? 'Yes' : 'No'}\n`;
            text += `   URL: ${company.url}\n`;
            text += `   Description: ${company.description.substring(0, 100)}...\n`;
            text += '\n';
        });

        container.innerHTML = html;
        textarea.value = text;

        // Store for export
        window.cybersecResults = companies;
    }

    function exportCSV() {
        const companies = window.cybersecResults || [];
        if (companies.length === 0) {
            alert('No results to export. Run the scraper first.');
            return;
        }

        let csv = 'Rank,Company Name,Quota Attainment %,RepVue Score,Ratings,Hiring,URL,Description\n';

        companies.forEach((company, index) => {
            const desc = (company.description || '').replace(/"/g, '""');
            csv += `${index + 1},"${company.name}",${company.quotaAttainment},${company.repvueScore || ''},${company.ratings || ''},${company.isHiring ? 'Yes' : 'No'},"${company.url}","${desc}"\n`;
        });

        downloadFile(csv, 'repvue-cybersecurity-companies.csv', 'text/csv');
    }

    function exportJSON() {
        const companies = window.cybersecResults || [];
        if (companies.length === 0) {
            alert('No results to export. Run the scraper first.');
            return;
        }

        const data = {
            exportDate: new Date().toISOString(),
            totalCompanies: companies.length,
            companies: companies.map((c, i) => ({ rank: i + 1, ...c }))
        };

        downloadFile(JSON.stringify(data, null, 2), 'repvue-cybersecurity-companies.json', 'application/json');
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }

})();
