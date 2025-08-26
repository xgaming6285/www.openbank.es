const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

// Supported HTML files
const HTML_FILES = {
  openbank: "Openbank.html",
  directDebits: "Openbank-direct-debits.html",
  cards: "Openbank-cards.html",
  transfers: "Openbank-transfers.html",
};

// Middleware
app.use(express.json());
app.use(express.static("."));

// Balance field configurations for different HTML files
const FIELD_CONFIGS = {
  openbank: {
    accountTotalBalance: {
      selector:
        ".glb-position-financial-card-header-col__amount-object span span",
      context: "Total balance",
      defaultValue: "430.26",
    },
    individualAccountBalance: {
      selector: ".glb-position-financial-card-item__amount span span",
      context: "individual account",
      defaultValue: "0.00",
    },
    totalSavingsBalance: {
      selector: ".global-position-total-balance__amount span",
      context: "Total savings balance",
      defaultValue: "0.00",
    },
    monthlyExpenses: {
      selector: ".expenses-summary-box__header__expenses--total",
      context: "Agosto",
      defaultValue: "0.00 €",
    },
    savingsInvestmentsTotal: {
      selector:
        ".glb-all-position-summary__totalbalance-section .global-position-total-balance__amount span",
      context: "Total savings and investments balance",
      defaultValue: "0.00",
    },
    totalLending: {
      selector:
        ".glb-all-position-summary__totalbalance-section .global-position-total-balance__amount span",
      context: "Total Lending",
      defaultValue: "0.00",
    },
    cardLastDigits: {
      selector: ".glb-position-financial-card-item__title--small",
      context: "Card last 4 digits (Global)",
      defaultValue: "...2150",
    },
    avatarName: {
      selector: ".avatar-component__alias span span",
      context: "User display name",
      defaultValue: "Alfonso",
    },
  },
  directDebits: {
    accountsBalanceAmount: {
      selector: ".accounts-balance__amount",
      context: "Balance in your accounts",
      defaultValue: "0.00",
    },
    cardLastDigits: {
      selector: ".accounts-box-header__iban",
      context: "Card last 4 digits",
      defaultValue: "...2150",
    },
    availableAmount: {
      selector: "#lblAvailableAmount0",
      context: "Available balance",
      defaultValue: "0.00",
    },
    availableCurrency: {
      selector: "#lblAvailableCurrency0",
      context: "Available currency",
      defaultValue: "€",
    },
    avatarName: {
      selector: ".avatar-component__alias span span",
      context: "User display name",
      defaultValue: "Alfonso",
    },
  },
  cards: {
    cardLastDigits: {
      selector:
        ".card__card-number--small.card__card-number--show.card__card-number--only-number span:last-child",
      context: "Card last 4 digits",
      defaultValue: "1704",
    },
    avatarName: {
      selector: ".avatar-component__alias span span",
      context: "User display name",
      defaultValue: "Alfonso",
    },
  },
  transfers: {
    cardLastDigits: {
      selector: ".dropdown-accounts__account-description-iban",
      context: "Card last 4 digits (Global)",
      defaultValue: "...2150",
    },
    avatarName: {
      selector: ".avatar-component__alias span span",
      context: "User display name",
      defaultValue: "Alfonso",
    },
  },
};

// Backward compatibility - keep BALANCE_FIELDS for existing openbank functionality
const BALANCE_FIELDS = FIELD_CONFIGS.openbank;

/**
 * Load and parse HTML file
 */
async function loadHTMLFile(fileType = "openbank") {
  try {
    const fileName = HTML_FILES[fileType];
    if (!fileName) {
      throw new Error(`Unknown file type: ${fileType}`);
    }
    const htmlContent = await fs.readFile(fileName, "utf8");
    return cheerio.load(htmlContent);
  } catch (error) {
    console.error("Error loading HTML file:", error);
    throw new Error(`Failed to load ${fileName}: ${error.message}`);
  }
}

/**
 * Extract current balance values from HTML
 */
function extractBalanceValues($, fileType = "openbank") {
  const balances = {};
  const fieldConfig = FIELD_CONFIGS[fileType];

  if (!fieldConfig) {
    throw new Error(`Unknown file type: ${fileType}`);
  }

  try {
    // Handle openbank file with special logic for text-based selectors
    if (fileType === "openbank") {
      return extractOpenbankValues($);
    }

    // Handle direct debits file
    if (fileType === "directDebits") {
      return extractDirectDebitsValues($);
    }

    // Handle cards file
    if (fileType === "cards") {
      return extractCardsValues($);
    }

    // Handle transfers file
    if (fileType === "transfers") {
      return extractTransfersValues($);
    }

    // Generic field extraction for other file types
    for (const [fieldName, config] of Object.entries(fieldConfig)) {
      const elements = $(config.selector);
      let value = config.defaultValue;

      elements.each((i, elem) => {
        const text = $(elem).text().trim();
        if (text) {
          value = text;
          return false; // break
        }
      });

      balances[fieldName] = value;
    }

    console.log("Extracted balances:", balances);
    return balances;
  } catch (error) {
    console.error("Error extracting balance values:", error);
    // Return default values if extraction fails
    const defaultBalances = {};
    for (const [fieldName, config] of Object.entries(fieldConfig)) {
      defaultBalances[fieldName] = config.defaultValue;
    }
    return defaultBalances;
  }
}

/**
 * Extract values from Openbank.html (keeping original logic)
 */
