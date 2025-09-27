# Multi-Temple Management System

This system allows you to manage multiple temples, each with their own isolated admin users, devotees, and data. Each temple operates completely independently with no cross-temple data access.

## 🏛️ Key Features

### **Temple Isolation**
- **Separate Data**: Each temple has its own devotees, events, records, and settings
- **Admin Isolation**: Temple admins can only manage their own temple's data
- **Security**: Complete data separation between temples
- **Scalability**: Support for unlimited temples

### **Multi-Tenant Architecture**
- **Temple Settings**: Each temple has its own branding, colors, and configuration
- **User Management**: Temple-specific admin and devotee management
- **Data Isolation**: Row Level Security (RLS) ensures data separation
- **Independent Operation**: Each temple operates as a separate entity

## 🚀 Quick Setup

### **Method 1: SQL Scripts (Recommended)**

1. **Run the Migration**
   ```sql
   -- Apply the multi-temple migration
   \i supabase/migrations/20250127030000_add_multi_temple_support.sql
   ```

2. **Create Multiple Temples**
   ```sql
   -- Run the multi-temple setup script
   \i multi-temple-setup.sql
   ```

### **Method 2: Node.js Script**

1. **Install Dependencies**
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

2. **Set Environment Variables**
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Run Temple Manager**
   ```bash
   # Create a new temple
   node scripts/temple-manager.js create-temple
   
   # Add admin to existing temple
   node scripts/temple-manager.js add-admin --temple-id=<uuid>
   
   # List all temples
   node scripts/temple-manager.js list-temples
   ```

## 📋 Available Functions

### **SQL Functions**

| Function | Purpose | Parameters |
|----------|---------|------------|
| `create_temple()` | Create new temple with admin | temple details + admin details |
| `create_temple_admin()` | Add admin to existing temple | temple_id + admin details |
| `get_temple_by_id()` | Get temple details | temple_id |
| `list_all_temples()` | List all temples | none |
| `list_temple_admins()` | List admins for temple | temple_id |
| `list_temple_devotees()` | List devotees for temple | temple_id |

### **Node.js Commands**

| Command | Purpose | Options |
|---------|---------|---------|
| `create-temple` | Create new temple | Interactive prompts |
| `add-admin` | Add admin to temple | `--temple-id=<uuid>` |
| `list-temples` | List all temples | None |
| `list-admins` | List temple admins | `--temple-id=<uuid>` |
| `list-devotees` | List temple devotees | `--temple-id=<uuid>` |

## 🏗️ Database Structure

### **Temple Isolation**
```sql
-- Each table now has temple_id for isolation
user_profiles (temple_id)
devotee_records (temple_id)
temple_events (temple_id)
temple_settings (id) -- Each temple has its own settings
```

### **Row Level Security (RLS)**
- **Temple Isolation**: Users can only access data from their temple
- **Admin Permissions**: Admins can only manage their temple's data
- **Data Separation**: Complete isolation between temples

## 🔧 Usage Examples

### **Creating a New Temple**

```sql
-- Create temple with admin
SELECT create_temple(
  'Sri Maha Bodhi Temple',
  'A sacred temple dedicated to the sacred Bodhi tree',
  '123 Temple Road, Anuradhapura, Sri Lanka',
  '+94-25-222-2222',
  'info@mahabodhitemple.lk',
  'https://mahabodhitemple.lk',
  'admin@mahabodhitemple.lk',
  'MainTempleAdmin123!',
  'Chief Administrator',
  '+94-77-123-4567',
  '123456789V',
  '123 Temple Road, Anuradhapura'
);
```

### **Adding Additional Admins**

```sql
-- Add secretary to temple
SELECT create_temple_admin(
  'temple-uuid-here',
  'secretary@mahabodhitemple.lk',
  'SecretaryPass123!',
  'Temple Secretary',
  '+94-77-111-2222',
  '111222333V',
  '123 Temple Road, Anuradhapura'
);
```

### **Managing Temple Data**

```sql
-- List all temples
SELECT * FROM list_all_temples();

-- List admins for specific temple
SELECT * FROM list_temple_admins('temple-uuid-here');

-- List devotees for specific temple
SELECT * FROM list_temple_devotees('temple-uuid-here');
```

## 🔒 Security Features

