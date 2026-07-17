import * as B from "@/base_script.js";


class ModalS extends B.AModal {
    readonly elInnerContent = document.getElementById("modalInnerContent") as HTMLDivElement;
    readonly mw = {
        name: document.getElementById("mwName") as HTMLUListElement,
        datePublished: document.getElementById("mwDatePublished") as HTMLParagraphElement,
        dateUpdated: document.getElementById("mwDateUpdated") as HTMLParagraphElement,
        poweredBy: document.getElementById("mwPoweredBy") as HTMLParagraphElement,
        DDescription: document.getElementById("mwDDescription") as HTMLDivElement,
        description: document.getElementById("mwDescription") as HTMLParagraphElement,
        AGo: document.getElementById("mwAGo") as HTMLAnchorElement
    }
    
    openFunction(entry: ProjectDirectoryEntry) {
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
            

        // play
        this.mw.AGo.href = entry.src;
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

// ЗАГРУЗИТЬ project_directory.json

interface ProjectDirectoryEntry {
    name: string,
    src: string,
    thumb_src?: string,
    date_published: string,
    date_updated?: string,

    details?: {
        powered_by?: string,
        description?: string
    }
}

B.loadJSON("project_directory.json")
.then((directory)=>{
    const projectDirectory = directory as Array<ProjectDirectoryEntry>;
    const templateCard = document.getElementById("templateCard") as HTMLTemplateElement;
    const projectCatalog = document.getElementById("projectCatalog") as HTMLDivElement;
    // Динамически добавить элементы из переменной "projectDirectory"
    
    projectDirectory.forEach((entry, index)=>{
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

        projectCatalog.appendChild(clone);
    });
})
.catch((e)=>{
    // не удалось загрузить файл
    console.error(e);
    const elProjectCatalogP = document.getElementById("projectCatalogP")!;
    elProjectCatalogP.textContent = "";
    elProjectCatalogP.appendChild(B.createEl("p", {class:"t-center", text: "Не удалось загрузить каталог"}));
});
