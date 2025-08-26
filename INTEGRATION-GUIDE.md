# OpenBank JSON Configuration System - Integration Guide

This guide shows you how to integrate the JSON configuration system with your existing `Openbank-cards.html` file.

## 🚀 Quick Start

### 1. File Structure
Make sure you have these files in your project:

```
your-project/
├── config/
│   ├── cards-config.json
│   ├── accounts-config.json
│   ├── products-config.json
│   ├── settings-config.json
│   └── transactions-config.json
├── js/
│   ├── config-manager.js
│   └── data-manipulation-interface.js
├── css/
│   └── data-interface.css
├── Openbank-cards.html (your existing file)
└── integration-example.html (reference example)
```

### 2. Add to Your Existing HTML

Add these lines to the `<head>` section of your `Openbank-cards.html`:

```html
<!-- Add CSS for data manipulation interface -->
<link rel="stylesheet" href="css/data-interface.css">
```

Add these lines before the closing `</body>` tag:

```html
<!-- JSON Configuration System -->
<script src="js/config-manager.js"></script>
<script src="js/data-manipulation-interface.js"></script>

<script>
// Initialize when your page loads
document.addEventListener('DOMContentLoaded', async () => {
    await ConfigManager.loadAllConfigs();
    console.log('OpenBank Configuration System Ready!');
});
</script>
```

## 📝 Basic Usage Examples

### Update Account Balance
```javascript
// In browser console or your scripts:
await OpenBankData.updateAccountBalance('acc_main', 3500.00);
```

### Add Transaction
```javascript
await OpenBankData.addTransaction({
    accountId: 'acc_main',
    amount: -75.50,
    description: 'Restaurant Payment',
    category: 'dining'
});
```

### Block/Unblock Card
```javascript
await OpenBankData.updateCardStatus('card_001', 'blocked');
```

### Update Settings
```javascript
await ConfigManager.updateConfigProperty('settings', 'userPreferences.notifications.email.enabled', false);
```

## 🎯 Adding Data Manipulation to Your Existing Elements

### Make Balance Editable
Add data attributes to your existing balance displays:

```html
<!-- Before -->
<span class="balance">€2,500.00</span>

<!-- After -->
<span class="balance" data-account-balance="acc_main">€2,500.00</span>
<button class="data-action-btn" data-action="edit-balance" data-account-id="acc_main">
    Edit Balance
</button>
```

### Make Card Status Interactive
```html
<!-- Before -->
<span class="card-status">Active</span>

<!-- After -->
<span class="card-status card-status--active" data-card-status="card_001">Active</span>
<button class="data-action-btn" data-action="toggle-card" data-card-id="card_001">
    Toggle Card
</button>
```

### Add Transaction Button
```html
<button class="data-action-btn data-action-btn--success" 
        data-action="add-transaction" 
        data-account-id="acc_main">
    Add Transaction
</button>
```

## 🔧 Configuration File Customization

### Edit JSON Files Directly
You can edit any `.json` file in the `config/` folder and the changes will be reflected immediately.

**Example: Add a new card**
```json
// In cards-config.json, add to userCards array:
{
    "id": "card_003",
    "cardTypeId": "credit_gold",
    "accountId": "acc_main",
    "cardNumber": "**** **** **** 9012",
    "holderName": "JOHN DOE",
    "expiryDate": "03/28",
    "status": "active",
    "issuedDate": "2024-01-15"
}
```

### Runtime Updates
```javascript
// Add new account
const newAccount = {
    id: 'acc_business',
    accountNumber: 'ES21 1234 5678 9012 3456 7892',
    accountType: 'business_account',
    name: 'Business Account',
    currency: 'EUR',
    balance: 10000.00,
    status: 'active'
};

const accountsConfig = await ConfigManager.loadConfig('accounts');
accountsConfig.accounts.push(newAccount);
await ConfigManager.updateConfig('accounts', accountsConfig);
```

## 🎨 UI Integration Examples