function extractOpenbankValues($) {
  const balances = {};

  try {
    // Account Total Balance - 430.26
    const accountTotalElements = $(
      ".glb-position-financial-card-header-col__amount span span"
    );
    let accountTotal = "430.26";
    accountTotalElements.each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && !isNaN(parseFloat(text)) && text !== "€") {
        accountTotal = text;
        return false; // break
      }
    });
    balances.accountTotalBalance = accountTotal;

    // Individual Account Balance
    const individualAccountElements = $(
      ".glb-position-financial-card-item__amount span span"
    );
    let individualAccount = "0.00";
    individualAccountElements.each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && !isNaN(parseFloat(text)) && text !== "€") {
        individualAccount = text;
        return false; // break
      }
    });
    balances.individualAccountBalance = individualAccount;

    // Total Savings Balance
    const totalSavingsElements = $(
      ".global-position-total-balance__amount span"
    );
    let totalSavings = "0.00";
    totalSavingsElements.each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && !isNaN(parseFloat(text)) && text !== "€") {
        totalSavings = text;
        return false; // break
      }
    });
    balances.totalSavingsBalance = totalSavings;

    // Monthly Expenses (Agosto)
    const monthlyExpensesElements = $(
      ".expenses-summary-box__header__expenses--total"
    );
    let monthlyExpenses = "0.00";
    if (monthlyExpensesElements.length > 0) {
      const text = monthlyExpensesElements
        .first()
        .text()
        .trim()
        .replace(" €", "");
      if (text && !isNaN(parseFloat(text))) {
        monthlyExpenses = text;
      }
    }
    balances.monthlyExpenses = monthlyExpenses;

    // Savings & Investments Total (using text-based selector)
    const savingsSectionExtract = $(
      '.glb-all-position-summary__statement:contains("Total savings and investments")'
    ).closest(".glb-all-position-summary__totalbalance-section");
    let savingsInvestments = "0.00";
    if (savingsSectionExtract.length > 0) {
      const savingsAmountText = savingsSectionExtract
        .find(".global-position-total-balance__amount span")
        .first()
        .text()
        .trim();
      if (
        savingsAmountText &&
        !isNaN(parseFloat(savingsAmountText)) &&
        savingsAmountText !== "€"
      ) {
        savingsInvestments = savingsAmountText;
      }
    }
    balances.savingsInvestmentsTotal = savingsInvestments;

    // Total Lending (using text-based selector)
    const lendingSectionExtract = $(
      '.glb-all-position-summary__statement:contains("Total Lending")'
    ).closest(".glb-all-position-summary__totalbalance-section");
    let totalLending = "0.00";
    if (lendingSectionExtract.length > 0) {
      const lendingAmountText = lendingSectionExtract
        .find(".global-position-total-balance__amount span")
        .first()
        .text()
        .trim();
      if (
        lendingAmountText &&
        !isNaN(parseFloat(lendingAmountText)) &&
        lendingAmountText !== "€"
      ) {
        totalLending = lendingAmountText;
      }
    }
    balances.totalLending = totalLending;

    // Extract Avatar Name
    let avatarName = "Alfonso";

    // Extract avatar name
    const avatarNameElement = $(".avatar-component__alias span span").first();
    if (avatarNameElement.length > 0) {
      const name = avatarNameElement.text().trim();
      if (name && name !== "") {
        avatarName = name;
      }
    }

    balances.avatarName = avatarName;

    // Extract Card Last 4 Digits
    let cardLastDigits = "...2150";
    const cardDigitsElement = $(
      ".glb-position-financial-card-item__title--small"
    );
    if (cardDigitsElement.length > 0) {
      const digits = cardDigitsElement.text().trim();
      if (digits && digits !== "") {
        cardLastDigits = digits;
      }
    }
    balances.cardLastDigits = cardLastDigits;

    console.log("Extracted balances:", balances);
    return balances;
  } catch (error) {
    console.error("Error extracting balance values:", error);
    // Return default values if extraction fails
    return {
      accountTotalBalance: "430.26",
      individualAccountBalance: "0.00",
      totalSavingsBalance: "0.00",
      monthlyExpenses: "0.00",
      savingsInvestmentsTotal: "0.00",
      totalLending: "0.00",
      avatarName: "Alfonso",
      cardLastDigits: "...2150",
    };
  }
}

/**
 * Extract values from Openbank-direct-debits.html
 */
function extractDirectDebitsValues($) {
  const balances = {};

  try {
    // Balance in accounts
    const accountsBalanceElement = $(".accounts-balance__amount");
    balances.accountsBalanceAmount =
      accountsBalanceElement.text().trim() || "0.00";

    // Card last digits
    const cardDigitsElement = $(".accounts-box-header__iban");
    balances.cardLastDigits = cardDigitsElement.text().trim() || "...2150";

    // Available amount
    const availableAmountElement = $("#lblAvailableAmount0");
    balances.availableAmount = availableAmountElement.text().trim() || "0.00";

    // Available currency
    const availableCurrencyElement = $("#lblAvailableCurrency0");
    balances.availableCurrency = availableCurrencyElement.text().trim() || "€";

    // Extract Avatar Name
    let avatarName = "Alfonso";
    const avatarNameElement = $(".avatar-component__alias span span").first();
    if (avatarNameElement.length > 0) {
      const name = avatarNameElement.text().trim();
      if (name && name !== "") {
        avatarName = name;
      }
    }
    balances.avatarName = avatarName;

    console.log("Extracted direct debits balances:", balances);
    return balances;
  } catch (error) {
    console.error("Error extracting direct debits values:", error);
    // Return default values if extraction fails
    return {
      accountsBalanceAmount: "0.00",
      cardLastDigits: "...2150",
      availableAmount: "0.00",
      availableCurrency: "€",
      avatarName: "Alfonso",
    };
  }
}

/**
 * Update card digits globally across Openbank.html and Openbank-transfers.html
 */
