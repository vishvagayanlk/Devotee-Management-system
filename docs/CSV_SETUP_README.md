# 📊 CSV-Based Temple Setup

The easiest way to set up multiple temples and admins is using CSV files. This system allows you to define all your temples and admins in spreadsheet format, then automatically create everything with a single command.

## 🚀 Quick Start

### **1. Run the Setup Script**
```bash
./setup.sh
# Choose option 2: CSV-Based Setup
```

### **2. Or Run Directly**
```bash
./scripts/csv-setup.sh
```

## 📄 CSV File Format

### **Temples CSV (templates/temples.csv)**
```csv
temple_name,temple_description,temple_address,temple_phone,temple_email,temple_website,admin_email,admin_password,admin_name,admin_phone,admin_nic,admin_address
"Sri Maha Bodhi Temple","A sacred temple dedicated to the sacred Bodhi tree","123 Temple Road, Anuradhapura, Sri Lanka","+94-25-222-2222","info@mahabodhitemple.lk","https://mahabodhitemple.lk","admin@mahabodhitemple.lk","MainTempleAdmin123!","Chief Administrator","+94-77-123-4567","123456789V","123 Temple Road, Anuradhapura"
```

### **Additional Admins CSV (templates/additional_admins.csv)**
```csv
temple_name,admin_email,admin_password,admin_name,admin_phone,admin_nic,admin_address,role
"Sri Maha Bodhi Temple","secretary@mahabodhitemple.lk","SecretaryPass123!","Temple Secretary","+94-77-111-2222","111222333V","123 Temple Road, Anuradhapura","secretary"
```

## 🔧 Usage Examples

### **Basic Setup (Temples Only)**
```bash
# Use default templates
./scripts/csv-setup.sh

# Or specify custom files
node scripts/csv-setup.js --temples=my-temples.csv
```

### **Complete Setup (Temples + Additional Admins)**
```bash
node scripts/csv-setup.js --temples=my-temples.csv --admins=my-admins.csv
```

### **Dry Run (See What Would Be Created)**
```bash
node scripts/csv-setup.js --temples=my-temples.csv --dry-run
```

## 📋 CSV Field Descriptions

### **Temples CSV Fields**
| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `temple_name` | ✅ | Name of the temple | "Sri Maha Bodhi Temple" |
| `temple_description` | ❌ | Description of the temple | "A sacred temple dedicated to the sacred Bodhi tree" |
| `temple_address` | ❌ | Physical address | "123 Temple Road, Anuradhapura, Sri Lanka" |
| `temple_phone` | ❌ | Contact phone number | "+94-25-222-2222" |
| `temple_email` | ❌ | Contact email | "info@mahabodhitemple.lk" |
| `temple_website` | ❌ | Website URL | "https://mahabodhitemple.lk" |
| `admin_email` | ✅ | Primary admin email | "admin@mahabodhitemple.lk" |
| `admin_password` | ✅ | Admin password (min 8 chars) | "MainTempleAdmin123!" |
| `admin_name` | ✅ | Admin full name | "Chief Administrator" |
| `admin_phone` | ❌ | Admin phone number | "+94-77-123-4567" |
| `admin_nic` | ❌ | Admin NIC number | "123456789V" |
| `admin_address` | ❌ | Admin address | "123 Temple Road, Anuradhapura" |

### **Additional Admins CSV Fields**
| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `temple_name` | ✅ | Must match a temple from temples CSV | "Sri Maha Bodhi Temple" |
| `admin_email` | ✅ | Admin email | "secretary@mahabodhitemple.lk" |
| `admin_password` | ✅ | Admin password (min 8 chars) | "SecretaryPass123!" |
| `admin_name` | ✅ | Admin full name | "Temple Secretary" |
| `admin_phone` | ❌ | Admin phone number | "+94-77-111-2222" |
| `admin_nic` | ❌ | Admin NIC number | "111222333V" |
| `admin_address` | ❌ | Admin address | "123 Temple Road, Anuradhapura" |
| `role` | ❌ | Admin role (for reference) | "secretary" |

## 🛠️ Step-by-Step Setup

### **Step 1: Prepare Your Data**
1. **Copy the templates:**
   ```bash
   cp templates/temples.csv my-temples.csv
   cp templates/additional_admins.csv my-admins.csv
   ```

2. **Edit the CSV files:**
   - Open `my-temples.csv` in Excel, Google Sheets, or any text editor
   - Replace the example data with your actual temple information
   - Save the file

3. **Edit additional admins (optional):**
   - Open `my-admins.csv` in Excel, Google Sheets, or any text editor
   - Add additional admin users for each temple
   - Make sure `temple_name` matches exactly with temples CSV
   - Save the file

### **Step 2: Run the Setup**
```bash
# Interactive setup
./scripts/csv-setup.sh

# Or direct command
node scripts/csv-setup.js --temples=my-temples.csv --admins=my-admins.csv
```

### **Step 3: Verify Setup**
The script will show you:
- ✅ Successfully created temples
- ✅ Successfully created admins
- ❌ Any errors that occurred
- 📄 Results saved to `setup-results.json`

## 🔍 Validation

The script automatically validates your CSV data:

