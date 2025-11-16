// 텍스트 리포지토리: name.txt / talk.txt 1회 로드 + 캐시
class TalkRepository {
  constructor() {
    this.names = null;
    this.talks = null;

    this.story_talk_max = 0;
    this.talk_index = 0;
    this.is_story_end = false; // 원래 false
  }

  async loadOnce() {
    if (this.names && this.talks) return;

    const name_txt = await fetch('../talk/name.txt').then(r => {
        if (!r.ok) throw new Error('name.txt failed');
        return r.text();
    });
    const talk_txt = await this.getTalkTxt();
    
    const clean = (_t) => _t.replace(/^\uFEFF/, '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);

    this.names = clean(name_txt);
    this.talks = clean(talk_txt);

    this.story_talk_max = this.talks.length;

    if (!this.names.length || !this.talks.length) throw new Error('empty data');
  }

  getTalkTxt(){
    let return_txt = null;

    let raw = localStorage.getItem("try_count");
    let talk_num = 1; // 기본값

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.count === "number") {
          talk_num = parsed.count;
        }
      } catch (e) {
        console.warn("try_count parse failed, fallback to 1");
        talk_num = 1;
      }
    } else {
      console.warn("try_count not found, initializing...");
      localStorage.setItem("try_count", JSON.stringify({ count: 1, updated_at: Date.now() }));
    }

    if (talk_num > 5 || this.is_story_end){
      return_txt = fetch('../talk/randomTalk.txt').then(r => {
        if (!r.ok) throw new Error('randomTalk.txt failed');
        return r.text();
      });
      return return_txt;
    }

    return_txt = fetch(`../talk/storyTalk${talk_num}.txt`).then(r => {
      if (!r.ok) throw new Error(`storyTalk${talk_num}.txt failed`);
      return r.text();
    });

    return return_txt;
  }

  getRandomName() {
    const i = Math.floor(Math.random() * this.names.length);
    return this.names[i];
  }

  getRandomTalk() {
    const i = Math.floor(Math.random() * this.talks.length);
    return this.talks[i];
  }

  async getStoryTalk() {
    if(this.is_story_end){
      return this.getRandomTalk();
    }

    let return_talk = this.talks[this.talk_index++];
    
    if (this.talk_index == this.story_talk_max){
      this.is_story_end = true;
      const talk_txt = await this.getTalkTxt();
      const clean = (_t) => _t.replace(/^\uFEFF/, '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      this.talks = clean(talk_txt);
    }

    return return_talk;
  }
}

// 게임 관리자?
class GameManager{
  constructor(_game_try_count,_story_talk_max){
    this.game_try_count = _game_try_count;
    this.message_count = 0;
    this.exit_button =  document.getElementById('exit_button');
    this.ending_button =  document.getElementById('ending_button');
    this.story_talk_max = _story_talk_max;
  }

  incressMessageCount(){
    if(this.message_count > this.story_talk_max+10){
      this.showExitButton();
      return;
    }
    this.message_count++;
  }

  showExitButton(){
    let count = JSON.parse(localStorage.getItem("try_count")).count;
    if(count > 5){
      this.ending_button.hidden = false;
      this.ending_button.addEventListener('click', () => this.goToEnding());
      return;
    }

    if(count < 4){
      this.exit_button.style.backgroundColor = `rgba(${150},${100},${100},${0.5})`
    }else{
      this.exit_button.style.backgroundColor = `rgba(${200},${50},${50},${0.75})`
    }

    this.exit_button.hidden = false;
    this.exit_button.addEventListener('click', () => this.goToHome());
  }

  goToHome(){
    history.go(-1);
  }

  goToEnding(){
    let fade_out = document.getElementById("fade_out");
    fade_out.hidden = false;
    this.fade_out = 0;
    this.fadeOut(fade_out);
  }

  fadeOut(fade_out){
    if (this.fade_out >= 1){
      window.location.href = "ending.html";
    }
    this.fade_out += 0.0001
    fade_out.style.backgroundColor = `rgba(0,0,0,${this.fade_out})`
    setTimeout(() => this.fadeOut(fade_out), 1);
  }
}

// 메시지 DOM 생성 전용: 재사용 가능한 팩토리
class MessageFactory {
  createMine(_text) {
    let td = document.createElement('td');
    let msg = this._div('msg');
    let content = this._div('content');
    let bubble = this._div('bubble');

    td.classList.add('message','me');
    td.appendChild(msg);
    msg.appendChild(content);
    content.appendChild(bubble);
    bubble.textContent = _text;
    return td;
  }

  createOther(_name, _text) {
    let td = document.createElement('td');
    let msg = this._div('msg');
    let avatar = this._div('avatar');
    let content = this._div('content');
    let name = this._div('name');
    let bubble = this._div('bubble');

    td.classList.add('message','other');
    td.appendChild(msg);
    msg.appendChild(avatar);
    msg.appendChild(content);
    content.appendChild(name);
    content.appendChild(bubble);

    avatar.textContent = (_name && _name[0]) ? _name[0] : '?';
    name.textContent = _name || '익명';
    bubble.textContent = _text || '...';
    return td;
  }

