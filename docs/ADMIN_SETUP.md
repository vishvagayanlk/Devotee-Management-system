# Temple Admin Management Setup

This guide explains how to manage temple administrators, including removing test accounts and creating new production admins.

## 🚀 Quick Setup

### Method 1: SQL Scripts (Recommended)

1. **Remove Test Admin and Create New Admin**
   ```sql
   -- Run this in Supabase SQL Editor
   \i setup-admin.sql
   ```

2. **Or run individual commands:**
   ```sql
   -- Remove test admin
   SELECT remove_test_admins();
   
   -- Create new admin
   SELECT create_temple_admin(
     'admin@yourtemple.lk',
     'YourSecurePassword123!',
     'Temple Administrator',
     '0771234567',
     '123456789V',
     '123 Temple Street, Colombo, Sri Lanka'
   );
   ```

### Method 2: Node.js Script

1. **Install dependencies:**
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

2. **Set up environment variables:**
   Create a `.env` file with:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Run the admin manager:**
   ```bash
   # Create new admin (interactive)
   node scripts/admin-manager.js create
   
   # Remove specific admin
   node scripts/admin-manager.js remove --email=your-admin@temple.lk
   
   # List all admins
   node scripts/admin-manager.js list
   
   # Clean up test accounts
   node scripts/admin-manager.js cleanup
   ```

## 📋 Available Functions

### SQL Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| `create_temple_admin()` | Create new admin | email, password, name, phone, nic, address |
| `promote_to_admin()` | Promote existing user | email |
| `demote_admin()` | Demote admin to devotee | email |
| `list_admin_users()` | List all admins | none |
| `remove_test_admins()` | Remove test accounts | none |
| `delete_admin_by_email()` | Delete specific admin | email |

### Node.js Commands

| Command | Purpose | Options |
|---------|---------|---------|
| `create` | Create new admin | Interactive prompts |
| `remove` | Remove admin | `--email=your-admin@temple.lk` |
| `list` | List all admins | None |
| `cleanup` | Remove test accounts | None |

## 🔒 Security Notes

1. **Service Role Key**: Keep the `SUPABASE_SERVICE_ROLE_KEY` secret and never commit it to version control.

2. **Password Requirements**: Admin passwords must be at least 8 characters long.

3. **Last Admin Protection**: The system prevents removing the last admin user.

4. **Test Account Cleanup**: Always remove test accounts before going to production.

## 🛠️ Customization

### Creating Multiple Admins

```sql
-- Temple Secretary
SELECT create_temple_admin(
  'secretary@yourtemple.lk',
  'SecretaryPassword123!',
  'Temple Secretary',
  '0772345678',
  '234567890V',
  '456 Temple Avenue, Colombo, Sri Lanka'
);

-- Temple Treasurer
SELECT create_temple_admin(
  'treasurer@yourtemple.lk',
  'TreasurerPassword123!',
  'Temple Treasurer',
  '0773456789',
  '345678901V',
  '789 Temple Road, Colombo, Sri Lanka'
);
```

### Promoting Existing Users

```sql
-- Promote existing devotee to admin
SELECT promote_to_admin('existinguser@email.com');
```

## 🚨 Troubleshooting

### Common Issues

1. **"User already exists"**
   - Check if the email is already registered
   - Use a different email address

2. **"Cannot remove last admin"**
   - Create another admin first
   - Then remove the unwanted admin

3. **"Permission denied"**
   - Ensure you're using the service role key
   - Check Supabase RLS policies

4. **"Profile creation failed"**
   - Check database connection
   - Verify user_profiles table exists

### Verification

After creating admins, verify they work:

1. **Check in Supabase Dashboard:**
   - Go to Authentication > Users
   - Verify the admin user exists
   - Check user metadata

2. **Check in Database:**
   ```sql
   SELECT * FROM list_admin_users();
   ```

3. **Test Login:**
   - Try logging in with the new admin credentials
   - Verify admin permissions work

## 📞 Support

If you encounter issues:

1. Check the Supabase logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure the service role key has proper permissions
4. Check that all required database tables and functions exist

## 🔄 Migration from Test to Production

1. **Backup current data** (if needed)
2. **Run cleanup script** to remove test accounts
3. **Create production admin accounts**
4. **Test admin functionality**
5. **Update any hardcoded test credentials in code**

---

**Remember**: Always test admin creation in a development environment before running in production!
