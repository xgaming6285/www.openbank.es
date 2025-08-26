/**
 * MongoDB Account Manager for Openbank
 * Handles frontend interactions with the MongoDB backend
 */

class OpenBankAccountManager {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.currentUserId = 'user1'; // Default user for demo
        this.accounts = [];
        this.transactions = [];
    }

    // Utility method for API calls
    async apiCall(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // Initialize sample data
    async initializeSampleData() {
        try {
            const result = await this.apiCall('/api/init-sample-data', {
                method: 'POST'
            });
            console.log('Sample data initialized:', result.message);
            return result;
        } catch (error) {
            console.error('Failed to initialize sample data:', error);
            throw error;
        }
    }

    // Get account details
    async getAccount(accountId) {
        try {
            return await this.apiCall(`/api/account/${accountId}`);
        } catch (error) {
            console.error('Failed to get account:', error);
            throw error;
        }
    }

    // Create new account
    async createAccount(accountData) {
        try {
            const newAccount = await this.apiCall('/api/accounts', {
                method: 'POST',
                body: JSON.stringify({
                    ...accountData,
                    userId: this.currentUserId,
                    accountId: 'ACC' + Date.now(), // Simple ID generation
                    accountNumber: '****' + Math.floor(Math.random() * 10000)
                })
            });
            
            // Refresh accounts list
            await this.loadAccounts();
            this.showSuccess('Account created successfully!');
            return newAccount;
        } catch (error) {
            console.error('Failed to create account:', error);
            this.showError('Failed to create account. Please try again.');
            throw error;
        }
    }

    // Update account
    async updateAccount(accountId, updateData) {
        try {
            const updatedAccount = await this.apiCall(`/api/account/${accountId}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            
            // Refresh accounts list
            await this.loadAccounts();
            this.showSuccess('Account updated successfully!');
            return updatedAccount;
        } catch (error) {
            console.error('Failed to update account:', error);
            this.showError('Failed to update account. Please try again.');
            throw error;
        }
    }

    // Delete account
    async deleteAccount(accountId) {
        try {
            await this.apiCall(`/api/account/${accountId}`, {
                method: 'DELETE'
            });
            
            // Refresh accounts list
            await this.loadAccounts();
            this.showSuccess('Account deleted successfully!');
        } catch (error) {
            console.error('Failed to delete account:', error);
            this.showError('Failed to delete account. Please try again.');
            throw error;
        }
    }

    // Load transactions for an account
    async loadTransactions(accountId, page = 1, limit = 10) {
        try {
            const result = await this.apiCall(`/api/transactions/${accountId}?page=${page}&limit=${limit}`);
            return result;
        } catch (error) {
            console.error('Failed to load transactions:', error);
            return { transactions: [], totalPages: 0, currentPage: 1, total: 0 };
        }
    }

    // Create new transaction
    async createTransaction(transactionData) {
        try {
            const newTransaction = await this.apiCall('/api/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    ...transactionData,
                    transactionId: 'TXN' + Date.now() // Simple ID generation
                })
            });
            
            // Refresh accounts to show updated balance
            await this.loadAccounts();
            this.showSuccess('Transaction created successfully!');
            return newTransaction;
        } catch (error) {
            console.error('Failed to create transaction:', error);
            this.showError('Failed to create transaction. Please try again.');
            throw error;
        }
    }

    // Get account summary
    async getAccountSummary(accountId) {
        try {
            return await this.apiCall(`/api/summary/${accountId}`);
        } catch (error) {
            console.error('Failed to get account summary:', error);
            throw error;
        }
    }

    // Render account overview in the existing page
    renderAccountOverview() {
        const container = this.getOrCreateAccountContainer();
        
        if (this.accounts.length === 0) {
            container.innerHTML = `
                <div class="account-overview-empty">
                    <h3>No accounts found</h3>
                    <p>Click "Initialize Sample Data" to create sample accounts or add a new account.</p>
                    <button onclick="accountManager.initializeSampleData().then(() => accountManager.loadAccounts())" 
                            class="btn btn-primary">Initialize Sample Data</button>
                </div>
            `;
            return;
        }

        const accountsHtml = this.accounts.map(account => `
            <div class="account-card" data-account-id="${account.accountId}">
                <div class="account-header">
                    <h4>${account.accountName}</h4>
                    <span class="account-type">${account.accountType.toUpperCase()}</span>
                </div>
                <div class="account-details">
                    <div class="account-number">${account.accountNumber}</div>
                    <div class="account-balance ${account.balance < 0 ? 'negative' : 'positive'}">
                        ${this.formatCurrency(account.balance, account.currency)}
                    </div>
                </div>
                <div class="account-actions">
                    <button onclick="accountManager.showTransactions('${account.accountId}')" class="btn btn-sm">View Transactions</button>
                    <button onclick="accountManager.showEditAccount('${account.accountId}')" class="btn btn-sm">Edit</button>
                    <button onclick="accountManager.showAddTransaction('${account.accountId}')" class="btn btn-sm btn-success">Add Transaction</button>
                    <button onclick="accountManager.deleteAccountConfirm('${account.accountId}')" class="btn btn-sm btn-danger">Delete</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="account-overview-header">
                <h3>Account Overview - MongoDB Integrated</h3>
                <button onclick="accountManager.showAddAccount()" class="btn btn-success">Add New Account</button>
            </div>
            <div class="accounts-grid">
                ${accountsHtml}
            </div>
            <div id="account-modals"></div>
        `;
    }

    // Get or create account container in the page
    getOrCreateAccountContainer() {
        let container = document.getElementById('mongodb-account-overview');
        if (!container) {
            container = document.createElement('div');
            container.id = 'mongodb-account-overview';
            container.className = 'mongodb-account-container';
            
            // Try to find a suitable place to insert the container
            const app = document.getElementById('app');
            const body = document.body;
            
            if (app) {
                app.appendChild(container);
            } else {
                body.appendChild(container);
            }
        }
        return container;
    }

    // Show add account modal
    showAddAccount() {
        const modalHtml = `
            <div class="modal-overlay" onclick="accountManager.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <h4>Add New Account</h4>
                    <form id="add-account-form" onsubmit="accountManager.handleAddAccount(event)">
                        <div class="form-group">
                            <label>Account Name:</label>
                            <input type="text" name="accountName" required>
                        </div>
                        <div class="form-group">
                            <label>Account Type:</label>
                            <select name="accountType" required>
                                <option value="checking">Checking</option>
                                <option value="savings">Savings</option>
                                <option value="credit">Credit</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Initial Balance:</label>
                            <input type="number" step="0.01" name="balance" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="accountManager.closeModal()" class="btn btn-secondary">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create Account</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    }

    // Show add transaction modal
    showAddTransaction(accountId) {
        const modalHtml = `
            <div class="modal-overlay" onclick="accountManager.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <h4>Add Transaction</h4>
                    <form id="add-transaction-form" onsubmit="accountManager.handleAddTransaction(event, '${accountId}')">
                        <div class="form-group">
                            <label>Type:</label>
                            <select name="type" required>
                                <option value="credit">Credit (Deposit)</option>
                                <option value="debit">Debit (Withdrawal)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Amount:</label>
                            <input type="number" step="0.01" name="amount" required min="0">
                        </div>
                        <div class="form-group">
                            <label>Category:</label>
                            <select name="category" required>
                                <option value="Salary">Salary</option>
                                <option value="Groceries">Groceries</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Bills">Bills</option>
                                <option value="Transfer">Transfer</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Description:</label>
                            <input type="text" name="description" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="accountManager.closeModal()" class="btn btn-secondary">Cancel</button>
                            <button type="submit" class="btn btn-primary">Add Transaction</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    }

    // Handle form submissions
    async handleAddAccount(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const accountData = {
            accountName: formData.get('accountName'),
            accountType: formData.get('accountType'),
            balance: parseFloat(formData.get('balance')),
            currency: 'EUR'
        };
        
        await this.createAccount(accountData);
        this.closeModal();
    }

    async handleAddTransaction(event, accountId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const transactionData = {
            accountId,
            amount: parseFloat(formData.get('amount')),
            type: formData.get('type'),
            category: formData.get('category'),
            description: formData.get('description')
        };
        
        await this.createTransaction(transactionData);
        this.closeModal();
    }

    // Modal utilities
    showModal(html) {
        const modalsContainer = document.getElementById('account-modals') || document.body;
        modalsContainer.innerHTML = html;
    }

    closeModal() {
        const modalsContainer = document.getElementById('account-modals');
        if (modalsContainer) {
            modalsContainer.innerHTML = '';
        }
    }

    // Confirmation for account deletion
    deleteAccountConfirm(accountId) {
        const account = this.accounts.find(acc => acc.accountId === accountId);
        if (confirm(`Are you sure you want to delete account "${account.accountName}"? This action cannot be undone.`)) {
            this.deleteAccount(accountId);
        }
    }

    // Utility methods
    formatCurrency(amount, currency = 'EUR') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 4px;
            color: white;
            z-index: 10000;
            background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Initialize the account manager
    async initialize() {
        try {
            // Load accounts on initialization
            await this.loadAccounts();
            console.log('Account Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Account Manager:', error);
            // Show initialize option if no accounts exist
            this.renderAccountOverview();
        }
    }
}

// Create global instance
const accountManager = new OpenBankAccountManager();

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => accountManager.initialize());
} else {
    accountManager.initialize();
}