### **Data Isolation**
- **Temple Separation**: Each temple's data is completely isolated
- **Admin Boundaries**: Admins can only access their temple's data
- **RLS Policies**: Database-level security ensures data separation
- **User Context**: Users are automatically associated with their temple

### **Access Control**
- **Temple-Specific Admins**: Each temple has its own admin users
- **Role-Based Access**: Admins, committee, and devotees within temple context
- **Data Ownership**: Users can only access their temple's data
- **Secure Operations**: All operations are temple-scoped

## 📊 Temple Management

### **Temple Information**
Each temple has:
- **Basic Info**: Name, description, address, contact details
- **Branding**: Colors, logo, theme settings
- **Configuration**: Custom settings and preferences
- **Statistics**: Admin count, devotee count, activity metrics

### **User Management**
- **Temple Admins**: Full access to temple data and settings
- **Committee Members**: Manage temple events and records
- **Devotees**: Access to their own data and temple events
- **Isolation**: Users can only see their temple's data

## 🚨 Important Considerations

### **Migration from Single Temple**
If you're migrating from a single-temple setup:

1. **Backup Data**: Always backup before migration
2. **Assign Temple ID**: Existing users need to be assigned to a temple
3. **Update RLS**: Policies will be updated for temple isolation
4. **Test Thoroughly**: Verify data isolation works correctly

### **Temple ID Assignment**
```sql
-- Assign existing users to a temple
UPDATE user_profiles 
SET temple_id = 'your-temple-uuid-here' 
WHERE temple_id IS NULL;
```

### **Data Migration**
```sql
-- Assign existing records to a temple
UPDATE devotee_records 
SET temple_id = 'your-temple-uuid-here' 
WHERE temple_id IS NULL;

UPDATE temple_events 
SET temple_id = 'your-temple-uuid-here' 
WHERE temple_id IS NULL;
```

## 🔄 Temple Operations

### **Creating Temples**
1. **Temple Details**: Name, description, contact information
2. **Admin Setup**: Create first admin for the temple
3. **Configuration**: Set up temple-specific settings
4. **Verification**: Test temple isolation and admin access

### **Managing Admins**
1. **Add Admins**: Create additional admin users for temple
2. **Role Management**: Assign appropriate roles and permissions
3. **Access Control**: Ensure admins can only access their temple
4. **Monitoring**: Track admin activity and access

### **Data Management**
1. **Devotee Records**: Temple-specific devotee management
2. **Events**: Temple-specific event management
3. **Settings**: Temple-specific configuration and branding
4. **Reports**: Temple-specific reporting and analytics

## 📞 Support and Troubleshooting

### **Common Issues**

1. **"Temple not found"**
   - Verify temple ID is correct
   - Check if temple is active
   - Ensure proper permissions

2. **"Access denied"**
   - Check RLS policies
   - Verify user is assigned to temple
   - Ensure proper role permissions

3. **"Data not visible"**
   - Check temple_id assignment
   - Verify RLS policies
   - Ensure user is in correct temple

### **Verification Steps**

1. **Check Temple Setup**
   ```sql
   SELECT * FROM list_all_temples();
   ```

2. **Verify Admin Access**
   ```sql
   SELECT * FROM list_temple_admins('temple-uuid');
   ```

3. **Test Data Isolation**
   ```sql
   -- This should only show data for the user's temple
   SELECT * FROM user_profiles WHERE temple_id = 'user-temple-id';
   ```

## 🎯 Best Practices

### **Temple Setup**
- **Unique Names**: Use distinct temple names to avoid confusion
- **Clear Descriptions**: Provide clear temple descriptions
- **Contact Information**: Include complete contact details
- **Admin Accounts**: Create multiple admin accounts for redundancy

### **Security**
- **Strong Passwords**: Use strong passwords for all admin accounts
- **Regular Audits**: Regularly review admin access and permissions
- **Data Backup**: Regular backups of temple data
- **Access Monitoring**: Monitor admin access and activities

### **Management**
- **Documentation**: Keep records of temple configurations
- **User Training**: Train admins on temple-specific features
- **Regular Updates**: Keep the system updated with latest features
- **Support**: Provide ongoing support for temple operations

---

**Remember**: Each temple operates independently. Admins can only access their own temple's data, ensuring complete isolation and security between different temples.
