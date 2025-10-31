// ???님이 그룹을 만들었습니다.
// instagram

class GameManager{
    constructor(){
        this.alarm = document.getElementById('alarm');
        this.hide_timer = null;
        this.finish_timer = null;

        this.showAlarm();
    }

    showAlarm() {
        const alarm = this.alarm;
        if (!alarm) return;

        alarm.hidden = false;

        if (this.hide_timer) clearTimeout(this.hide_timer);
        if (this.finish_timer) clearTimeout(this.finish_timer);

        alarm.style.willChange = 'transform, opacity';
        alarm.style.pointerEvents = 'none';
        alarm.style.transition = 'transform 300ms ease, opacity 300ms ease';

        // 시작: 기본 CSS의 top:15% 기준에서 화면 위쪽으로 올려둠
        alarm.style.transform = 'translateY(-140%)';
        alarm.style.opacity = '0';

        void alarm.offsetHeight; // reflow로 트랜지션 보장

        // 내려오기
        alarm.style.transform = 'translateY(0)';
        alarm.style.opacity = '1';

        // 3초 뒤 다시 올라가며 숨김
        this.hide_timer = setTimeout(() => {
            alarm.style.transform = 'translateY(-140%)';
            alarm.style.opacity = '0';

            this.finish_timer = setTimeout(() => {
                alarm.hidden = true;
                alarm.style.transition = '';
                alarm.style.willChange = '';
            }, 320); // transition보다 살짝 길게
        }, 3000);
    }
}

class InitPage{
    constructor(){
        const els = {
            lock: document.getElementById("lock"),
            alarm: document.getElementById("alarm")
        };

        this.documentSet(els);

        new GameManager();

    }
    documentSet(_els){
        _els.lock.addEventListener('click', () => {
            window.location.href = "./resource/page/main.html";
        });
        _els.alarm.hidden = true;
    }
}

new InitPage();