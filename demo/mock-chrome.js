/* Preview only. The production manifest never loads this file or makes these simulated requests. */
(()=>{
  const query=new URLSearchParams(location.search);
  if(query.get('lang'))document.documentElement.lang=GrokFirstUI.normalizeLanguage(query.get('lang'));
  const keyState=query.get('security')==='migration'?'migration':query.get('security')==='missing'?'missing':'ready';
  const config={settings:XGrokCore.normalizeSettings({provider:'api',interfaceLanguage:query.get('interface')||'auto'}),ready:keyState==='ready',keyState,used:0,collapsed:false};
  const listeners=[],pending=new Map(),analysisCache=new Map();let calls=0,commentCalls=0,cancelled=0,verificationPreview=false,citationsPreview=false,urlBoundaryPreview=false,markdownPreview=false,verificationFailurePreview='';
  const simulatedVerificationFailures={
    OUTPUT_LIMIT:{code:'OUTPUT_LIMIT',stage:'verify',errorCode:'API_INCOMPLETE',reason:'max_output_tokens'},
    CONNECTION:{code:'CONNECTION',stage:'verify',errorCode:'API_STREAM_INTERRUPTED'},
    LANGUAGE_MISMATCH:{code:'LANGUAGE_MISMATCH',stage:'verify',errorCode:'API_LANGUAGE_MISMATCH'}
  };
  const emit=message=>listeners.forEach(fn=>fn(message));
  const log=()=>{document.getElementById('log').textContent=`模拟分析 ${calls} 次 · 评论 ${commentCalls} 次 · 取消 ${cancelled} 次 · 当前 xAI API · 未读取或发送 API Key`;};
  const configure=()=>emit({type:'CONFIG',...config});
  function openPreviewSettings(focus) {
    const destination=new URL('/demo/options.html',location.origin);destination.searchParams.set('lang',document.documentElement.lang);
    destination.searchParams.set('focus','api-key');
    if(keyState==='migration')destination.searchParams.set('security','migration');
    location.assign(destination.href);
  }
  function finish(entry){pending.delete(entry.requestId);}
  function cancel(id){const entry=pending.get(id);if(!entry)return;entry.timers.forEach(clearTimeout);pending.delete(id);cancelled++;log();}
  function cancelAll(){[...pending.keys()].forEach(cancel);}
  const drafts={
    'zh-CN':['完整上下文或许能帮助我们理解这条观点。','我想先看看这条主张的原始来源。','这里最值得讨论的是哪一个假设？'],
    'zh-TW':['完整脈絡或許能幫助我們理解這個觀點。','我想先看看這項主張的原始來源。','這裡最值得討論的是哪個假設？'],
    en:['The full context could help clarify this point.','I would like to see the original source first.','Which assumption matters most here?'],
    ja:['全体の文脈を確認すると理解が深まりそうです。','まずは元の情報源を見てみたいです。','ここで最も重要な前提は何でしょうか？'],
    ko:['전체 맥락을 보면 더 잘 이해할 수 있을 것 같습니다.','먼저 원래 출처를 보고 싶습니다.','여기서 가장 중요한 가정은 무엇일까요?'],
    es:['El contexto completo podría aclarar esta idea.','Me gustaría consultar primero la fuente original.','¿Qué supuesto resulta más importante aquí?'],
    fr:['Le contexte complet pourrait éclairer cette idée.','Je voudrais consulter la source originale.','Quelle hypothèse compte le plus ici ?'],
    de:['Der vollständige Kontext könnte diesen Punkt klären.','Ich würde gern zuerst die ursprüngliche Quelle sehen.','Welche Annahme ist hier am wichtigsten?'],
    pt:['O contexto completo pode esclarecer essa ideia.','Gostaria de consultar primeiro a fonte original.','Qual hipótese é mais importante aqui?'],
    ar:['قد يساعد السياق الكامل على توضيح هذه الفكرة.','أود الاطلاع على المصدر الأصلي أولاً.','ما الافتراض الأهم هنا؟'],
    ru:['Полный контекст мог бы прояснить эту мысль.','Хотелось бы сначала увидеть первоисточник.','Какое предположение здесь важнее всего?'],
    hi:['पूरा संदर्भ इस विचार को समझने में मदद कर सकता है।','मैं पहले मूल स्रोत देखना चाहूँगा।','यहाँ सबसे महत्वपूर्ण धारणा कौन सी है?']
  };
  function begin(entry){
    const {requestId,message,comments,language,provider,apiVerification,verificationFailureDemo}=entry;
    if(comments){
      entry.timers.push(setTimeout(()=>{entry.started=true;emit({type:'COMMENT_START',requestId});},80));
      entry.timers.push(setTimeout(()=>{emit({type:'COMMENT_RESULT',requestId,comments:[...(drafts[GrokFirstUI.normalizeLanguage(language)]||drafts.en)],cached:false,usage:{input_tokens:180,output_tokens:90,total_tokens:270},model:entry.apiModel,usageComplete:true});finish(entry);},850));
      return;
    }
    const sample={
      'zh-CN':`这是与「${message.post.author}」当前显示的中文正文对应的模拟回答。判断一项主张，需要看完整上下文和原始证据；单独一张图表不足以支持全面结论。\n\n现在切换「显示原文」，回答会恢复为英文；已有的英文结果可以直接复用。\n\n仅为界面演示，未向 Grok 发起请求。`,
      en:'This simulated answer follows the currently displayed English post. A claim needs its full context and original evidence; a chart alone does not support a sweeping conclusion.\n\nSwitching the post to its Chinese translation also switches the answer. Returning to English reuses its completed answer.\n\nDemo only; no Grok request was made.',
      ja:'現在表示されている投稿、または指定した言語に合わせた回答の表示例です。文脈と元の証拠を確認することで、主張を理解しやすくなります。\n\n日本語を指定した場合、投稿の翻訳を切り替えても回答は日本語のままです。\n\n画面のデモです。Grok へのリクエストは送信していません。'
    };
    const citationUrls=['https://developer.chrome.com/docs/extensions','https://developer.chrome.com/docs/extensions/develop','https://developer.chrome.com/docs/extensions/mv3','https://developer.chrome.com/docs/extensions/reference','https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts'];
    const sources=urlBoundaryPreview?[{url:'https://t.co/dZ1jiqrxX',title:'1'}]:citationsPreview?[...citationUrls.map((url,index)=>({url,title:String(index+1)})),{url:'https://developer.chrome.com/docs/extensions/reference/api/runtime',title:'6'}]:[{url:'https://developer.chrome.com/docs/extensions',title:language==='zh-CN'?'Chrome 官方扩展文档':'Chrome extensions documentation'}];
    const citationNames=['扩展概览','开发文档','Manifest V3','API 参考','内容脚本'];
    const citationText='引用去重的模拟回答，未调用 Grok。\n\n正文已经提供这些出处，下面不会再重复显示编号：\n'+citationUrls.map((url,index)=>`[${citationNames[index]}](${url})`).join('\n')+'\n\n补充来源保留可点击的网站与页面名称。';
    const boundaryText='链接边界的模拟回答，未调用 Grok。\n\n帖子附带两张图片，一张是主帖内容截图，另一张回复中附的链接图片（https://t.co/dZ1jiqrxX），可能为相关截图或证明材料，但内容未在文本中展开。回复中有人表示“原来打个电话付十刀就能直邮，学到了”，显示该信息对部分香港用户有实用参考价值。\n\n这里只能点击网址，后面的中文保持普通正文。';
    const markdownText=message.post.id==='10001'?'### 看懂这条帖子\n\n**图表不等于完整证据。** 先看统计范围，再判断这条主张。\n\n- 核对数据的 **来源和时间**\n- 了解比较对象，避免以偏概全 [[1]](https://developer.chrome.com/docs/extensions)\n\n> 补充背景应当帮助理解这条帖子。\n\n*本地模拟回答，未调用 Grok。*':'### 代码与表格\n\n`URL` 是原帖上下文，代码按原样显示：\n\n```js\nconst post = "https://x.com/example/status/123";\n```\n\n| 内容 | 显示方式 |\n| --- | --- |\n| 重点 | **粗体** |\n| 出处 | [Chrome 文档](https://developer.chrome.com/docs/extensions) |\n\n*本地模拟回答，未调用 Grok。*';
    const text=markdownPreview?markdownText:urlBoundaryPreview?boundaryText:citationsPreview?citationText:message.post.id==='10004'?'Render test: <img src=x onerror=alert(1)>\nThis is literal text and cannot execute.':sample[language]||sample.en;
    const checkText=language==='zh-CN'?'模拟求证：应核对原始来源、日期及完整背景。本地演示未联网检索，未实际核实这条帖子。':language==='ja'?'事実確認の表示例です。元の情報源、日付、背景の確認が必要です。このローカルデモは検索や実際の検証を行っていません。':'Simulated verification: check the original source, date and full context. This local demo did not search online or verify the post.';
    const phase=apiVerification==='inline'?'inline':'explain';
    const checking=apiVerification==='background';
    const verificationStart=text.length+2;
    const completeText=checking?text+'\n\n'+checkText:text;
    if(checking&&verificationFailureDemo) {
      const usage=message.post.id==='10001'?{input_tokens:850,output_tokens:384,total_tokens:1234}:{input_tokens:125,output_tokens:48,total_tokens:173};
      entry.timers.push(
        setTimeout(()=>{entry.started=true;emit({type:'START',requestId,used:config.used});},80),
        setTimeout(()=>emit({type:'UPDATE',requestId,text:text.slice(0,70),phase:'explain',apiVerification:'background'}),380),
        setTimeout(()=>emit({type:'UPDATE',requestId,text,phase:'verification_queued',apiVerification:'background',verificationText:''}),650),
        setTimeout(()=>emit({type:'UPDATE',requestId,text,phase:'verify',apiVerification:'background',verificationText:''}),900),
        setTimeout(()=>{
          const result={text,sources,provider,apiVerification:'background',searched:false,verified:false,verificationStatus:'incomplete',verificationFailure:{...simulatedVerificationFailures[verificationFailureDemo]},warning:'Demo only: the explanation is retained after a simulated fact-check failure; no API request was made.',usage,model:entry.apiModel,usageComplete:verificationFailureDemo!=='CONNECTION'};
          if(entry.cacheKey)analysisCache.set(entry.cacheKey,result);
          emit({type:'RESULT',requestId,result,cached:false});finish(entry);
        },1300)
      );return;
    }
    if(verificationPreview) {
      entry.verificationDemoStage=1;entry.explanation=text.split('\n\n')[0];
      entry.checkText=checkText;entry.verificationStart=entry.explanation.length+2;
      entry.timers.push(
        setTimeout(()=>{entry.started=true;emit({type:'START',requestId,used:config.used});},80),
        setTimeout(()=>emit({type:'UPDATE',requestId,text:entry.explanation,phase:'explain',apiVerification:'background'}),180),
        setTimeout(()=>emit({type:'UPDATE',requestId,text:entry.explanation,phase:'verification_queued',verificationText:'',apiVerification:'background',verificationStart:entry.verificationStart}),300),
        setTimeout(()=>emit({type:'UPDATE',requestId,text:entry.explanation+'\n\n',phase:'verify',verificationText:'',apiVerification:'background',verificationStart:entry.verificationStart}),450)
      );return;
    }
    entry.timers.push(
      setTimeout(()=>{entry.started=true;emit({type:'START',requestId,used:config.used});},80),
      setTimeout(()=>emit({type:'UPDATE',requestId,text:text.slice(0,70),phase,apiVerification,...(citationsPreview||urlBoundaryPreview||markdownPreview?{sources}:{})}),380),
      setTimeout(()=>emit({type:'UPDATE',requestId,text,phase:checking?'verification_queued':phase,apiVerification,...(checking?{verificationText:'',verificationStart}:{})}),650),
      setTimeout(()=>emit({type:'UPDATE',requestId,text:checking?text+'\n\n'+checkText.slice(0,35):text,phase:checking?'verify':phase,apiVerification,...(checking?{verificationText:checkText.slice(0,35),verificationStart}:{})}),900),
      setTimeout(()=>emit({type:'UPDATE',requestId,text:completeText,phase:checking?'verify':phase,apiVerification,...(checking?{verificationText:checkText,verificationStart}:{})}),1100),
      setTimeout(()=>{const result={text:completeText,sources,provider,apiVerification,...(checking?{verificationStart}:{}),searched:false,verified:false,verificationStatus:apiVerification==='off'?'off':'unverified',warning:'仅为界面演示，未联网核查。',usage:message.post.id==='10001'?{input_tokens:850,output_tokens:384,total_tokens:1234}:{input_tokens:125,output_tokens:48,total_tokens:173},model:entry.apiModel,usageComplete:true};if(entry.cacheKey)analysisCache.set(entry.cacheKey,result);emit({type:'RESULT',requestId,result,cached:false});finish(entry);},1300)
    );
  }
  window.chrome={runtime:{
    id:'superx-demo',getManifest:()=>({version:'0.7.26-demo'}),getURL:asset=>`/extension/${asset}`,
    async sendMessage(message){if(message.type==='GET_UI_LANGUAGE')return{ok:true,language:document.documentElement.lang};if(message.type==='OPEN_SETTINGS'){if(query.get('connection')==='expired')throw new Error('Extension context invalidated');openPreviewSettings(message.focus);}if(message.type==='OPEN_HISTORY')location.assign(`/demo/history.html?lang=${encodeURIComponent(document.documentElement.lang)}`);return{ok:true};},
    connect:()=>{
      setTimeout(configure,20);
      return {onMessage:{addListener:fn=>listeners.push(fn)},onDisconnect:{addListener:()=>{}},disconnect:()=>{},postMessage:message=>{
        if(query.get('connection')==='expired'&&message.type==='GENERATE_COMMENTS')throw new Error('Extension context invalidated');
        if(message.type==='PING'){emit({type:'PONG'});return;}
        if(message.type==='HISTORY_VISIT'){emit({type:'HISTORY_ACK',batchId:message.batchId,ok:true,epoch:message.historyEpoch});return;}
        if(message.type==='CANCEL'){cancel(message.requestId);return;}
        if(message.type==='CANCEL_IF_QUEUED'){
          if(pending.get(message.requestId)?.started)return;
          cancel(message.requestId);emit({type:'ERROR',requestId:message.requestId,code:'CANCELLED',error:'未开始的分析已暂停。'});return;
        }
        if(message.type==='CANCEL_ALL'){cancelAll();return;}
        if(message.type==='OPEN_SETTINGS'){
          openPreviewSettings(message.focus);return;
        }
        if(message.type==='SET_ENABLED'){config.settings.enabled=message.enabled;configure();return;}
        if(message.type==='SET_LANGUAGE'){config.settings.language=message.language;configure();return;}
        if(message.type==='SET_RAIL_COLLAPSED'){
          config.collapsed=Boolean(message.collapsed);
          if(config.collapsed)for(const [id,entry] of pending)if(!entry.started){cancel(id);emit({type:entry.comments?'COMMENT_ERROR':'ERROR',requestId:id,code:'RAIL_COLLAPSED',error:'右栏已收起'});}
          emit({type:'RAIL_VISIBILITY',collapsed:config.collapsed});return;
        }
        if(!['ANALYZE','GENERATE_COMMENTS'].includes(message.type)||config.collapsed)return;
        const comments=message.type==='GENERATE_COMMENTS';
        const cacheKey=!comments?JSON.stringify([XGrokCore.apiPostIdentity(message.post,config.settings),config.settings,...(verificationFailurePreview?[verificationFailurePreview]:[])]):'';
        if(cacheKey&&!message.force&&analysisCache.has(cacheKey)){emit({type:'RESULT',requestId:message.requestId,result:analysisCache.get(cacheKey),cached:true});return;}
        if(comments)commentCalls++;else{calls++;config.used++;}
        log();
        const entry={requestId:message.requestId,message,comments,provider:'api',apiModel:config.settings.apiModel,apiVerification:config.settings.apiVerification,verificationFailureDemo:comments?'':verificationFailurePreview,language:XGrokCore.resolvePostLanguage(config.settings.language,message.post),cacheKey,timers:[],started:false};
        pending.set(entry.requestId,entry);if(!comments)emit({type:'QUEUED',requestId:entry.requestId});
        begin(entry);
      }};
    }
  }};
  document.getElementById('toggle').onclick=()=>{config.settings.enabled=!config.settings.enabled;configure();};
  document.getElementById('markdown-demo').onclick=()=>{
    cancelAll();markdownPreview=true;citationsPreview=false;verificationPreview=false;urlBoundaryPreview=false;verificationFailurePreview='';analysisCache.clear();
    config.settings=XGrokCore.normalizeSettings({...config.settings,language:'zh-CN',explanationMode:'preset',enabled:true});configure();
    document.getElementById('message').textContent='模拟 Markdown：标题、粗体、列表、引用、代码和表格直接排版，出处不重复。不调用 Grok。';
  };
  document.getElementById('sources-demo').onclick=()=>{
    cancelAll();citationsPreview=true;verificationPreview=false;urlBoundaryPreview=false;markdownPreview=false;verificationFailurePreview='';analysisCache.clear();
    config.settings=XGrokCore.normalizeSettings({...config.settings,language:'zh-CN',explanationMode:'preset',enabled:true});configure();
    document.getElementById('message').textContent='模拟引用：正文五个出处不重复列编号，额外来源显示网址名称。不调用 Grok。';
  };
  document.getElementById('url-boundary-demo').onclick=()=>{
    cancelAll();urlBoundaryPreview=true;citationsPreview=false;verificationPreview=false;markdownPreview=false;verificationFailurePreview='';analysisCache.clear();
    config.settings=XGrokCore.normalizeSettings({...config.settings,language:'zh-CN',explanationMode:'preset',enabled:true});configure();
    document.getElementById('message').textContent='模拟链接边界：中文右括号和后文保持普通正文，出处不重复。不调用 Grok。';
  };
  document.getElementById('verify-wait').onclick=()=>{
    cancelAll();verificationPreview=true;citationsPreview=false;urlBoundaryPreview=false;markdownPreview=false;verificationFailurePreview='';analysisCache.clear();config.settings=XGrokCore.normalizeSettings({...config.settings,provider:'api',explanationMode:'preset',apiVerification:'background',enabled:true});configure();
    document.getElementById('message').textContent='求证等待演示：点击「推进模拟求证」显示首字，再点击一次完成。仅模拟 UI，不调用 Grok。';
  };
  document.getElementById('verify-advance').onclick=()=>{
    for(const entry of [...pending.values()]) {
      if(!entry.verificationDemoStage)continue;
      entry.timers.forEach(clearTimeout);
      const text=entry.explanation+'\n\n'+entry.checkText;
      if(entry.verificationDemoStage===1){entry.verificationDemoStage=2;emit({type:'UPDATE',requestId:entry.requestId,phase:'verify',text,verificationText:entry.checkText,apiVerification:'background',verificationStart:entry.verificationStart});}
      else {emit({type:'RESULT',requestId:entry.requestId,result:{provider:'api',text,sources:[],apiVerification:'background',verificationStart:entry.verificationStart,searched:false,verified:false,verificationStatus:'unverified',warning:'Demo only; no Grok request was made.'}});finish(entry);}
    }
  };
  function restartFailurePreview(code) {
    cancelAll();verificationFailurePreview=code;verificationPreview=false;citationsPreview=false;urlBoundaryPreview=false;markdownPreview=false;analysisCache.clear();
    // These explicit demo controls reset completed cards through the existing
    // configuration channel. No product setting or real API is involved.
    config.settings=XGrokCore.normalizeSettings({...config.settings,apiVerification:'background',explanationMode:'preset',enabled:false});configure();
    config.settings=XGrokCore.normalizeSettings({...config.settings,enabled:true});configure();
  }
  document.getElementById('verify-failure-demo').onclick=()=>{
    const code=document.getElementById('verify-failure-reason').value;
    if(!Object.hasOwn(simulatedVerificationFailures,code))return;
    restartFailurePreview(code);
    document.getElementById('message').textContent=`仅模拟 Fact Check 失败：${code}。解释保留；悬停状态可看原因，展开诊断可看详情。不调用 API。`;
  };
  document.getElementById('verify-failure-reset').onclick=()=>{
    restartFailurePreview('');
    document.getElementById('message').textContent='已恢复普通本地演示，不模拟 Fact Check 失败。不调用 API。';
  };
  document.getElementById('theme').onclick=()=>{document.body.className=document.body.className==='theme-light'?'theme-dim':document.body.className==='theme-dim'?'':'theme-light';};
  document.getElementById('locale').onclick=()=>{const language=document.documentElement.lang==='zh-CN'?'en':document.documentElement.lang==='en'?'ja':'zh-CN';document.documentElement.lang=language;emit({type:'UI_LANGUAGE',language});document.getElementById('message').textContent='仅切换 X 界面语言；生成中的回答与输出语言设置继续保留。';};
  document.getElementById('recycle').onclick=()=>{const article=document.querySelector('article'),a=article.querySelector('a[href*="/status/"]');a.href=a.getAttribute('href').endsWith('10001')?'/SuperXDemo/status/10011':'/SuperXDemo/status/10001';article.querySelector('time').setAttribute('datetime','2026-10-06T10:00:00Z');document.getElementById('message').textContent='仅更新帖子链接/时间属性，卡片应重新匹配。';};
  document.getElementById('route').onclick=()=>{history.pushState({},'',location.pathname==='/demo/index.html'?'/home':'/demo/index.html');document.querySelector('.feedtitle').textContent=location.pathname==='/home'?'为你推荐 · SPA 路由验证':'为你推荐';};
  document.getElementById('translate').onclick=()=>{
    // Use existing original/translation nodes, like X's visibility-only path.
    // The toggle itself changes only classes, not text nodes or lang attributes.
    const body=document.querySelector('article .post-text');
    const translated=body.classList.toggle('translated');
    document.getElementById('translate').classList.toggle('translated',translated);
  };
})();
