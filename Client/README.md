# AlphaByte Frontend

React-based frontend for the AlphaByte Event Management System, built with Vite and Tailwind CSS.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 🛠️ Tech Stack

- **React 19.2** - UI library with latest features
- **Vite 7** - Lightning-fast build tool
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **React Router DOM 7** - Client-side routing
- **Recharts 3** - Charts and data visualization
- **Lucide React** - Beautiful icon library
- **QRCode.react** - QR code generation and scanning

## 📦 Available Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── admin/       # Admin-specific components
│   └── organizer/   # Organizer-specific components
├── context/         # React Context providers
├── layouts/         # Layout wrappers (Admin, Organizer, Participant)
├── pages/           # Page components by role
├── services/        # API integration layer
└── assets/          # Static assets
```

## 🔧 Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🎨 Features

- Role-based dashboards (Admin, Organizer, Participant)
- QR code generation and scanning
- Real-time analytics with Recharts
- Responsive design with Tailwind CSS
- Protected routes with JWT authentication
- Modern UI with Lucide icons

## 📱 Responsive Design

Optimized for all screen sizes:
- Mobile: 320px+
- Tablet: 768px+
- Desktop: 1024px+

## 🚀 Deployment

Built for Vercel deployment with optimized settings in `vercel.json`.

```bash
npm run build
vercel --prod
```

---

See main [README.md](../README.md) for complete project documentation.
