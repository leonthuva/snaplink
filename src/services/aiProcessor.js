require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const cheerio = require('cheerio');

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS) || 10000;
const MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES) || 1;

let genAI = null;
function getGenAI() {
  if (!genAI && API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

function extractKeywords(url) {
  const hostname = new URL(url).hostname.replace('www.', '');
  const parts = hostname.split('.');
  const domain = parts[0];

  const keywordMap = {
    github: ['development', 'code', 'repository'],
    gitlab: ['development', 'code', 'repository'],
    bitbucket: ['development', 'code', 'repository'],
    stackoverflow: ['programming', 'questions', 'answers'],
    stackexchange: ['programming', 'questions', 'answers'],
    npm: ['javascript', 'package', 'nodejs'],
    pypi: ['python', 'package', 'library'],
    maven: ['java', 'package', 'library'],
    nuget: ['dotnet', 'package', 'library'],
    docker: ['container', 'devops', 'deployment'],
    kubernetes: ['container', 'orchestration', 'devops'],
    aws: ['cloud', 'amazon', 'infrastructure'],
    azure: ['cloud', 'microsoft', 'infrastructure'],
    gcp: ['cloud', 'google', 'infrastructure'],
    nodejs: ['javascript', 'runtime', 'backend'],
    react: ['javascript', 'frontend', 'library'],
    vuejs: ['javascript', 'frontend', 'framework'],
    angular: ['javascript', 'frontend', 'framework'],
    svelte: ['javascript', 'frontend', 'compiler'],
    nextjs: ['javascript', 'react', 'framework'],
    vercel: ['hosting', 'deployment', 'frontend'],
    netlify: ['hosting', 'deployment', 'frontend'],
    heroku: ['hosting', 'deployment', 'paas'],
    mongodb: ['database', 'nosql', 'document'],
    postgresql: ['database', 'sql', 'relational'],
    mysql: ['database', 'sql', 'relational'],
    redis: ['database', 'cache', 'key-value'],
    elasticsearch: ['search', 'analytics', 'engine'],
    kafka: ['messaging', 'streaming', 'event-driven'],
    rabbitmq: ['messaging', 'queue', 'amqp'],
    grafana: ['monitoring', 'visualization', 'dashboard'],
    prometheus: ['monitoring', 'metrics', 'alerting'],
    jenkins: ['ci-cd', 'automation', 'pipeline'],
    githubactions: ['ci-cd', 'automation', 'workflow'],
    gitlabci: ['ci-cd', 'automation', 'pipeline'],
    terraform: ['infrastructure', 'iac', 'devops'],
    ansible: ['automation', 'configuration', 'devops'],
    linux: ['os', 'kernel', 'open-source'],
    ubuntu: ['linux', 'distribution', 'server'],
    debian: ['linux', 'distribution', 'stable'],
    arch: ['linux', 'distribution', 'rolling'],
    alpine: ['linux', 'container', 'lightweight'],
    nginx: ['web-server', 'reverse-proxy', 'performance'],
    apache: ['web-server', 'http', 'open-source'],
    postgres: ['database', 'sql', 'relational'],
    sqlite: ['database', 'embedded', 'lightweight'],
    firebase: ['backend', 'realtime', 'google'],
    supabase: ['backend', 'postgresql', 'open-source'],
    planetcale: ['database', 'mysql', 'serverless'],
    neon: ['database', 'postgresql', 'serverless'],
    cloudflare: ['cdn', 'security', 'edge'],
    fastly: ['cdn', 'edge', 'performance'],
    stripe: ['payments', 'api', 'finance'],
    paypal: ['payments', 'finance', 'api'],
    twilio: ['communications', 'api', 'sms'],
    sendgrid: ['email', 'api', 'communications'],
    slack: ['communication', 'team', 'collaboration'],
    discord: ['communication', 'community', 'chat'],
    notion: ['productivity', 'notes', 'database'],
    figma: ['design', 'ui', 'prototyping'],
    'vs-code': ['editor', 'ide', 'microsoft'],
    vscode: ['editor', 'ide', 'microsoft'],
    intellij: ['ide', 'java', 'jetbrains'],
    pycharm: ['ide', 'python', 'jetbrains'],
    webstorm: ['ide', 'javascript', 'jetbrains'],
    golang: ['go', 'language', 'backend'],
    rust: ['language', 'systems', 'memory-safe'],
    python: ['language', 'scripting', 'data-science'],
    java: ['language', 'jvm', 'enterprise'],
    kotlin: ['language', 'jvm', 'android'],
    swift: ['language', 'ios', 'apple'],
    typescript: ['javascript', 'typed', 'frontend'],
    deno: ['javascript', 'runtime', 'secure'],
    bun: ['javascript', 'runtime', 'fast'],
    electron: ['desktop', 'javascript', 'cross-platform'],
    tauri: ['desktop', 'rust', 'cross-platform'],
    flutter: ['mobile', 'dart', 'cross-platform'],
    'react-native': ['mobile', 'javascript', 'cross-platform'],
    expo: ['mobile', 'react-native', 'framework'],
    android: ['mobile', 'google', 'os'],
    ios: ['mobile', 'apple', 'os'],
    macos: ['desktop', 'apple', 'os'],
    windows: ['desktop', 'microsoft', 'os'],
  };

  const keywords = keywordMap[domain.toLowerCase()] || [];

  if (keywords.length >= 3) {
    return keywords.slice(0, 3);
  }

  const genericKeywords = ['web', 'resource', 'link'];
  return [...keywords, ...genericKeywords].slice(0, 3);
}

function generateSummary(url, tags) {
  const hostname = new URL(url).hostname.replace('www.', '');
  const domain = hostname.split('.')[0];
  const primaryTag = tags[0] || 'resource';

  const summaries = {
    development: `${domain} is a development platform for code collaboration and version control.`,
    programming: `${domain} provides programming resources and community-driven answers.`,
    javascript: `${domain} offers JavaScript tools, libraries, or frameworks for web development.`,
    python: `${domain} is a Python-focused resource for packages and development.`,
    cloud: `${domain} delivers cloud computing services and infrastructure solutions.`,
    container: `${domain} specializes in containerization and orchestration technologies.`,
    database: `${domain} provides database solutions for data storage and management.`,
    hosting: `${domain} offers hosting and deployment services for web applications.`,
    monitoring: `${domain} focuses on application monitoring and observability.`,
    'ci-cd': `${domain} enables continuous integration and deployment pipelines.`,
    automation: `${domain} provides automation tools for infrastructure and workflows.`,
    design: `${domain} offers design and prototyping tools for UI/UX.`,
    productivity: `${domain} enhances productivity with note-taking and organization features.`,
    communication: `${domain} facilitates team communication and collaboration.`,
    payments: `${domain} processes online payments and financial transactions.`,
    editor: `${domain} is a code editor or IDE for software development.`,
    language: `${domain} is a programming language or runtime environment.`,
    mobile: `${domain} supports mobile application development.`,
    desktop: `${domain} enables cross-platform desktop application development.`,
    os: `${domain} is an operating system for computers or devices.`,
  };

  return summaries[primaryTag] || `${domain} is a useful ${primaryTag} resource for developers.`;
}

async function fetchPageContent(url) {
  const response = await axios.get(url, {
    timeout: TIMEOUT_MS,
    headers: { 'User-Agent': 'SnaplinkBot/1.0 (+https://snaplink.app)' },
    maxContentLength: 50000,
    maxBodyLength: 50000,
  });

  const $ = cheerio.load(response.data);

  $('script, style, nav, footer, header, aside, noscript, iframe').remove();

  const title = $('title').text().trim() || $('h1').first().text().trim() || '';
  const metaDesc = $('meta[name="description"]').attr('content')
    || $('meta[property="og:description"]').attr('content')
    || $('meta[name="twitter:description"]').attr('content')
    || '';
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 2000);

  return { title, metaDesc, bodyText };
}

async function callGemini(prompt, retries = MAX_RETRIES) {
  const ai = getGenAI();
  if (!ai) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const model = ai.getGenerativeModel({ model: MODEL });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(parsed.tags) || typeof parsed.summary !== 'string') {
        throw new Error('Invalid response format: expected {tags: [], summary: ""}');
      }

      return {
        tags: parsed.tags.slice(0, 5).map(t => String(t).trim()).filter(Boolean),
        summary: String(parsed.summary).trim().slice(0, 300),
      };
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      const delay = 1000 * (attempt + 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

function buildPrompt({ title, metaDesc, bodyText, url }) {
  return `Given this webpage content, generate 3-5 relevant tags as a JSON array and a 1-sentence summary. Return ONLY valid JSON in this format: {"tags": ["tag1", "tag2"], "summary": "..."}

URL: ${url}
Title: ${title}
Meta Description: ${metaDesc}
Content: ${bodyText}`;
}

async function processUrl(url) {
  if (API_KEY) {
    try {
      const content = await fetchPageContent(url);
      const prompt = buildPrompt({ ...content, url });
      const result = await callGemini(prompt);
      return result;
    } catch (err) {
      console.warn('[AI] Gemini API failed, falling back to keyword method:', err.message);
    }
  } else {
    console.warn('[AI] GEMINI_API_KEY not set, using keyword-based fallback');
  }

  const tags = extractKeywords(url);
  const summary = generateSummary(url, tags);
  return { tags, summary };
}

module.exports = { processUrl, extractKeywords, generateSummary };