async function updateCardDigitsGlobally(newCardDigits) {
  try {
    console.log(
      `Updating card digits globally to: ${newCardDigits} across Openbank and Transfers files...`
    );

    const filesToUpdate = ["openbank", "transfers"];
    let updatedCount = 0;
    let skippedCount = 0;

    // Process each file
    for (const fileType of filesToUpdate) {
      try {
        console.log(`Updating card digits in ${HTML_FILES[fileType]}...`);

        // Load the file
        const $ = await loadHTMLFile(fileType);

        // Update card digits using file-specific selectors
        let updated = false;
        if (fileType === "openbank") {
          const cardDigitsElement = $(
            ".glb-position-financial-card-item__title--small"
          );
          if (cardDigitsElement.length > 0) {
            const oldValue = cardDigitsElement.text().trim();
            // Ensure the "..." prefix is always preserved
            let formattedDigits = newCardDigits;
            if (!formattedDigits.startsWith("...")) {
              formattedDigits = "..." + formattedDigits.replace(/^\.+/, "");
            }
            cardDigitsElement.text(formattedDigits);
            console.log(
              `  Updated Openbank: "${oldValue}" -> "${formattedDigits}"`
            );
            updated = true;
          }
        } else if (fileType === "transfers") {
          const cardDigitsElement = $(
            ".dropdown-accounts__account-description-iban"
          );
          if (cardDigitsElement.length > 0) {
            const oldValue = cardDigitsElement.text().trim();
            // Ensure the "..." prefix is always preserved
            let formattedDigits = newCardDigits;
            if (!formattedDigits.startsWith("...")) {
              formattedDigits = "..." + formattedDigits.replace(/^\.+/, "");
            }
            cardDigitsElement.text(formattedDigits);
            console.log(
              `  Updated Transfers: "${oldValue}" -> "${formattedDigits}"`
            );
            updated = true;
          }
        }

        if (updated) {
          // Save the file
          await saveHTMLFile($, fileType);
          console.log(`✓ Updated ${HTML_FILES[fileType]}`);
          updatedCount++;
        } else {
          console.log(
            `  - Skipped ${HTML_FILES[fileType]} (card element not found)`
          );
          skippedCount++;
        }
      } catch (fileError) {
        console.error(
          `Error updating card digits in ${HTML_FILES[fileType]}:`,
          fileError
        );
        // Continue with other files even if one fails
      }
    }

    console.log(`\n💳 Card digits update completed:`);
    console.log(`   ✅ Updated: ${updatedCount} files`);
    console.log(`   ⏭️ Skipped: ${skippedCount} files`);
    console.log(`   🔢 New digits: "${newCardDigits}"`);

    return true;
  } catch (error) {
    console.error("Error updating card digits globally:", error);
    throw error;
  }
}

/**
 * Update account balance globally across Openbank.html and Openbank-transfers.html
 */
async function updateAccountBalanceGlobally(newAccountBalance) {
  try {
    console.log(
      `Updating account balance globally to: ${newAccountBalance} across Openbank and Transfers files...`
    );

    const filesToUpdate = ["openbank", "transfers"];
    let updatedCount = 0;
    let skippedCount = 0;

    // Process each file
    for (const fileType of filesToUpdate) {
      try {
        console.log(`Updating account balance in ${HTML_FILES[fileType]}...`);

        // Load the file
        const $ = await loadHTMLFile(fileType);

        // Update account balance using file-specific selectors
        let updated = false;
        if (fileType === "openbank") {
          // Update Total Balance in Openbank.html
          const accountTotalElements = $(
            ".glb-position-financial-card-header-col__amount span span"
          );
          accountTotalElements.each((i, elem) => {
            const $elem = $(elem);
            const text = $elem.text().trim();
            if (text && !isNaN(parseFloat(text)) && text !== "€") {
              const oldValue = text;
              $elem.text(newAccountBalance);
              console.log(
                `  Updated Openbank total balance: "${oldValue}" -> "${newAccountBalance}"`
              );
              updated = true;
              return false; // break after first match
            }
          });
        } else if (fileType === "transfers") {
          // Update Account Balance amounts in Openbank-transfers.html
          const accountAmountElements = $(
            ".dropdown-accounts__account-description-amount span"
          );
          let balanceUpdated = false;
          accountAmountElements.each((i, elem) => {
            const $elem = $(elem);
            const text = $elem.text().trim();
            if (text && !isNaN(parseFloat(text)) && text !== "€") {
              const oldValue = text;
              $elem.text(newAccountBalance);
              console.log(
                `  Updated Transfers account balance ${
                  i + 1
                }: "${oldValue}" -> "${newAccountBalance}"`
              );
              balanceUpdated = true;
            }
          });
          updated = balanceUpdated;
        }

        if (updated) {
          await saveHTMLFile($, fileType);
          console.log(`✓ Updated ${HTML_FILES[fileType]}`);
          updatedCount++;
        } else {
          console.log(
            `- Skipped ${HTML_FILES[fileType]} (no balance elements found)`
          );
          skippedCount++;
        }
      } catch (fileError) {
        console.error(`Error updating ${HTML_FILES[fileType]}:`, fileError);
        skippedCount++;
      }
    }

    console.log(`\n💰 Account balance update completed:`);
    console.log(`   ✅ Updated: ${updatedCount} files`);
    console.log(`   ⏭️ Skipped: ${skippedCount} files`);
    console.log(`   💵 New balance: "${newAccountBalance}"`);

    return true;
  } catch (error) {
    console.error("Error updating account balance globally:", error);
    throw error;
  }
}

/**
 * Update avatar name globally across all HTML files in the project
 */
