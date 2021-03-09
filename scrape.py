import requests
from parsel import Selector


r = requests.get('https://www.muenster.de/corona_testungen.html')
r.raise_for_status()

selector = Selector(r.text)

for li in selector.css("main div.anreisser ul li::text"):
    text = li.get().strip()
    if text != "":
        parts = text.split(",")
        print(parts[-2])
