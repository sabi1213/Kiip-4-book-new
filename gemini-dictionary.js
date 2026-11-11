(() => {
  'use strict';
  // Configure a server-side Gemini proxy. Never expose a Gemini API key in public client-side code.
  const GEMINI_PROXY_ENDPOINT = '';
  const view = document.getElementById('view-container');
  if (!view) return;

  const sampleWords = [
    {word:'대가족', meaning:'যৌথ পরিবার / বড় পরিবার', sentence:'우리 할머니는 대가족에서 사셨다.'},
    {word:'핵가족', meaning:'একক পরিবার / নিউক্লিয়ার ফ্যামিলি', sentence:'도시에서는 대부분 핵가족 형태로 삽니다.'},
    {word:'맞벌이 부부', meaning:'উভয়ই উপার্জনকারী দম্পতি', sentence:'우리는 맞벌이 부부라서 바쁘다.'},
    {word:'고령화', meaning:'জনসংখ্যার বার্ধক্য', sentence:'한국은 고령화 사회에 진입했다.'}
  ];
  const tiles = document.querySelector('.quick');
  if (tiles && !document.getElementById('gemini-dictionary-tile')) {
    const tile = document.createElement('button'); tile.id='gemini-dictionary-tile'; tile.className='tile'; tile.type='button';
    tile.innerHTML='<span class="tile-icon">✨</span><span><strong>Live Gemini AI Dictionary</strong><small>কোরিয়ান শব্দের বিশ্লেষণ</small></span>';
    tile.addEventListener('click', openDictionary); tiles.appendChild(tile);
  }
  const nav = document.querySelector('.bottom-inner');
  if (nav && !document.getElementById('gemini-dictionary-nav')) {
    const button=document.createElement('button'); button.id='gemini-dictionary-nav'; button.type='button'; button.innerHTML='<span>✨</span>AI Dictionary'; button.addEventListener('click',openDictionary); nav.appendChild(button);
  }
  if (tiles && !document.getElementById('kiip-audiobook-tile')) {
    const tile=document.createElement('button'); tile.id='kiip-audiobook-tile'; tile.className='tile'; tile.type='button'; tile.innerHTML='<span class="tile-icon">🎧</span><span><strong>অডিও বুক</strong><small>শব্দ ও অর্থ শুনুন</small></span>'; tile.addEventListener('click',openAudiobook); tiles.appendChild(tile);
  }
  if (nav && !document.getElementById('kiip-audiobook-nav')) {
    const button=document.createElement('button'); button.id='kiip-audiobook-nav'; button.type='button'; button.innerHTML='<span>🎧</span>অডিও বুক'; button.addEventListener('click',openAudiobook); nav.appendChild(button);
  }

  function panel(title, subtitle, body) {
    if (typeof active === 'function') active('gemini');
    view.innerHTML=`<section class="panel"><div class="heading"><h2>${title}</h2><small>${subtitle}</small></div>${body}</section>`;
    window.scrollTo(0,0);
  }
  function openDictionary() {
    panel('Live Gemini AI Dictionary','কোরিয়ান শব্দের বাংলা বিশ্লেষণ',
      '<p>শব্দের ধরন, 한자/어원, মূল ধারণা, related words, synonym/antonym, ব্যবহার, উদাহরণ ও grammar breakdown।</p><div class="writer-actions"><input id="gemini-word-input" class="name-input" style="max-width:500px" lang="ko" placeholder="예: 대가족, 핵가족, 낯설다"><button id="gemini-search-button" class="primary" type="button">AI সার্চ</button><button id="gemini-pdf-button" class="secondary" type="button">📄 PDF / Print</button></div><p id="gemini-status" aria-live="polite"></p><div id="gemini-result"></div><p class="disclaimer">Live Gemini চালাতে নিরাপদ server-side proxy প্রয়োজন। Public website-এ API key রাখা নিরাপদ নয়।</p>');
    document.getElementById('gemini-search-button').addEventListener('click',search);
    document.getElementById('gemini-word-input').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
    document.getElementById('gemini-pdf-button').addEventListener('click',printCurrent);
  }
  async function search() {
    const input=document.getElementById('gemini-word-input'), status=document.getElementById('gemini-status'), result=document.getElementById('gemini-result'), word=input.value.trim();
    result.replaceChildren(); if(!word){status.textContent='একটি Korean শব্দ লিখুন।';return;}
    if(!GEMINI_PROXY_ENDPOINT){status.textContent='Live Gemini এখনো চালু হয়নি। নিরাপদ server-side Gemini proxy endpoint configure করতে হবে; API key browser-এ দেওয়া যাবে না।';return;}
    status.textContent='Gemini বিশ্লেষণ তৈরি করছে…'; const button=document.getElementById('gemini-search-button');button.disabled=true;
    try {
      const response=await fetch(GEMINI_PROXY_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word,language:'bn',instructions:'Explain this Korean word to a Bangladeshi learner in simple Bangla. Include word type (Sino-Korean/native/loanword), Hanja and etymology where relevant, core concept, related roots and word family, nuanced synonyms and antonyms, natural native usage, one natural Korean sentence with Bangla translation, and particle/grammar breakdown. Clearly say when etymology is uncertain.'})});
      if(!response.ok)throw new Error('AI request failed');const data=await response.json();const text=typeof data.text==='string'?data.text:data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('\n');if(!text)throw new Error('Empty AI response');
      const card=document.createElement('article');card.className='word-card';const h=document.createElement('h3');h.className='kr';h.textContent=word;const p=document.createElement('p');p.style.whiteSpace='pre-wrap';p.textContent=text;card.append(h,p);result.replaceChildren(card);status.textContent='';
    } catch(_){status.textContent='AI উত্তর পাওয়া যায়নি। Proxy endpoint, server ও network যাচাই করুন.';} finally{button.disabled=false;}
  }
  let audioList=[], audioIndex=0, audioPlaying=false, audioRate=1;
  function openAudiobook(){
    const existing=Array.isArray(window.vocab)?window.vocab.filter(v=>v&&v.word):[];
    audioList=existing.length?existing.map(v=>({word:v.word,meaning:v.meaning||'',sentence:v.example||''})):sampleWords;
    audioIndex=0;
    panel('🎧 Korean Audio Book','কোরিয়ান শব্দ ও বাংলা অর্থ ধারাবাহিকভাবে শুনুন',
      '<div class="word-card" style="text-align:center"><h3 id="book-word" class="kr"></h3><p id="book-meaning"></p><p id="book-sentence" class="kr"></p><p id="book-count" class="count"></p></div><div class="writer-actions" style="justify-content:center"><button id="book-prev" class="secondary" type="button">⏮️ আগের</button><button id="book-play" class="primary" type="button">▶️ চালু</button><button id="book-next" class="secondary" type="button">পরের ⏭️</button></div><div class="writer-actions" style="justify-content:center"><span>স্পিড:</span><button class="secondary" data-rate="0.8" type="button">0.8x</button><button class="secondary" data-rate="1" type="button">1.0x</button><button class="secondary" data-rate="1.2" type="button">1.2x</button></div><p class="disclaimer">প্লেব্যাক বন্ধ করতে Pause চাপুন বা পেজ ছেড়ে যান। Browser-এর Korean/Bangla voice availability device অনুযায়ী ভিন্ন হতে পারে।</p>');
    updateAudio();document.getElementById('book-play').addEventListener('click',()=>audioPlaying?stopAudio():playAudio());
    document.getElementById('book-prev').addEventListener('click',()=>moveAudio(-1));document.getElementById('book-next').addEventListener('click',()=>moveAudio(1));
    document.querySelectorAll('[data-rate]').forEach(b=>b.addEventListener('click',()=>{audioRate=Number(b.dataset.rate);if(audioPlaying)playAudio()}));
  }
  function updateAudio(){const item=audioList[audioIndex];if(!item)return;document.getElementById('book-word').textContent=item.word;document.getElementById('book-meaning').textContent=item.meaning;document.getElementById('book-sentence').textContent=item.sentence?`“${item.sentence}”`:'';document.getElementById('book-count').textContent=`শব্দ ${audioIndex+1} / ${audioList.length}`;}
  function moveAudio(delta){audioIndex=(audioIndex+delta+audioList.length)%audioList.length;updateAudio();if(audioPlaying)playAudio();}
  function stopAudio(){audioPlaying=false;if('speechSynthesis'in window)window.speechSynthesis.cancel();const button=document.getElementById('book-play');if(button)button.textContent='▶️ চালু';}
  function playAudio(){if(!('speechSynthesis'in window)){document.getElementById('book-count').textContent='এই browser-এ voice পাওয়া যায়নি।';return;}audioPlaying=true;const item=audioList[audioIndex];window.speechSynthesis.cancel();const kr=new SpeechSynthesisUtterance(item.word);kr.lang='ko-KR';kr.rate=audioRate;kr.onend=()=>{if(!audioPlaying)return;const bn=new SpeechSynthesisUtterance(item.meaning);bn.lang='bn-BD';bn.rate=audioRate;bn.onend=()=>{if(audioPlaying)moveAudio(1)};window.speechSynthesis.speak(bn)};document.getElementById('book-play').textContent='⏸️ বিরতি';window.speechSynthesis.speak(kr);}
  function printCurrent(){const result=document.getElementById('gemini-result');if(!result||!result.childElementCount){document.getElementById('gemini-status').textContent='PDF করার আগে শব্দের analysis তৈরি করুন।';return;}const style=document.createElement('style');style.id='gemini-print-style';style.textContent='@media print{body>*{visibility:hidden!important}#view-container,#view-container *{visibility:visible!important}#view-container{position:absolute!important;left:0;top:0;width:100%;margin:0!important;padding:16px!important;background:white!important;color:#111!important}.word-card{background:white!important;color:#111!important;border:1px solid #999!important;box-shadow:none!important}.word-card *{color:#111!important}}';document.head.appendChild(style);window.print();setTimeout(()=>style.remove(),1000);}
  window.addEventListener('beforeunload',stopAudio);
})();