### **Temple Validation**
- ✅ All required fields are present
- ✅ Admin passwords are at least 8 characters
- ✅ Email addresses are valid format
- ✅ No duplicate temple names

### **Admin Validation**
- ✅ All required fields are present
- ✅ Admin passwords are at least 8 characters
- ✅ Temple names match existing temples
- ✅ No duplicate admin emails

## 📊 Example Setup

### **Temples CSV Example**
```csv
temple_name,temple_description,temple_address,temple_phone,temple_email,temple_website,admin_email,admin_password,admin_name,admin_phone,admin_nic,admin_address
"Sri Maha Bodhi Temple","A sacred temple dedicated to the sacred Bodhi tree","123 Temple Road, Anuradhapura, Sri Lanka","+94-25-222-2222","info@mahabodhitemple.lk","https://mahabodhitemple.lk","admin@mahabodhitemple.lk","MainTempleAdmin123!","Chief Administrator","+94-77-123-4567","123456789V","123 Temple Road, Anuradhapura"
"Temple of the Sacred Tooth","A historic temple housing the sacred tooth relic","456 Sacred Street, Kandy, Sri Lanka","+94-81-222-3333","info@toothrelictemple.lk","https://toothrelictemple.lk","admin@toothrelictemple.lk","ToothTempleAdmin123!","Temple Administrator","+94-77-234-5678","234567890V","456 Sacred Street, Kandy"
"Village Meditation Center","A peaceful meditation center for local community","789 Peaceful Lane, Galle, Sri Lanka","+94-91-333-4444","info@villagecenter.lk","https://villagecenter.lk","admin@villagecenter.lk","VillageAdmin123!","Village Administrator","+94-77-345-6789","345678901V","789 Peaceful Lane, Galle"
```

### **Additional Admins CSV Example**
```csv
temple_name,admin_email,admin_password,admin_name,admin_phone,admin_nic,admin_address,role
"Sri Maha Bodhi Temple","secretary@mahabodhitemple.lk","SecretaryPass123!","Temple Secretary","+94-77-111-2222","111222333V","123 Temple Road, Anuradhapura","secretary"
"Sri Maha Bodhi Temple","treasurer@mahabodhitemple.lk","TreasurerPass123!","Temple Treasurer","+94-77-111-3333","111333444V","123 Temple Road, Anuradhapura","treasurer"
"Temple of the Sacred Tooth","secretary@toothrelictemple.lk","SecretaryPass123!","Temple Secretary","+94-77-222-3333","222333444V","456 Sacred Street, Kandy","secretary"
"Village Meditation Center","secretary@villagecenter.lk","SecretaryPass123!","Temple Secretary","+94-77-333-4444","333444555V","789 Peaceful Lane, Galle","secretary"
```

## 🚨 Troubleshooting

### **Common Issues**

1. **"CSV file not found"**
   ```bash
   # Make sure the file exists
   ls -la my-temples.csv
   
   # Use absolute path if needed
   node scripts/csv-setup.js --temples=/full/path/to/my-temples.csv
   ```

2. **"Validation errors"**
   - Check that all required fields are filled
   - Ensure passwords are at least 8 characters
   - Verify email addresses are valid
   - Check that temple names match exactly

3. **"Temple not found"**
   - Make sure temple names in admins CSV exactly match temples CSV
   - Check for extra spaces or different capitalization

4. **"Permission denied"**
   ```bash
   chmod +x scripts/csv-setup.sh
   chmod +x scripts/csv-setup.js
   ```

### **Debug Mode**
```bash
# Run with verbose output
node scripts/csv-setup.js --temples=my-temples.csv --dry-run
```

## 📄 Output Files

### **setup-results.json**
Contains detailed results of the setup process:
```json
{
  "timestamp": "2025-01-27T10:30:00.000Z",
  "temples": [
    {
      "success": true,
      "temple_id": "uuid-here",
      "temple_name": "Sri Maha Bodhi Temple",
      "admin_email": "admin@mahabodhitemple.lk"
    }
  ],
  "admins": [
    {
      "success": true,
      "name": "Temple Secretary",
      "email": "secretary@mahabodhitemple.lk"
    }
  ],
  "errors": []
}
```

## 🎯 Best Practices

### **CSV File Management**
- **Use descriptive filenames**: `temples-2025.csv`, `admins-production.csv`
- **Keep backups**: Always backup your CSV files
- **Version control**: Track changes to your CSV files
- **Test first**: Use `--dry-run` to test before actual setup

### **Data Quality**
- **Consistent formatting**: Use consistent date formats, phone numbers
- **Valid emails**: Ensure all email addresses are valid
- **Strong passwords**: Use strong passwords for all admin accounts
- **Complete data**: Fill in as much information as possible

### **Security**
- **Secure storage**: Keep CSV files with passwords secure
- **Access control**: Limit access to CSV files with sensitive data
- **Cleanup**: Delete CSV files after setup if they contain sensitive data

## 🎉 Success!

After successful setup, you'll have:

- ✅ Multiple temples with complete isolation
- ✅ Admin users for each temple
- ✅ Additional admin users (if specified)
- ✅ Complete data separation between temples
- ✅ Ready-to-use temple management system

Your CSV-based temple setup is complete! 🏛️
