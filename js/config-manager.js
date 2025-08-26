/**
 * OpenBank Configuration Manager
 * Handles loading, caching, and updating JSON configuration files
 */

class ConfigManager {
    constructor() {
        this.configs = new Map();
        this.loadedConfigs = new Set();
        this.observers = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
        
        // Configuration file mapping
        this.configFiles = {
            cards: './config/cards-config.json',
            accounts: './config/accounts-config.json', 
            products: './config/products-config.json',
            settings: './config/settings-config.json',
            transactions: './config/transactions-config.json'
        };
    }

    /**
     * Load a specific configuration file
     * @param {string} configName - Name of the config (cards, accounts, etc.)
     * @param {boolean} forceReload - Force reload from file
     * @returns {Promise<Object>} Configuration data
     */
    async loadConfig(configName, forceReload = false) {
        const cacheKey = `config_${configName}`;
        const cached = this.getCachedConfig(configName);
        
        // Return cached version if available and not forcing reload
        if (cached && !forceReload) {
            return cached;
        }

        try {
            // Try to load from localStorage first (for updated configs)
            const localData = localStorage.getItem(cacheKey);
            if (localData && !forceReload) {
                const parsed = JSON.parse(localData);
                // Check if cache is still valid
                if (Date.now() - parsed.timestamp < this.cacheDuration) {
                    this.configs.set(configName, parsed.data);
                    this.loadedConfigs.add(configName);
                    return parsed.data;
                }
            }

            // Load from file
            const response = await fetch(this.configFiles[configName]);
            if (!response.ok) {
                throw new Error(`Failed to load config: ${configName}`);
            }
            
            const data = await response.json();
            
            // Cache the data
            this.configs.set(configName, data);
            this.loadedConfigs.add(configName);
            
            // Store in localStorage with timestamp
            localStorage.setItem(cacheKey, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
            
            // Notify observers
            this.notifyObservers(configName, data);
            
            return data;
            
        } catch (error) {
            console.error(`Error loading config ${configName}:`, error);
            
            // Fallback to any cached version available
            const fallbackData = localStorage.getItem(cacheKey);
            if (fallbackData) {
                const parsed = JSON.parse(fallbackData);
                console.warn(`Using cached fallback for ${configName}`);
                return parsed.data;
            }
            
            throw error;
        }
    }

    /**
     * Load all configuration files
     * @returns {Promise<Object>} All configuration data
     */
    async loadAllConfigs() {
        const results = {};
        const loadPromises = Object.keys(this.configFiles).map(async (configName) => {
            results[configName] = await this.loadConfig(configName);
        });
        
        await Promise.all(loadPromises);
        return results;
    }

    /**
     * Get cached configuration data
     * @param {string} configName - Configuration name
     * @returns {Object|null} Cached data or null
     */
    getCachedConfig(configName) {
        return this.configs.get(configName) || null;
    }

    /**
     * Update configuration data
     * @param {string} configName - Configuration name
     * @param {Object} updates - Updates to apply
     * @param {boolean} merge - Whether to merge with existing data
     * @returns {Object} Updated configuration
     */
    async updateConfig(configName, updates, merge = true) {
        let currentConfig = this.getCachedConfig(configName);
        
        if (!currentConfig) {
            currentConfig = await this.loadConfig(configName);
        }

        const updatedConfig = merge 
            ? this.deepMerge(currentConfig, updates)
            : updates;

        // Update memory cache
        this.configs.set(configName, updatedConfig);
        
        // Update localStorage
        const cacheKey = `config_${configName}`;
        localStorage.setItem(cacheKey, JSON.stringify({
            data: updatedConfig,
            timestamp: Date.now(),
            modified: true
        }));

        // Notify observers
        this.notifyObservers(configName, updatedConfig);

        return updatedConfig;
    }

    /**
     * Update specific nested property in config
     * @param {string} configName - Configuration name
     * @param {string} path - Dot notation path (e.g., 'userCards.0.balance')
     * @param {*} value - New value
     * @returns {Object} Updated configuration
     */
    async updateConfigProperty(configName, path, value) {
        const config = await this.loadConfig(configName);
        const pathParts = path.split('.');
        
        let target = config;
        for (let i = 0; i < pathParts.length - 1; i++) {
            const key = pathParts[i];
            if (!(key in target)) {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[pathParts[pathParts.length - 1]] = value;
        
        return await this.updateConfig(configName, config, false);
    }

    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Subscribe to configuration changes
     * @param {string} configName - Configuration to observe
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    observe(configName, callback) {
        if (!this.observers.has(configName)) {
            this.observers.set(configName, new Set());
        }
        
        this.observers.get(configName).add(callback);
        
        // Return unsubscribe function
        return () => {
            this.observers.get(configName)?.delete(callback);
        };
    }

    /**
     * Notify observers of configuration changes
     * @param {string} configName - Configuration name
     * @param {Object} data - Updated data
     */
    notifyObservers(configName, data) {
        const callbacks = this.observers.get(configName);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data, configName);
                } catch (error) {
                    console.error('Observer callback error:', error);
                }
            });
        }
    }

    /**
     * Reset configuration to original file state
     * @param {string} configName - Configuration to reset
     * @returns {Object} Reset configuration
     */
    async resetConfig(configName) {
        const cacheKey = `config_${configName}`;
        localStorage.removeItem(cacheKey);
        this.configs.delete(configName);
        
        return await this.loadConfig(configName, true);
    }

    /**
     * Export current configuration state
     * @param {string} configName - Configuration to export (or 'all')
     * @returns {Object} Configuration data
     */
    exportConfig(configName = 'all') {
        if (configName === 'all') {
            const result = {};
            this.loadedConfigs.forEach(name => {
                result[name] = this.getCachedConfig(name);
            });
            return result;
        }
        
        return this.getCachedConfig(configName);
    }

    /**
     * Import configuration data
     * @param {string} configName - Configuration name
     * @param {Object} data - Data to import
     * @returns {Object} Imported configuration
     */
    async importConfig(configName, data) {
        return await this.updateConfig(configName, data, false);
    }

    /**
     * Get configuration value by path
     * @param {string} configName - Configuration name
     * @param {string} path - Dot notation path
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value
     */
    async getValue(configName, path, defaultValue = null) {
        const config = await this.loadConfig(configName);
        const pathParts = path.split('.');
        
        let current = config;
        for (const part of pathParts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }
}

