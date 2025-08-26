# 🏦 Openbank Balance Manipulator

A professional admin dashboard for manipulating balance values in Openbank HTML files. This system allows administrators to easily modify financial balance values and save changes directly to the HTML file.

## ✨ Features

- **Professional Admin Dashboard** - Clean, modern interface for balance management
- **Real-time Balance Detection** - Automatically extracts current balance values from HTML
- **Multiple Balance Types** - Supports 6 different balance fields:
  - Account Total Balance (430.26 €)
  - Individual Account Balance (0.00 €)
  - Total Savings Balance (0.00 €)
  - Monthly Expenses - Agosto (0.00 €)
  - Savings & Investments Total (0.00 €)
  - Total Lending (0.00 €)
- **Avatar Customization** - Change user profile settings:
  - User Display Name (Alfonso)
- **Change Preview** - Preview all changes before applying them
- **Direct File Modification** - Saves changes directly to the HTML file
- **Error Handling** - Comprehensive error handling and status reporting

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 16.0.0 or higher) - [Download here](https://nodejs.org/)
- **Openbank.html** file in the project directory

### Installation & Setup

1. **Download/Clone** all project files to a folder
2. **Place your Openbank.html file** in the same folder
3. **Run the startup script**:

   ```bash
   # On Windows
   start-dashboard.bat

   # Or manually with npm
   npm install
   npm start
   ```

4. **Open your browser** and go to: `http://localhost:3000`

## 🎯 Usage Guide

### Step 1: Access the Dashboard

1. Run `start-dashboard.bat` or `npm start`
2. Open your browser to `http://localhost:3000`
3. The dashboard will automatically load current balance values

### Step 2: Modify Values

1. **View Current Values** - All current balances and profile info are displayed in the "Current:" sections
2. **Enter New Values** - Type new values in the balance input fields
3. **Customize Avatar** - Change the user display name:
   - **Display Name**: Enter a new name to replace "Alfonso"
4. **Preview Changes** - Click "👁️ Preview Changes" to see what will be modified
5. **Apply Changes** - Click "💾 Apply Changes" to save to the HTML file

### Step 3: Verify Changes

- The system will show a success message when changes are applied
- Current values will automatically refresh to show updated balances
- The `Openbank.html` file is directly modified with your new values

## 🔧 API Endpoints

The system provides REST API endpoints for programmatic access:

- `GET /` - Admin Dashboard Interface
- `GET /api/health` - System health check
- `GET /api/current-balances` - Get current balance values
- `POST /api/update-balances` - Update balance values

### Example API Usage

```javascript
// Get current balances
fetch("/api/current-balances")
  .then((response) => response.json())
  .then((data) => console.log(data.balances));

// Update balances
fetch("/api/update-balances", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    balances: {
      accountTotalBalance: "1000.50",
      individualAccountBalance: "500.25",
      // ... other balance fields
    },
  }),
});
```

## 📊 Supported Fields

| Field Name                 | Description                 | Default Value | HTML Selector                                           |
| -------------------------- | --------------------------- | ------------- | ------------------------------------------------------- |
| `accountTotalBalance`      | Main account total balance  | 430.26 €      | `.glb-position-financial-card-header-col__amount`       |
| `individualAccountBalance` | Individual account balance  | 0.00 €        | `.glb-position-financial-card-item__amount`             |
| `totalSavingsBalance`      | Total savings balance       | 0.00 €        | `.global-position-total-balance__amount`                |
| `monthlyExpenses`          | Monthly expenses (Agosto)   | 0.00 €        | `.expenses-summary-box__header__expenses--total`        |
| `savingsInvestmentsTotal`  | Total savings & investments | 0.00 €        | Text-based: `contains("Total savings and investments")` |
| `totalLending`             | Total lending amount        | 0.00 €        | Text-based: `contains("Total Lending")`                 |
| `avatarName`               | User display name           | Alfonso       | `.avatar-component__alias span span`                    |

## 📁 Multi-File Support

The balance manipulator now supports multiple Openbank HTML files:

| File                            | Description                | Supported Fields                                                                    |
| ------------------------------- | -------------------------- | ----------------------------------------------------------------------------------- |
| **Openbank.html**               | Main Openbank interface    | All balance fields, expenses, savings, lending, **card digits (global)**, user name |
| **Openbank-direct-debits.html** | Direct debits interface    | Account balance, card digits (...XXXX), available amounts, user name                |
| **Openbank-cards.html**         | Cards management interface | Card last 4 digits (XXXX), user name                                                |
| **Openbank-transfers.html**     | Transfers interface        | **Card digits (global)**, user name                                                 |

### Card Digits Formatting

- **Direct Debits**: Maintains "..." prefix (e.g., "...2150")
- **Cards**: Pure 4-digit format (e.g., "1704")
- **Global Sync**: Openbank.html ↔ Transfers.html sync automatically

### 🔄 Global Card Digits Sync

- **Global Updates**: When you edit card digits in **Openbank.html** or **Openbank-transfers.html**, both files update automatically
- **Smart Formatting**: Automatically preserves "..." prefix format
- **Bi-directional**: Changes from either file apply to both files
- **Real-time**: Updates happen immediately when you save changes
- **Logging**: Shows exactly which files were updated

### Global Avatar Name

- **User Display Name**: Changes apply globally across **ALL HTML files** in the entire project
- When you update the name, it automatically scans and updates every HTML file that contains the avatar element
- **Multiple Elements**: Updates ALL avatar instances in each file (not just the first one)
- Includes all Openbank pages: main, cards, direct debits, deposits, transfers, insurances, loans, mortgages, and more
- **Detailed Logging**: Shows exactly which elements were updated in each file

## 🛠️ Technical Details

### Architecture

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with Express.js
- **HTML Parser**: Cheerio for jQuery-like server-side HTML manipulation
- **File Operations**: Node.js filesystem APIs

### File Structure

```
openbank-balance-manipulator/
├── admin-dashboard.html    # Admin dashboard interface
├── server.js              # Node.js server and API
├── package.json           # Dependencies and scripts
├── start-dashboard.bat    # Windows startup script
├── README.md              # This documentation
└── Openbank.html          # Target HTML file (your file)
```

### Dependencies

- **express**: ^4.18.2 - Web server framework
- **cheerio**: ^1.0.0-rc.12 - Server-side HTML parsing

## 🔒 Security Notes

- This tool directly modifies HTML files - always backup your original files
- Designed for local/admin use only - not recommended for production web deployment
- No authentication built-in - secure your environment appropriately

## 🐛 Troubleshooting

### Common Issues

**"Node.js is not installed"**

- Download and install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your command prompt/terminal after installation

**"Openbank.html not found"**

- Ensure the HTML file is in the same directory as the project files
- Check the filename matches exactly: `Openbank.html`

**"Port 3000 is already in use"**

- Close other applications using port 3000
- Or modify the PORT in `server.js` to use a different port

**Changes not reflecting**

- Try refreshing the browser page
- Check browser console for JavaScript errors
- Verify the HTML file has write permissions

### Debug Mode

To enable detailed logging, modify `server.js` and add:

```javascript
const DEBUG = true; // Add this line at the top
```

## 📝 Changelog

### Version 1.5.0 (Latest)

- 🚀 **Transfers Support**: Added support for `Openbank-transfers.html`
- 🔄 **Global Card Digits**: Card digits sync between Openbank.html ↔ Transfers.html automatically
- 💳 **Bi-directional Sync**: Update card digits from either file, both files update instantly
- 🎯 **Smart Formatting**: Automatically preserves "..." prefix format
- 📄 **Four File System**: Now supports Openbank.html, direct debits, cards, and transfers

### Version 1.4.0

- 🆕 **Cards Support**: Added support for `Openbank-cards.html`
- 💳 **Card Numbers**: Edit last 4 digits of card numbers (XXXX format)
- 🔄 **Three File System**: Now supports Openbank.html, direct debits, and cards
- 📱 **UI Enhanced**: Updated dashboard with cards file option
- 🌐 **Global Avatar**: User display name changes now apply across ALL HTML files in the entire project automatically

### Version 1.3.0

- ✨ **Multi-File Support**: Added support for `Openbank-direct-debits.html`
- 📝 **New Fields**: Balance in accounts, card last 4 digits, available amounts
- 🔄 **Dynamic UI**: File selector dropdown with dynamic field generation
- 🛠️ **Enhanced Backend**: File-specific extraction and update logic
- 📊 **Better Organization**: Separate field configurations per file type

### Version 1.2.0

- 🔧 **SIMPLIFIED**: Removed avatar image functionality (name-only customization)
  - Avatar image changes were causing issues for users
  - Kept user display name customization
  - Simplified dashboard interface

### Version 1.1.0

- ✨ **NEW**: Avatar customization functionality
  - Change user display name (Alfonso → Your Name)
  - Update profile picture with URLs or base64 images
  - Live avatar preview in dashboard
  - Support for various image formats
- 🐛 **FIXED**: Total Lending field now updates correctly
- 🔧 **IMPROVED**: Better text-based selectors for summary sections
- 📚 **DOCS**: Enhanced documentation with avatar tips

### Version 1.0.0

- Initial release
- Professional admin dashboard interface
- Support for 6 balance field types
- Real-time balance detection and modification
- Change preview functionality
- Direct HTML file manipulation
- Comprehensive error handling

## 🤝 Support

For issues or questions:

1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Ensure file permissions allow reading/writing the HTML file

## 📄 License

MIT License - Feel free to use and modify as needed for your administrative purposes.

---

**🎯 Ready to manage your Openbank balances? Run `start-dashboard.bat` and open http://localhost:3000!**
