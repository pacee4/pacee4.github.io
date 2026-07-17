import * as B from "@/base_script.js";


class ModalS extends B.AModal {
    readonly elInnerContent = document.getElementById("modalInnerContent") as HTMLDivElement;
    readonly mw = {
        name: document.getElementById("mwName") as HTMLUListElement,
        categories: document.getElementById("mwCategories") as HTMLUListElement,
        datePublished: document.getElementById("mwDatePublished") as HTMLParagraphElement,
        dateUpdated: document.getElementById("mwDateUpdated") as HTMLParagraphElement,
        poweredBy: document.getElementById("mwPoweredBy") as HTMLParagraphElement,
        DDescription: document.getElementById("mwDDescription") as HTMLDivElement,
        description: document.getElementById("mwDescription") as HTMLParagraphElement,
        DHowToPlay: document.getElementById("mwDHowToPlay") as HTMLDivElement,
        howToPlay: document.getElementById("mwHowToPlay") as HTMLParagraphElement,
        DCredits: document.getElementById("mwDCredits") as HTMLDivElement,
        credits: document.getElementById("mwCredits") as HTMLParagraphElement,
        APlay: document.getElementById("mwAPlay") as HTMLAnchorElement
    }
    
    openFunction(entry: GameDirectoryEntry) {
        this.resetScrolling();

        // name
        this.mw.name.textContent = entry.name;
    
        // datePublished
        this.writeDate(this.mw.datePublished, entry.date_published, "Опубликовано");

        // dateUpdated
        {
            const dateUpdated = entry.date_updated;
            if (dateUpdated) {
                B.showEl(this.mw.dateUpdated);
                this.writeDate(this.mw.dateUpdated, dateUpdated, "Обновлено");
            }
            else {
                B.hideEl(this.mw.dateUpdated);
            }
        }

        // categories 
        {
            const mwCategories = this.mw.categories;
            // remove all but 2 children
            while (mwCategories.children.length > 2) {
                mwCategories.removeChild(mwCategories.lastElementChild!);
            }


            const {
                support = "all",
                length = "minigame",
                other = []
            } = entry.details?.categories ?? {};

            // support
            const elSupport = (mwCategories.children[0]) as HTMLLIElement;
            
            switch (support) {
                case "mobile":
                    elSupport.textContent = "только для моб. устройств";
                    elSupport.classList.add("t-orange");
                    elSupport.dataset.support = "mobile";
                    break;
                case "pc":
                    elSupport.textContent = "только для ПК";
                    elSupport.classList.add("t-orange");
                    elSupport.dataset.support = "pc";
                    break;
                default:
                    elSupport.textContent = "для всех устройств";
                    elSupport.classList.remove("t-orange");
                    elSupport.dataset.support = "";
                    break;
            }

            // length
            ((mwCategories.children[1]) as HTMLLIElement).textContent = (
                (length==="plot") ? "сюжетная игра" : "мини-игра"
            );

            // other
            if (Array.isArray(other)) { // type-guard to avoid error
                other.forEach((value)=>{
                    mwCategories.appendChild(B.createEl("li", {text: value}));
                });
            }
        }
            

        // powered_by
        {
            const poweredBy = entry.details?.powered_by ?? "none";
            if (poweredBy!=="none") {
                B.showEl(this.mw.poweredBy)
                this.mw.poweredBy.textContent = (
                    (poweredBy==="turbowarp") ? "Создано на Scratch с использованием сторонних утилит TurboWarp и TurboWarp Packager."
                    : (poweredBy==="pixijs") ? "Работает на браузерном игровом движке PixiJS."
                    : poweredBy
                )
            }
            else {
                B.hideEl(this.mw.poweredBy)
            }
        }

        // description
        {
            const description = entry.details?.description;
            if (description) {
                B.showEl(this.mw.DDescription);
                B.formatText(description, this.mw.description);
            }
            else {
                B.hideEl(this.mw.DDescription);
            }
        }
        // how_to_play
        {
            const howToPlay = entry.details?.how_to_play;
            if (howToPlay) {
                B.showEl(this.mw.DHowToPlay);
                B.formatText(howToPlay, this.mw.howToPlay);
            }
            else {
                B.hideEl(this.mw.DHowToPlay);
            }
        }
        // credits
        {
            const credits = entry.details?.credits;
            if (credits) {
                B.showEl(this.mw.DCredits);
                B.formatText(credits, this.mw.credits);
            }
            else {
                B.hideEl(this.mw.DCredits);
            }
        }
            

        // play
        this.mw.APlay.href = entry.src;
    }

