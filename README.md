# 🏛️ Temple Management System

A comprehensive single-temple management system built with React, TypeScript, and Supabase for managing devotees, events, and temple administration.

## ✨ Features

- **Single Temple Management**: Simple setup for one temple with admin accounts
- **User Management**: Devotee registration, approval, and profile management
- **Event Management**: Create and manage temple events and recurring events
- **QR Code System**: Generate and scan QR codes for devotee identification
- **Multi-Language Support**: English and Sinhala language support
- **Theme Customization**: Customizable temple themes and branding
- **Mobile Responsive**: Optimized for mobile devices
- **Admin Dashboard**: Comprehensive admin panel for temple management

## 🚀 Quick Start

### **1. Run the Main Setup Script**
```bash
./setup.sh
```

This provides a menu-driven interface with multiple setup options:

- **🚀 Quick Setup** - Step-by-step instructions for beginners
- **🏛️ Single Temple Setup** - Simple admin creation for single temple
- **🔧 Advanced Setup** - Interactive admin management
- **📄 SQL Script Runner** - Direct database operations
- **📋 Instructions Only** - View setup instructions
- **❓ Help & Documentation** - Get help and view docs

### **2. Single Temple Setup (Recommended)**

The easiest way to set up your temple:

```bash
# Interactive setup
./setup.sh
# Choose option 2: Single Temple Setup

# Or direct command
node scripts/setup-single-temple.js \
  --admin-email=your-admin@temple.lk \
  --admin-password=YourSecurePassword123! \
  --admin-name="Temple Administrator" \
  --temple-name="Your Temple Name" \
  --temple-description="A beautiful temple for community worship"
```

### **3. Environment Setup**

Make sure you have a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 📋 Setup Options

### **Option 1: Quick Setup**
- Shows step-by-step instructions
- Displays SQL content for copying
- Guides you through the process

### **Option 2: Single Temple Setup**
- Create single temple with admin
- Simple command-line setup
- Perfect for single temple management

### **Option 3: Advanced Setup**
- Interactive admin creation
- Manual configuration
- Full control over the process

## 🛠️ Manual Setup

If you prefer to set up manually:

### **1. Database Setup**
Run the migration to remove multi-temple support:
```bash
node scripts/run-migration.js supabase/migrations/20250127050000_remove_multi_temple_support.sql
```

### **2. Create Admin User**
```bash
node scripts/setup-single-temple.js \
  --admin-email=your-admin@temple.lk \
  --admin-password=YourSecurePassword123! \
  --admin-name="Temple Administrator"
```

### **3. Start Development Server**
```bash
npm run dev
```

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   ├── contexts/           # React contexts (Auth, Theme, Language)
│   ├── lib/                # Utilities and configurations
│   └── utils/              # Helper functions
├── supabase/
│   └── migrations/         # Database migrations
├── scripts/                # Setup and utility scripts
└── templates/              # Template files
```

## 🔧 Available Scripts

- `./setup.sh` - Main setup script with menu
- `node scripts/setup-single-temple.js` - Single temple setup
- `node scripts/run-migration.js` - Run database migrations
- `npm run dev` - Start development server
- `npm run build` - Build for production

## 🌐 Multi-Language Support

The system supports both English and Sinhala:

- **English**: Default language
- **Sinhala**: සිංහල language support with proper fonts

Language can be switched in the top navigation bar.

## 🎨 Theme Customization

Temple themes can be customized through the admin panel:

- **Primary Colors**: Main temple colors
- **Secondary Colors**: Accent colors
- **Background Colors**: Page backgrounds
- **Text Colors**: Text and content colors
- **Font Family**: Custom fonts
- **Custom CSS**: Additional styling

## 📱 Mobile Support

The system is fully responsive and optimized for mobile devices:

- Touch-friendly interface
- Mobile-optimized navigation
- Responsive layouts
- Mobile-specific UI improvements

## 🔐 Security

- **Row Level Security (RLS)**: Database-level security
- **Role-based Access**: Admin, Committee, and Devotee roles
- **Secure Authentication**: Supabase Auth integration
- **Data Isolation**: Proper user data separation

## 🚀 Deployment

### **1. Build the Application**
```bash
npm run build
```

### **2. Deploy to Your Hosting Service**
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### **3. Configure Environment Variables**
Set the same environment variables in your hosting service.

## 📞 Support

For support and questions:

1. Check the troubleshooting guide
2. Review the setup instructions
3. Check the console for error messages
4. Ensure all environment variables are set correctly

## 🎉 Success!

Once setup is complete, you can:

1. **Login** with your admin credentials
2. **Manage Devotees** through the admin panel
3. **Create Events** for your temple
4. **Generate QR Codes** for devotee identification
5. **Customize Themes** to match your temple's branding
6. **Switch Languages** between English and Sinhala

Your temple management system is now ready to use! 🏛️