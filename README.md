# AI USTHAD - Intelligent Islamic Assistant

AI Ustad is an advanced, AI-powered scholarly assistant designed to provide accurate, context-aware Islamic knowledge. Built with a modern tech stack, it features a responsive chat interface, document analysis capabilities, and a robust admin management system.

![AI Ustad Banner](https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png)

## 🚀 Features

-   **Intelligent Chat Interface**: Real-time conversations with an AI specifically tuned for scholarly accuracy (`gemini-2.5-flash` model).
-   **Multi-Modal Capabilities**:
    -   **Text-to-Speech (TTS)**: Listen to responses with natural-sounding AI voices.
    -   **Document Analysis**: Upload PDFs (e.g., books, fatwas) to ask questions based on specific texts.
-   **Robust Authentication**: Secure user authentication via Supabase (Email/Password & Google OAuth).
-   **Admin Dashboard**:
    -   **User Management**: View and manage user accounts.
    -   **Analytics**: Track chat usage, active users, and system performance.
    -   **Knowledge Base**: Centralized management of reference documents.
    -   **System Configuration**: Manage AI API keys and system settings directly from the UI.
-   **Resilient AI Backend**:
    -   **Multi-Key Management**: Supports multiple Gemini API keys with automatic failover and load balancing.
    -   **Rate Limit Handling**: Automatically retries requests with backup keys if limits are reached.

## 🛠️ Technology Stack

-   **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/)
-   **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Edge Functions)
-   **AI Engine**: [Google Gemini API](https://ai.google.dev/) (Generative Language)
-   **Deployment**: [Vercel](https://vercel.com/) / PM2 (VPS)

## 📦 Getting Started

### Prerequisites

-   Node.js 18+
-   npm / pnpm / bun
-   A Supabase project
-   Google Gemini API Key(s)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/aiustad.git
    cd aiustad
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    
    # Initial fallback API key (optional if setting up via Admin UI)
    GEMINI_API_KEY=your_primary_gemini_key
    
    # Production Redirect URL (Important for Auth)
    NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://your-production-domain.com
    ```

4.  **Database Setup**
    Run the SQL migrations in your Supabase SQL Editor.
    -   *See [GEMINI_KEYS_SETUP.md](./GEMINI_KEYS_SETUP.md) for setting up the API key management table.*

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 🔒 Admin Access

To access the admin panel:
1.  Sign up for an account in the app.
2.  Manually update your user role in the Supabase `user_profiles` table to `'admin'`.
3.  Navigate to `/admin` or click the profile menu.

## 🌐 Deployment

### Vercel
The project is optimized for Vercel deployment. Connect your repository and add the environment variables in the Vercel dashboard.

### VPS (PM2)
1.  Build the project: `npm run build`
2.  Start with PM2: `pm2 start npm --name "aiustad" -- start`
3.  **Note**: Ensure `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` is set correctly for auth redirects to work behind a reverse proxy.

## 📄 License

This project is proprietary.