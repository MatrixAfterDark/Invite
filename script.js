(() => {
  "use strict";
  const cfg = window.MATRIX_CONFIG;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const sleep = (ms) => new Promise((resolve) => {
    let remaining = ms;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      if (!document.hidden) remaining -= now - last;
      last = now;
      if (remaining <= 0) resolve(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  const params = new URLSearchParams(location.search);
  const guestName = (params.get("name") || "GUEST").trim().slice(0, 50).toUpperCase();
  const guestToken = (params.get("token") || "").trim().slice(0, 100);
  const glyphs = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ0123456789ZXCVBNM";

  const scenes = {
    opening: $("#scene-opening"), phone: $("#scene-phone"),
    entry: $("#scene-entry"), invite: $("#scene-invite"), blue: $("#scene-blue"),
    red: $("#scene-red"), final: $("#scene-final")
  };
  const rainCanvas = $("#matrix-rain");
  const rainCtx = rainCanvas.getContext("2d", { alpha: true });
  const flash = $("#screen-flash");
  const rabbitImage = $("#rabbit-image");
  const rabbitChoice = $("#rabbit-choice");

  const audio = {
    ringtone: $("#audio-ringtone"), call: $("#audio-morpheus-call"), feed: $("#audio-phone-feed"), bg: $("#audio-background"),
    red: $("#audio-morpheus-red"), blue: $("#audio-blue")
  };

  let vw = innerWidth, vh = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  let lastFrame = performance.now();
  let transitionLock = false;
  let rainMode = "off";
  let rainTint = "green";
  let rainTargetDensity = 0;
  let rainDensity = 0;
  let rainSpeed = 1;
  let columns = [];
  let audioUnlocked = false;
  const pausedAudio = new Map();

  const palettes = {
    green: { head:[215,255,218], body:[48,232,80], dim:[0,104,28] },
    red: { head:[255,218,218], body:[245,44,54], dim:[105,0,12] },
    blue: { head:[220,232,255], body:[56,104,255], dim:[5,28,110] }
  };

  function resize() {
    vw = innerWidth; vh = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    rainCanvas.width = Math.round(vw*dpr); rainCanvas.height = Math.round(vh*dpr);
    rainCanvas.style.width = vw + "px"; rainCanvas.style.height = vh + "px";
    rainCtx.setTransform(dpr,0,0,dpr,0,0);
    buildColumns();
  }

  function buildColumns() {
    const baseFont = vw < 600 ? 12 : 13;
    const spacing = vw < 600 ? 10 : 12;
    const count = Math.ceil(vw / spacing) + 14;
    columns = Array.from({length: count}, (_, i) => ({
      x: (i - 5) * spacing + (Math.random() - .5) * spacing * .7,
      y: -Math.random() * vh * 1.2,
      speed: .82 + Math.random() * 1.7,
      length: 7 + Math.floor(Math.pow(Math.random(), .62) * 52),
      font: baseFont + Math.floor(Math.random() * 3),
      offset: Math.random() * 6000,
      active: Math.random(),
      mutateRate: 55 + Math.random() * 95
    }));
  }

  function setRain(mode, tint = "green") {
    rainMode = mode; rainTint = tint;
    const settings = {
      // Motion is intentionally 20% slower than v7 while preserving density.
      off:[0,0], calm:[.74,1.48], entry:[1,2.20], red:[1,2.36], blue:[1,1.36], final:[.78,1.72]
    }[mode] || [0,0];
    rainTargetDensity = settings[0]; rainSpeed = settings[1];
    rainCanvas.classList.toggle("is-visible", mode !== "off");
  }

  function mixColor(a,b,p){ return a.map((v,i)=>Math.round(v+(b[i]-v)*p)); }
  function currentPalette() {
    if (rainTint !== "redToGreen" && rainTint !== "blueToGreen") return palettes[rainTint] || palettes.green;
    const p = Number(rainCanvas.dataset.colorProgress || 0);
    const from = rainTint === "blueToGreen" ? palettes.blue : palettes.red;
    return {
      head: mixColor(from.head,palettes.green.head,p),
      body: mixColor(from.body,palettes.green.body,p),
      dim: mixColor(from.dim,palettes.green.dim,p)
    };
  }

  function drawRain(dt, t) {
    rainDensity += (rainTargetDensity-rainDensity)*Math.min(1,dt*.0045);
    if (rainMode === "off" && rainDensity < .01) { rainCtx.clearRect(0,0,vw,vh); return; }
    const fade = rainMode === "calm" ? .125 : rainMode === "final" ? .115 : rainMode === "blue" ? .11 : .075;
    rainCtx.fillStyle = `rgba(0,0,0,${fade})`;
    rainCtx.fillRect(0,0,vw,vh);
    const pal = currentPalette();
    rainCtx.textAlign = "center"; rainCtx.textBaseline = "middle";
    for (let i=0;i<columns.length;i++) {
      const c = columns[i];
      if (c.active > rainDensity) continue;
      c.y += c.speed * rainSpeed * dt * .058;
      if (c.y - c.length*c.font > vh + 80) {
        c.y = -Math.random()*vh*.55;
        c.speed = .82 + Math.random()*1.75;
        c.length = 7 + Math.floor(Math.pow(Math.random(), .62) * 52);
        c.x = (i - 5) * (vw < 600 ? 10 : 12) + (Math.random()-.5)*8;
        c.active = Math.random();
      }
      rainCtx.font = `${c.font}px "IBM Plex Mono", monospace`;
      const headIndex = Math.floor((t*.018 + c.offset)) % glyphs.length;
      for (let j=0;j<c.length;j++) {
        const y = c.y - j*c.font*.91;
        if (y < -30 || y > vh+30) continue;
        const p = 1-j/c.length;
        const isHead = j===0;
        const alpha = isHead ? 1 : Math.pow(p,1.42)*.86;
        const rgb = isHead ? pal.head : j<4 ? pal.body : pal.dim;
        rainCtx.fillStyle = `rgba(${rgb.join(",")},${alpha})`;
        rainCtx.shadowBlur = isHead ? 12 : j<4 ? 5 : 0;
        rainCtx.shadowColor = `rgba(${pal.body.join(",")},.72)`;
        const char = glyphs[(headIndex + j*7 + Math.floor(t/c.mutateRate) + ((i*j)%13)) % glyphs.length];
        rainCtx.fillText(char,c.x,y);
      }
    }
    rainCtx.shadowBlur = 0;
  }

  function frame(now) {
    const dt = Math.min(40, now-lastFrame); lastFrame = now;
    if (!document.hidden) drawRain(dt, now);
    requestAnimationFrame(frame);
  }

  function showScene(name) {
    Object.values(scenes).forEach(s=>s.classList.remove("is-active"));
    scenes[name].classList.add("is-active");
  }

  let terminalAudioCtx = null;
  function terminalTick(ch){
    if(ch === " ") return;
    try{
      terminalAudioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if(terminalAudioCtx.state !== "running") return;
      const now=terminalAudioCtx.currentTime;
      const osc=terminalAudioCtx.createOscillator();
      const gain=terminalAudioCtx.createGain();
      osc.type="square";
      const punctuation=/[.,!?…]/.test(ch);
      osc.frequency.value=(punctuation?520:690)*(0.96+Math.random()*0.08);
      gain.gain.setValueAtTime(0.0001,now);
      gain.gain.exponentialRampToValueAtTime(punctuation?0.018:0.012,now+0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+(punctuation?0.035:0.026));
      osc.connect(gain); gain.connect(terminalAudioCtx.destination);
      osc.start(now); osc.stop(now+0.04);
    }catch{}
  }
  async function typeText(el,text,speed=34,withTerminalSound=false) {
    el.textContent="";
    for (const ch of text) {
      el.textContent += ch;
      if(withTerminalSound) terminalTick(ch);
      await sleep(speed + Math.random()*15);
    }
  }
  async function typeLines(container, lines, speed=28, initialPause=120) {
    container.innerHTML=""; await sleep(initialPause);
    for (const item of lines) {
      const p=document.createElement("p"); p.className="system-line"+(item.verified?" verified":"");
      container.appendChild(p); await typeText(p,item.text,speed); await sleep(item.pause||300);
    }
  }
  async function whiteBloom(ms=380) {
    flash.style.transition="none"; flash.style.opacity="0";
    await sleep(20); flash.style.transition=`opacity ${ms*.35}ms ease-out`; flash.style.opacity=".95";
    await sleep(ms*.35); flash.style.transition=`opacity ${ms*.65}ms ease-in`; flash.style.opacity="0";
    await sleep(ms*.65);
  }

  function configureAudio() {
    audio.ringtone.src=cfg.audio.ringtone; audio.call.src=cfg.audio.morpheusCall; audio.feed.src=cfg.audio.phoneFeed;
    audio.bg.src=cfg.audio.backgroundMusic; audio.red.src=cfg.audio.morpheusRedPill; audio.blue.src=cfg.audio.bluePill;
    audio.ringtone.volume=cfg.volumes.ringtone; audio.call.volume=cfg.volumes.voice; audio.feed.volume=cfg.volumes.phoneFeed ?? .28;
    audio.bg.volume=cfg.volumes.music; audio.red.volume=cfg.volumes.voice; audio.blue.volume=cfg.volumes.voice;
  }
  async function safePlay(el,{restart=true}={}) {
    try {
      el.muted = false;
      if (restart) el.currentTime = 0;
      if (el.readyState === 0) el.load();
      await el.play();
      return true;
    } catch (error) {
      console.warn("Audio playback failed:", el?.src || "unknown source", error);
      return false;
    }
  }
  function stopAudio(el){ try{el.pause();el.currentTime=0;}catch{} }
  function fadeAudio(el,target,ms=700){
    const start=el.volume, startAt=performance.now();
    const run=(now)=>{ if(document.hidden){requestAnimationFrame(run);return;} const p=Math.min(1,(now-startAt)/ms); el.volume=start+(target-start)*p; if(p<1) requestAnimationFrame(run); };
    requestAnimationFrame(run);
  }
  async function unlockAudio(){
    if(audioUnlocked)return; audioUnlocked=true;

    // Do not call load() here. Reloading an element after playback has begun can
    // silently reset the ringtone on iOS. Sources are configured and preloaded at startup.
    for (const el of Object.values(audio)) el.muted = false;

    // Explicitly guarantee that no dialogue can be active before its scene.
    stopAudio(audio.call);
    stopAudio(audio.feed);
    stopAudio(audio.red);
    stopAudio(audio.blue);
  }
  function waitForAudioOrTimeout(el,timeout){ return new Promise(resolve=>{ let done=false; const finish=()=>{if(done)return;done=true;el.removeEventListener("ended",finish);resolve();}; el.addEventListener("ended",finish,{once:true}); sleep(timeout).then(finish); }); }
  function waitForCallCompletion(started) {
    if (!started) return sleep(cfg.timing.callFallbackMs || 6200);
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        audio.call.removeEventListener("ended", finish);
        audio.call.removeEventListener("error", finish);
        resolve();
      };
      audio.call.addEventListener("ended", finish, { once: true });
      audio.call.addEventListener("error", finish, { once: true });
      // Safety timeout uses the real media duration where available.
      const durationMs = Number.isFinite(audio.call.duration) && audio.call.duration > 0
        ? Math.ceil(audio.call.duration * 1000) + 2500
        : Math.max(cfg.timing.callFallbackMs || 6200, 15000);
      sleep(durationMs).then(finish);
    });
  }
  async function beginMusicBridgeForCall() {
    // Start the score with Morpheus's first words so the call never ends into silence.
    // It stays deliberately quiet beneath Morpheus, then rises after the call.
    if (audio.bg.paused) {
      audio.bg.volume = 0;
      const started = await safePlay(audio.bg);
      if (!started) return;
    }
    fadeAudio(audio.bg, .045, 1400);
  }

  function populate() {
    $$('[data-guest-name]').forEach(el=>el.textContent=guestName);
    $("#event-date").textContent=cfg.displayDate; $("#event-time").textContent=cfg.displayTime;
    $("#event-venue").textContent=cfg.venue; $("#event-dress").textContent=cfg.dressCode;
    $("#final-date").textContent=cfg.displayDate;
    const briefing=$("#briefing-copy"); briefing.innerHTML="";
    cfg.briefing.forEach(x=>{const p=document.createElement("p");p.innerHTML=x;briefing.appendChild(p);});
    buildGallery(); updateCountdown(); setInterval(updateCountdown,1000);
  }
  function updateCountdown() {
    const diff=Math.max(0,new Date(cfg.eventDateISO)-new Date());
    const d=Math.floor(diff/86400000), h=Math.floor(diff/3600000)%24, m=Math.floor(diff/60000)%60, s=Math.floor(diff/1000)%60;
    [["days","final-days",String(d).padStart(3,"0")],["hours","final-hours",String(h).padStart(2,"0")],["minutes","final-minutes",String(m).padStart(2,"0")],["seconds","final-seconds",String(s).padStart(2,"0")]].forEach(([a,b,v])=>{const x=$("#"+a),y=$("#"+b);if(x)x.textContent=v;if(y)y.textContent=v;});
  }
  function buildGallery() {
    const gallery=$("#character-gallery"); gallery.innerHTML="";
    cfg.characters.forEach(c=>{
      const b=document.createElement("button"); b.type="button"; b.className="character-card";
      b.innerHTML=`<img src="${c.image}" alt="${c.name} outfit inspiration" loading="lazy"><span>${c.name}</span>`;
      b.querySelector("img").addEventListener("error",()=>b.remove()); b.addEventListener("click",()=>openCharacter(c)); gallery.appendChild(b);
    });
  }
  function openCharacter(c){ const d=$("#character-dialog"); $("#character-dialog-image").src=c.image; $("#character-dialog-image").alt=`${c.name} outfit inspiration`; $("#character-dialog-name").textContent=c.name; $("#character-dialog-note").textContent=c.note||""; d.showModal(); }
  $("#close-character").addEventListener("click",()=>$("#character-dialog").close());

  async function openingSequence(){
    await sleep(cfg.timing.openingStartDelay);
    await typeText($("#opening-line-1"),`WAKE UP, ${guestName}...`,49,true); await sleep(750);
    await typeText($("#opening-line-2"),"THE MATRIX HAS YOU...",49,true); await sleep(820);
    await typeText($("#opening-line-3"),"FOLLOW THE WHITE RABBIT...",49,true); await sleep(1250);
    rabbitChoice.hidden=false;
    const f=$("#follow-rabbit"); f.disabled=false; f.classList.add("is-ready");
    rabbitImage.classList.add("is-visible");
  }
  async function beginPhone(){
    if(transitionLock)return;transitionLock=true;

    // Clear any dialogue first. The White Rabbit is only allowed to begin the
    // phone scene and ringtone.
    stopAudio(audio.call);
    stopAudio(audio.feed);
    stopAudio(audio.red);
    stopAudio(audio.blue);

    // IMPORTANT FOR MOBILE SAFARI: make the phone scene visible synchronously
    // inside the tap handler before asking the browser to play audio. Visual
    // progression must never depend on an audio promise resolving.
    rabbitChoice.classList.add("is-leaving");
    showScene("phone");
    const phoneWrap = $("#phone-wrap");
    phoneWrap.classList.remove("is-ending","is-answered");
    phoneWrap.classList.add("is-visible","is-ringing");
    // Force this frame to paint before playback so the phone and first ring arrive together.
    void phoneWrap.offsetWidth;
    $("#answer-call").hidden=false;
    $("#answer-call").disabled=false;
    $("#phone-status").textContent="INCOMING TRANSMISSION...";

    // Start the ringtone in the same user gesture, but do not await it before
    // revealing the phone. This prevents a mobile playback negotiation from
    // leaving the phone hidden while the ringtone is audible.
    audio.ringtone.muted = false;
    audio.ringtone.volume = cfg.volumes.ringtone;
    await unlockAudio();
    const ringtonePromise = safePlay(audio.ringtone);
    const ringtoneStarted = await ringtonePromise;
    if (!ringtoneStarted) {
      // Retry once; the phone remains visible and answerable regardless.
      await sleep(120);
      await safePlay(audio.ringtone);
    }

    transitionLock=false;
  }

  let phoneCodeRaf = 0;
  let phoneCodeParticles = [];

  function startPhoneImmersion(){
    const stage = $(".phone-stage");
    const canvas = $("#phone-code");
    if(!stage || !canvas) return;

    stage.classList.remove("call-ending");
    stage.classList.add("call-connected");

    const ctx = canvas.getContext("2d", { alpha: true });
    const glyphs = "01ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｿｴ";

    function resizePhoneCode(){
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }

    resizePhoneCode();
    phoneCodeParticles = [];
    const start = performance.now();

    cancelAnimationFrame(phoneCodeRaf);
    function frame(now){
      const rect = stage.getBoundingClientRect();
      const elapsed = now - start;
      const build = Math.min(1, elapsed / 16000);

      ctx.clearRect(0, 0, rect.width, rect.height);

      // Sparse at first, gently increasing while Morpheus talks.
      const emissions = Math.random() < (.16 + build * .40) ? 1 : 0;
      for(let n=0;n<emissions;n++){
        const side = Math.random() < .5 ? -1 : 1;
        phoneCodeParticles.push({
          x: rect.width/2 + side*(80 + Math.random()*90),
          y: rect.height*.46 + (Math.random()-.5)*rect.height*.48,
          vx: side*(.10 + Math.random()*.24),
          vy: -.10 - Math.random()*.30,
          alpha: .45 + Math.random()*.35,
          life: 1,
          glyph: glyphs[(Math.random()*glyphs.length)|0]
        });
      }

      ctx.font = '12px "IBM Plex Mono","Courier New",monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for(let i=phoneCodeParticles.length-1;i>=0;i--){
        const p = phoneCodeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= .0065;
        if(p.life <= 0){
          phoneCodeParticles.splice(i,1);
          continue;
        }
        ctx.globalAlpha = p.alpha * p.life;
        ctx.fillStyle = "#86ff91";
        ctx.fillText(p.glyph, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      phoneCodeRaf = requestAnimationFrame(frame);
    }
    phoneCodeRaf = requestAnimationFrame(frame);
  }

  function intensifyPhoneImmersion(){
    $(".phone-stage")?.classList.add("call-ending");
  }

  function stopPhoneImmersion(){
    cancelAnimationFrame(phoneCodeRaf);
    phoneCodeRaf = 0;
    phoneCodeParticles = [];
    const stage = $(".phone-stage");
    stage?.classList.remove("call-connected","call-ending");
    const canvas = $("#phone-code");
    if(canvas){
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0,0,canvas.width,canvas.height);
    }
  }


  function wholePhoneAnswer(e){
    const wrap = $("#phone-wrap");
    if(!wrap || wrap.classList.contains("is-answered") || transitionLock) return;
    e?.preventDefault();
    answerPhone();
  }

  async function answerPhone(){
    if(transitionLock)return;
    transitionLock=true;
    const audioCue=$("#audio-on-cue"); if(audioCue) audioCue.hidden=true;

    stopAudio(audio.ringtone);
    stopAudio(audio.red);
    stopAudio(audio.blue);

    const phoneWrap = $("#phone-wrap");
    phoneWrap.classList.remove("is-ringing");
    phoneWrap.classList.add("is-answered");
    $("#answer-call").hidden=true;
    $("#phone-status").textContent="CALL CONNECTED";

    /*
      MOBILE-SAFE START:
      iOS/Safari can reject a second audio.play() after an awaited promise.
      Therefore Morpheus, the phone-feed and the score are all STARTED
      synchronously inside the Answer tap before we await anything.
    */
    audio.call.muted = false;
    audio.call.volume = cfg.volumes.voice;
    audio.call.currentTime = 0;
    audio.call.setAttribute("playsinline","");
    audio.call.preload = "auto";

    audio.feed.muted = false;
    audio.feed.volume = cfg.volumes.phoneFeed ?? .40;
    audio.feed.currentTime = 0;
    audio.feed.loop = true;
    audio.feed.setAttribute("playsinline","");

    audio.bg.muted = false;
    audio.bg.volume = .02;
    audio.bg.setAttribute("playsinline","");

    let callPromise;
    let feedPromise;
    let bgPromise;

    try { callPromise = audio.call.play(); } catch(e) { callPromise = Promise.reject(e); }
    try { feedPromise = audio.feed.play(); } catch(e) { feedPromise = Promise.reject(e); }
    try { if(audio.bg.paused) bgPromise = audio.bg.play(); } catch(e) { bgPromise = Promise.reject(e); }

    startPhoneImmersion();
    beginMusicBridgeForCall();

    let callStarted = true;
    if(callPromise && typeof callPromise.then === "function"){
      try { await callPromise; } catch(err){
        callStarted = false;
        console.warn("Morpheus phone audio was blocked:", err);
      }
    }

    // Do not let a feed/music rejection interrupt the scene.
    if(feedPromise && typeof feedPromise.catch === "function") feedPromise.catch(()=>{});
    if(bgPromise && typeof bgPromise.catch === "function") bgPromise.catch(()=>{});

    // Let the call breathe, then begin the escape while Morpheus is still speaking.
    // The invitation itself will not reveal until the real audio has ended.
    if(callStarted){
      await new Promise(resolve=>{
        if(audio.call.currentTime >= 10 || audio.call.ended) return resolve();
        const onTime=()=>{ if(audio.call.currentTime >= 10 || audio.call.ended){ cleanup(); resolve(); } };
        const onEnd=()=>{ cleanup(); resolve(); };
        const cleanup=()=>{ audio.call.removeEventListener("timeupdate",onTime); audio.call.removeEventListener("ended",onEnd); };
        audio.call.addEventListener("timeupdate",onTime);
        audio.call.addEventListener("ended",onEnd,{once:true});
      });
    } else {
      await sleep(10000);
    }

    intensifyPhoneImmersion();
    $(".phone-stage")?.classList.add("signal-unstable");
    $("#phone-status").textContent="TRACE DETECTED";
    await sleep(430);

    // Phone-feed and Morpheus continue over the Matrix takeover.
    fadeAudio(audio.bg,.18,900);
    phoneWrap.classList.add("is-ending");
    await sleep(650);
    stopPhoneImmersion();

    const callFinished = waitForCallCompletion(callStarted);
    await entryTransition(callFinished);
    transitionLock=false;
  }

  async function entryTransition(callFinishedPromise=null){
    showScene("entry");
    $("#entry-status").innerHTML="";
    setRain("entry","green");
    rainDensity=.08;
    await sleep(220);
    rainTargetDensity=.62;
    await sleep(420);
    rainTargetDensity=.98;
    const status=$("#entry-status");
    await typeLines(status,[
      {text:"SIGNAL ACQUIRED...",pause:70},
      {text:"TRACE COMPLETE...",pause:60},
      {text:"DISCONNECTING FROM THE SIMULATION...",pause:80},
      {text:"INITIALIZING MATRIX CONNECTION...",pause:100}
    ],10,20);
    // Morpheus is allowed to speak through the takeover; never flash/reveal early.
    if(callFinishedPromise) await callFinishedPromise;
    await sleep(1500);
    await whiteBloom(340);
    fadeAudio(audio.bg,cfg.volumes.music,750);
    setRain("calm","green");
    showScene("invite");

    // We are now fully inside the Matrix. Let the phone-feed dissolve only after
    // the invitation is visible, leaving the background score behind.
    audio.feed.loop = false;
    fadeAudio(audio.feed, 0, cfg.timing.phoneFeedInviteFadeMs || 1100);
    await sleep(cfg.timing.phoneFeedInviteFadeMs || 1100);
    stopAudio(audio.feed);
  }

  async function playBluePillAudioFromGesture(){
    stopAudio(audio.blue);
    audio.blue.muted = false;
    audio.blue.volume = cfg.volumes.voice;
    try {
      audio.blue.currentTime = 0;
      const playPromise = audio.blue.play();
      if (playPromise && typeof playPromise.then === "function") await playPromise;
      return true;
    } catch (error) {
      console.warn("Blue-pill audio was blocked:", error);
      return false;
    }
  }


  async function bluePath(){
    if(transitionLock)return;
    transitionLock=true;
    $("#blue-pill-button").classList.add("is-selected");
    const reconnectPill = $("#blue-reconnect-red");
    reconnectPill.hidden = true;
    reconnectPill.classList.remove("is-visible");

    // Start the licensed Blue Pill line directly from the pill tap. No visible
    // recovery prompt is ever shown; the cinematic sequence continues even if
    // a browser refuses audio playback.
    playBluePillAudioFromGesture();
    showScene("blue");
    $("#blue-status").innerHTML="";

    await sleep(260);
    setRain("blue","blue");
    rainDensity=.08;
    rainTargetDensity=.38;
    await sleep(560);
    rainTargetDensity=.72;
    await sleep(620);
    rainTargetDensity=.96;

    const status = $("#blue-status");
    await typeLines(status,[
      {text:"SIMULATION RESTORED...",pause:360},
      {text:"YOU HAVE CHOSEN TO REMAIN",pause:80},
      {text:"WITHIN THE SIMULATION.",pause:120}
    ],19,70);

    // Let the decision land before the Matrix quietly leaves the door open.
    await sleep(2000);

    rainTint="blueToGreen";
    const colorStart=performance.now(), colorDuration=1100;
    await new Promise(resolve=>{const tick=(now)=>{const p=Math.min(1,(now-colorStart)/colorDuration);rainCanvas.dataset.colorProgress=String(p);if(p<1)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
    setRain("final","green");

    await typeLines(status,[
      {text:"IF YOU CHANGE YOUR MIND...",pause:260},
      {text:"THE CONNECTION",pause:70},
      {text:"REMAINS AVAILABLE.",verified:true,pause:240}
    ],19,40);

    await sleep(800);
    reconnectPill.hidden = false;
    await sleep(20);
    reconnectPill.classList.add("is-visible");
    transitionLock=false;
  }

  async function submitRSVP(){
    const payload={name:guestName,response:"ATTENDING",event:cfg.eventTitle,submitted_at:new Date().toISOString(),guest_token:guestToken||"not supplied",_subject:`${cfg.rsvpSubjectPrefix} — ${guestName}`,_template:"table",_captcha:"false"};
    try{const r=await fetch(cfg.rsvpEndpoint,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(payload),keepalive:true});return r.ok;}catch{return false;}
  }

  async function redPath(){
    if(transitionLock)return;
    transitionLock=true;
    stopAudio(audio.call);
    stopAudio(audio.blue);
    $("#red-pill-button").classList.add("is-selected");
    $("#rsvp-status").textContent="TRANSMITTING PRESENCE...";
    const rsvpPromise=submitRSVP();
    safePlay(audio.red);
    const redAudioDone=waitForAudioOrTimeout(audio.red,cfg.timing.redAudioFallbackMs||9000);
    fadeAudio(audio.bg,.17,420);
    await sleep(260);
    showScene("red");
    $("#red-status").innerHTML="";
    rainCanvas.dataset.colorProgress="0";
    setRain("red","red");
    rainDensity=.07;
    rainTargetDensity=.35;
    await sleep(650);
    rainTargetDensity=.68;
    await sleep(700);
    rainTargetDensity=1;
    const status=$("#red-status");
    await typeLines(status,[
      {text:"CONNECTING...",pause:320},
      {text:"VERIFYING IDENTITY...",pause:380},
      {text:"IDENTITY VERIFIED",verified:true,pause:180},
      {text:`SUBJECT: ${guestName}`,verified:true,pause:340},
      {text:"CONFIRMING PRESENCE...",pause:300}
    ],24,80);
    const rsvpOk=await Promise.race([rsvpPromise,sleep(1500).then(()=>null)]);
    const line=document.createElement("p");
    line.className="system-line verified";
    status.appendChild(line);
    await typeText(line,rsvpOk===false?"PRESENCE QUEUED // CONNECTION UNSTABLE":"PRESENCE CONFIRMED",25);
    rainTint="redToGreen";
    const colorStart=performance.now(), colorDuration=1150;
    await new Promise(resolve=>{const tick=(now)=>{const p=Math.min(1,(now-colorStart)/colorDuration);rainCanvas.dataset.colorProgress=String(p);if(p<1)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
    await redAudioDone;
    await whiteBloom(340);
    setRain("final","green");
    fadeAudio(audio.bg,cfg.volumes.music,650);
    showScene("final");
    await finalSequence();
    transitionLock=false;
  }

  async function matrixReveal(el,text,duration=800){
    const target=text.toUpperCase(), start=performance.now();
    await new Promise(resolve=>{ const timer=setInterval(()=>{ const p=Math.min(1,(performance.now()-start)/duration); let out=""; for(let i=0;i<target.length;i++){ if(target[i]===" ")out+=" "; else {const settle=Math.min(1,Math.max(0,p*1.35-i/target.length*.35)); out+=settle>.83?target[i]:glyphs[Math.floor(Math.random()*glyphs.length)];}} el.textContent=out; if(p>=1){clearInterval(timer);el.textContent=target;resolve();}},42); });
  }
  async function finalSequence(){
    await sleep(180); await matrixReveal($("#final-system"),"SYSTEM ONLINE // ACCESS GRANTED",520);
    await sleep(130); await matrixReveal($("#final-welcome-pre"),"WELCOME TO THE",620);
    await sleep(110); await matrixReveal($("#final-welcome"),"MATRIX",980);
    await sleep(220); await matrixReveal($("#final-name"),guestName,720);
    await sleep(160); await matrixReveal($("#final-verified"),"IDENTITY VERIFIED",620);
    await sleep(120); await matrixReveal($("#final-presence"),"PRESENCE CONFIRMED",620);
    await sleep(150); await matrixReveal($("#final-event-message"),"SEE YOU IN THE SIMULATION",760);
    const details=$("#final-mission-details"); details.hidden=false; await sleep(40); details.classList.add("is-visible");
  }

  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){
      for(const el of Object.values(audio)){ if(!el.paused){pausedAudio.set(el,true); try{el.pause();}catch{}} }
    } else {
      for(const [el] of pausedAudio){ safePlay(el,{restart:false}); }
      pausedAudio.clear(); lastFrame=performance.now();
    }
  });

  $("#follow-rabbit").addEventListener("click",beginPhone);
  $("#rabbit-image-button").addEventListener("click",beginPhone);
  $("#answer-call").addEventListener("click",answerPhone);
  const missionFile=$("#mission-file-overlay");
  $("#access-mission-file")?.addEventListener("click",()=>{
    missionFile.classList.add("is-open");
    missionFile.setAttribute("aria-hidden","false");
  });
  $("#close-mission-file")?.addEventListener("click",()=>{
    missionFile.classList.remove("is-open");
    missionFile.setAttribute("aria-hidden","true");
  });
  missionFile?.addEventListener("click",(e)=>{
    if(e.target===missionFile){
      missionFile.classList.remove("is-open");
      missionFile.setAttribute("aria-hidden","true");
    }
  });
  $("#red-pill-button").addEventListener("click",redPath);
  $("#blue-pill-button").addEventListener("click",bluePath);
  $("#blue-reconnect-red").addEventListener("click",redPath);
  addEventListener("resize",resize,{passive:true});

  configureAudio(); resize(); populate(); requestAnimationFrame(frame); openingSequence();

  // v7.1.20: make the entire phone image tappable/clickable.
  $("#phone-wrap")?.addEventListener("click", wholePhoneAnswer);

})();
