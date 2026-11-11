(() => {
  'use strict';
  // Put only a server-side Gemini proxy URL here. Never expose the Gemini API key in public client-side code.
  const GEMINI_PROXY_ENDPOINT = '';
  const view = document.getElementById('view-container');
  if (!view) return;

  const $ = id => document.getElementById(id);
  const safeVocab = () => Array.isArray(window.vocab) ? window.vocab.filter(item => item && item.word) : [];
  const safeText = value => String(value == null ? '' : value);

  const quick = document.querySelector('.quick');
  if (quick && !$('gemini-dictionary-tile')) {
    const tile = document.createElement('button'); tile.id='gemini-dictionary-tile'; tile.type='button'; tile.className='tile';
    tile.innerHTML='<span class="tile-icon">✨</span><span><strong>Smart AI Dictionary</strong><small>কোরিয়ান শব্দ ও বাক্যের বিশ্লেষণ</small></span>';
    tile.addEventListener('click', openDictionary); quick.appendChild(tile);
  }
  if (quick && !$('kiip-audio-tile')) {
    const tile=document.createElement('button'); tile.id='kiip-audio-tile'; tile.type='button'; tile.className='tile';
    tile.innerHTML='<span class="tile-icon">🎧</span><span><strong>Audio Book</strong><small>শব্দ ও অর্থ শুনুন</small></span>';
    tile.addEventListener('click',openAudio); quick.appendChild(tile);
  }
  if (quick && !$('kiip-exam-writing-tile')) {
    const tile=document.createElement('button'); tile.id='kiip-exam-writing-tile'; tile.type='button'; tile.className='tile';
    tile.innerHTML='<span class="tile-icon">📝</span><span><strong>পরীক্ষার 원고지</strong><small>প্রথম ঘর খালি রেখে অনুশীলন</small></span>';
    tile.addEventListener('click',openExamWriting); quick.appendChild(tile);
  }
  const nav=document.querySelector('.bottom-inner');
  if(nav&&!$('gemini-dictionary-nav')){const b=document.createElement('button');b.id='gemini-dictionary-nav';b.type='button';b.innerHTML='<span>✨</span>AI Dictionary';b.addEventListener('click',openDictionary);nav.appendChild(b)}
  if(nav&&!$('kiip-audio-nav')){const b=document.createElement('button');b.id='kiip-audio-nav';b.type='button';b.innerHTML='<span>🎧</span>অডিও';b.addEventListener('click',openAudio);nav.appendChild(b)}

  function setView(title, subtitle, html, action) {
    if(typeof window.active==='function') window.active(action||'vocab');
    view.innerHTML=`<section class="panel"><div class="heading"><h2>${title}</h2><small>${subtitle}</small></div>${html}</section>`;
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function button(label,id,cls='primary'){return `<button id="${id}" type="button" class="${cls}">${label}</button>`}
  function openDictionary(prefill='') {
    setView('Smart AI Korean Dictionary','শব্দ বা বাক্যাংশের বিশ্লেষণ',
      `<p>শব্দ বা বাক্যাংশ লিখুন। পরিচিত শব্দ হলে আপনার আগের offline dictionary-এর তথ্য দেখাবে; live Gemini ফলাফলের জন্য নিরাপদ server-side endpoint configure করতে হবে।</p><div class="writer-actions"><input id="gemini-query" class="name-input" style="max-width:520px" lang="ko" placeholder="예: 대가족, 성격, 낯설다 또는 Korean বাক্য"><button id="gemini-go" class="primary">AI সার্চ</button><button id="gemini-print" class="secondary">📄 A4 / Print</button></div><div class="writer-actions" id="gemini-chips"><button class="secondary" data-word="대가족">대가족</button><button class="secondary" data-word="핵가족">핵가족</button><button class="secondary" data-word="낯설다">낯설다</button><button class="secondary" data-word="성격이 강한 바람">성격이 강한 바람</button></div><p id="gemini-status" aria-live="polite"></p><div id="gemini-results"></div><p class="disclaimer">AI-র তৈরি ব্যাখ্যা ভুল হতে পারে—বিশেষ করে idiom, Hanja ও আবহাওয়ার 표현। গুরুত্বপূর্ণ ক্ষেত্রে নির্ভরযোগ্য dictionary দিয়ে যাচাই করুন। API key এই public page-এ দেওয়া হবে না।</p>`, 'vocab');
    const input=$('gemini-query');input.value=prefill;
    $('gemini-go').addEventListener('click',()=>search(input.value));input.addEventListener('keydown',e=>{if(e.key==='Enter')search(input.value)});
    $('gemini-print').addEventListener('click',printView);
    $('gemini-chips').addEventListener('click',e=>{const b=e.target.closest('[data-word]');if(b){input.value=b.dataset.word;search(input.value)}});
    if(prefill)search(prefill);else showOfflineWords();
  }
  function showOfflineWords(){
    const results=$('gemini-results');if(!results)return;results.replaceChildren();
    safeVocab().slice(0,8).forEach(item=>results.appendChild(makeOfflineCard(item)));
    if(!results.childElementCount){const p=document.createElement('p');p.textContent='কোনো offline vocabulary পাওয়া যায়নি।';results.appendChild(p)}
  }
  function makeOfflineCard(item){
    const article=document.createElement('article');article.className='word-card';
    const h=document.createElement('h3');h.className='kr';h.textContent=safeText(item.word);article.appendChild(h);
    const fields=[['বাংলা অর্থ',item.meaning],['Hanja / শব্দ বিশ্লেষণ',item.breakdown],['উদাহরণ',item.example],['অনুবাদ',item.translation]];
    fields.forEach(([label,value])=>{if(!value)return;const p=document.createElement('p');const strong=document.createElement('strong');strong.textContent=label+': ';p.append(strong,document.createTextNode(safeText(value)));article.appendChild(p)});
    if(item.example){const speak=document.createElement('button');speak.type='button';speak.className='secondary';speak.textContent='🔊 Korean শুনুন';speak.addEventListener('click',()=>say(safeText(item.example),'ko-KR'));article.appendChild(speak)}
    return article;
  }
  function escapeHTML(value){return safeText(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  async function search(raw){
    const query=safeText(raw).trim(),status=$('gemini-status'),results=$('gemini-results');if(!query||!status||!results)return;
    results.replaceChildren();status.textContent='';
    const matches=safeVocab().filter(item=>[item.word,item.meaning,item.breakdown].some(text=>safeText(text).toLocaleLowerCase().includes(query.toLocaleLowerCase())));
    if(matches.length){matches.forEach(item=>results.appendChild(makeOfflineCard(item)));status.textContent='আপনার আগের offline dictionary থেকে ফলাফল দেখানো হয়েছে।';return;}
    if(!GEMINI_PROXY_ENDPOINT){status.textContent='এই শব্দের offline ফল নেই। Live Gemini চালু করতে নিরাপদ server-side Gemini endpoint configure করতে হবে; আপাতত কোনো বানানো AI উত্তর দেখানো হচ্ছে না।';return;}
    status.textContent='Gemini বিশ্লেষণ তৈরি করছে…';const go=$('gemini-go');go.disabled=true;
    try{
      const response=await fetch(GEMINI_PROXY_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word:query,language:'bn',instructions:'Explain this Korean word or phrase to a Bangladeshi learner in simple Bangla. Include natural meaning and usage, word type, Hanja/etymology only if verified (state uncertainty), roots and related words, nuanced synonyms and antonyms, one natural Korean example, Bangla translation, and particle/grammar breakdown. Correct unnatural Korean phrasing explicitly; do not invent facts.'})});
      if(!response.ok)throw new Error('request failed');const data=await response.json();const text=typeof data.text==='string'?data.text:data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('\n');if(!text)throw new Error('empty response');
      const card=document.createElement('article');card.className='word-card';const h=document.createElement('h3');h.className='kr';h.textContent=query;const p=document.createElement('p');p.style.whiteSpace='pre-wrap';p.textContent=text;card.append(h,p);results.appendChild(card);status.textContent='';
    }catch(_){status.textContent='Gemini উত্তর পাওয়া যায়নি। Endpoint, server ও network configuration যাচাই করুন.'}finally{go.disabled=false}
  }

  let audioItems=[],audioIndex=0,audioActive=false,audioRate=1,audioTimer=null;
  function openAudio(){
    audioItems=safeVocab().map(v=>({word:safeText(v.word),meaning:safeText(v.meaning),sentence:safeText(v.example||'')}));audioIndex=0;
    setView('🎧 KIIP Level 4 Audio Book','কোরিয়ান শব্দ ও বাংলা অর্থ শুনুন',
      `<div class="word-card" style="text-align:center"><h3 id="book-word" class="kr"></h3><p id="book-meaning"></p><p id="book-sentence" class="kr"></p><p id="book-progress" class="count"></p></div><div class="writer-actions"><button id="book-prev" class="secondary">⏮️ আগের</button><button id="book-play" class="primary">▶️ সব একসাথে প্লে</button><button id="book-stop" class="secondary">⏹ বন্ধ</button><button id="book-next" class="secondary">পরের ⏭️</button></div><div class="writer-actions"><span>স্পিড:</span><button class="secondary" data-rate="0.8">0.8x</button><button class="secondary" data-rate="1">1.0x</button><button class="secondary" data-rate="1.2">1.2x</button></div><div id="audio-playlist"></div>`, 'vocab');
    if(!audioItems.length){$('audio-playlist').textContent='Offline vocabulary পাওয়া যায়নি।';return}
    renderAudio();$('book-prev').addEventListener('click',()=>stepAudio(-1));$('book-next').addEventListener('click',()=>stepAudio(1));$('book-play').addEventListener('click',playAll);$('book-stop').addEventListener('click',stopAudio);
    document.querySelectorAll('[data-rate]').forEach(b=>b.addEventListener('click',()=>{audioRate=Number(b.dataset.rate)}));
  }
  function renderAudio(){const item=audioItems[audioIndex];if(!item)return;$('book-word').textContent=item.word;$('book-meaning').textContent=item.meaning;$('book-sentence').textContent=item.sentence;$('book-progress').textContent=`শব্দ ${audioIndex+1} / ${audioItems.length}`;const list=$('audio-playlist');list.replaceChildren();audioItems.forEach((v,i)=>{const row=document.createElement('div');row.className='qa';const p=document.createElement('p');p.textContent=`${i+1}. ${v.word} — ${v.meaning}`;const b=document.createElement('button');b.className='secondary';b.type='button';b.textContent='🔊 শুনুন';b.addEventListener('click',()=>{audioIndex=i;renderAudio();say(`${v.word}. ${v.meaning}`,'ko-KR')});row.append(p,b);list.appendChild(row)})}
  function stepAudio(delta){if(!audioItems.length)return;audioIndex=(audioIndex+delta+audioItems.length)%audioItems.length;renderAudio()}
  function stopAudio(){audioActive=false;clearTimeout(audioTimer);if('speechSynthesis'in window)window.speechSynthesis.cancel();if($('book-play'))$('book-play').textContent='▶️ সব একসাথে প্লে'}
  function playAll(){if(!audioItems.length)return;if(audioActive){stopAudio();return}audioActive=true;$('book-play').textContent='⏸️ Pause';playCurrent()}
  function playCurrent(){if(!audioActive)return;const item=audioItems[audioIndex];if(!item){stopAudio();return}renderAudio();if(!('speechSynthesis'in window)){stopAudio();return}window.speechSynthesis.cancel();const kr=new SpeechSynthesisUtterance(item.word);kr.lang='ko-KR';kr.rate=audioRate;kr.onend=()=>{if(!audioActive)return;const bn=new SpeechSynthesisUtterance(item.meaning);bn.lang='bn-BD';bn.rate=audioRate;bn.onend=()=>{if(audioActive){audioIndex++;if(audioIndex>=audioItems.length){stopAudio();return}audioTimer=setTimeout(playCurrent,700)}};window.speechSynthesis.speak(bn)};window.speechSynthesis.speak(kr)}
  function say(text,lang){if(!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang=lang||'ko-KR';utterance.rate=.9;window.speechSynthesis.speak(utterance)}

  function openExamWriting(){
    setView('원고지 100자 · পরীক্ষার অনুশীলন','প্রথম ঘর ফাঁকা, তারপর লেখা শুরু',
      `<div class="disclaimer"><strong>পরীক্ষার অনুশীলন:</strong> অনুচ্ছেদের প্রথম ঘর ফাঁকা রেখে পরের ঘর থেকে লিখুন। ১০০টি লেখা-ঘরসহ প্রথম ফাঁকা ঘর আলাদা করে ১০১টি cell দেখানো হবে। ‘해요/합니다/습니다’ ধাঁচ পেলে সতর্কতা দেখাবে।</div><label class="label" for="exam-won-input">Korean লেখা</label><textarea id="exam-won-input" class="text-input kr" maxlength="100" placeholder="한국 생활에 잘 적응하려면..."></textarea><div class="writer-actions"><span id="exam-count" class="count">0 / 100자</span><button id="exam-save" class="primary">💾 সেভ</button><button id="exam-print" class="secondary">📄 A4 Print</button><button id="exam-clear" class="secondary">মুছুন</button></div><p id="exam-warning" class="disclaimer" hidden></p><div class="grid-wrap"><div id="exam-grid" class="wongoji"></div></div><p id="exam-save-status" aria-live="polite"></p>`, 'writing');
    const input=$('exam-won-input'),key='kiip_exam_wonguji_v1';try{input.value=localStorage.getItem(key)||''}catch(_){};updateExamGrid();input.addEventListener('input',updateExamGrid);
    $('exam-save').addEventListener('click',()=>{try{localStorage.setItem(key,input.value);$('exam-save-status').textContent='এই device/browser-এ সেভ হয়েছে.'}catch(_){$('exam-save-status').textContent='Browser storage-এ সেভ করা যায়নি.'}});
    $('exam-clear').addEventListener('click',()=>{input.value='';updateExamGrid();$('exam-save-status').textContent=''});$('exam-print').addEventListener('click',printView);
  }
  function updateExamGrid(){const input=$('exam-won-input');if(!input)return;const chars=Array.from(input.value).slice(0,100),grid=$('exam-grid');$('exam-count').textContent=`${chars.length} / 100자`;grid.replaceChildren();for(let i=0;i<101;i++){const cell=document.createElement('div');cell.className='cell';if(i===0){cell.classList.add('space');cell.setAttribute('aria-label','প্রথম ঘর খালি');}else cell.textContent=chars[i-1]||'';grid.appendChild(cell)}const warning=$('exam-warning'),mixed=/해요|합니다|습니다/.test(input.value);warning.hidden=!mixed;warning.textContent=mixed?"⚠️ ‘해요/합니다/습니다’ আছে—এই অনুশীলনে ‘한다’ style ব্যবহার করুন।":"✅ ‘한다’ style পরীক্ষা করুন; এটি কেবল সহজ phrase check, পূর্ণ grammar checker নয়।"}
  function printView(){const clone=view.cloneNode(true);clone.querySelectorAll('button,textarea,input').forEach(el=>{if(el.tagName==='TEXTAREA'){const p=document.createElement('p');p.textContent=el.value;el.replaceWith(p)}else el.remove()});const win=window.open('','_blank');if(!win){window.print();return}win.document.write('<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>KIIP A4 Print</title><style>body{font:14px sans-serif;color:#111;padding:20px}.panel,.word-card{border:1px solid #bbb;padding:14px;margin:10px 0}.wongoji{display:grid;grid-template-columns:repeat(10,28px);gap:2px}.cell{width:28px;height:28px;border:1px solid #ef9999;display:grid;place-items:center}.space{background:#fee2e2}</style></head><body></body></html>');win.document.body.appendChild(clone);win.document.close();win.focus();setTimeout(()=>{win.print();win.close()},350)}
  window.addEventListener('beforeunload',stopAudio);
})();
