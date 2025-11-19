class Scene{
    constructor(){
        this.click = document.getElementById("click_to_next");
        this.count = 0;

        this.click.addEventListener('click', () => this.nextScene());
        this.can_click = true;

        localStorage.removeItem("try_count");
    }

    nextScene(){
        if (!this.can_click){
            return;
        }
        this.count += 1;

        if(this.count == 5){
            let c2nt = document.getElementById("click_to_next_text");
            c2nt.innerText = "클릭해서 설문조사 진행"
        }
        if(this.count == 6){
            location.href = "https://forms.gle/9QeH4EZFfzExSTxK7"; 
        }

        this.scene = document.getElementById(`scene_${this.count}`);
        this.opacity = 0;
        this.showScene();
    }

    showScene(){
        if(this.opacity >= 1){
            this.can_click = true;
            return;
        }
        this.can_click = false;
        this.scene.style.opacity = this.opacity;
        this.opacity += 0.01
        setTimeout(() => this.showScene(), 1);
    }

}

let scene = new Scene();