import json
import os

def process_locale(filepath):
    print(f"Processing {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        home_obj = data.get('home', {})
        keys_to_move = ['wishlist', 'orders', 'orderDetails', 'publicStore', 'search', 'storeSection', 'profile']
        
        modified = False
        for key in keys_to_move:
            if key in home_obj:
                data[key] = home_obj.pop(key)
                modified = True
                print(f"  Moved '{key}' to root.")
                
        # Add missing keys to publicStore structure if they don't exist
        if 'publicStore' in data:
            if 'generalCollection' not in data['publicStore']:
                if filepath.endswith('en.json'): data['publicStore']['generalCollection'] = 'General Collection'
                elif filepath.endswith('hi.json'): data['publicStore']['generalCollection'] = 'सामान्य संग्रह'
                elif filepath.endswith('mr.json'): data['publicStore']['generalCollection'] = 'सामान्य संग्रह'
                modified = True
                print("  Added 'generalCollection'")
                
            if 'curatedSelection' not in data['publicStore']:
                if filepath.endswith('en.json'): data['publicStore']['curatedSelection'] = 'Curated Selection in'
                elif filepath.endswith('hi.json'): data['publicStore']['curatedSelection'] = 'में क्यूरेटेड चयन'
                elif filepath.endswith('mr.json'): data['publicStore']['curatedSelection'] = 'मध्ये निवडक संग्रह'
                modified = True
                print("  Added 'curatedSelection'")
                
            if 'tagline' not in data['publicStore']:
                if filepath.endswith('en.json'): data['publicStore']['tagline'] = 'Curated Luxury Fashion & Artistry'
                elif filepath.endswith('hi.json'): data['publicStore']['tagline'] = 'क्यूरेटेड लक्ज़री फैशन और कलात्मकता'
                elif filepath.endswith('mr.json'): data['publicStore']['tagline'] = 'क्युरेटेड लक्झरी फॅशन आणि कलाकुसर'
                modified = True
                print("  Added 'tagline'")
                
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  Saved changes to {filepath}")
        else:
            print(f"  No changes needed for {filepath}")
            
    except Exception as e:
        print(f"  Error processing {filepath}: {e}")

process_locale('src/locales/en.json')
process_locale('src/locales/hi.json')
process_locale('src/locales/mr.json')
print('Script finished.')
