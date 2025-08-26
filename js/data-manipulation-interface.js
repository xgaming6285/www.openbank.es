/**
 * OpenBank Data Manipulation Interface
 * Provides easy-to-use functions for common data operations
 */

class DataManipulationInterface {
    constructor() {
        this.api = window.OpenBankData;
        this.configManager = window.ConfigManager;
        this.setupEventListeners();
    }

    /**
     * Setup global event listeners for data manipulation
     */
    setupEventListeners() {
        // Listen for data update events
        document.addEventListener('click', (e) => {
            this.handleClickEvents(e);
        });

        // Listen for form submissions
        document.addEventListener('submit', (e) => {
            this.handleFormSubmissions(e);
        });

        // Listen for input changes
        document.addEventListener('change', (e) => {
            this.handleInputChanges(e);
        });
    }

    /**
     * Handle click events for data manipulation
     */
    async handleClickEvents(event) {
        const target = event.target;

        // Edit balance buttons
        if (target.matches('[data-action="edit-balance"]')) {
            await this.handleEditBalance(target);
        }

        // Toggle card status
        if (target.matches('[data-action="toggle-card"]')) {
            await this.handleToggleCard(target);
        }

        // Add transaction
        if (target.matches('[data-action="add-transaction"]')) {
            await this.handleAddTransaction(target);
        }

        // Update settings
        if (target.matches('[data-action="update-setting"]')) {
            await this.handleUpdateSetting(target);
        }

        // Reset config
        if (target.matches('[data-action="reset-config"]')) {
            await this.handleResetConfig(target);
        }
    }

    /**
     * Handle form submissions
     */
    async handleFormSubmissions(event) {
        const form = event.target;

        if (form.matches('[data-form="transaction"]')) {
            event.preventDefault();
            await this.handleTransactionForm(form);
        }

        if (form.matches('[data-form="settings"]')) {
            event.preventDefault();
            await this.handleSettingsForm(form);
        }
    }

    /**
     * Handle input changes for real-time updates
     */
    async handleInputChanges(event) {
        const input = event.target;

        if (input.matches('[data-live-update]')) {
            const configName = input.dataset.configName;
            const propertyPath = input.dataset.propertyPath;
            let value = input.value;

            // Convert value based on input type
            if (input.type === 'number') {
                value = parseFloat(value);
            } else if (input.type === 'checkbox') {
                value = input.checked;
            }

            await this.configManager.updateConfigProperty(configName, propertyPath, value);
            this.showNotification('Setting updated successfully', 'success');
        }
    }

    /**
     * Edit account balance
     */
    async handleEditBalance(button) {
        const accountId = button.dataset.accountId;
        const account = await this.api.getAccount(accountId);
        
        if (!account) {
            this.showNotification('Account not found', 'error');
            return;
        }

        const newBalance = prompt(
            `Enter new balance for ${account.name}:`,
            account.balance.toFixed(2)
        );

        if (newBalance === null) return; // User cancelled

        if (isNaN(newBalance) || parseFloat(newBalance) < 0) {
            this.showNotification('Invalid balance amount', 'error');
            return;
        }

        try {
            await this.api.updateAccountBalance(accountId, parseFloat(newBalance));
            this.refreshAccountDisplay(accountId);
            this.showNotification('Balance updated successfully', 'success');
        } catch (error) {
            this.showNotification('Error updating balance: ' + error.message, 'error');
        }
    }

    /**
     * Toggle card status (active/blocked)
     */
    async handleToggleCard(button) {
        const cardId = button.dataset.cardId;
        const card = await this.api.getCard(cardId);
        
        if (!card) {
            this.showNotification('Card not found', 'error');
            return;
        }

        const newStatus = card.status === 'active' ? 'blocked' : 'active';
        const confirmMessage = `Are you sure you want to ${newStatus === 'blocked' ? 'block' : 'activate'} this card?`;

        if (!confirm(confirmMessage)) return;

        try {
            await this.api.updateCardStatus(cardId, newStatus);
            this.refreshCardDisplay(cardId);
            this.showNotification(`Card ${newStatus} successfully`, 'success');
        } catch (error) {
            this.showNotification('Error updating card status: ' + error.message, 'error');
        }
    }

    /**
     * Add a new transaction
     */
    async handleAddTransaction(button) {
        const accountId = button.dataset.accountId;
        
        const transaction = {
            accountId: accountId,
            amount: parseFloat(prompt('Enter transaction amount (negative for expenses):')),
            description: prompt('Enter transaction description:') || 'Manual Transaction',
            category: prompt('Enter category:') || 'other',
            type: 'manual_entry'
        };

        if (isNaN(transaction.amount)) {
            this.showNotification('Invalid amount', 'error');
            return;
        }

        try {
            const newTransaction = await this.api.addTransaction(transaction);
            
            // Update account balance
            const account = await this.api.getAccount(accountId);
            await this.api.updateAccountBalance(accountId, account.balance + transaction.amount);
            
            this.refreshTransactionDisplay();
            this.refreshAccountDisplay(accountId);
            this.showNotification('Transaction added successfully', 'success');
        } catch (error) {
            this.showNotification('Error adding transaction: ' + error.message, 'error');
        }
    }