  _div(_class) {
    let div = document.createElement('div');
    div.className = _class;
    return div;
  }
}

// 메시지 보관/표시 담당: 테이블 렌더와 큐 관리
class MessageTableView {
  constructor(_table_el, _max_messages) {
    this.table_el = _table_el;
    this.max_messages = _max_messages;
    this.items = new Array(_max_messages);
    for (let i = 0; i < _max_messages; i++) {
      let td = document.createElement('td');
      td.className = 'message';
      this.items[i] = td;
    }
    this.sync();
  }

  push(_td) {
    this.items.shift();
    this.items.push(_td);
    this.sync();
  }

  sync() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < this.max_messages; i++) {
      const tr = document.createElement('tr');
      tr.appendChild(this.items[i]);
      fragment.appendChild(tr);
    }
    this.table_el.replaceChildren(fragment);
  }
}

// 전체 오케스트레이션: 이벤트, 입력 검증, 시나리오 타이밍
class ChatController {
  constructor(_els) {
    this.factory = new MessageFactory();
    this.repo = new TalkRepository();
    this.view = new MessageTableView(_els.message_table, 9);

    this._auto_enabled = false;
    this._auto_timer = null;
  }

  // 0.2~1초 랜덤 지연 생성
  _randomDelayMs() {
    return 200 + Math.floor(Math.random() * 1000);
  }

  // 자동 가해자 메시지 루프 시작
  _startAutoPerpetrator(_game_manager) {
    if (this._auto_enabled) return;
    this._auto_enabled = true;

    const tick = async () => {
      if (!this._auto_enabled) return;

      const name = this.repo.getRandomName();
      const talk = await this.repo.getStoryTalk();
      const td = this.factory.createOther(name, talk);
      _game_manager.incressMessageCount();
      this.view.push(td);

      // 다음 메시지 예약
      this._auto_timer = setTimeout(tick, this._randomDelayMs());
    };

    // 첫 메시지 예약
    this._auto_timer = setTimeout(tick, this._randomDelayMs());
  }

  stopAutoPerpetrator() {
    this._auto_enabled = false;
    if (this._auto_timer) {
      clearTimeout(this._auto_timer);
      this._auto_timer = null;
    }
  }

  resumeAutoPerpetrator(_game_manager) {
    if (this._auto_enabled) return;
    this._startAutoPerpetrator(_game_manager);
  }
}

// 초기화 예시(적용 시점에 한 번만 호출)
class InitPage{

  constructor(){
    this.init();
  }
  
  async init(){
    let exit_button =  document.getElementById('exit_button');
    exit_button.hidden = true;

    let ending_button =  document.getElementById('ending_button');
    ending_button.hidden = true;
  
    this.cc = this.bootstrapChat();
    
    await this.cc.repo.loadOnce();

    this.game_manager = this.getCachData();
    this.cc._startAutoPerpetrator(this.game_manager);
  }

  initTryCount(_key = "try_count") {
    const record = { count: 1, updated_at: Date.now() };
    localStorage.setItem(_key, JSON.stringify(record));
    return 0;
  }

  incrementTryCount(_key = "try_count") {
    const raw = localStorage.getItem(_key);
    if (raw === null) {
      return initTryCount(_key);
    }

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = null;
    }

    let next = 0;
    if (parsed && typeof parsed.count === "number") {
      next = parsed.count + 1;
    } else if (!isNaN(Number(raw))) {
      next = Number(raw) + 1;
    } else {
      next = 1;
    }

    localStorage.setItem(_key, JSON.stringify({ count: next, updated_at: Date.now() }));
    return next;
  }

  getCachData(){
    let cache_name = "try_count";

    let raw = localStorage.getItem(cache_name);
    let try_count = 0;

    if (raw === null) {
      try_count = this.initTryCount(cache_name);
    } else {
      try_count = this.incrementTryCount(cache_name);
    }

    let game_manager = new GameManager(try_count,this.cc.repo.story_talk_max);
    return game_manager;
  }

  bootstrapChat() {
    // 0 <-- 채팅방을 얼마나 나갔는지 ==> 추후에 캐시로
  
    const els = {
      message_send_div: document.getElementById('message_send_div'),
      message_input: document.getElementById('message_input'),
      message_send: document.getElementById('message_send'),
      message_table: document.getElementById('message_table')
    };
    return new ChatController(els);
  }
}

function cachDel(_key = "try_count") {
  localStorage.removeItem(_key);
} // 디버그용 Console에 cachDel(); 작성  --> try_count 0으로 만듬

function cachGet(_key = "try_count") {
  console.log(localStorage.getItem(_key));
} // 디버그용 

let ip = new InitPage();