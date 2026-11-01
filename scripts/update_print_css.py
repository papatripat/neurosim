with open('public/demo/pitch_deck.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_print = """    @media print {
      body {
        overflow: visible;
        background: #0b1120 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      #bottom-bar { display: none !important; }
      .slide {
        position: relative !important;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        page-break-after: always;
        height: 100vh;
        padding: 50px 60px;
      }
    }"""

new_print = """    @media print {
      body, html {
        overflow: visible !important;
        height: auto !important;
        width: 100% !important;
        background: #0b1120 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #bottom-bar { display: none !important; }
      #deck-container {
        position: static !important;
        height: auto !important;
        overflow: visible !important;
      }
      .slide {
        position: relative !important;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        display: flex !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        min-height: 100vh !important;
        height: 100vh !important;
        padding: 50px 70px !important;
        box-sizing: border-box !important;
      }
    }"""

if old_print in html:
    html = html.replace(old_print, new_print)
    with open('public/demo/pitch_deck.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Successfully replaced print CSS!")
else:
    print("Old print CSS not found directly, checking...")
