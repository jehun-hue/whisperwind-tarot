import os
import re
import requests
import json
import time

base_dir = r"c:\Users\제헌\whisperwind-tarot"
out_dir = os.path.join(base_dir, "public", "cards")
os.makedirs(out_dir, exist_ok=True)

data_file = os.path.join(base_dir, "src", "data", "tarotCards.ts")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
}

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')

with open(data_file, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to extract the id, name, and suit from the typescript file
pattern = re.compile(r'\{\s*id:\s*(\d+),\s*name:\s*"([^"]+)",\s*korean:\s*"([^"]+)",\s*suit:\s*"([^"]+)"')
matches = pattern.findall(content)

for id_str, name, korean, suit in matches:
    card_id = int(id_str)
    filename = slugify(name) + ".jpg"
    out_path = os.path.join(out_dir, filename)
    
    # Determine URL
    if suit == "Major Arcana":
        url = f"https://sacred-texts.com/tarot/pkt/img/ar{card_id:02d}.jpg"
    else:
        prefix = {
            "Wands": "wa",
            "Cups": "cu",
            "Swords": "sw",
            "Pentacles": "pe"
        }[suit]
        
        if suit == "Wands": base = 21
        elif suit == "Cups": base = 35
        elif suit == "Swords": base = 49
        elif suit == "Pentacles": base = 63
        
        number = card_id - base
        url = f"https://sacred-texts.com/tarot/pkt/img/{prefix}{number:02d}.jpg"
        
    print(f"Downloading {name} from {url} to {filename}")
    if not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
        try:
            res = requests.get(url, headers=headers, timeout=10)
            if res.status_code == 200:
                with open(out_path, 'wb') as img_f:
                    img_f.write(res.content)
            else:
                print(f"Failed to download {url}: {res.status_code}")
        except Exception as e:
            print(f"Error downloading {url}: {e}")
        time.sleep(0.1) # Be nice to the server

# Now update the ts file to include image: "/cards/filename.jpg"
updated_content = content
for id_str, name, korean, suit in matches:
    filename = slugify(name) + ".jpg"
    search_str = f'id: {id_str}, name: "{name}", korean: "{korean}", suit: "{suit}",'
    replace_str = f'id: {id_str}, name: "{name}", korean: "{korean}", suit: "{suit}", image: "/cards/{filename}",'
    updated_content = updated_content.replace(search_str, replace_str)

with open(data_file, 'w', encoding='utf-8') as f:
    f.write(updated_content)

print("Done downloading and updating tarotCards.ts!")