    /**
     * Handle settings updates
     */
    async handleUpdateSetting(button) {
        const settingPath = button.dataset.settingPath;
        const currentValue = await this.api.configManager.getValue('settings', `userPreferences.${settingPath}`);
        
        let newValue;
        if (typeof currentValue === 'boolean') {
            newValue = !currentValue;
        } else {
            newValue = prompt(`Enter new value for ${settingPath}:`, currentValue);
        }

        if (newValue === null) return;

        try {
            await this.api.updateUserSetting(settingPath, newValue);
            this.showNotification('Setting updated successfully', 'success');
        } catch (error) {
            this.showNotification('Error updating setting: ' + error.message, 'error');
        }
    }

    /**
     * Reset configuration to defaults
     */
    async handleResetConfig(button) {
        const configName = button.dataset.configName;
        
        if (!confirm(`Are you sure you want to reset ${configName} configuration to defaults?`)) {
            return;
        }

        try {
            await this.configManager.resetConfig(configName);
            location.reload(); // Refresh page to show default data
        } catch (error) {
            this.showNotification('Error resetting configuration: ' + error.message, 'error');
        }
    }

    /**
     * Refresh account display
     */
    refreshAccountDisplay(accountId) {
        this.api.getAccount(accountId).then(account => {
            if (!account) return;

            const balanceElements = document.querySelectorAll(`[data-account-balance="${accountId}"]`);
            balanceElements.forEach(el => {
                el.textContent = this.formatCurrency(account.balance);
            });

            const availableElements = document.querySelectorAll(`[data-account-available="${accountId}"]`);
            availableElements.forEach(el => {
                el.textContent = this.formatCurrency(account.availableBalance);
            });
        });
    }

    /**
     * Refresh card display
     */
    refreshCardDisplay(cardId) {
        this.api.getCard(cardId).then(card => {
            if (!card) return;

            const statusElements = document.querySelectorAll(`[data-card-status="${cardId}"]`);
            statusElements.forEach(el => {
                el.textContent = card.status.charAt(0).toUpperCase() + card.status.slice(1);
                el.className = `card-status card-status--${card.status}`;
            });
        });
    }

    /**
     * Refresh transaction display
     */
    refreshTransactionDisplay() {
        const transactionContainer = document.querySelector('[data-transaction-list]');
        if (!transactionContainer) return;

        this.api.getTransactions().then(transactions => {
            // Update transaction list (implement based on your HTML structure)
            this.renderTransactions(transactionContainer, transactions);
        });
    }

    /**
     * Render transactions in container
     */
    renderTransactions(container, transactions) {
        const transactionHTML = transactions.slice(0, 10).map(transaction => `
            <div class="transaction-item" data-transaction-id="${transaction.id}">
                <div class="transaction-info">
                    <span class="transaction-description">${transaction.description}</span>
                    <span class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</span>
                </div>
                <div class="transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">
                    ${this.formatCurrency(transaction.amount)}
                </div>
            </div>
        `).join('');

        container.innerHTML = transactionHTML;
    }

    /**
     * Format currency value
     */
    formatCurrency(amount, currency = 'EUR') {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Handle close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    /**
     * Export all data as JSON
     */
    async exportAllData() {
        const allConfigs = this.configManager.exportConfig('all');
        const dataStr = JSON.stringify(allConfigs, null, 2);
        
        // Create download link
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `openbank-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully', 'success');
    }

    /**
     * Import data from JSON file
     */
    importData(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                for (const [configName, configData] of Object.entries(data)) {
                    if (this.configManager.configFiles[configName]) {
                        await this.configManager.importConfig(configName, configData);
                    }
                }
                
                this.showNotification('Data imported successfully. Refresh page to see changes.', 'success');
            } catch (error) {
                this.showNotification('Error importing data: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Global utility functions
window.OpenBankUtils = {
    // Quick balance update
    async updateBalance(accountId, amount) {
        const interface = window.DataInterface;
        const account = await interface.api.getAccount(accountId);
        await interface.api.updateAccountBalance(accountId, amount);
        interface.refreshAccountDisplay(accountId);
        interface.showNotification('Balance updated', 'success');
    },

    // Quick transaction add
    async addQuickTransaction(accountId, amount, description) {
        const interface = window.DataInterface;
        await interface.api.addTransaction({
            accountId,
            amount: parseFloat(amount),
            description: description || 'Quick Transaction',
            category: amount > 0 ? 'income' : 'expense',
            type: 'manual_entry'
        });
        
        const account = await interface.api.getAccount(accountId);
        await interface.api.updateAccountBalance(accountId, account.balance + parseFloat(amount));
        
        interface.refreshAccountDisplay(accountId);
        interface.refreshTransactionDisplay();
        interface.showNotification('Transaction added', 'success');
    },

    // Toggle card status
    async toggleCard(cardId) {
        const interface = window.DataInterface;
        const card = await interface.api.getCard(cardId);
        const newStatus = card.status === 'active' ? 'blocked' : 'active';
        await interface.api.updateCardStatus(cardId, newStatus);
        interface.refreshCardDisplay(cardId);
        interface.showNotification(`Card ${newStatus}`, 'success');
    }
};

// Initialize interface
document.addEventListener('DOMContentLoaded', () => {
    window.DataInterface = new DataManipulationInterface();
    console.log('OpenBank Data Manipulation Interface Initialized');
});