    private updateScrollGradients = ()=>{
        if (this.elInnerContent.scrollTop <= 0) {
            this.elInnerContent.classList.add("js-atTop");
        } else {
            this.elInnerContent.classList.remove("js-atTop");
        }
    }
    private resetScrolling() {
        // обнулить позицию прокрутки в содержимом модального окна
        this.elInnerContent.scrollTop = 0;
        this.elInnerContent.classList.add("js-atTop");

        this.updateScrollGradients();
    }

    private writeDate(el: HTMLElement, entryDate: string, text: string) {
        el.textContent = "";
        
        const elTime = B.createTimeEl(B.formatToRuDate(entryDate), B.formatToISODate(entryDate));
        const elSpan = B.createEl("span", {
            class: "date-period",
            text: `(${B.getApproximatePeriodUntilToday(entryDate)})`
        });

        el.append(`${text} `, elTime, " ", elSpan);
    }


    constructor() {
        super({modal: "modal", window: "modalWindow"});
        // Добавить обработчики событий

        // кнопка "Закрыть"
        document.getElementById("mwAClose")!.addEventListener("click", ()=>{
            this.close();
        });

        // обновление прокрутки
        this.elInnerContent.addEventListener("scroll", this.updateScrollGradients);
    }
}
const modal = new ModalS();

// ЗАГРУЗИТЬ game_directory.json

interface GameDirectoryEntry {
    name: string,
    src: string,
    thumb_src?: string,
    date_published: string,
    date_updated?: string,

    details?: {
        categories?: {
            support?: "all"|"mobile"|"pc",
            length?: "minigame"|"plot",
            other?: string[]
        },
        powered_by?: string,
        description?: string,
        how_to_play?: string,
        credits?: string
    }
}

B.loadJSON("game_directory.json")
.then((directory)=>{
    const gameDirectory = directory as Array<GameDirectoryEntry>;
    const templateCard = document.getElementById("templateCard") as HTMLTemplateElement;
    const gameCatalog = document.getElementById("gameCatalog") as HTMLDivElement;
    // Динамически добавить элементы из переменной "gameDirectory"
    
    gameDirectory.forEach((entry, index)=>{
        const clone = (templateCard.content.cloneNode(true)) as DocumentFragment;

        // Картинка
        for (const el of [(clone.querySelector(".image-fill") as HTMLDivElement), (clone.querySelector(".image-contain") as HTMLDivElement)]) {
            el.style.backgroundImage = `url(${entry.thumb_src ?? "/assets/photo_placeholder.svg"})`;
        }

        // Содержимое
        clone.querySelector(".header")!.textContent = entry.name;
        {
            const elDatePublished = clone.querySelector(".datePublished") as HTMLTimeElement;
            elDatePublished.textContent = B.formatToRuDate(entry.date_published);
            elDatePublished.dateTime = B.formatToISODate(entry.date_published);
        }


        clone.querySelectorAll("a").forEach(el => { el.href = entry.src; });

        (clone.querySelector(".buttonInfo") as HTMLButtonElement)
            .addEventListener("click", ()=>{
                modal.open(directory[index]);
            });

        // Иконки
        {
            const support = entry.details?.categories?.support ?? "all";
            if (support==="mobile"||support==="pc") {
                const elCardRight = (clone.querySelector(".card-right") as HTMLDivElement);
                const elIcon = document.createElement("img");
                const text = (support==="mobile") ? "Только для моб.устройств" : "Только для ПК";

                elIcon.src = (support==="mobile") ? "/assets/icons/c-mobile.svg" : "/assets/icons/c-pc.svg";
                elIcon.alt = text;
                elIcon.title = text;

                elCardRight.insertBefore(elIcon, elCardRight.firstChild);
            }
        }

        gameCatalog.appendChild(clone);
    });
})
.catch((e)=>{
    // не удалось загрузить файл
    console.error(e);
    const elGameCatalogP = document.getElementById("gameCatalogP")!;
    elGameCatalogP.textContent = "";
    elGameCatalogP.appendChild(B.createEl("p", {class:"t-center", text: "Не удалось загрузить каталог"}));
});
