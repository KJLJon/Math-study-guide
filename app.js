(() => {
  const BANK = window.MATH_BANK;
  const GENERATORS = window.MATH_GENERATORS;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fmt = n => Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
  const stageLabel = {teach:'TEACH MODE',guided:'GUIDED QUEST',independent:'INDEPENDENT RUN',challenge:'CHALLENGE ROUND'};
  const stageOrder = ['teach','guided','independent','challenge'];
  const focusNames = {
    eq_add:'same operation on both sides',eq_mult:'undoing multiplication',eq_twostep:'two-step equations',eq_bothsides:'variables on both sides',eq_distribute:'equivalent equation steps',
    alg_onestep_add:'inverse operations',alg_onestep_mult:'undoing multiplication',alg_twostep:'two-step equations',alg_fraction:'undoing division',alg_distribute:'distribution and inverse operations',
    conv_ft_in:'larger vs. smaller units',conv_hr_min:'time conversions',conv_lb_oz:'weight conversions',conv_metric:'metric conversions',conv_yd_in:'multi-step conversions',conv_minutes_clock:'minutes and hours',
    pct_of:'finding a percent amount',pct_discount_choice:'discount amount vs. final price',pct_discount:'final price after a discount',pct_tip:'percent increase / tip',pct_whole:'part ÷ rate to find the whole',pct_increase:'using 1 + rate',pct_reverse_discount:'working backward from a sale price',pct_change:'percent change',
    word_linear:'turning a story into an equation',word_time:'time relationships',word_discount:'percent word problems',word_conversion:'conversion word problems',word_percentwhole:'finding the original whole',word_split:'multi-step word problems',word_battery:'percent remaining',word_goal:'goal equations',word_linear_decimal:'decimal rate equations'
  };
  const worldStyle = {
    equality:['#dcf5f1','#2ea7a0'], algebra:['#ece9ff','#5c4ee5'], conversions:['#e7f1fd','#4588d7'], percents:['#fce5ef','#d95e93'], words:['#fff4cf','#d39b20']
  };

  function defaultSkillProgress(){
    return {reasonCorrect:0,reasonTotal:0,answerCorrect:0,answerTotal:0,completed:0,stageWins:{teach:0,guided:0,independent:0,challenge:0},misses:{},recentKinds:[]};
  }
  function defaultProgress(){
    return {xp:0,streak:0,skills:Object.fromEntries(Object.keys(BANK).map(k=>[k,defaultSkillProgress()]))};
  }
  let progress;
  try { progress = JSON.parse(localStorage.getItem('mathQuestProgress') || 'null') || defaultProgress(); }
  catch { progress = defaultProgress(); }
  progress.skills ||= {};progress.xp ||= 0;progress.streak ||= 0;
  for(const k of Object.keys(BANK)){
    const base=defaultSkillProgress();
    progress.skills[k] ||= base;
    const p=progress.skills[k];
    p.stageWins ||= {teach:Math.min(2,p.completed||0),guided:Math.max(0,Math.min(2,(p.completed||0)-2)),independent:Math.max(0,Math.min(2,(p.completed||0)-4)),challenge:Math.max(0,(p.completed||0)-6)};
    p.misses ||= {}; p.recentKinds ||= [];
    for(const st of stageOrder) p.stageWins[st] ||= 0;
  }

  let currentSkill=null,currentStage='teach',currentProblem=null,currentTemplateKind=null;
  let stepIndex=0,reasonMiss=false,answered=false,questionCount=0,reasonAttempted=false,answerAttempts=0,hintLevel=0;
  let adaptiveFocus='',forcedTemplateKind=null,manipState=null,draggedRecently=0;

  const pct=(a,b)=>b?Math.round(a/b*100):0;
  const mastery=k=>{const p=progress.skills[k];return Math.round((pct(p.reasonCorrect,p.reasonTotal)+pct(p.answerCorrect,p.answerTotal))/2)};
  const starCount=k=>{const m=mastery(k);return m>=80?3:m>=50?2:m>=20?1:0};
  function stageUnlocked(skill,stage){
    const idx=stageOrder.indexOf(stage);if(idx<=0)return true;
    const prev=stageOrder[idx-1];return (progress.skills[skill].stageWins?.[prev]||0)>=2;
  }
  function highestUnlockedStage(skill){
    return [...stageOrder].reverse().find(st=>stageUnlocked(skill,st))||'teach';
  }
  function renderStageLocks(){
    if(!currentSkill)return;
    $$('.stage-tabs button').forEach(b=>{
      const st=b.dataset.stage,ok=stageUnlocked(currentSkill,st),idx=stageOrder.indexOf(st),prev=stageOrder[Math.max(0,idx-1)];
      b.classList.toggle('locked',!ok);b.setAttribute('aria-disabled',ok?'false':'true');
      const sm=b.querySelector('small');if(sm)sm.textContent=ok?(b.dataset.baseLabel||sm.textContent):`🔒 Clear 2 ${prev}`;
      const wins=progress.skills[currentSkill].stageWins?.[st]||0;b.style.setProperty('--stage-fill',`${Math.min(100,(wins/2)*100)}%`);
    });
  }
  function recordMiss(kind=currentTemplateKind){
    if(!kind||kind==='boss_combo'||kind==='mistake')return;
    const p=progress.skills[currentSkill];p.misses[kind]=(p.misses[kind]||0)+1;
  }
  function rewardCorrection(kind=currentTemplateKind){
    if(!kind||kind==='boss_combo'||kind==='mistake')return;
    const p=progress.skills[currentSkill];if((p.misses[kind]||0)>0)p.misses[kind]--;
  }
  function focusLabel(kind){return focusNames[kind]||String(kind||'').replace(/_/g,' ')}

  const escapeHtml=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function save(){ localStorage.setItem('mathQuestProgress',JSON.stringify(progress)); renderStats(); }
  function renderStats(){ $('#xp').textContent=progress.xp; $('#streak').textContent=progress.streak; }
  function show(id){ $$('.view').forEach(v=>v.classList.remove('active')); $(id).classList.add('active'); window.scrollTo({top:0,behavior:'smooth'}); }
  function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('show'),1400); }
  function celebrate(){
    const c=$('#celebration'); c.innerHTML='';
    for(let i=0;i<22;i++){const p=document.createElement('i');p.className='confetti';p.style.left=`${4+Math.random()*92}%`;p.style.animationDelay=`${Math.random()*160}ms`;c.appendChild(p)}
    setTimeout(()=>c.innerHTML='',1300);
  }

  function miniPathMarkup(key){
    return `<div class="mini-level-path" aria-label="Level unlock progress">${stageOrder.map((st,i)=>{const open=stageUnlocked(key,st),wins=progress.skills[key].stageWins?.[st]||0;return `<span class="mini-node ${open?'open':'locked'}" title="${st}: ${open?'unlocked':'locked'}">${open?(wins>=2?'✓':i+1):'🔒'}</span>${i<stageOrder.length-1?'<i></i>':''}`}).join('')}</div>`;
  }

  function renderHome(){
    const grid=$('#skillGrid'); grid.innerHTML='';
    let totalStars=0;
    Object.entries(BANK).forEach(([key,skill])=>{
      const m=mastery(key),stars=starCount(key); totalStars+=stars;
      const [bg,color]=worldStyle[key]; const b=document.createElement('button');
      b.className='quest-card'; b.style.setProperty('--world-bg',bg); b.style.setProperty('--world-color',color);
      b.innerHTML=`<div class="quest-top"><div class="quest-icon">${skill.icon}</div><div class="quest-stars" aria-label="${stars} of 3 stars">${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}</div></div><h3>${skill.title}</h3><p>${skill.description}</p>${miniPathMarkup(key)}<div class="quest-footer"><div class="skill-meter"><span style="width:${m}%"></span></div><small>${m}%</small></div>`;
      b.addEventListener('click',()=>openSkill(key)); grid.appendChild(b);
    });
    $('#overallStars').textContent=totalStars; renderStats();
  }

  function openSkill(key,stage='teach'){
    currentSkill=key; currentStage=stageUnlocked(key,stage)?stage:'teach'; questionCount=0;forcedTemplateKind=null;adaptiveFocus='';
    $('#skillEyebrow').textContent=`${BANK[key].icon}  SKILL WORLD`; $('#skillTitle').textContent=BANK[key].title;
    updateMastery(); renderStageLocks();renderStage(); show('#learnView');
  }
  function updateMastery(){ $('#masteryPill').textContent=`${starCount(currentSkill)} / 3 ⭐  •  ${mastery(currentSkill)}% mastery`; }

  function openBossQuest(){
    currentSkill='algebra';currentStage='challenge';questionCount=4;currentTemplateKind='boss_combo';currentProblem=buildBossProblem();
    $('#skillEyebrow').textContent='👑  MULTI-SKILL CHALLENGE';$('#skillTitle').textContent='Boss Quest';updateMastery();
    $$('.stage-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.stage==='challenge'));
    $('#lessonCard').innerHTML='<h3>Put several ideas together</h3><div class="lesson-strip"><div class="rule"><strong>1 • PERCENT</strong>Find the discounted target.</div><div class="rule"><strong>2 • MODEL</strong>Turn the story into an equation.</div><div class="rule"><strong>3 • BALANCE</strong>Solve using equal operations on both sides.</div></div><div class="lesson-tip">👑 Each correct reasoning move clears one boss gem. The final answer is only the last step.</div>';
    stepIndex=0;reasonMiss=false;answered=false;reasonAttempted=false;answerAttempts=0;hintLevel=0;renderProblem();show('#learnView');
  }

  function smartReviewTarget(){
    let best=null;
    for(const skill of Object.keys(BANK)){
      for(const stage of stageOrder){
        if(!stageUnlocked(skill,stage))continue;
        for(const t of BANK[skill].templates[stage]){
          const score=progress.skills[skill].misses?.[t.kind]||0;
          if(score>0 && (!best||score>best.score))best={skill,stage,kind:t.kind,score};
        }
      }
    }
    if(best)return best;
    const skill=Object.keys(BANK).sort((a,b)=>mastery(a)-mastery(b))[0];
    return {skill,stage:highestUnlockedStage(skill),kind:null,score:0};
  }
  function openSmartReview(){
    const target=smartReviewTarget();currentSkill=target.skill;currentStage=target.stage;questionCount=0;forcedTemplateKind=target.kind;adaptiveFocus=target.kind?focusLabel(target.kind):'';
    $('#skillEyebrow').textContent='🎯  SMART REVIEW';$('#skillTitle').textContent=BANK[currentSkill].title;updateMastery();renderStageLocks();renderStage();show('#learnView');
    toast(target.kind?`Focused review: ${focusLabel(target.kind)}`:`Starting with ${BANK[currentSkill].title}`);
  }

  function renderStage(){
    $$('.stage-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.stage===currentStage));
    const tips=BANK[currentSkill].lesson[currentStage];
    const heading=currentStage==='teach'?'See the idea':currentStage==='guided'?'Practice with a guide':currentStage==='independent'?'You choose the path':'Put it all together';
    const labels=['NOTICE','THINK','CHECK'];
    $('#lessonCard').innerHTML=`<h3>${heading}</h3><div class="lesson-strip">${tips.slice(0,3).map((x,i)=>`<div class="rule"><strong>${labels[i]||'TIP'}</strong>${x}</div>`).join('')}</div><div class="lesson-tip">💡 ${lessonNudge(currentSkill,currentStage)}</div>`;
    renderStageLocks();nextProblem();
  }

  function lessonNudge(skill,stage){
    if(skill==='equality') return stage==='teach'?'Picture the equal sign as a perfectly balanced scale. Every legal move must keep it balanced.':'Say the operation out loud: “I am ___ both sides by ___.”';
    if(skill==='algebra') return 'Your goal is not to “move” numbers. Your goal is to undo operations until x is alone.';
    if(skill==='conversions') return 'Predict first: should the number get bigger or smaller? That catches lots of mistakes.';
    if(skill==='percents') return 'Before calculating, decide: do you need the change, the final amount, or the original whole?';
    return 'Name the unknown and the relationship before reaching for the calculator.';
  }

  function selectTemplate(){
    const pool=BANK[currentSkill].templates[currentStage];adaptiveFocus='';
    if(forcedTemplateKind){const forced=pool.find(t=>t.kind===forcedTemplateKind);forcedTemplateKind=null;if(forced){adaptiveFocus=focusLabel(forced.kind);return forced}}
    const misses=progress.skills[currentSkill].misses||{};
    const weak=pool.map(t=>({t,score:misses[t.kind]||0})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    if(weak.length && Math.random()<0.68){adaptiveFocus=focusLabel(weak[0].t.kind);return weak[0].t}
    return pick(pool);
  }
  function buildMistakeProblem(skill){
    if(skill==='equality'||skill==='algebra') return {prompt:'Spot the glitch: Ava solves 3x + 6 = 21 by writing 3x = 21, then x = 7.',steps:[{q:'What is the FIRST mistake?',options:['She forgot to subtract 6 from both sides','She should add 6 to both sides','She should divide by 3 before changing anything','There is no mistake'],correct:0,why:'The +6 must be undone on both sides first, giving 3x = 15.'}],answer:5,hint:'Correct the first illegal step, then finish the equation.',mistake:true};
    if(skill==='percents') return {prompt:'Spot the glitch: A $80 hoodie is 25% off. Jordan calculates 80 × 0.25 = 20 and says the sale price is $20.',steps:[{q:'What did Jordan actually find?',options:['The discount amount','The final sale price','The original price','A 20% discount'],correct:0,why:'$20 is the amount taken off. The sale price is the original minus that amount.'}],answer:60,unit:'$',hint:'The amount off and the amount paid are different.',mistake:true};
    if(skill==='conversions') return {prompt:'Spot the glitch: 4 feet = 4 ÷ 12 = 0.33 inches.',steps:[{q:'What is wrong with the setup?',options:['Feet → inches should make the number larger, so multiply by 12','Feet → inches should divide by 12','The conversion factor is 60','Nothing is wrong'],correct:0,why:'Inches are smaller units, so it takes more of them. 4 ft = 48 in.'}],answer:48,unit:'in',hint:'Predict whether the numerical value should grow or shrink.',mistake:true};
    return {prompt:'Spot the glitch: A club has $15 and earns $5 per sale. To reach $40, Riley writes 15x + 5 = 40.',steps:[{q:'Which relationship matches the story?',options:['15 + 5x = 40','15x + 5 = 40','40 + 5x = 15','15 + 40x = 5'],correct:0,why:'$15 is the fixed starting amount; $5 is earned for each sale.'}],answer:5,unit:'sales',hint:'Fixed amount + rate × number = total.',mistake:true};
  }

  function buildBossProblem(){
    const discount=pick([20,25,30,40,50]);
    const jacket=pick([40,50,60,80,100]);
    const sale=jacket*(1-discount/100);
    const earned=pick([8,10,12,15]);
    const alreadyChoices=[0,10,12,15,20,24,30].filter(v=>v<sale && Number.isInteger((sale-v)/earned));
    const already=alreadyChoices.length?pick(alreadyChoices):0;
    const hours=(sale-already)/earned;
    if(!Number.isInteger(hours) || hours<1 || hours>8) return buildBossProblem();
    return {
      boss:true,
      prompt:`Boss Quest: A $${jacket} jacket is ${discount}% off. You already have $${already} and earn $${earned} per hour helping with a neighborhood job. How many hours do you need to earn enough for the sale price?`,
      bossData:{jacket,discount,sale,already,earned,hours},
      steps:[
        {q:'First, what percent of the original price will you actually pay?',options:[`${100-discount}%`,`${discount}%`,`${100+discount}%`,'Divide by the percent'],correct:0,why:`A ${discount}% discount leaves ${100-discount}% of the original price.`},
        {q:`Which calculation gives the sale price?`,options:[`${jacket} × ${(100-discount)/100}`,`${jacket} × ${discount/100}`,`${jacket} ÷ ${(100-discount)/100}`,`${jacket} + ${discount}`],correct:0,why:`Final price after a discount is original × (1 − rate), so the sale price is $${fmt(sale)}.`},
        {q:`Now which equation models the money you need?`,options:[`${already} + ${earned}h = ${fmt(sale)}`,`${already}h + ${earned} = ${fmt(sale)}`,`${fmt(sale)} + ${earned}h = ${already}`,`${earned} ÷ h = ${fmt(sale)}`],correct:0,why:'Starting money + hourly earnings × hours = the amount needed.'},
        {q:`What should you do first to solve ${already} + ${earned}h = ${fmt(sale)}?`,options:[`Subtract ${already} from both sides`,`Subtract ${already} only from the left`,`Divide everything by ${already || earned}`,'Guess hours until it works'],correct:0,why:`Subtracting ${already} from both sides keeps the equation balanced and leaves ${earned}h = ${fmt(sale-already)}.`},
        {q:`Last reasoning move: how do you isolate h?`,options:[`Divide both sides by ${earned}`,`Multiply both sides by ${earned}`,`Subtract ${earned} from both sides`,'Move h across the equal sign'],correct:0,why:`Division undoes the multiplication by ${earned}.`}
      ],
      answer:hours,unit:'hours',
      hint:`Find the sale price first. Then solve ${already} + ${earned}h = ${fmt(sale)}.`
    };
  }

  function nextProblem(){
    questionCount++;
    if(currentStage==='challenge' && questionCount%4===0){adaptiveFocus='';currentTemplateKind='boss_combo';currentProblem=buildBossProblem()}
    else if(currentStage==='challenge' && questionCount%3===0){adaptiveFocus='';currentTemplateKind='mistake';currentProblem=buildMistakeProblem(currentSkill)}
    else {const t=selectTemplate();currentTemplateKind=t.kind;const g=GENERATORS[t.kind];if(!g)throw new Error(`Unknown question generator: ${t.kind}`);currentProblem=g();}
    stepIndex=0;reasonMiss=false;answered=false;reasonAttempted=false;answerAttempts=0;hintLevel=0; renderProblem();
  }

  function renderProblem(){
    const label=currentProblem.boss?'👑 BOSS QUEST':currentProblem.mistake?'🕵️ SPOT THE GLITCH':stageLabel[currentStage];
    const bossClass=currentProblem.boss?' boss-card':'';
    $('#problemCard').className=`card problem-card${bossClass}`;
    $('#problemCard').innerHTML=`<div class="problem-top"><span class="mode-label">${label}</span><span class="question-count">Quest ${questionCount}</span></div>${adaptiveFocus?`<div class="adaptive-chip">🎯 Focused practice: <b>${escapeHtml(adaptiveFocus)}</b></div>`:''}<div class="mini-progress"><span style="width:${currentProblem.boss?Math.min(100,(stepIndex/currentProblem.steps.length)*100):Math.min(100,20+(questionCount%5)*20)}%"></span></div><div class="problem-prompt">${escapeHtml(currentProblem.prompt)}</div><div id="visualZone" class="visual-zone"></div><div id="interaction"></div>`;
    renderVisual(); renderInteraction();
  }

  function equationState(){
    const p=currentProblem,kind=currentTemplateKind,raw=p.prompt.replace(/^Solve:\s*/,'');
    const split=raw.split('=').map(s=>s.trim()); let left=split[0]||'?',right=split[1]||'?'; let op='';
    if(stepIndex===0) return {left,right,op};
    let m;
    if(['eq_add','alg_onestep_add'].includes(kind)) return {left:'x',right:String(p.answer),op:correctOptionText(stepIndex-1)};
    if(['eq_mult','alg_onestep_mult'].includes(kind)) return {left:'x',right:String(p.answer),op:correctOptionText(stepIndex-1)};
    if(['eq_twostep','alg_twostep'].includes(kind) && (m=raw.match(/(\d+)x \+ (\d+) = ([-\d.]+)/))){
      if(stepIndex===1)return{left:`${m[1]}x`,right:fmt(Number(m[3])-Number(m[2])),op:`− ${m[2]} on both sides`};
      return{left:'x',right:String(p.answer),op:`÷ ${m[1]} on both sides`};
    }
    if(kind==='alg_fraction' && (m=raw.match(/x\/(\d+) \+ (\d+) = ([-\d.]+)/))){
      if(stepIndex===1)return{left:`x/${m[1]}`,right:fmt(Number(m[3])-Number(m[2])),op:`− ${m[2]} on both sides`};
      return{left:'x',right:String(p.answer),op:`× ${m[1]} on both sides`};
    }
    if(['eq_distribute','alg_distribute'].includes(kind) && (m=raw.match(/(\d+)\(x \+ (\d+)\) = ([-\d.]+)/))){
      if(stepIndex===1)return{left:`x + ${m[2]}`,right:fmt(Number(m[3])/Number(m[1])),op:`÷ ${m[1]} on both sides`};
      return{left:'x',right:String(p.answer),op:`− ${m[2]} on both sides`};
    }
    if(kind==='eq_bothsides' && (m=raw.match(/(\d+)x \+ (\d+) = (\d+)x \+ ([-\d.]+)/))){
      if(stepIndex===1)return{left:`${Number(m[1])-Number(m[3])}x + ${m[2]}`,right:m[4],op:`− ${m[3]}x on both sides`};
      return{left:`${Number(m[1])-Number(m[3])}x + ${m[2]}`,right:m[4],op:'Keep equality balanced'};
    }
    return {left,right,op:stepIndex?correctOptionText(stepIndex-1):''};
  }
  function correctOptionText(i){const s=currentProblem.steps[i];return s?s.options[s.correct]:'';}

  function renderVisual(){
    const z=$('#visualZone'); if(!z)return;
    if(currentProblem.boss){z.innerHTML=bossVisual();bindVisualInteractions();return;}
    if(currentSkill==='equality'||currentSkill==='algebra'){
      const e=equationState();
      z.innerHTML=`<div class="balance-stage ${stepIndex?'changed show-op':''}"><div class="balance-op">${escapeHtml(e.op||'Keep both sides equal')}</div><div class="balance-beam"><span></span></div><div class="balance-post"></div><div class="balance-base"></div><div class="balance-pan left"><b>${escapeHtml(e.left)}</b><small>LEFT SIDE</small></div><div class="balance-pan right"><b>${escapeHtml(e.right)}</b><small>RIGHT SIDE</small></div></div>${algebraTilesVisual(e)}<div class="visual-caption" id="labCaption">The equation is a balance. A legal move changes both sides equally.</div>${mathLabControls()}${equationTrail()}`;
      bindVisualInteractions();return;
    }
    if(currentSkill==='percents'){ z.innerHTML=percentVisual();bindVisualInteractions();return; }
    if(currentSkill==='conversions'){ z.innerHTML=conversionVisual(); return; }
    z.innerHTML=wordVisual();
  }

  function equationTrail(){
    if(stepIndex===0)return '';
    const raw=currentProblem.prompt.replace(/^Solve:\s*/,'');const e=equationState();
    return `<div class="equation-trail"><span class="trail-step">${escapeHtml(raw)}</span><span class="trail-arrow">→</span><span class="trail-step">${escapeHtml(e.left)} = ${escapeHtml(e.right)}</span></div>`;
  }

  function percentVisual(){
    const prompt=currentProblem.prompt; const rateMatch=prompt.match(/(\d+(?:\.\d+)?)%/); const rate=rateMatch?Math.max(0,Math.min(100,Number(rateMatch[1]))):25;
    const isIncrease=/increase|tip|rises/i.test(prompt); const isWhole=/what number|original price|full price/i.test(prompt);
    const wantsFinal=/final|sale price|total after|new value/i.test(prompt);
    const focus=wantsFinal?'remain':isWhole?'whole':'change';
    const cells=Array.from({length:100},(_,i)=>`<span class="pct-cell ${i<rate?'pct-change':'pct-keep'}" aria-hidden="true"></span>`).join('');
    if(isIncrease){
      const extra=Math.min(40,Math.max(10,rate));
      const extraCells=Array.from({length:extra},()=>'<span class="pct-extra" aria-hidden="true"></span>').join('');
      return `<div class="percent-lab" data-focus="increase"><div class="percent-grid" aria-label="100 percent original amount">${cells}</div><div class="percent-extra-grid" style="--extra-cols:${Math.min(10,extra)}">${extraCells}</div><div class="percent-equation">100% original <b>+</b> ${rate}% increase = <b>${100+rate}% total</b></div><div class="percent-tools"><button type="button" data-percent-focus="whole">Show original 100%</button><button type="button" data-percent-focus="increase">Show +${rate}%</button><button type="button" data-percent-focus="total">Show final ${100+rate}%</button></div><div class="visual-caption" id="percentCaption">For an increase, keep the original 100% and add the extra percent.</div></div>`;
    }
    return `<div class="percent-lab" data-focus="${focus}"><div class="percent-grid" aria-label="100-block percent model">${cells}</div><div class="percent-key"><span><i class="key-change"></i>${rate}% changed</span><span><i class="key-keep"></i>${100-rate}% remains</span></div><div class="percent-tools"><button type="button" data-percent-focus="change">Show ${rate}% part</button><button type="button" data-percent-focus="remain">Show ${100-rate}% left</button><button type="button" data-percent-focus="whole">Show whole 100%</button></div><div class="visual-caption" id="percentCaption">${isWhole?'You know a part and its rate; work backward to the whole 100%.':wantsFinal?`The final amount is the ${100-rate}% that remains.`:`The percent amount is the ${rate}% changed section.`}</div></div>`;
  }

  function parseLinearTileExpr(expr){
    const t=String(expr).replace(/\s+/g,'');
    if(/^[-+]?\d+(?:\.\d+)?$/.test(t))return{x:0,c:Number(t)};
    const m=t.match(/^([+-]?\d*)x(?:([+-]\d+(?:\.\d+)?))?$/);
    if(!m)return null;
    let xc=m[1];if(xc===''||xc==='+')xc=1;else if(xc==='-')xc=-1;else xc=Number(xc);
    return{x:Number(xc),c:Number(m[2]||0)};
  }
  function cloneSide(side){return{x:Number(side.x),c:Number(side.c)}}
  function exprFromSide(side){
    const parts=[];const x=Number(side.x),c=Number(side.c);
    if(Math.abs(x)>1e-9){const ax=Math.abs(x);parts.push(`${x<0?'-':''}${ax===1?'':fmt(ax)}x`)}
    if(Math.abs(c)>1e-9){const ac=fmt(Math.abs(c));if(!parts.length)parts.push(c<0?`-${ac}`:ac);else parts.push(`${c<0?'−':'+'} ${ac}`)}
    return parts.length?parts.join(' '):'0';
  }
  function manipTileMarkup(side,label){
    let out='';const x=Number(side.x),c=Number(side.c),count=Math.min(6,Math.ceil(Math.abs(x)));
    if(Math.abs(x)>1e-9){
      if(Number.isInteger(x)&&Math.abs(x)<=6){for(let i=0;i<count;i++)out+=`<button type="button" draggable="true" class="manip-tile x-piece ${x<0?'negative':''}" data-term="x" data-value="${x<0?-1:1}" aria-label="${x<0?'negative x':'x'} tile">${x<0?'−x':'x'}</button>`}
      else out+=`<button type="button" draggable="true" class="manip-tile x-piece ${x<0?'negative':''}" data-term="x" data-value="${escapeHtml(x)}" aria-label="${escapeHtml(exprFromSide({x,c:0}))} tile">${escapeHtml(exprFromSide({x,c:0}))}</button>`;
    }
    if(Math.abs(c)>1e-9)out+=`<button type="button" draggable="true" class="manip-tile const-piece ${c<0?'negative':''}" data-term="const" data-value="${escapeHtml(c)}" aria-label="${c<0?'negative ':''}${Math.abs(c)} constant tile">${c>0&&Math.abs(x)>1e-9?'+':''}${fmt(c)}</button>`;
    return out||'<span class="zero-piece">0</span>';
  }
  function algebraTilesVisual(e){
    const left=parseLinearTileExpr(e.left),right=parseLinearTileExpr(e.right);
    if(!left||!right){manipState=null;return `<div class="tile-lab"><div class="tile-side"><small>LEFT TILES</small><div class="tile-tray">${tileMarkup(e.left)}</div></div><div class="tile-equals">=</div><div class="tile-side"><small>RIGHT TILES</small><div class="tile-tray">${tileMarkup(e.right)}</div></div></div><div class="drag-lab-note">🧩 This step uses a symbolic tile model. Drag mode turns on again when the equation is in linear tile form.</div>`}
    manipState={initial:{left:cloneSide(left),right:cloneSide(right)},left:cloneSide(left),right:cloneSide(right),history:[]};
    return `<div class="drag-lab" id="dragLab"><div class="drag-lab-title"><div><b>🧩 Hands-on Tile Lab</b><small>Drag a tile to the center — or tap it — to apply its inverse to BOTH sides.</small></div><span class="drag-badge">DRAG / TAP</span></div><div class="tile-lab interactive"><div class="tile-side"><small>LEFT SIDE</small><div class="tile-tray" id="leftManipTray">${manipTileMarkup(left,'left')}</div></div><div class="tile-equals">=</div><div class="tile-side"><small>RIGHT SIDE</small><div class="tile-tray" id="rightManipTray">${manipTileMarkup(right,'right')}</div></div></div><div class="manip-equation" id="manipEquation">${escapeHtml(exprFromSide(left))} = ${escapeHtml(exprFromSide(right))}</div><div class="tile-drop-zone" id="tileDropZone" tabindex="0"><b>Drop a tile here</b><span>Same inverse operation happens on BOTH sides</span></div><div class="tile-lab-actions"><button type="button" id="groupTiles" class="secondary">Split into equal groups</button><button type="button" id="undoTiles" class="secondary">↶ Undo tile move</button><button type="button" id="resetTiles" class="secondary">Reset tiles</button></div><div class="visual-caption" id="tileLabCaption">Try simplifying the equation without ever dragging a term “across” the equal sign.</div></div>`;
  }

  function tileMarkup(expr){
    const text=String(expr).replace(/\s+/g,'');
    let m=text.match(/^(\d*)x(?:\+(\d+))?$/);
    if(m){
      const xs=Number(m[1]||1), units=Number(m[2]||0);
      return `${Array.from({length:Math.min(xs,8)},()=>'<span class="x-tile">x</span>').join('')}${numberTiles(units)}`;
    }
    m=text.match(/^x\/(\d+)(?:\+(\d+))?$/);
    if(m)return `<span class="x-tile fraction">x ÷ ${m[1]}</span>${numberTiles(Number(m[2]||0))}`;
    const n=Number(text);
    if(Number.isFinite(n))return numberTiles(n);
    return `<span class="expr-tile">${escapeHtml(expr)}</span>`;
  }

  function numberTiles(n){
    if(!Number.isFinite(n))return '';
    if(n<0)return `<span class="number-block negative">${fmt(n)}</span>`;
    if(!Number.isInteger(n))return `<span class="number-block">${fmt(n)}</span>`;
    const tens=Math.floor(n/10),ones=n%10;
    let out='';
    for(let i=0;i<Math.min(tens,8);i++)out+='<span class="ten-tile">10</span>';
    for(let i=0;i<ones;i++)out+='<span class="unit-tile">1</span>';
    if(tens>8)out+=`<span class="number-block">${n-ones}</span>`;
    return out||'<span class="unit-tile zero">0</span>';
  }

  function pushManipHistory(){if(manipState)manipState.history.push({left:cloneSide(manipState.left),right:cloneSide(manipState.right)})}
  function applyManipTile(term,value){
    if(!manipState)return;const v=Number(value);if(!Number.isFinite(v)||Math.abs(v)<1e-9)return;pushManipHistory();
    let action='';
    if(term==='const'){const delta=-v;manipState.left.c+=delta;manipState.right.c+=delta;action=delta<0?`Subtracted ${fmt(Math.abs(delta))} from both sides`:`Added ${fmt(delta)} to both sides`}
    else{const delta=-v;manipState.left.x+=delta;manipState.right.x+=delta;action=delta<0?`Subtracted ${fmt(Math.abs(delta))}x from both sides`:`Added ${fmt(delta)}x to both sides`}
    rerenderManipBoard(action);
  }
  function groupManipTiles(){
    if(!manipState)return;let d=null;
    if(Math.abs(manipState.left.c)<1e-9&&Math.abs(manipState.left.x)>1&&Math.abs(manipState.right.x)<1e-9)d=manipState.left.x;
    else if(Math.abs(manipState.right.c)<1e-9&&Math.abs(manipState.right.x)>1&&Math.abs(manipState.left.x)<1e-9)d=manipState.right.x;
    if(!d){const cap=$('#tileLabCaption');if(cap)cap.textContent='Grouping is most useful once one side is a pure multiple like 3x and the other side is a number.';toast('Simplify to a pure multiple of x first');return}
    pushManipHistory();for(const side of [manipState.left,manipState.right]){side.x/=d;side.c/=d}rerenderManipBoard(`Divided both sides into ${fmt(Math.abs(d))} equal groups`);
  }
  function rerenderManipBoard(action=''){
    if(!manipState)return;const l=$('#leftManipTray'),r=$('#rightManipTray'),eq=$('#manipEquation'),cap=$('#tileLabCaption');if(!l||!r)return;
    l.innerHTML=manipTileMarkup(manipState.left,'left');r.innerHTML=manipTileMarkup(manipState.right,'right');eq.textContent=`${exprFromSide(manipState.left)} = ${exprFromSide(manipState.right)}`;
    if(cap&&action)cap.textContent=`${action}. Equality stayed true.`;bindManipTileEvents();
  }
  function bindManipTileEvents(){
    const zone=$('#tileDropZone');if(!zone||!manipState)return;
    $$('.manip-tile').forEach(tile=>{
      tile.addEventListener('dragstart',e=>{draggedRecently=Date.now();e.dataTransfer.setData('text/plain',JSON.stringify({term:tile.dataset.term,value:tile.dataset.value}));e.dataTransfer.effectAllowed='move';zone.classList.add('ready')});
      tile.addEventListener('dragend',()=>zone.classList.remove('ready'));
      tile.addEventListener('click',()=>{if(Date.now()-draggedRecently<350)return;applyManipTile(tile.dataset.term,tile.dataset.value)});
    });
    if(!zone.dataset.bound){zone.dataset.bound='1';zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('over')});zone.addEventListener('dragleave',()=>zone.classList.remove('over'));zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('over','ready');try{const d=JSON.parse(e.dataTransfer.getData('text/plain'));applyManipTile(d.term,d.value)}catch{}})}
  }

  function mathLabControls(){
    if(!['teach','guided'].includes(currentStage) || !currentProblem.steps?.length || stepIndex>=currentProblem.steps.length)return '';
    const correct=currentProblem.steps[stepIndex].options[currentProblem.steps[stepIndex].correct];
    return `<div class="math-lab-controls"><div><b>🧪 Balance Lab</b><small>Experiment before answering.</small></div><button type="button" data-lab="one">Try it on one side</button><button type="button" class="lab-good" data-lab="both">Preview on BOTH sides</button><div class="lab-action">Move to test: <b>${escapeHtml(correct)}</b></div></div>`;
  }

  function bossVisual(){
    const d=currentProblem.bossData; const completed=Math.min(stepIndex,currentProblem.steps.length);
    const gems=Array.from({length:currentProblem.steps.length},(_,i)=>`<span class="boss-gem ${i<completed?'done':''}">${i<completed?'✓':'◆'}</span>`).join('');
    return `<div class="boss-stage"><div class="boss-header"><span class="boss-crown">👑</span><div><b>Multi-skill Boss</b><small>Percent → equation → balanced solving</small></div></div><div class="boss-path"><div class="boss-node"><span>🏷️</span><b>$${d.jacket}</b><small>${d.discount}% off</small></div><div class="boss-arrow">→</div><div class="boss-node"><span>💵</span><b>$${fmt(d.sale)}</b><small>sale target</small></div><div class="boss-arrow">→</div><div class="boss-node"><span>⏱️</span><b>$${d.earned}/hr</b><small>earnings</small></div></div><div class="boss-gems">${gems}</div><div class="visual-caption">Clear each reasoning gem to unlock the final answer.</div></div>`;
  }

  function bindVisualInteractions(){
    const z=$('#visualZone');if(!z)return;
    if(manipState){
      bindManipTileEvents();
      z.querySelector('#groupTiles')?.addEventListener('click',groupManipTiles);
      z.querySelector('#resetTiles')?.addEventListener('click',()=>{manipState.left=cloneSide(manipState.initial.left);manipState.right=cloneSide(manipState.initial.right);manipState.history=[];rerenderManipBoard('Tile model reset')});
      z.querySelector('#undoTiles')?.addEventListener('click',()=>{const prev=manipState.history.pop();if(!prev){toast('No tile move to undo');return}manipState.left=cloneSide(prev.left);manipState.right=cloneSide(prev.right);rerenderManipBoard('Undid the last tile move')});
    }
    z.querySelectorAll('[data-lab]').forEach(btn=>btn.addEventListener('click',()=>{
      const bal=z.querySelector('.balance-stage'),cap=z.querySelector('#labCaption'),tiles=z.querySelector('.tile-lab');
      if(btn.dataset.lab==='one'){bal?.classList.add('unbalanced');tiles?.classList.add('one-side-test');if(cap)cap.textContent='That changed only one side, so the equality breaks. Reset by doing the SAME operation to the other side.';toast('Balance broken — one side changed');}
      else{bal?.classList.remove('unbalanced');tiles?.classList.remove('one-side-test');tiles?.classList.add('both-side-test');if(cap)cap.textContent='Yes — the same operation on both sides preserves equality. Now choose that legal move below.';toast('Balanced move previewed');setTimeout(()=>tiles?.classList.remove('both-side-test'),700);}
    }));
    z.querySelectorAll('[data-percent-focus]').forEach(btn=>btn.addEventListener('click',()=>{
      const lab=z.querySelector('.percent-lab'),cap=z.querySelector('#percentCaption');if(!lab)return;lab.dataset.focus=btn.dataset.percentFocus;
      const labels={change:'This highlighted section is the percent amount being changed or removed.',remain:'This highlighted section is what remains after the percent is removed.',whole:'The entire 10 × 10 grid represents the original 100%.',increase:'The extra blocks are the percent added on top of the original 100%.',total:'The original 100% plus the extra blocks make the new total.'};
      if(cap)cap.textContent=labels[btn.dataset.percentFocus]||cap.textContent;
    }));
  }

  function conversionVisual(){
    const p=currentProblem.prompt; let from='starting unit',to='target unit',factor='conversion factor';
    const m=p.match(/Convert ([\d.]+) ([A-Za-z]+) to ([A-Za-z]+)/i); if(m){from=`${m[1]} ${m[2]}`;to=m[3]}
    const map={conv_ft_in:'12',conv_hr_min:'60',conv_lb_oz:'16',conv_metric:'100',conv_yd_in:'3 then 12',conv_minutes_clock:'groups of 60'}; factor=map[currentTemplateKind]||'unit relationship';
    return `<div class="conversion-stage"><div class="unit-card"><div><b>${escapeHtml(from)}</b><small>START</small></div></div><div class="unit-arrow">→<small>${escapeHtml(factor)}</small></div><div class="unit-card target"><div><b>${escapeHtml(to)}</b><small>TARGET</small></div></div></div><div class="visual-caption">Predict before calculating: should the number get larger or smaller?</div>`;
  }

  function wordVisual(){
    return `<div class="story-stage"><div class="story-chip"><span>❓</span><b>UNKNOWN</b><small>What are we finding?</small></div><div class="story-chip"><span>🔗</span><b>RELATIONSHIP</b><small>How are the quantities connected?</small></div><div class="story-chip"><span>🏷️</span><b>UNITS</b><small>What should the answer mean?</small></div></div>`;
  }

  function renderInteraction(){
    const p=currentProblem; const maxReason=currentStage==='independent'?Math.min(1,p.steps.length):p.steps.length; const zone=$('#interaction');
    if(stepIndex<maxReason){
      const s=p.steps[stepIndex]; reasonAttempted=false;
      zone.innerHTML=`<div class="reason-box"><div class="reason-head"><h4>${p.mistake?'Find the mistake':'Choose your next move'}</h4><span class="checkpoint-pill">STEP ${stepIndex+1} OF ${maxReason}</span></div><p>${escapeHtml(s.q)}</p><div class="options">${s.options.map((o,i)=>`<button class="option" data-opt="${i}"><span class="letter">${String.fromCharCode(65+i)}</span><span>${escapeHtml(o)}</span></button>`).join('')}</div><div id="feedback" aria-live="polite"></div></div>`;
      $$('.option').forEach(b=>b.addEventListener('click',()=>chooseReason(Number(b.dataset.opt),s,b))); return;
    }
    renderAnswer();
  }

  function chooseReason(idx,step,button){
    if(button.disabled)return; const opts=$$('.option'); const ok=idx===step.correct;
    if(!reasonAttempted){progress.skills[currentSkill].reasonTotal++;reasonAttempted=true;if(ok)progress.skills[currentSkill].reasonCorrect++;}
    if(!ok){reasonMiss=true;recordMiss();progress.streak=0;button.disabled=true;button.classList.add('wrong');const vz=$('#visualZone');if(currentSkill==='equality'||currentSkill==='algebra'){const bal=vz?.querySelector('.balance-stage');if(bal)bal.classList.add('unbalanced')}else if(vz){vz.classList.remove('nudge');void vz.offsetWidth;vz.classList.add('nudge')}$('#feedback').innerHTML=`<div class="feedback bad"><b>Almost — use that clue.</b> ${escapeHtml(shortHintForStep(step))}</div>`;save();return;}
    const bal=$('#visualZone')?.querySelector('.balance-stage');if(bal)bal.classList.remove('unbalanced');
    if(reasonAttempted && !reasonMiss && !button.classList.contains('wrong')){} // first-try correctness already counted above
    opts.forEach((b,i)=>{b.disabled=true;if(i===step.correct)b.classList.add('correct')});
    const gain=reasonMiss?1:2;progress.xp+=gain;progress.streak++;save();
    $('#feedback').innerHTML=`<div class="feedback good"><span class="big-feedback">✓ Nice move.</span> ${escapeHtml(step.why)}</div><div class="step-explain">⚖️ <span><b>Why it works:</b> ${escapeHtml(step.why)}</span></div><div class="next-row"><span class="xp-pop">+${gain} XP${reasonMiss?' recovery':''}</span><button class="primary" id="continueReason">Apply this move →</button></div>`;
    $('#continueReason').addEventListener('click',applyReasonMove);
  }

  function applyReasonMove(){
    const btn=$('#continueReason');if(btn)btn.disabled=true;
    const z=$('#visualZone');
    if(currentProblem.boss){
      z?.querySelector('.boss-stage')?.classList.add('boss-clear');
    } else if(currentSkill==='equality'||currentSkill==='algebra'){
      z?.querySelector('.tile-lab')?.classList.add('apply-move');
      z?.querySelector('.balance-stage')?.classList.add('apply-move');
    }
    setTimeout(()=>{stepIndex++;renderVisual();renderInteraction();const bar=$('#problemCard .mini-progress span');if(bar&&currentProblem.boss)bar.style.width=`${Math.min(100,(stepIndex/currentProblem.steps.length)*100)}%`;},360);
  }

  function shortHintForStep(step){
    const w=step.why||''; if(/both sides/i.test(w))return 'Ask: did that choice change BOTH sides in the same way?';
    if(/smaller|larger|units/i.test(w))return 'Predict whether the numerical answer should grow or shrink.';
    if(/percent|rate|whole|final/i.test(w))return 'Name what the question wants: change, final amount, or original whole.';
    return 'Look for the choice that keeps the mathematical relationship true.';
  }

  function normalize(s){return String(s).trim().toLowerCase().replace(/\s+/g,' ').replace(/\$/g,'').replace(/%/g,'').replace(/,/g,'');}
  function renderAnswer(){
    const p=currentProblem; const label=p.answerText?'Enter your answer (hours and minutes):':`Finish the quest${p.unit?` — answer in ${p.unit}`:''}:`;
    $('#interaction').innerHTML=`<div class="reason-box"><div class="reason-head"><h4>Now finish it</h4><span class="checkpoint-pill">FINAL MOVE</span></div><p>${escapeHtml(label)}</p><div class="answer-row"><input id="answerInput" inputmode="decimal" autocomplete="off" aria-label="Final answer" placeholder="Type your answer"><button id="checkAnswer" class="primary">Check answer</button></div><div class="hint-area"><span id="hintText" class="hint">Want a clue without giving away the answer?</span><button id="hintBtn" class="hint-btn">💡 Hint</button></div><div id="feedback" aria-live="polite"></div></div>`;
    $('#checkAnswer').addEventListener('click',checkAnswer);$('#answerInput').addEventListener('keydown',e=>{if(e.key==='Enter')checkAnswer()});$('#hintBtn').addEventListener('click',showHint);$('#answerInput').focus();
  }
  function showHint(){
    hintLevel++; const p=currentProblem; let msg=p.hint||'Use the relationship you identified in the reasoning step.';
    if(hintLevel>=2){ if(currentSkill==='equality'||currentSkill==='algebra'){const e=equationState();msg=`Write the current balanced equation: ${e.left} = ${e.right}. Now undo the remaining operation on both sides.`}
      else if(currentSkill==='percents')msg=`Decide whether you need rate, 1 − rate, 1 + rate, or part ÷ rate before entering numbers.`;
      else if(currentSkill==='conversions')msg='Write the unit relationship, then choose the operation that makes your predicted size happen.';
      else msg='Write a one-line equation or relationship using the known quantities and the unknown.';
    }
    $('#hintText').textContent=msg; $('#hintBtn').textContent=hintLevel>=2?'💡 Strong hint shown':'💡 Stronger hint'; toast('Hint unlocked');
  }

  function checkAnswer(){
    if(answered)return;const p=currentProblem,raw=$('#answerInput').value;if(!raw.trim())return;
    let ok=false;if(p.answerText)ok=(p.answerAlt||[p.answerText]).some(v=>normalize(v)===normalize(raw));else{const v=Number(normalize(raw));ok=Number.isFinite(v)&&Math.abs(v-Number(p.answer))<.011}
    answerAttempts++;
    if(answerAttempts===1){progress.skills[currentSkill].answerTotal++;if(ok)progress.skills[currentSkill].answerCorrect++;else recordMiss();}
    if(!ok && answerAttempts<2){progress.streak=0;save();$('#feedback').innerHTML=`<div class="feedback bad"><b>Good try — one correction round.</b> ${escapeHtml(p.hint||'Re-check the relationship and your arithmetic.')}</div>`;$('#answerInput').select();showHint();return;}
    progress.skills[currentSkill].completed++;answered=true;let gain=0;
    if(ok){gain=(currentProblem.boss?15:currentStage==='challenge'?8:currentStage==='independent'?6:4);if(answerAttempts>1)gain=Math.max(2,Math.floor(gain/2));progress.xp+=gain;progress.streak++;if(answerAttempts===1&&!reasonMiss)rewardCorrection();const sp=progress.skills[currentSkill];const before=sp.stageWins[currentStage]||0;sp.stageWins[currentStage]=before+1;if(before<2&&sp.stageWins[currentStage]>=2){const ni=stageOrder.indexOf(currentStage)+1;if(ni<stageOrder.length)setTimeout(()=>toast(`${stageOrder[ni][0].toUpperCase()+stageOrder[ni].slice(1)} unlocked!`),500)}celebrate();}
    else progress.streak=0;save();updateMastery();renderStageLocks();
    const correct=p.answerText?p.answerText:`${p.unit==='$'?'$':''}${fmt(Number(p.answer))}${p.unit&&p.unit!=='$'?` ${p.unit}`:''}`;
    $('#feedback').innerHTML=ok?`<div class="feedback good"><span class="big-feedback">★ Quest cleared!</span> ${answerAttempts>1?'Nice correction.':'Your reasoning and calculation matched.'}</div><div class="next-row"><span class="xp-pop">+${gain} XP</span><button class="primary" id="nextProblem">Next quest →</button></div>`:`<div class="feedback bad"><b>Let’s lock in the correction.</b> The answer is <b>${escapeHtml(correct)}</b>. ${escapeHtml(p.hint||'')}</div><div class="next-row"><span>Review the setup before moving on.</span><button class="primary" id="nextProblem">Next quest →</button></div>`;
    $('#checkAnswer').disabled=true;$('#answerInput').disabled=true;$('#hintBtn').disabled=true;$('#nextProblem').addEventListener('click',nextProblem);
  }

  function weakFocusFor(skill){
    const misses=progress.skills[skill].misses||{};const items=Object.entries(misses).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
    return items.length?focusLabel(items[0][0]):'No repeated misconception yet';
  }
  function stageSummary(skill){
    const w=progress.skills[skill].stageWins||{};return stageOrder.map(st=>`${st[0].toUpperCase()}:${Math.min(2,w[st]||0)}/2`).join(' • ');
  }

  function renderParent(){
    const grid=$('#progressGrid');grid.innerHTML='';
    Object.entries(BANK).forEach(([k,skill])=>{const p=progress.skills[k],m=mastery(k),stars=starCount(k);const c=document.createElement('div');c.className='card progress-card';c.innerHTML=`<h3>${skill.icon} ${skill.title} <span aria-label="${stars} stars">${'⭐'.repeat(stars)}</span></h3><div class="progress-bar"><span style="width:${m}%"></span></div><div class="metric"><span>Mastery</span><b>${m}%</b></div><div class="metric"><span>Reasoning accuracy</span><b>${pct(p.reasonCorrect,p.reasonTotal)}% (${p.reasonCorrect}/${p.reasonTotal})</b></div><div class="metric"><span>Answer accuracy</span><b>${pct(p.answerCorrect,p.answerTotal)}% (${p.answerCorrect}/${p.answerTotal})</b></div><div class="metric"><span>Quests finished</span><b>${p.completed}</b></div><div class="metric adaptive-metric"><span>Adaptive focus</span><b>${escapeHtml(weakFocusFor(k))}</b></div><div class="stage-summary">${escapeHtml(stageSummary(k))}</div>${insightFor(p)}`;grid.appendChild(c)});show('#parentView');
  }
  function insightFor(p){
    if(p.reasonTotal<3||p.answerTotal<3)return '<div class="lesson-tip">Complete a few more quests to reveal a learning pattern.</div>';
    const r=pct(p.reasonCorrect,p.reasonTotal),a=pct(p.answerCorrect,p.answerTotal);
    if(r+12<a)return '<div class="lesson-tip">🧠 Calculation is stronger than reasoning. Spend more time on Guided mode and explain each move.</div>';
    if(a+12<r)return '<div class="lesson-tip">✏️ Reasoning is stronger than calculation. The method is clicking; slow down and check arithmetic.</div>';
    return '<div class="lesson-tip">✨ Reasoning and calculation are developing together.</div>';
  }

  function initScratchPad(){
    const panel=$('#scratchPanel'),toggle=$('#scratchToggle'),canvas=$('#scratchCanvas');if(!panel||!toggle||!canvas)return;
    const pen=$('#scratchPen'),eraser=$('#scratchEraser'),undo=$('#scratchUndo'),clear=$('#scratchClear');
    let mode='pen',drawing=false,current=null,strokes=[];
    const ctx=canvas.getContext('2d');
    function resize(){
      const rect=canvas.getBoundingClientRect();if(rect.width<10)return;const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);redraw();
    }
    function redraw(){
      const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';
      for(const st of strokes){ctx.save();ctx.globalCompositeOperation=st.mode==='eraser'?'destination-out':'source-over';ctx.strokeStyle='#30345f';ctx.lineWidth=st.mode==='eraser'?18:3;ctx.beginPath();st.points.forEach((pt,i)=>{const x=pt.x*w,y=pt.y*h;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});ctx.stroke();ctx.restore()}
    }
    function point(e){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))}}
    canvas.addEventListener('pointerdown',e=>{drawing=true;canvas.setPointerCapture?.(e.pointerId);current={mode,points:[point(e)]};strokes.push(current);redraw()});
    canvas.addEventListener('pointermove',e=>{if(!drawing||!current)return;current.points.push(point(e));redraw()});
    const stop=()=>{drawing=false;current=null};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
    function setMode(next){mode=next;pen.classList.toggle('active',mode==='pen');eraser.classList.toggle('active',mode==='eraser')}
    pen.addEventListener('click',()=>setMode('pen'));eraser.addEventListener('click',()=>setMode('eraser'));undo.addEventListener('click',()=>{strokes.pop();redraw()});clear.addEventListener('click',()=>{strokes=[];redraw()});
    toggle.addEventListener('click',()=>{const opening=panel.hidden;panel.hidden=!opening;toggle.setAttribute('aria-expanded',String(opening));toggle.textContent=opening?'Close scratch pad':'Open scratch pad';if(opening)requestAnimationFrame(resize)});
    if('ResizeObserver' in window)new ResizeObserver(()=>{if(!panel.hidden)resize()}).observe(canvas);else window.addEventListener('resize',()=>{if(!panel.hidden)resize()});
  }

  $$('[data-back]').forEach(b=>b.addEventListener('click',()=>{renderHome();show('#homeView')}));
  $$('.stage-tabs button').forEach(b=>b.addEventListener('click',()=>{const st=b.dataset.stage;if(!stageUnlocked(currentSkill,st)){const idx=stageOrder.indexOf(st),prev=stageOrder[idx-1];toast(`Clear 2 ${prev} quests to unlock this level.`);return}currentStage=st;questionCount=0;renderStage()}));
  $('#parentBtn').addEventListener('click',renderParent);$('#bossBtn').addEventListener('click',openBossQuest);$('#quickMixBtn').addEventListener('click',openSmartReview);$('#brandHome').addEventListener('click',()=>{renderHome();show('#homeView')});
  $('#resetProgress').addEventListener('click',()=>{if(confirm('Reset all saved Math Quest progress on this device?')){progress=defaultProgress();save();renderParent();renderHome()}});
  initScratchPad();renderHome();
  if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