async function updateAvatarNameGlobally(newAvatarName) {
  try {
    console.log(
      `Updating avatar name globally to: ${newAvatarName} across ALL HTML files in project...`
    );

    const glob = require("glob");
    const path = require("path");

    // Find all HTML files in the project (excluding node_modules and other irrelevant directories)
    const htmlFiles = glob.sync("**/*.{html,htm}", {
      ignore: [
        "node_modules/**",
        "**/node_modules/**",
        "admin-dashboard.html", // Skip our own dashboard
        "integration-example.html", // Skip example files
        "**/*_files/**", // Skip cached/temp files directories
      ],
    });

    console.log(
      `Found ${htmlFiles.length} HTML files to check for avatar updates...`
    );

    let updatedCount = 0;
    let skippedCount = 0;

    // Process each HTML file
    for (const filePath of htmlFiles) {
      try {
        console.log(`Checking ${filePath}...`);

        // Read the HTML file
        const htmlContent = await fs.readFile(filePath, "utf8");
        const $ = cheerio.load(htmlContent);

        // Check if this file contains avatar elements (update ALL instances)
        const avatarNameElements = $(".avatar-component__alias span span");
        if (avatarNameElements.length > 0) {
          let elementUpdated = false;
          avatarNameElements.each((index, element) => {
            const oldName = $(element).text().trim();
            if (oldName && oldName !== newAvatarName) {
              $(element).text(newAvatarName);
              console.log(
                `  └─ Element ${index + 1}: "${oldName}" -> "${newAvatarName}"`
              );
              elementUpdated = true;
            }
          });

          if (elementUpdated) {
            // Save the updated file
            const updatedHTML = $.html();
            await fs.writeFile(filePath, updatedHTML, "utf8");

            console.log(
              `✓ Updated ${filePath} (${avatarNameElements.length} avatar elements checked)`
            );
            updatedCount++;
          } else {
            console.log(
              `  - Skipped ${filePath} (all avatar elements already have correct name)`
            );
            skippedCount++;
          }
        } else {
          console.log(`  - Skipped ${filePath} (no avatar element found)`);
          skippedCount++;
        }
      } catch (fileError) {
        console.error(`  - Error processing ${filePath}:`, fileError.message);
        skippedCount++;
        // Continue with other files even if one fails
      }
    }

    console.log(`\n🎯 Avatar name update completed:`);
    console.log(`   ✅ Updated: ${updatedCount} files`);
    console.log(`   ⏭️ Skipped: ${skippedCount} files`);
    console.log(`   📝 New name: "${newAvatarName}"`);

    return true;
  } catch (error) {
    console.error("Error updating avatar name globally:", error);
    throw error;
  }
}

/**
 * Update balance values in HTML
 */
async function updateBalanceValues($, newBalances, fileType = "openbank") {
  try {
    console.log("Updating balances with:", newBalances);

    // Handle global card digits update for openbank and transfers files
    if (
      newBalances.cardLastDigits &&
      newBalances.cardLastDigits !== "" &&
      (fileType === "openbank" || fileType === "transfers")
    ) {
      console.log("Detected card digits change, updating globally...");
      await updateCardDigitsGlobally(newBalances.cardLastDigits);

      // Remove cardLastDigits from newBalances to avoid duplicate updates
      const { cardLastDigits, ...otherBalances } = newBalances;
      newBalances = otherBalances;
    }

    // Handle global account balance update for openbank and transfers files
    if (
      newBalances.accountTotalBalance &&
      newBalances.accountTotalBalance !== "" &&
      fileType === "openbank"
    ) {
      console.log(
        "Detected account total balance change, updating globally..."
      );
      await updateAccountBalanceGlobally(newBalances.accountTotalBalance);
    }

    // Handle global avatar name update
    if (newBalances.avatarName && newBalances.avatarName !== "") {
      console.log("Detected avatar name change, updating globally...");
      await updateAvatarNameGlobally(newBalances.avatarName);

      // Remove avatarName from newBalances to avoid duplicate updates
      const { avatarName, ...otherBalances } = newBalances;
      newBalances = otherBalances;
    }

    // Handle different file types for other fields
    if (fileType === "openbank") {
      return updateOpenbankValues($, newBalances);
    }

    if (fileType === "directDebits") {
      return updateDirectDebitsValues($, newBalances);
    }

    if (fileType === "cards") {
      return updateCardsValues($, newBalances);
    }

    if (fileType === "transfers") {
      return updateTransfersValues($, newBalances);
    }

    throw new Error(`Unknown file type: ${fileType}`);
  } catch (error) {
    console.error("Error updating balance values:", error);
    throw error;
  }
}

/**
 * Update values in Openbank.html (keeping original logic)
 */
function updateOpenbankValues($, newBalances) {
  try {
    console.log("Updating Openbank values with:", newBalances);

    // Update Account Total Balance (430.26)
    $(".glb-position-financial-card-header-col__amount span span").each(
      (i, elem) => {
        const $elem = $(elem);
        const text = $elem.text().trim();
        if (text && !isNaN(parseFloat(text)) && text !== "€") {
          $elem.text(newBalances.accountTotalBalance);
          console.log(
            `Updated account total balance: ${text} -> ${newBalances.accountTotalBalance}`
          );
          return false; // break after first match
        }
      }
    );

    // Update Individual Account Balance
    $(".glb-position-financial-card-item__amount span span").each((i, elem) => {
      const $elem = $(elem);
      const text = $elem.text().trim();
      if (text && !isNaN(parseFloat(text)) && text !== "€") {
        $elem.text(newBalances.individualAccountBalance);
        console.log(
          `Updated individual account balance: ${text} -> ${newBalances.individualAccountBalance}`
        );
        return false; // break after first match
      }
    });

    // Update Total Savings Balance
    $(".global-position-total-balance__amount span").each((i, elem) => {
      const $elem = $(elem);
      const text = $elem.text().trim();
      if (text && !isNaN(parseFloat(text)) && text !== "€") {
        $elem.text(newBalances.totalSavingsBalance);
        console.log(
          `Updated total savings balance: ${text} -> ${newBalances.totalSavingsBalance}`
        );
        return false; // break after first match
      }
    });

    // Update Monthly Expenses (Agosto)
    $(".expenses-summary-box__header__expenses--total").each((i, elem) => {
      const $elem = $(elem);
      $elem.text(`${newBalances.monthlyExpenses} €`);
      console.log(
        `Updated monthly expenses: -> ${newBalances.monthlyExpenses} €`
      );
    });

    // Update Savings & Investments Total (using text-based selector)
    const savingsSection = $(
      '.glb-all-position-summary__statement:contains("Total savings and investments")'
    ).closest(".glb-all-position-summary__totalbalance-section");
    if (savingsSection.length > 0) {
      const savingsAmount = savingsSection
        .find(".global-position-total-balance__amount span")
        .first();
      const oldValue = savingsAmount.text().trim();
      savingsAmount.text(newBalances.savingsInvestmentsTotal);
      console.log(
        `Updated savings & investments total: ${oldValue} -> ${newBalances.savingsInvestmentsTotal}`
      );
    }

    // Update Total Lending (using text-based selector)
    const lendingSection = $(
      '.glb-all-position-summary__statement:contains("Total Lending")'
    ).closest(".glb-all-position-summary__totalbalance-section");
    if (lendingSection.length > 0) {
      const lendingAmount = lendingSection
        .find(".global-position-total-balance__amount span")
        .first();
      const oldValue = lendingAmount.text().trim();
      lendingAmount.text(newBalances.totalLending);
      console.log(
        `Updated total lending: ${oldValue} -> ${newBalances.totalLending}`
      );
    }

    return true;
  } catch (error) {
    console.error("Error updating balance values:", error);
    throw error;
  }
}

