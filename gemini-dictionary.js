(() => {
  'use strict';

  // Configure the public Worker URL in gemini-config.js. The Gemini API key belongs only in Worker secrets.
  const GEMINI_PROXY_ENDPOINT = window.GEMINI_API_ENDPOINT || '';
  const root = document.getElementById('view-container');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const text = value => String(value == null ? '' : value);
  const originalVocab = () => Array.isArray(window.vocab) ? window.vocab.filter(item => item && item.word) : [];

  // A small verified offline dictionary. Arbitrary live AI answers need the secure server endpoint above.
  const mobileDictionary = [
    {word:'성격',hanja:'性格',type:'한자어',meaning:'ব্যক্তিত্ব / স্বভাব / চরিত্র',breakdown:'성(性: স্বভাব) + 격(格: ধরন/কাঠামো)।',concept:'মানুষের তুলনামূলক স্থায়ী আচরণ ও মানসিক বৈশিষ্ট্য।',root:'성품, 성질',family:'성격이 좋다 · 성격이 강하다',synonym:'인품 (ব্যক্তিত্ব; প্রাসঙ্গিক অর্থে)',antonym:'একটি সরাসরি বিপরীত শব্দ নেই',native:'দৈনন্দিন কথোপকথন এবং TOPIK/KIIP-এ প্রচলিত।',sentenceKr:'그 사람은 성격이 원만하다.',sentenceBn:'সেই ব্যক্তির স্বভাব অমায়িক।',grammar:'그 사람은(সেই ব্যক্তি) + 성격이(ব্যক্তিত্ব) + 원만하다(অমায়িক)।'},
    {word:'대가족',hanja:'大家族',type:'한자어',meaning:'বড় / যৌথ পরিবার',breakdown:'대(大: বড়) + 가(家: পরিবার) + 족(族: গোষ্ঠী)।',concept:'সাধারণত একাধিক প্রজন্ম বা বিস্তৃত আত্মীয়দের নিয়ে গঠিত পরিবার।',root:'가족, 가족 구성원',family:'확대가족 (বর্ধিত পরিবার)',synonym:'확대가족 (প্রসঙ্গভেদে)',antonym:'핵가족 (একক পরিবার)',native:'পরিবার ও সমাজ বিষয়ক আলোচনায় ব্যবহৃত হয়।',sentenceKr:'우리 할머니는 대가족에서 사셨다.',sentenceBn:'আমার দাদি যৌথ পরিবারে বাস করতেন।',grammar:'우리 할머니는(আমার দাদি) + 대가족에서(বড় পরিবারে) + 사셨다(বাস করতেন; সম্মানসূচক অতীত)।'},
    {word:'핵가족',hanja:'核家族',type:'한자어',meaning:'একক / নিউক্লিয়ার পরিবার',breakdown:'핵(核: কেন্দ্র) + 가족(家族: পরিবার)।',concept:'সাধারণত বাবা-মা ও তাঁদের সন্তানদের নিয়ে গঠিত পরিবার।',root:'핵심 (মূল বিষয়), 가족 (পরিবার)',family:'1인 가구 (এক ব্যক্তির পরিবার)',synonym:'소가족 (ছোট পরিবার; পুরোপুরি একই অর্থ নয়)',antonym:'대가족 (বড় পরিবার)',native:'আধুনিক পরিবার কাঠামো নিয়ে আলোচনায় প্রচলিত।',sentenceKr:'도시에는 핵가족이 많다.',sentenceBn:'শহরে একক পরিবারের সংখ্যা বেশি।',grammar:'도시에는(শহরে) + 핵가족이(একক পরিবার) + 많다(বেশি আছে)।'},
    {word:'강한 바람',hanja:'native Korean phrase',type:'표현',meaning:'জোর বাতাস / প্রবল হাওয়া',breakdown:'강하다 (শক্তিশালী হওয়া) থেকে 강한 (শক্তিশালী) + 바람 (বাতাস)।',concept:'বাতাসের জোর বেশি বোঝায়।',root:'강하다, 바람',family:'바람이 강하게 불다',synonym:'센 바람, 거센 바람 (প্রসঙ্গভেদে)',antonym:'약한 바람, 산들바람',native:'আবহাওয়া বর্ণনায় স্বাভাবিক; 강풍 হলো সংক্ষিপ্ত/প্রাতিষ্ঠানিক শব্দ।',sentenceKr:'오늘은 바람이 강하게 분다.',sentenceBn:'আজ জোরে বাতাস বইছে।',grammar:'오늘은(আজ) + 바람이(বাতাস) + 강하게(জোরে) + 분다(বয়; 한다-ধাঁচ)।'},
    {word:'성격이 강한 바람',hanja:'문장 조합 — 자연스럽지 않은 표현',type:'표현 교정',meaning:'শব্দে-শব্দে: “ব্যক্তিত্ব শক্তিশালী বাতাস”; বাতাস বোঝাতে কোরিয়ান ভাষায় এটি স্বাভাবিক প্রকাশ নয়।',breakdown:'성격이 강하다 সাধারণত ব্যক্তির স্বভাব/ব্যক্তিত্ব সম্পর্কে বলা হয়; আবহাওয়ার ক্ষেত্রে 강한 바람 / 바람이 강하게 분다 বলুন।',concept:'সম্ভবত উদ্দেশ্য “প্রবল বাতাস”।',root:'성격이 강하다 (ব্যক্তিত্ব দৃঢ়) · 강한 바람 (প্রবল বাতাস)',family:'바람이 세다 · 강풍이 불다',synonym:'강한 바람, 거센 바람',antonym:'약한 바람, 산들바람',native:'এই পুরো phrase-টি আবহাওয়ার জন্য অস্বাভাবিক; নিচের সংশোধিত বাক্য ব্যবহার করুন।',sentenceKr:'오늘 바닷가에는 강한 바람이 분다.',sentenceBn:'আজ সমুদ্রতীরে প্রবল বাতাস বইছে।',grammar:'오늘(আজ) + 바닷가에는(সমুদ্রতীরে) + 강한 바람이(প্রবল বাতাস) + 분다(বয়)।'}
  ];

  const quick = document.querySelector('.quick');
  function addTile(id, icon, title, caption, handler) {
    if (!quick || $(id)) return;
    const tile=document.createElement('button'); tile.id=id; tile.type='button'; tile.className='tile';
    const iconNode=document.createElement('span'); iconNode.className='tile-icon'; iconNode.textContent=icon;
    const copy=document.createElement('span'), heading=document.createElement('strong'), detail=document.createElement('small');
    heading.textContent=title; detail.textContent=caption; copy.append(heading,detail); tile.append(iconNode,copy); tile.addEventListener('click',handler); quick.appendChild(tile);
  }
  addTile('gemini-dictionary-tile','✨','Mobile Smart Dictionary','Offline শব্দ + secure Gemini',openDictionary);
  addTile('kiip-audio-tile','🎧','Audio Book','শব্দ ও অর্থ শুনুন',openAudio);
  addTile('kiip-exam-writing-tile','📝','পরীক্ষার 원고지','প্রথম ঘর খালি রেখে অনুশীলন',openExamWriting);
  const nav=document.querySelector('.bottom-inner');
  function addNav(id,icon,label,handler){if(!nav||$(id))return;const b=document.createElement('button');b.id=id;b.type='button';b.innerHTML=`<span>${icon}</span>${label}`;b.addEventListener('click',handler);nav.appendChild(b)}
  addNav('gemini-dictionary-nav','✨','AI Dictionary',openDictionary);
  addNav('kiip-audio-nav','🎧','অডিও',openAudio);

  function setView(title,subtitle,body,tab){if(typeof window.active==='function')window.active(tab||'vocab');root.innerHTML=`<section class="panel"><div class="heading"><h2>${title}</h2><small>${subtitle}</small></div>${body}</section>`;window.scrollTo({top:0,behavior:'smooth'})}
  function openDictionary(prefill=''){
    setView('Mobile Smart Korean Dictionary','শব্দ বা বাক্যাংশের বিশ্লেষণ',`<p>অন্তর্ভুক্ত offline শব্দের ফল সঙ্গে সঙ্গে পাওয়া যাবে। অন্য শব্দে live Gemini ফলের জন্য secure server endpoint দরকার; endpoint না থাকলে কোনো বানানো AI উত্তর দেখানো হবে না।</p><div class="writer-actions"><input id="mobile-dict-query" class="name-input" style="max-width:520px" lang="ko" placeholder="예: 성격, 대가족, 환경, 낯설다"><button id="mobile-dict-search" class="primary" type="button">সার্চ</button><button id="mobile-dict-print" class="secondary" type="button">📄 A4 / Print</button></div><div class="writer-actions" id="mobile-dict-chips"><button class="secondary" data-word="성격">성격</button><button class="secondary" data-word="대가족">대가족</button><button class="secondary" data-word="핵가족">핵가족</button><button class="secondary" data-word="성격이 강한 바람">বাতাসের phrase সংশোধন</button></div><p id="mobile-dict-status" aria-live="polite"></p><div id="mobile-dict-results"></div><p class="disclaimer">Hanja, etymology ও phrase-usage যাচাই করে নিন। Gemini API key কখনো public webpage-এ রাখা হয় না।</p>`,'vocab');
    const input=$('mobile-dict-query'); input.value=prefill;
    $('mobile-dict-search').addEventListener('click',()=>searchDictionary(input.value));
    input.addEventListener('keydown',event=>{if(event.key==='Enter')searchDictionary(input.value)});
    $('mobile-dict-print').addEventListener('click',printCurrent);
    $('mobile-dict-chips').addEventListener('click',event=>{const b=event.target.closest('[data-word]');if(b){input.value=b.dataset.word;searchDictionary(input.value)}});
    if(prefill)searchDictionary(prefill);else showOfflineDictionary();
  }
  function makeCard(item){
    const card=document.createElement('article');card.className='word-card';
    const heading=document.createElement('h3');heading.className='kr';heading.textContent=text(item.word);card.appendChild(heading);
    const fields=[['বাংলা অর্থ',item.meaning],['শব্দের ধরন',item.type],['Hanja / শব্দ বিশ্লেষণ',item.breakdown],['মূল ধারণা',item.concept],['Root words',item.root],['Word family',item.family],['সমার্থক / বিপরীত',`${text(item.synonym)} / ${text(item.antonym)}`],['ব্যবহার',item.native],['Korean বাক্য',item.sentenceKr],['বাংলা অনুবাদ',item.sentenceBn],['ব্যাকরণ',item.particleBreakdown||item.grammar]];
    for(const [label,value] of fields){if(!value)continue;const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=`${label}: `;p.append(strong,document.createTextNode(text(value)));card.appendChild(p)}
    const speak=document.createElement('button');speak.type='button';speak.className='secondary';speak.textContent='🔊 Korean বাক্য শুনুন';speak.addEventListener('click',()=>speakText(text(item.sentenceKr||item.word),'ko-KR'));card.appendChild(speak);
    return card;
  }
  function showOfflineDictionary(){const results=$('mobile-dict-results');if(!results)return;results.replaceChildren();const all=[...mobileDictionary,...originalVocab()];all.slice(0,10).forEach(item=>results.appendChild(makeCard(item)));}
  function searchDictionary(raw){
    const query=text(raw).trim(),status=$('mobile-dict-status'),results=$('mobile-dict-results');if(!query||!status||!results)return;
    results.replaceChildren();status.textContent='';
    const norm=value=>text(value).toLocaleLowerCase().replace(/\s+/g,' ').trim();
    const local=[...mobileDictionary,...originalVocab()];
    const found=local.filter(item=>[item.word,item.meaning,item.breakdown].some(value=>norm(value).includes(norm(query))||norm(query).includes(norm(value))));
    if(found.length){found.slice(0,8).forEach(item=>results.appendChild(makeCard(item)));status.textContent='Offline dictionary result';return;}
    if(!GEMINI_PROXY_ENDPOINT){status.textContent='এই শব্দের offline তথ্য নেই, আর secure Gemini endpoint configure করা হয়নি। “API/Cloudflare ছাড়া live AI” সম্ভব নয়—এ জন্য AI server/API প্রয়োজন।';return;}
    status.textContent='Gemini বিশ্লেষণ তৈরি হচ্ছে…';const button=$('mobile-dict-search');button.disabled=true;
    fetch(GEMINI_PROXY_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word:query})})
      .then(async response=>{const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`Request failed (${response.status})`);if(typeof data.text!=='string'||!data.text.trim())throw new Error('Empty AI response');return data.text;})
      .then(answer=>{const card=document.createElement('article');card.className='word-card';const h=document.createElement('h3');h.className='kr';h.textContent=query;const p=document.createElement('p');p.style.whiteSpace='pre-wrap';p.textContent=answer;card.append(h,p);results.appendChild(card);status.textContent='';})
      .catch(error=>{status.textContent=`Gemini ফল পাওয়া যায়নি: ${error.message||'endpoint যাচাই করুন'}`;})
      .finally(()=>{button.disabled=false;});
  }

  let audioItems=[],audioIndex=0,audioActive=false,audioRate=1,audioTimer=null;
  function openAudio(){audioItems=[...mobileDictionary,...originalVocab()].map(v=>({word:text(v.word),meaning:text(v.meaning),sentence:text(v.sentenceKr||v.example||'')}));audioIndex=0;setView('🎧 KIIP Level 4 Audio Book','কোরিয়ান শব্দ ও বাংলা অর্থ শুনুন',`<div class="word-card" style="text-align:center"><h3 id="mobile-audio-word" class="kr"></h3><p id="mobile-audio-meaning"></p><p id="mobile-audio-progress" class="count"></p></div><div class="writer-actions"><button id="mobile-audio-prev" class="secondary">⏮️ আগের</button><button id="mobile-audio-play" class="primary">▶️ সব চালু</button><button id="mobile-audio-stop" class="secondary">⏹ বন্ধ</button><button id="mobile-audio-next" class="secondary">পরের ⏭️</button></div><div class="writer-actions"><span>গতি:</span><button class="secondary" data-audio-rate="0.8">0.8x</button><button class="secondary" data-audio-rate="1">1.0x</button><button class="secondary" data-audio-rate="1.2">1.2x</button></div><div id="mobile-audio-list"></div>`,'vocab');if(!audioItems.length){$('mobile-audio-list').textContent='কোনো শব্দ নেই।';return}renderAudio();$('mobile-audio-prev').addEventListener('click',()=>stepAudio(-1));$('mobile-audio-next').addEventListener('click',()=>stepAudio(1));$('mobile-audio-play').addEventListener('click',playAllAudio);$('mobile-audio-stop').addEventListener('click',stopAudio);document.querySelectorAll('[data-audio-rate]').forEach(b=>b.addEventListener('click',()=>audioRate=Number(b.dataset.audioRate)));}
  function renderAudio(){const item=audioItems[audioIndex];if(!item)return;$('mobile-audio-word').textContent=item.word;$('mobile-audio-meaning').textContent=item.meaning;$('mobile-audio-progress').textContent=`${audioIndex+1} / ${audioItems.length}`;const list=$('mobile-audio-list');list.replaceChildren();audioItems.forEach((value,index)=>{const row=document.createElement('div');row.className='qa';const p=document.createElement('p');p.textContent=`${index+1}. ${value.word} — ${value.meaning}`;const b=document.createElement('button');b.className='secondary';b.type='button';b.textContent='🔊 শুনুন';b.addEventListener('click',()=>{audioIndex=index;renderAudio();speakText(`${value.word}. ${value.meaning}`,'ko-KR')});row.append(p,b);list.appendChild(row);});}
  function stepAudio(delta){if(!audioItems.length)return;audioIndex=(audioIndex+delta+audioItems.length)%audioItems.length;renderAudio();}
  function stopAudio(){audioActive=false;clearTimeout(audioTimer);if('speechSynthesis'in window)window.speechSynthesis.cancel();if($('mobile-audio-play'))$('mobile-audio-play').textContent='▶️ সব চালু';}
  function playAllAudio(){if(!audioItems.length)return;if(audioActive){stopAudio();return;}audioActive=true;$('mobile-audio-play').textContent='⏸️ থামান';playCurrentAudio();}
  function playCurrentAudio(){if(!audioActive)return;const item=audioItems[audioIndex];if(!item||!('speechSynthesis'in window)){stopAudio();return;}renderAudio();window.speechSynthesis.cancel();const kr=new SpeechSynthesisUtterance(item.word);kr.lang='ko-KR';kr.rate=audioRate;kr.onend=()=>{if(!audioActive)return;const bn=new SpeechSynthesisUtterance(item.meaning);bn.lang='bn-BD';bn.rate=audioRate;bn.onend=()=>{if(!audioActive)return;audioIndex++;if(audioIndex>=audioItems.length){stopAudio();return;}audioTimer=setTimeout(playCurrentAudio,500);};window.speechSynthesis.speak(bn);};window.speechSynthesis.speak(kr);}
  function speakText(value,lang){if(!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text(value));utterance.lang=lang||'ko-KR';utterance.rate=.9;utterance.pitch=.95;window.speechSynthesis.speak(utterance);}

  function openExamWriting(){setView('원고지 100자 · পরীক্ষার নিয়ম','প্রথম ঘর খালি রেখে লেখা শুরু',`<div class="disclaimer">অনুচ্ছেদের প্রথম ঘর খালি রেখে পরের ঘর থেকে লিখুন। এখানে ১টি ফাঁকা ঘর ও ১০০টি লেখা-ঘর দেখানো হবে। এটি লেখার অনুশীলন; সম্পূর্ণ Korean grammar checker নয়।</div><label class="label" for="mobile-won-input">Korean লেখা</label><textarea id="mobile-won-input" class="text-input kr" maxlength="100" placeholder="한국 생활에 잘 적응하려면..."></textarea><div class="writer-actions"><span id="mobile-won-count" class="count">0 / 100자</span><button id="mobile-won-save" class="primary">💾 সেভ</button><button id="mobile-won-print" class="secondary">📄 Print</button><button id="mobile-won-clear" class="secondary">মুছুন</button></div><p id="mobile-won-warning" class="disclaimer" hidden></p><div class="grid-wrap"><div id="mobile-won-grid" class="wongoji"></div></div><p id="mobile-won-status" aria-live="polite"></p>`,'writing');const input=$('mobile-won-input'),key='kiip_exam_wonguji_v2';try{input.value=localStorage.getItem(key)||''}catch(_){}updateWonGrid();input.addEventListener('input',updateWonGrid);$('mobile-won-save').addEventListener('click',()=>{try{localStorage.setItem(key,input.value);$('mobile-won-status').textContent='এই device/browser-এ সেভ হয়েছে।'}catch(_){$('mobile-won-status').textContent='সেভ করা যায়নি।'}});$('mobile-won-clear').addEventListener('click',()=>{input.value='';updateWonGrid();$('mobile-won-status').textContent=''});$('mobile-won-print').addEventListener('click',printCurrent);}
  function updateWonGrid(){const input=$('mobile-won-input');if(!input)return;const chars=Array.from(input.value).slice(0,100),grid=$('mobile-won-grid');$('mobile-won-count').textContent=`${chars.length} / 100자`;grid.replaceChildren();for(let i=0;i<101;i++){const cell=document.createElement('div');cell.className='cell';if(i===0){cell.classList.add('space');cell.setAttribute('aria-label','প্রথম ঘর খালি')}else cell.textContent=chars[i-1]||'';grid.appendChild(cell);}const warning=$('mobile-won-warning'),hasMixed=/해요|합니다|습니다/.test(input.value);warning.hidden=!hasMixed;warning.textContent=hasMixed?"⚠️ ‘해요/합니다/습니다’ আছে—এই অনুশীলনে ‘한다’ style ব্যবহার করুন।":"✅ নিজের বাক্যের ‘한다’ style যাচাই করুন; এটি কেবল সহজ phrase সতর্কতা।";}
  function printCurrent(){const area=root.cloneNode(true);area.querySelectorAll('button,input,textarea').forEach(node=>{if(node.tagName==='TEXTAREA'){const p=document.createElement('p');p.textContent=node.value;node.replaceWith(p);}else node.remove();});const win=window.open('','_blank');if(!win){window.print();return;}win.document.write('<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>KIIP A4 Print</title><style>body{font:14px sans-serif;color:#111;padding:20px}.panel,.word-card{border:1px solid #bbb;padding:14px;margin:10px 0}.wongoji{display:grid;grid-template-columns:repeat(10,30px);gap:2px}.cell{width:30px;height:30px;border:1px solid #ef9999;display:grid;place-items:center}.space{background:#fee2e2}</style></head><body></body></html>');win.document.body.appendChild(area);win.document.close();win.focus();setTimeout(()=>{win.print();win.close();},350);}
  window.addEventListener('beforeunload',stopAudio);
})();
