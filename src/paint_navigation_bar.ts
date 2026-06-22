const elHeaderWrapper = document.getElementById("headerWrapper")!;
const elHeader = document.getElementById("header")!;

// Тянучка
{
    // Функция для динамического перерасчета высоты меню
    let spaceHeight = 0;
    const updateHeaderHeight = ()=>{
        const currentHeight = elHeader.offsetHeight + 3; // включая полосу снизу
        elHeaderWrapper.style.setProperty('--space-height', `${currentHeight}px`);
        spaceHeight = currentHeight;
    };
    
    updateHeaderHeight();
    window.addEventListener("resize", ()=>{
        updateHeaderHeight();
    })
    window.addEventListener("scroll", ()=>{
        const scrollY = window.scrollY;
        if (scrollY >= spaceHeight) {
            elHeaderWrapper.classList.remove("js-open");

            elHeaderWrapper.classList.add("js-pullerShow");
        }
        else {
            elHeaderWrapper.classList.remove("js-pullerShow");
            elHeaderWrapper.classList.remove("js-transition");
        }
    });

    window.addEventListener("click", (event)=>{
        const target = (event.target as HTMLElement);
        if (target.closest("#puller")) {
            elHeaderWrapper.classList.add("js-transition");
            elHeaderWrapper.classList.toggle("js-open");
        }
        else if (!target.closest("#headerPullContainer")) {
            elHeaderWrapper.classList.remove("js-open");
        }
    });
}

// Раскраска навигационных кнопок
{
    const elNavBars = document.querySelectorAll("nav > a");

    const activeIndex = Array.from(elNavBars).findIndex(item => item.classList.contains('active'));

    elNavBars.forEach((el, index) => {
        const distance = Math.abs(index - activeIndex);
        
        (el as HTMLElement).style.setProperty('--distance', String(distance));
    });
}

// Включать переход только после загрузки документа
window.addEventListener("load", ()=>{
    document.body.classList.remove("js-preload");
}, {once: true})