/**
 * Update values in Openbank-direct-debits.html
 */
function updateDirectDebitsValues($, newBalances) {
  try {
    console.log("Updating direct debits values with:", newBalances);

    // Update Balance in accounts
    if (
      newBalances.accountsBalanceAmount &&
      newBalances.accountsBalanceAmount !== ""
    ) {
      const accountsBalanceElement = $(".accounts-balance__amount");
      if (accountsBalanceElement.length > 0) {
        const oldValue = accountsBalanceElement.text().trim();
        accountsBalanceElement.text(newBalances.accountsBalanceAmount);
        console.log(
          `Updated accounts balance: ${oldValue} -> ${newBalances.accountsBalanceAmount}`
        );
      }
    }

    // Update Card last digits
    if (newBalances.cardLastDigits && newBalances.cardLastDigits !== "") {
      const cardDigitsElement = $(".accounts-box-header__iban");
      if (cardDigitsElement.length > 0) {
        const oldValue = cardDigitsElement.text().trim();
        // Ensure the "..." prefix is always preserved
        let formattedDigits = newBalances.cardLastDigits;
        if (!formattedDigits.startsWith("...")) {
          formattedDigits = "..." + formattedDigits.replace(/^\.+/, "");
        }
        cardDigitsElement.text(formattedDigits);
        console.log(`Updated card digits: ${oldValue} -> ${formattedDigits}`);
      }
    }

    // Update Available amount
    if (newBalances.availableAmount && newBalances.availableAmount !== "") {
      const availableAmountElement = $("#lblAvailableAmount0");
      if (availableAmountElement.length > 0) {
        const oldValue = availableAmountElement.text().trim();
        availableAmountElement.text(newBalances.availableAmount);
        console.log(
          `Updated available amount: ${oldValue} -> ${newBalances.availableAmount}`
        );
      }
    }

    // Update Available currency
    if (newBalances.availableCurrency && newBalances.availableCurrency !== "") {
      const availableCurrencyElement = $("#lblAvailableCurrency0");
      if (availableCurrencyElement.length > 0) {
        const oldValue = availableCurrencyElement.text().trim();
        availableCurrencyElement.text(newBalances.availableCurrency);
        console.log(
          `Updated available currency: ${oldValue} -> ${newBalances.availableCurrency}`
        );
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating direct debits values:", error);
    throw error;
  }
}

/**
 * Extract values from Openbank-cards.html
 */
function extractCardsValues($) {
  const balances = {};

  try {
    // Card last 4 digits from the card number structure
    const cardDigitsElement = $(
      ".card__card-number--small.card__card-number--show.card__card-number--only-number span:last-child"
    );
    balances.cardLastDigits = cardDigitsElement.text().trim() || "1704";

    // Extract Avatar Name
    let avatarName = "Alfonso";
    const avatarNameElement = $(".avatar-component__alias span span").first();
    if (avatarNameElement.length > 0) {
      const name = avatarNameElement.text().trim();
      if (name && name !== "") {
        avatarName = name;
      }
    }
    balances.avatarName = avatarName;

    console.log("Extracted cards balances:", balances);
    return balances;
  } catch (error) {
    console.error("Error extracting cards values:", error);
    // Return default values if extraction fails
    return {
      cardLastDigits: "1704",
      avatarName: "Alfonso",
    };
  }
}

/**
 * Update values in Openbank-cards.html
 */
function updateCardsValues($, newBalances) {
  try {
    console.log("Updating cards values with:", newBalances);

    // Update Card last digits
    if (newBalances.cardLastDigits && newBalances.cardLastDigits !== "") {
      const cardDigitsElement = $(
        ".card__card-number--small.card__card-number--show.card__card-number--only-number span:last-child"
      );
      if (cardDigitsElement.length > 0) {
        const oldValue = cardDigitsElement.text().trim();
        cardDigitsElement.text(newBalances.cardLastDigits);
        console.log(
          `Updated card digits: ${oldValue} -> ${newBalances.cardLastDigits}`
        );
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating cards values:", error);
    throw error;
  }
}

/**
 * Extract values from Openbank-transfers.html
 */
function extractTransfersValues($) {
  const balances = {};

  try {
    // Card last 4 digits from dropdown account IBAN
    const cardDigitsElement = $(".dropdown-accounts__account-description-iban");
    balances.cardLastDigits = cardDigitsElement.text().trim() || "...2150";

    // Extract Account Balance amounts from dropdown accounts
    const accountAmountElements = $(
      ".dropdown-accounts__account-description-amount span"
    );
    let accountBalance = "0.00";
    accountAmountElements.each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && !isNaN(parseFloat(text)) && text !== "€") {
        accountBalance = text;
        return false; // break after first numeric match
      }
    });
    balances.accountBalance = accountBalance;

    // Extract Avatar Name
    let avatarName = "Alfonso";
    const avatarNameElement = $(".avatar-component__alias span span").first();
    if (avatarNameElement.length > 0) {
      const name = avatarNameElement.text().trim();
      if (name && name !== "") {
        avatarName = name;
      }
    }
    balances.avatarName = avatarName;

    console.log("Extracted transfers balances:", balances);
    return balances;
  } catch (error) {
    console.error("Error extracting transfers values:", error);
    // Return default values if extraction fails
    return {
      cardLastDigits: "...2150",
      accountBalance: "0.00",
      avatarName: "Alfonso",
    };
  }
}

/**
 * Update values in Openbank-transfers.html
 */
function updateTransfersValues($, newBalances) {
  try {
    console.log("Updating transfers values with:", newBalances);

    // Update Account Balance amounts
    if (newBalances.accountBalance && newBalances.accountBalance !== "") {
      const accountAmountElements = $(
        ".dropdown-accounts__account-description-amount span"
      );
      accountAmountElements.each((i, elem) => {
        const $elem = $(elem);
        const text = $elem.text().trim();
        if (text && !isNaN(parseFloat(text)) && text !== "€") {
          const oldValue = text;
          $elem.text(newBalances.accountBalance);
          console.log(
            `Updated transfers account balance ${i + 1}: ${oldValue} -> ${
              newBalances.accountBalance
            }`
          );
        }
      });
    }

    // Update Card last digits
    if (newBalances.cardLastDigits && newBalances.cardLastDigits !== "") {
      const cardDigitsElement = $(
        ".dropdown-accounts__account-description-iban"
      );
      if (cardDigitsElement.length > 0) {
        const oldValue = cardDigitsElement.text().trim();
        // Ensure the "..." prefix is always preserved
        let formattedDigits = newBalances.cardLastDigits;
        if (!formattedDigits.startsWith("...")) {
          formattedDigits = "..." + formattedDigits.replace(/^\.+/, "");
        }
        cardDigitsElement.text(formattedDigits);
        console.log(
          `Updated transfers card digits: ${oldValue} -> ${formattedDigits}`
        );
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating transfers values:", error);
    throw error;
  }
}

/**
 * Save updated HTML content to file
 */
async function saveHTMLFile($, fileType = "openbank") {
  try {
    const fileName = HTML_FILES[fileType];
    if (!fileName) {
      throw new Error(`Unknown file type: ${fileType}`);
    }
    const updatedHTML = $.html();
    await fs.writeFile(fileName, updatedHTML, "utf8");
    console.log(`HTML file ${fileName} saved successfully`);
    return true;
  } catch (error) {
    console.error("Error saving HTML file:", error);
    throw new Error(`Failed to save ${fileType} file: ${error.message}`);
  }
}

// API Routes

/**
 * Get list of available HTML files
 */
app.get("/api/files", (req, res) => {
  try {
    const fileList = Object.entries(HTML_FILES).map(([key, filename]) => ({
      key: key,
      filename: filename,
      displayName:
        key === "openbank"
          ? "Openbank Main"
          : key === "directDebits"
          ? "Openbank Direct Debits"
          : key === "cards"
          ? "Openbank Cards"
          : "Openbank Transfers",
    }));

    res.json({
      success: true,
      files: fileList,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get current balance values
 */
app.get("/api/current-balances", async (req, res) => {
  try {
    const fileType = req.query.fileType || "openbank";
    console.log(`Loading current balance values for ${fileType}...`);

    const $ = await loadHTMLFile(fileType);
    const balances = extractBalanceValues($, fileType);

    res.json({
      success: true,
      balances: balances,
      fileType: fileType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting current balances:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Update balance values
 */
app.post("/api/update-balances", async (req, res) => {
  try {
    const { balances, fileType = "openbank" } = req.body;

    if (!balances || typeof balances !== "object") {
      return res.status(400).json({
        success: false,
        error: "Invalid balances data provided",
      });
    }

    console.log(`Updating balances for ${fileType}:`, balances);

    // Load HTML file
    const $ = await loadHTMLFile(fileType);

    // Update balance values
    await updateBalanceValues($, balances, fileType);

    // Save updated file
    await saveHTMLFile($, fileType);

    res.json({
      success: true,
      message: "Balance values updated successfully",
      updatedBalances: balances,
      fileType: fileType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating balances:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get current direct debit transactions from HTML file
 */
app.get("/api/direct-debits", async (req, res) => {
  try {
    const fileType = req.query.fileType || "directDebits";
    console.log(`Loading direct debits for ${fileType}...`);

    const $ = await loadHTMLFile(fileType);
    const transactions = [];

    // Extract transactions from the HTML table
    $("table#account-box-body-last-movements tbody tr").each((i, el) => {
      const $row = $(el);
      const dateText = $row
        .find(".account-last-movements-table-row__cell-date .label-date")
        .text()
        .trim();
      const categoryImg = $row
        .find(".account-last-movements-table-row__cell-category img")
        .attr("src");
      const description = $row
        .find(".account-last-movements-table-row__cell-description span")
        .text()
        .trim();
      const amount = $row
        .find(".account-last-movements-table-row__cell-balance span span")
        .first()
        .text()
        .trim();
      const balance = $row
        .find(".account-last-movements-table-row__cell-total-balance span span")
        .first()
        .text()
        .trim();

      if (dateText && description) {
        // Extract category from image URL
        const categoryMatch = categoryImg
          ? categoryImg.match(/category_(\d+)\.png/)
          : null;
        const category = categoryMatch
          ? `category_${categoryMatch[1]}`
          : "category_9";

        // Parse date (assuming current year)
        const currentYear = new Date().getFullYear();
        const dateStr = `${currentYear}-${convertDateToISO(dateText)}`;

        transactions.push({
          id: `txn_${Date.now()}_${i}`,
          date: dateStr,
          category: category,
          description: description,
          amount: parseFloat(amount.replace(/[€,\s]/g, "")) || 0,
          balance: parseFloat(balance.replace(/[€,\s]/g, "")) || 0,
        });
      }
    });

    console.log(`Found ${transactions.length} transactions`);

    res.json({
      success: true,
      transactions: transactions,
      message: `Found ${transactions.length} transactions`,
    });
  } catch (error) {
    console.error("Error loading direct debits:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update direct debit transactions in HTML file
 */
app.post("/api/update-direct-debits", async (req, res) => {
  try {
    const {
      transactions = [],
      fileType = "directDebits",
      showEmptyState = false,
    } = req.body;

    if (!Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: "Invalid transactions data. Must be an array.",
      });
    }

    console.log(`Updating direct debits for ${fileType}...`);
    console.log(`Show empty state: ${showEmptyState}`);
    console.log(`Number of transactions: ${transactions.length}`);

    const filePath = path.join(__dirname, HTML_FILES[fileType]);
    const htmlContent = await fs.readFile(filePath, "utf8");
    const $ = cheerio.load(htmlContent);

    // Find the accounts-box-body__movements container
    const movementsContainer = $(".accounts-box-body__movements");

    if (movementsContainer.length === 0) {
      throw new Error("Movements container not found in HTML file");
    }

    if (showEmptyState || transactions.length === 0) {
      // Show empty state
      movementsContainer.html(`
        <article class="empty-state">
          <div class="icon empty-state__image empty-state-search-banking"></div>
          <div class="empty-state__primary-text empty-state__primary-text--with-margin">
            Your account currently has no transactions.
          </div>
        </article>
      `);
    } else {
      // Generate transaction table HTML
      const tableRows = transactions
        .map((transaction, index) => {
          const isNegative = transaction.amount < 0;
          const formattedAmount = isNegative
            ? transaction.amount.toFixed(2)
            : `+${transaction.amount.toFixed(2)}`;
          const formattedBalance = transaction.balance.toFixed(2);
          const dateFormatted = formatTransactionDate(transaction.date);
          const categoryIcon = getCategoryIconUrl(transaction.category);

          return `
          <tr class="ok-table-row" id="account-box-body-last-movements-allItems-${index}">
            <td class="ok-table-cell account-last-movements-table-row__cell-date">
              <span class="label-date">${dateFormatted}</span>
            </td>
            <td class="ok-table-cell account-last-movements-table-row__cell-category">
              <span><img class="" src="${categoryIcon}" alt="category"></span>
            </td>
            <td class="ok-table-cell account-last-movements-table-row__cell-description">
              <span>${transaction.description}</span>
            </td>
            <td class="ok-table-cell account-last-movements-table-row__cell-deferrable"></td>
            <td class="ok-table-cell account-last-movements-table-row__cell-balance">
              <span class=""><span id="">${formattedAmount}</span>&nbsp;<span id="">€</span></span>
            </td>
            <td class="ok-table-cell account-last-movements-table-row__cell-total-balance">
              <span class=""><span id="">${formattedBalance}</span>&nbsp;<span id="">€</span></span>
            </td>
          </tr>
        `;
        })
        .join("");

      // Create the full table structure
      movementsContainer.html(`
        <table class="ok-table last-movements-table" id="account-box-body-last-movements">
          <thead>
            <tr class="ok-table-row ok-table-row--header">
              <th class="ok-table-cell ok-table-cell--header">
                <span><span>Date</span></span>
              </th>
              <th class="ok-table-cell text-center ok-table-cell--header">
                <span><span>Category</span></span>
              </th>
              <th class="ok-table-cell ok-table-cell--header">
                <span>Description</span>
              </th>
              <th class="ok-table-cell ok-table-cell--header"></th>
              <th class="ok-table-cell accounts-box-body__movements-header-second ok-table-cell--header">
                <span>Amount</span>
              </th>
              <th class="ok-table-cell accounts-box-body__movements-header-second ok-table-cell--header">
                <span>Balance</span>
              </th>
            </tr>
          </thead>
          <tbody class="last-movements-table__body">
            ${tableRows}
          </tbody>
        </table>
        <div class="accounts-box-body__link-container">
          <a id="lnkbtnAccountDetails0" class="ok-link ok-link--complementary ok-link--inverse ok-link--complementary-inverse" href="/myprofile/accounts/6959847961/movements">
            <span class="ok-link__content">View account details</span>
            <i class="ok-link__icon--right icon-siguiente"></i>
          </a>
        </div>
      `);
    }

    // Write the updated HTML back to file
    await fs.writeFile(filePath, $.html());

    console.log(`Direct debits updated successfully for ${fileType}`);

    res.json({
      success: true,
      message: `Direct debits updated successfully. ${
        showEmptyState
          ? "Showing empty state."
          : `Updated ${transactions.length} transactions.`
      }`,
    });
  } catch (error) {
    console.error("Error updating direct debits:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get current transfer recipients from HTML file
 */
app.get("/api/transfer-recipients", async (req, res) => {
  try {
    const fileType = req.query.fileType || "transfers";
    console.log(`Loading transfer recipients for ${fileType}...`);

    const $ = await loadHTMLFile(fileType);
    const recipients = [];

    // Extract recipients from the HTML table (only from the first instance to avoid duplicates)
    $(".transfers-agenda-summary")
      .first()
      .find("table tbody tr")
      .each((i, el) => {
        const $row = $(el);
        const alias = $row
          .find(".transfers-agenda-table-row__alias-column p")
          .text()
          .trim();
        const account = $row
          .find(".transfers-agenda-table-row__account-column")
          .text()
          .trim();
        const currency = $row
          .find(".transfers-agenda-table-row__currency-column")
          .text()
          .trim();
        const country = $row
          .find(".transfers-agenda-table-row__country-column")
          .text()
          .trim();

        if (alias && account) {
          recipients.push({
            id: `recipient_${Date.now()}_${i}`,
            alias: alias,
            account: account,
            currency: currency || "€",
            country: country || "ES",
          });
        }
      });

    console.log(`Found ${recipients.length} recipients`);

    res.json({
      success: true,
      recipients: recipients,
      message: `Found ${recipients.length} recipients`,
    });
  } catch (error) {
    console.error("Error loading transfer recipients:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update transfer recipients in HTML file
 */
app.post("/api/update-transfer-recipients", async (req, res) => {
  try {
    const {
      recipients = [],
      fileType = "transfers",
      showEmptyState = false,
    } = req.body;

    if (!Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        error: "Invalid recipients data. Must be an array.",
      });
    }

    console.log(`Updating transfer recipients for ${fileType}...`);
    console.log(`Show empty state: ${showEmptyState}`);
    console.log(`Number of recipients: ${recipients.length}`);

    const filePath = path.join(__dirname, HTML_FILES[fileType]);
    const htmlContent = await fs.readFile(filePath, "utf8");
    const $ = cheerio.load(htmlContent);

    // Find the transfers-landing-view__main-content container (only update the first one to avoid duplicates)
    const mainContent = $(".transfers-landing-view__main-content").first();

    if (mainContent.length === 0) {
      throw new Error("Main content container not found in HTML file");
    }

    if (showEmptyState || recipients.length === 0) {
      // Show empty state
      mainContent.html(`
        <article class="transfers-agenda-summary">
          <header>
            <div class="transfers-agenda-summary__title">
              <div class="ok-box-title">
                <h3 class="">Regular recipients</h3>
                <span class="ok-box-title__separator"></span>
              </div>
            </div>
          </header>
          <article class="empty-state">
            <div class="icon empty-state__image empty-state-transfer-banking"></div>
            <div class="empty-state__primary-text empty-state__primary-text--with-margin">
              You can use your List to save your frequent recipients and have rapid access when issuing new transfers.
            </div>
            <div class="empty-state__button">
              <button type="button" class="buttons-base buttons-base--regular buttons-base--secondary">
                <div>
                  <div class="">
                    <span class="buttons-base__children">
                      <span>New recipient</span>
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </article>
        </article>
      `);
    } else {
      // Generate recipients table HTML
      const tableRows = recipients
        .map(
          (recipient, index) => `
          <tr class="ok-table-row">
            <td class="ok-table-cell transfers-agenda-table-row__expand-column">
              <div class="ok-collapsing-toggler ok-collapsing-toggler--floating">
                <i class="ok-icon-task ok-icon-task__standalone ok-icon-task__standalone--default icon-accordion-abrir"></i>
              </div>
            </td>
            <td class="ok-table-cell transfers-agenda-table-row__alias-column">
              <p class="transfers-agenda-table-row__description">${recipient.alias}</p>
            </td>
            <td class="ok-table-cell transfers-agenda-table-row__account-column">${recipient.account}</td>
            <td class="ok-table-cell transfers-agenda-table-row__currency-column">${recipient.currency}</td>
            <td class="ok-table-cell transfers-agenda-table-row__country-column">${recipient.country}</td>
            <td class="ok-table-cell transfers-agenda-table-row__transfer-column">
              <button type="button" class="buttons-base buttons-base--small buttons-base--secondary">
                <div>
                  <div class="">
                    <span class="buttons-base__children">
                      <span>Transfer</span>
                    </span>
                  </div>
                </div>
              </button>
            </td>
          </tr>
        `
        )
        .join("");

      // Create the full structure with recipients table
      mainContent.html(`
        <article class="transfers-agenda-summary">
          <header>
            <div class="transfers-agenda-summary__title pull-left">
              <div class="ok-box-title">
                <a class="ok-box-title__link-as-title" href="/myprofile/transfers/agenda">Regular recipients</a>
                <span class="ok-box-title__separator"></span>
              </div>
            </div>
            <div class="pull-right">
              <button type="button" class="buttons-base buttons-base--regular buttons-base--ghost">
                <div>
                  <div class="">
                    <i class="buttons-base__icon icon buttons-base__icon--left icon-agregar transfers-agenda__new-beneficiary-icon"></i>
                    <span class="buttons-base__children">
                      <span>New recipient</span>
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </header>
          <section>
            <table class="ok-table">
              <thead>
                <tr class="ok-table-row ok-table-row--header">
                  <th class="ok-table-cell ok-table-cell--header"><span></span></th>
                  <th class="ok-table-cell ok-table-cell--header"><span>Alias</span></th>
                  <th class="ok-table-cell ok-table-cell--header"><span>Destination account</span></th>
                  <th class="ok-table-cell ok-table-cell--header"><span>Currency</span></th>
                  <th class="ok-table-cell ok-table-cell--header"><span>Country</span></th>
                  <th class="ok-table-cell ok-table-cell--header"><span></span></th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </section>
        </article>
      `);
    }

    // Write the updated HTML back to file
    await fs.writeFile(filePath, $.html());

    console.log(`Transfer recipients updated successfully for ${fileType}`);

    res.json({
      success: true,
      message: `Transfer recipients updated successfully. ${
        showEmptyState
          ? "Showing empty state."
          : `Updated ${recipients.length} recipients.`
      }`,
    });
  } catch (error) {
    console.error("Error updating transfer recipients:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Openbank Balance Manipulator API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

/**
 * Serve admin dashboard
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "admin-dashboard.html"));
});

/**
 * Utility functions for direct debit management
 */
function convertDateToISO(dateText) {
  // Convert "Jul 14" format to "07-14"
  const months = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  const parts = dateText.split(" ");
  if (parts.length === 2) {
    const month = months[parts[0]];
    const day = parts[1].padStart(2, "0");
    return `${month}-${day}`;
  }
  return "01-01"; // fallback
}

function formatTransactionDate(dateString) {
  // Convert "2024-07-14T12:00:00Z" to "Jul 14"
  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function getCategoryIconUrl(category) {
  // Map categories to their icon URLs
  const categoryMap = {
    category_1:
      "https://www.openbank.es/assets/static/images/categories/icons/category_1.png",
    category_5:
      "https://www.openbank.es/assets/static/images/categories/icons/category_5.png",
    category_9:
      "https://www.openbank.es/assets/static/images/categories/icons/category_9.png",
    category_12:
      "https://www.openbank.es/assets/static/images/categories/icons/category_12.png",
  };

  return categoryMap[category] || categoryMap["category_9"];
}

/**
 * Error handling middleware
 */
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏦 Openbank Balance Manipulator Server is running!`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(
    `📁 Supported HTML Files: ${Object.values(HTML_FILES).join(", ")}`
  );
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log("");
  console.log("Available endpoints:");
  console.log("  GET  /                    - Admin Dashboard");
  console.log("  GET  /api/health          - Health check");
  console.log("  GET  /api/current-balances - Get current balance values");
  console.log("  POST /api/update-balances  - Update balance values");
  console.log("");
});

module.exports = app;
