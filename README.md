# DevShowcase - AI-Powered Developer Skill Analysis Platform

> Transform your GitHub projects into shareable skill scorecards with AI-powered technical interviews

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Claude AI](https://img.shields.io/badge/Claude-Sonnet%204-purple)](https://www.anthropic.com/)

## 🎯 What Makes DevShowcase Different?

DevShowcase is the **only platform** that:
- 📖 Analyzes your README to understand your project deeply
- 🤖 Generates **project-specific** technical questions (not generic ones)
- 💬 Conducts an intelligent Q&A session
- 📊 Creates comprehensive skill scorecards with AI evaluation
- 🔗 Provides shareable URLs with beautiful Open Graph previews

**No more resume flexing. Just merit-based skill evaluation.**

## ✨ Features

### Phase 1: AI README Analysis ✅
- Fetches README from GitHub repositories (supports main/master/develop branches)
- Claude Sonnet 4.5 analyzes project complexity and architecture
- Generates 5 project-specific technical questions

### Phase 2: Interactive Q&A Interface ✅
- Beautiful, intuitive question cards
- Progress tracking and auto-save
- Optional hints (affects scoring)
- Skip functionality for flexibility

### Phase 3: AI Scorecard Generation ✅
- Overall technical score (0-100)
- 5-dimensional skill breakdown
- Technology proficiency analysis
- Personalized learning recommendations
- Skill gaps identification with learning paths

### Phase 4: Social Sharing ✅
- Public shareable URLs
- Dynamic Open Graph images
- Twitter & LinkedIn integration
- View counter

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([create one](https://supabase.com))
- Anthropic API key ([get one](https://console.anthropic.com/))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Rish3666/EvalHub.git
cd EvalHub
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-your-api-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Set up Supabase database**

Go to your Supabase project → SQL Editor → New Query, then paste and run:
```sql
-- Copy contents from supabase/migrations/001_initial_schema.sql
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Project Structure

```
evalhub/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── projects/[id]/    # Project-specific endpoints
│   │   │   ├── analyze/      # AI README analysis
│   │   │   ├── answers/      # Save Q&A answers
│   │   │   ├── questions/    # Fetch questions
│   │   │   └── scorecard/    # Generate scorecard
│   │   └── og/[shareToken]/  # Dynamic OG images
│   ├── project/[id]/         # Project pages
│   │   ├── analysis/         # Q&A interface
│   │   └── scorecard/        # Scorecard display
│   ├── scorecard/[shareToken]/ # Public scorecard
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Homepage
├── components/               # React components
│   └── ui/                   # shadcn/ui components
├── lib/                      # Utilities
│   ├── ai/
│   │   └── claude.ts         # Claude AI integration
│   └── utils/
│       ├── github.ts         # GitHub API utilities
│       └── index.ts          # Helper functions
├── hooks/                    # Custom React hooks
├── supabase/
│   └── migrations/           # Database migrations
└── public/                   # Static assets
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: Anthropic Claude Sonnet 4.5
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **Deployment**: Vercel
- **OG Images**: @vercel/og

## 🎨 Key Components

### QuestionCard
Interactive Q&A interface with progress tracking, hints, and auto-save.

### ScorecardDisplay
Comprehensive skill visualization with charts, badges, and learning recommendations.

### ShareButtons
Social sharing with Twitter, LinkedIn, and copy-to-clipboard functionality.

## 🔐 Security

- Row Level Security (RLS) enabled on all Supabase tables
- API routes protected with authentication checks
- Environment variables for sensitive data
- Input validation on all user inputs

## 📊 Database Schema

```sql
users                 # User profiles
projects              # GitHub projects
project_analyses      # AI README analysis results
project_answers       # User Q&A responses
scorecards           # AI-generated skill evaluations
```

See `supabase/migrations/001_initial_schema.sql` for full schema.

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel --prod
```

### Environment Variables

Make sure to set these in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this project for your portfolio or commercial projects.

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude AI
- [Supabase](https://supabase.com/) for the backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Vercel](https://vercel.com/) for hosting

## 📧 Contact

Built by [Rish Varma](https://github.com/Rish3666)

---

**Star ⭐ this repo if you find it useful!**
