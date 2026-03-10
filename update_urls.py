import os
import re

base_dir = r"c:\Users\제헌\whisperwind-tarot"
data_file = os.path.join(base_dir, "src", "data", "tarotCards.ts")

with open(data_file, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'\{\s*id:\s*(\d+),\s*name:\s*"([^"]+)",\s*korean:\s*"([^"]+)",\s*suit:\s*"([^"]+)"')
matches = pattern.findall(content)

updated_content = content
for id_str, name, korean, suit in matches:
    card_id = int(id_str)
    
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
        
    search_str = f'id: {id_str}, name: "{name}", korean: "{korean}", suit: "{suit}",'
    replace_str = f'id: {id_str}, name: "{name}", korean: "{korean}", suit: "{suit}", image: "{url}",'
    updated_content = updated_content.replace(search_str, replace_str)

if "image:" not in updated_content.split('export interface TarotCardBase')[1].split('}')[0]:
    updated_content = updated_content.replace(
        "export interface TarotCardBase {\n  id: number;", 
        "export interface TarotCardBase {\n  id: number;\n  image: string;"
    )

with open(data_file, 'w', encoding='utf-8') as f:
    f.write(updated_content)

print("Done updating tarotCards.ts!")
