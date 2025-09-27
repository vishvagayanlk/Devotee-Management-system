# 🏛️ Temple Management Scripts

This directory contains all the scripts needed to set up and manage your temple management system.

## 🚀 Quick Start

### **1. Main Setup Script**
```bash
./setup.sh
```
This is the main entry point that provides a menu-driven interface for all setup options.

### **2. Quick Setup (Recommended for beginners)**
```bash
./scripts/quick-setup.sh
```
- Shows step-by-step instructions
- Displays SQL content for copying to Supabase
- Guides you through the entire process

### **3. Advanced Setup (Interactive)**
```bash
./scripts/setup-admin.sh
```
- Interactive admin creation
- Multi-temple management
- Full control over the setup process

## 📄 Available Scripts

### **Main Scripts**
| Script | Purpose | Usage |
|--------|---------|-------|
| `setup.sh` | Main setup script with menu | `./setup.sh` |
| `scripts/quick-setup.sh` | Quick setup with instructions | `./scripts/quick-setup.sh` |
| `scripts/setup-admin.sh` | Advanced admin management | `./scripts/setup-admin.sh` |
| `scripts/run-sql.sh` | SQL script runner | `./scripts/run-sql.sh` |

### **Node.js Scripts**
| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/temple-manager.js` | Multi-temple management | `node scripts/temple-manager.js` |
| `scripts/admin-manager.js` | Single temple admin management | `node scripts/admin-manager.js` |

### **SQL Scripts**
| Script | Purpose | Usage |
|--------|---------|-------|
| `supabase/migrations/20250127020000_add_admin_management.sql` | Admin management functions | Copy to Supabase SQL Editor |
| `supabase/migrations/20250127030000_add_multi_temple_support.sql` | Multi-temple support | Copy to Supabase SQL Editor |
| `run-admin-setup.sql` | Single temple admin setup | Copy to Supabase SQL Editor |
| `multi-temple-setup.sql` | Multi-temple example setup | Copy to Supabase SQL Editor |

## 🔧 Setup Process

### **Step 1: Environment Setup**
1. Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

2. Install dependencies:
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

### **Step 2: Database Migration**
1. Go to your Supabase Dashboard → SQL Editor
2. Run the migrations in order:
   - `supabase/migrations/20250127020000_add_admin_management.sql`
   - `supabase/migrations/20250127030000_add_multi_temple_support.sql`

### **Step 3: Admin Setup**
Choose one of these options:

#### **Option A: Single Temple**
```bash
./scripts/quick-setup.sh
# Choose option 3 (Single Temple Admin Setup)
# Copy the SQL content to Supabase
```

#### **Option B: Multi-Temple**
```bash
./scripts/quick-setup.sh
# Choose option 4 (Multi-Temple Setup Example)
# Copy the SQL content to Supabase
```

### **Step 4: Verification**
1. Check that admin users were created
2. Test login with new admin credentials
3. Verify temple isolation (if using multi-temple)

## 🎯 Usage Examples

### **Create a New Temple**
```bash
node scripts/temple-manager.js create-temple
```

### **Add Admin to Existing Temple**
```bash
node scripts/temple-manager.js add-admin --temple-id=<uuid>
```

### **List All Temples**
```bash
node scripts/temple-manager.js list-temples
```

### **List Temple Admins**
```bash
node scripts/temple-manager.js list-admins --temple-id=<uuid>
```

### **Create Single Temple Admin**
```bash
node scripts/admin-manager.js create
```

### **Remove Test Admin**
```bash
node scripts/admin-manager.js cleanup
```

## 🔒 Security Notes

1. **Service Role Key**: Keep the `SUPABASE_SERVICE_ROLE_KEY` secret
2. **Password Requirements**: Admin passwords must be at least 8 characters
3. **Last Admin Protection**: System prevents removing the last admin
4. **Test Account Cleanup**: Always remove test accounts before production

## 🚨 Troubleshooting

### **Common Issues**

1. **"Permission denied"**
   ```bash
   chmod +x scripts/*.sh
   chmod +x setup.sh
   ```

2. **"Node.js not found"**
   ```bash
   # Install Node.js from https://nodejs.org/
   ```

3. **"Environment variables not set"**
   ```bash
   # Check your .env file
   cat .env
   ```

4. **"SQL execution failed"**
   - Check your Supabase connection
   - Verify the SQL syntax
   - Check Supabase logs for errors

### **Verification Steps**

1. **Check Temple Setup**
   ```bash
   node scripts/temple-manager.js list-temples
   ```

2. **Verify Admin Access**
   ```bash
   node scripts/temple-manager.js list-admins --temple-id=<uuid>
   ```

3. **Test Database Connection**
   ```bash
   node scripts/admin-manager.js list
   ```

## 📞 Support

If you encounter issues:

1. Check the documentation files:
   - `ADMIN_SETUP.md`
   - `MULTI_TEMPLE_SETUP.md`

2. Verify your environment setup:
   - `.env` file is correct
   - Dependencies are installed
   - Scripts are executable

3. Check Supabase logs for detailed error messages

4. Ensure all migrations have been run successfully

## 🎉 Success!

Once setup is complete, you'll have:

- ✅ Admin management system
- ✅ Multi-temple support (if chosen)
- ✅ Complete data isolation
- ✅ Secure user management
- ✅ Easy-to-use scripts for ongoing management

Your temple management system is ready to use! 🏛️