// Create global instance
window.ConfigManager = new ConfigManager();

/**
 * OpenBank Data API - Easy-to-use interface for common operations
 */
class OpenBankDataAPI {
    constructor() {
        this.configManager = window.ConfigManager;
    }

    // === ACCOUNT OPERATIONS ===
    async getAccounts() {
        const accountsConfig = await this.configManager.loadConfig('accounts');
        return accountsConfig.accounts;
    }

    async getAccount(accountId) {
        const accounts = await this.getAccounts();
        return accounts.find(acc => acc.id === accountId);
    }

    async updateAccountBalance(accountId, newBalance) {
        const accounts = await this.getAccounts();
        const accountIndex = accounts.findIndex(acc => acc.id === accountId);
        
        if (accountIndex !== -1) {
            accounts[accountIndex].balance = parseFloat(newBalance);
            accounts[accountIndex].availableBalance = parseFloat(newBalance);
            
            await this.configManager.updateConfig('accounts', { accounts }, true);
            return accounts[accountIndex];
        }
        
        throw new Error(`Account not found: ${accountId}`);
    }

    // === CARD OPERATIONS ===
    async getCards() {
        const cardsConfig = await this.configManager.loadConfig('cards');
        return cardsConfig.userCards;
    }

    async getCard(cardId) {
        const cards = await this.getCards();
        return cards.find(card => card.id === cardId);
    }

    async updateCardStatus(cardId, status) {
        const cards = await this.getCards();
        const cardIndex = cards.findIndex(card => card.id === cardId);
        
        if (cardIndex !== -1) {
            cards[cardIndex].status = status;
            await this.configManager.updateConfig('cards', { userCards: cards }, true);
            return cards[cardIndex];
        }
        
        throw new Error(`Card not found: ${cardId}`);
    }

    // === TRANSACTION OPERATIONS ===
    async getTransactions() {
        const transactionsConfig = await this.configManager.loadConfig('transactions');
        return transactionsConfig.recentTransactions;
    }

    async addTransaction(transaction) {
        const transactionsConfig = await this.configManager.loadConfig('transactions');
        const newTransaction = {
            id: `txn_${Date.now()}`,
            date: new Date().toISOString(),
            status: 'completed',
            ...transaction
        };
        
        transactionsConfig.recentTransactions.unshift(newTransaction);
        
        // Keep only last 50 transactions
        if (transactionsConfig.recentTransactions.length > 50) {
            transactionsConfig.recentTransactions = transactionsConfig.recentTransactions.slice(0, 50);
        }
        
        await this.configManager.updateConfig('transactions', transactionsConfig, true);
        return newTransaction;
    }

    // === SETTINGS OPERATIONS ===
    async getUserSettings() {
        const settingsConfig = await this.configManager.loadConfig('settings');
        return settingsConfig.userPreferences;
    }

    async updateUserSetting(settingPath, value) {
        return await this.configManager.updateConfigProperty('settings', `userPreferences.${settingPath}`, value);
    }

    // === PRODUCT OPERATIONS ===
    async getProducts() {
        return await this.configManager.loadConfig('products');
    }

    async getDeposits() {
        const products = await this.getProducts();
        return products.deposits;
    }

    async getLoans() {
        const products = await this.getProducts();
        return products.loans;
    }
}

// Create global API instance
window.OpenBankData = new OpenBankDataAPI();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Load essential configurations
    window.ConfigManager.loadConfig('accounts');
    window.ConfigManager.loadConfig('cards');
    window.ConfigManager.loadConfig('transactions');
    window.ConfigManager.loadConfig('settings');
    
    console.log('OpenBank Configuration System Initialized');
});