### Account Card with Live Data
```html
<div class="account-card" id="account-acc_main">
    <div class="account-card-header">
        <div>
            <h3 class="account-name">Main Current Account</h3>
            <div class="account-number">ES21 1234 5678 9012 3456 7890</div>
        </div>
        <div class="account-balance">
            <div class="balance-label">Available Balance</div>
            <div class="balance-display" data-account-balance="acc_main">
                €2,847.65
            </div>
        </div>
    </div>
    <div class="account-actions">
        <button class="data-action-btn data-action-btn--primary" 
                data-action="edit-balance" 
                data-account-id="acc_main">
            Edit Balance
        </button>
        <button class="data-action-btn" 
                data-action="add-transaction" 
                data-account-id="acc_main">
            Add Transaction
        </button>
    </div>
</div>
```

### Card with Dynamic Status
```html
<div class="openbank-card">
    <div class="card-header">
        <div class="card-type">Debit Card</div>
        <div class="card-status card-status--active" data-card-status="card_001">
            Active
        </div>
    </div>
    <div class="card-number">**** **** **** 1234</div>
    <div class="card-actions">
        <button class="data-action-btn data-action-btn--warning" 
                data-action="toggle-card" 
                data-card-id="card_001">
            Block Card
        </button>
    </div>
</div>
```

## ⚡ Quick Utility Functions

Add these to your existing JavaScript:

```javascript
// Quick balance update
async function updateBalance(accountId, newAmount) {
    await OpenBankUtils.updateBalance(accountId, newAmount);
}

// Quick transaction
async function addExpense(accountId, amount, description) {
    await OpenBankUtils.addQuickTransaction(accountId, -Math.abs(amount), description);
}

// Quick income
async function addIncome(accountId, amount, description) {
    await OpenBankUtils.addQuickTransaction(accountId, Math.abs(amount), description);
}

// Toggle card
async function toggleCard(cardId) {
    await OpenBankUtils.toggleCard(cardId);
}
```

## 📊 Data Persistence

- **LocalStorage**: Changes persist in the browser
- **Original Files**: JSON files remain unchanged unless you edit them directly
- **Reset**: Use `ConfigManager.resetConfig('configName')` to restore original data
- **Export/Import**: Built-in data export/import functionality

## 🔄 Real-time Updates

### Listen to Data Changes
```javascript
// Listen to account updates
ConfigManager.observe('accounts', (data) => {
    console.log('Accounts updated:', data);
    // Update your UI here
    refreshAccountDisplays();
});

// Listen to card updates  
ConfigManager.observe('cards', (data) => {
    console.log('Cards updated:', data);
    refreshCardDisplays();
});
```

### Auto-refresh UI Elements
```javascript
function refreshAccountDisplays() {
    document.querySelectorAll('[data-account-balance]').forEach(async (el) => {
        const accountId = el.dataset.accountId;
        const account = await OpenBankData.getAccount(accountId);
        if (account) {
            el.textContent = `€${account.balance.toLocaleString('es-ES', {minimumFractionDigits: 2})}`;
        }
    });
}
```

## 🛠️ Browser Console Commands

Open your browser's developer console and try these:

```javascript
// View all loaded configurations
ConfigManager.exportConfig('all')

// Update a balance
await OpenBankData.updateAccountBalance('acc_main', 5000)

// Add a transaction
await OpenBankData.addTransaction({
    accountId: 'acc_main', 
    amount: -100, 
    description: 'Test Purchase'
})

// Block a card
await OpenBankData.updateCardStatus('card_001', 'blocked')

// Change language setting
await ConfigManager.updateConfigProperty('settings', 'userPreferences.profile.language', 'es')

// Reset all accounts to defaults
await ConfigManager.resetConfig('accounts')
```

## 🚨 Troubleshooting

### Configuration Not Loading
1. Check file paths in `config-manager.js`
2. Ensure JSON files are valid (use online JSON validator)
3. Check browser console for errors

### Changes Not Persisting
- Changes are stored in localStorage
- Clear browser cache to reset to original JSON files
- Use `ConfigManager.resetConfig('configName')` to restore defaults

### UI Not Updating
- Ensure data attributes are correctly set
- Check if event listeners are properly bound
- Verify observer callbacks are working

## 🎉 You're Ready!

Your OpenBank application now has a powerful, database-free data manipulation system. You can:

- ✅ Edit balances, transactions, and settings in real-time
- ✅ Modify JSON configuration files directly
- ✅ Export/import all your data
- ✅ Reset to original state anytime
- ✅ Listen to data changes and update UI automatically

Happy coding! 🚀
