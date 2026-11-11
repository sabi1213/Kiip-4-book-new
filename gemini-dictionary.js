(() => {
  'use strict';
  // Set this to a server-side Gemini proxy URL. Keep the Gemini API key on that server, never in this public file.
  const GEMINI_PROXY_ENDPOINT = '';
  const view = document.getElementById('view-container');
  if (!view) return;

  const tiles = document.querySelector('.quick');
  if (tiles && !document.getElementById('gemini-dictionary-tile')) {
    const tile = document.createElement('button');
    tile.id = 'gemini-dictionary-tile';
    tile.className = 'tile';
    tile.type = 'button';
    tile.innerHTML = '<span class="tile-icon">✨</span><span><strong>Live Gemini AI Dictionary</strong><small>কোরিয়ান শব্দের বিশ্লেষণ</small></span>';
    tile.addEventListener('click', openDictionary);
    tiles.appendChild(tile);
  }
  const nav = document.querySelector('.bottom-inner');
  if (nav && !document.getElementById('gemini-dictionary-nav')) {
    const button = document.createElement('button');
    button.id = 'gemini-dictionary-nav';
    button.type = 'button';
    button.innerHTML = '<span>✨</span>AI Dictionary';
    button.addEventListener('click', openDictionary);
    nav.appendChild(button);
  }

  function openDictionary() {
    if (typeof active === 'function') active('gemini');
    view.innerHTML = '<section class="panel"><div class="heading"><h2>Live Gemini AI Dictionary</h2><small>কোরিয়ান শব্দের বাংলা বিশ্লেষণ</small></div><p>কোরিয়ান শব্দ লিখুন। বিশ্লেষণে শব্দের ধরন, 어원/한자, মূল ধারণা, related words, synonym/antonym, ব্যবহার, উদাহরণ ও grammar breakdown থাকবে।</p><div class="writer-actions"><input id="gemini-word-input" class="name-input" style="max-width:500px" lang="ko" placeholder="예: 대가족, 핵가족, 낯설다"><button id="gemini-search-button" class="primary" type="button">AI সার্চ</button></div><p id="gemini-status" aria-live="polite"></p><div id="gemini-result"></div><p class="disclaimer">নিরাপত���তার জন্য API key এই public website-এ রাখা হয় না। Live search চালাতে server-side Gemini proxy configure করতে হবে।</p></section>';
    document.getElementById('gemini-search-button').addEventListener('click', search);
    document.getElementById('gemini-word-input').addEventListener('keydown', event => { if (event.key === 'Enter') search(); });
    window.scrollTo(0, 0);
  }

  async function search() {
    const input = document.getElementById('gemini-word-input');
    const status = document.getElementById('gemini-status');
    const result = document.getElementById('gemini-result');
    const word = input.value.trim();
    result.replaceChildren();
    if (!word) { status.textContent = 'একটি Korean শব্দ লিখুন।'; return; }
    if (!GEMINI_PROXY_ENDPOINT) { status.textContent = 'Live Gemini এখনো চালু নয়: নিরাপদ server-side Gemini proxy endpoint configure করা প্রয়োজন। API key সরাসরি এখানে দিলে public হয়ে যাবে।'; return; }
    status.textContent = 'Gemini বিশ্লেষণ তৈরি করছে…';
    const button = document.getElementById('gemini-search-button'); button.disabled = true;
    try {
      const response = await fetch(GEMINI_PROXY_ENDPOINT, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word,language:'bn',instructions:'Explain this Korean word to a Bangladeshi learner in simple Bangla. Include word type (Sino-Korean/native/loanword), Hanja and etymology where relevant, core concept, related roots and word family, nuanced synonyms and antonyms, natural native usage, one natural Korean sentence with Bangla translation, and particle/grammar breakdown. Clearly say when etymology is uncertain.'})});
      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      const text = typeof data.text === 'string' ? data.text : data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('\n');
      if (!text) throw new Error('Empty AI response');
      const card = document.createElement('article'); card.className = 'word-card';
      const heading = document.createElement('h3'); heading.className = 'kr'; heading.textContent = word;
      const body = document.createElement('p'); body.style.whiteSpace = 'pre-wrap'; body.textContent = text;
      card.append(heading, body); result.replaceChildren(card); status.textContent = '';
    } catch (_) { status.textContent = 'AI উত্তর পাওয়া যায়নি। Proxy endpoint, server ও network configuration যাচাই করুন।'; }
    finally { button.disabled = false; }
  }
})();
