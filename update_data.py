import json
import os

# --- Configuration ---
CONFIG_DIR = 'config'
ACCOUNTS_FILE = os.path.join(CONFIG_DIR, 'accounts-config.json')
SETTINGS_FILE = os.path.join(CONFIG_DIR, 'settings-config.json')
CARDS_FILE = os.path.join(CONFIG_DIR, 'cards-config.json')
PRODUCTS_FILE = os.path.join(CONFIG_DIR, 'products-config.json')

# --- Helper Functions ---

def load_data(filepath):
    """Loads JSON data from a file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading {filepath}: {e}")
        return None

def save_data(filepath, data):
    """Saves data to a JSON file with pretty printing."""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ Data successfully saved to {filepath}")
    except IOError as e:
        print(f"Error saving data to {filepath}: {e}")

def get_float_input(prompt):
    """Gets a valid float from user input."""
    while True:
        try:
            return float(input(prompt))
        except ValueError:
            print("Invalid input. Please enter a number.")

def get_choice(options):
    """Gets a valid choice from a list of options."""
    for i, option in enumerate(options, 1):
        print(f"  {i}. {option}")
    while True:
        try:
            choice = int(input("Enter your choice: "))
            if 1 <= choice <= len(options):
                return choice - 1
            else:
                print("Invalid choice. Please select a valid option.")
        except ValueError:
            print("Invalid input. Please enter a number.")

# --- Main Functions ---

def edit_account_balance():
    """Edits the balance of a selected account."""
    data = load_data(ACCOUNTS_FILE)
    if not data or 'accounts' not in data:
        return

    print("\n--- Select Account to Edit ---")
    account_names = [f"{acc['name']} ({acc['accountNumber']})" for acc in data['accounts']]
    choice_index = get_choice(account_names)
    
    selected_account = data['accounts'][choice_index]
    print(f"\nCurrent balance for {selected_account['name']}: {selected_account.get('balance', 'N/A')}")
    
    new_balance = get_float_input("Enter new balance: ")
    selected_account['balance'] = new_balance
    # Also update available balance for consistency in this example
    if 'availableBalance' in selected_account:
        selected_account['availableBalance'] = new_balance

    save_data(ACCOUNTS_FILE, data)

def change_user_language():
    """Changes the user's preferred language."""
    data = load_data(SETTINGS_FILE)
    if not data or 'userPreferences' not in data:
        return

    print("\n--- Change Language ---")
    current_lang = data['userPreferences']['profile']['language']
    print(f"Current language is: {current_lang.upper()}")
    
    languages = {"en": "English", "es": "Español", "fr": "Français"}
    lang_codes = list(languages.keys())
    
    choice_index = get_choice([languages[code] for code in lang_codes])
    new_lang = lang_codes[choice_index]
    
    data['userPreferences']['profile']['language'] = new_lang
    save_data(SETTINGS_FILE, data)

def toggle_card_status():
    """Toggles the status of a card (active/blocked)."""
    data = load_data(CARDS_FILE)
    if not data or 'userCards' not in data:
        return

    print("\n--- Select Card to Toggle Status ---")
    card_names = [f"{c.get('cardTypeId', 'Card').replace('_', ' ').title()} ({c['cardNumber']})" for c in data['userCards']]
    choice_index = get_choice(card_names)
    
    selected_card = data['userCards'][choice_index]
    current_status = selected_card['status']
    new_status = 'blocked' if current_status == 'active' else 'active'
    
    print(f"Changing status of {card_names[choice_index]} from '{current_status}' to '{new_status}'.")
    selected_card['status'] = new_status
    
    save_data(CARDS_FILE, data)

def view_products():
    """Views a summary of available financial products."""
    data = load_data(PRODUCTS_FILE)
    if not data:
        return

    print("\n--- Available Products ---")
    if 'deposits' in data:
        print("\n[ Deposits ]")
        for item in data['deposits']:
            print(f"  - {item['name']} (Rate: {item['interestRate']}%)")
    if 'loans' in data:
        print("\n[ Loans ]")
        for item in data['loans']:
            print(f"  - {item['name']} (Rates from: {item['interestRateFrom']}%)")
    if 'investments' in data:
        print("\n[ Investments ]")
        for item in data['investments']:
            print(f"  - {item['name']} (Risk Level: {item['riskLevel']})")
    input("\nPress Enter to return to menu...")


def main_menu():
    """Displays the main menu and handles user interaction."""
    menu_options = {
        "1": ("Edit Account Balance", edit_account_balance),
        "2": ("Change User Language", change_user_language),
        "3": ("Toggle Card Status", toggle_card_status),
        "4": ("View Products", view_products),
        "5": ("Exit", lambda: print("Exiting..."))
    }

    while True:
        print("\n--- OpenBank Data Control Panel ---")
        for key, (text, _) in menu_options.items():
            print(f"  {key}. {text}")
        
        choice = input("Select an option: ")
        
        if choice in menu_options:
            action = menu_options[choice][1]
            action()
            if choice == "5":
                break
        else:
            print("Invalid option, please try again.")

if __name__ == "__main__":
    if not os.path.exists(CONFIG_DIR):
        print(f"Error: The '{CONFIG_DIR}' directory was not found.")
        print("Please create it and add your JSON configuration files.")
    else:
        main_menu()
