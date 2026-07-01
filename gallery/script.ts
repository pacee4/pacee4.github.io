import * as B from "@/base_script.js";

const el = {
    formSearch: document.getElementById("formSearch") as HTMLFormElement,
    inpSearch: document.getElementById("inpSearch") as HTMLInputElement,
    inpSubmit: document.getElementById("inpSubmit") as HTMLButtonElement,

    headingDetails: document.getElementById("headingDetails") as HTMLDetailsElement,
    galleryCatalog: document.getElementById("galleryCatalog") as HTMLDivElement,
};
const templates = {
    section: document.getElementById("templateSection") as HTMLTemplateElement,
    folder: document.getElementById("templateFolder") as HTMLTemplateElement,
    card: document.getElementById("templateCard") as HTMLTemplateElement,
    cardAllPictures: document.getElementById("templateCardAllPictures") as HTMLTemplateElement,
}
var c: CatalogS|null = null;


function stringToHash(string: string) {
    // Сгенерировано ИИ //
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

function capitalize(str: string) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function clamp(value: number, min: number, max: number) {
    if(min > max){
        let temp = min;
        min = max;
        max = temp;
    }
    return (value < min) ? min : ((value > max) ? max : value);
}

function snap(value: number, threshold: number, snapValue: number = 0): number {
    return Math.abs(value - snapValue) < threshold ? snapValue : value;
}

function easeQuadOut(start: number, end: number, t: number): number {
    // Ограничиваем прогресс t в диапазоне от 0 до 1
    const change = end - start;
    return -change * t * (t - 2) + start;
}

function pushUrlQuery(parameters: {name: string, value: string}[]) {
    const url = new URL(window.location.href);
    for (const parameter of parameters) {
        if (parameter.value !== "") {
            url.searchParams.set(parameter.name, parameter.value);
        }
        else {
            url.searchParams.delete(parameter.name);
        }
    }
    window.history.pushState({}, "", url);
}

function getUrlQuery(name: string) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}


// КЛАССЫ
class SearchBar {
    static currentQuery = "";
    static waitingForSearch = false;
    static canSubmit = true;

    
    static submitQuery(targetQuery="") {
        if (this.canSubmit) {
            const query = (
                (targetQuery)
                ? targetQuery
                : ((this.submitButtonTypeP===1) ? "" : el.inpSearch.value)
            );
            
            if (this.currentQuery !== query.trim()) {
                this.currentQuery = query.trim();
                el.inpSearch.value = query;

                pushUrlQuery([
                    {name: "folder", value: ""},
                    {name: "search", value: this.currentQuery}
                ]);

                this.updateBar();
                if (c) {
                    c.search(this.currentQuery);
                }
            }
        }
    }
    static recoverSearchBar(fromQuery?: string) {
        const query = (fromQuery!==undefined) ? (fromQuery) : (getUrlQuery("search") || "");
        
        this.currentQuery = query;
        el.inpSearch.value = query;

        this.updateBar(true);
    }

    static updateBar(noDelay=false) {
        this.updateButton((this.currentQuery!=="") ? 1 : 0);

        if (!noDelay) {
            // Ставим задержку
            this.canSubmit = false;
            setTimeout(()=>{
                this.canSubmit = true;
            }, 500);
        }
    }


    private static submitButtonTypeP = 0;
    static updateButton(toButtonType: number) {
        if (this.submitButtonTypeP !== toButtonType) {
            this.submitButtonTypeP = toButtonType;
            
            const children = el.inpSubmit.children;
            for (let i = 0; i < children.length; i++) {
                if (i === this.submitButtonTypeP) {
                    children[i].classList.add("show");
                }
                else {
                    children[i].classList.remove("show");
                }
            }
        }
    }

    static {
        el.inpSearch.addEventListener("input", ()=>{
            this.updateButton(
                (el.inpSearch.value==="") ? 1 : 0
            );
        });
        // Изменение плейсхолдера
        el.inpSearch.addEventListener("focus", ()=>{
            el.inpSearch.placeholder = "Введите запрос или год...";
        });
        el.inpSearch.addEventListener("blur", ()=>{
            el.inpSearch.placeholder = "Поиск...";
        });
    }
}



interface TagProperty {
    tag: string,
    bgColor: string,
    borderColor: string
}
interface GroupedByYear {
    year: number,
    fromPositionIndex: number
}

class CatalogS {
    readonly tags: TagProperty[];
    readonly galleryDirectory: FlatGalleryDirectory;

    loadedCount = 0;
    currentTabState: "main"|"results"|"reload" = "reload";
    private switchTabState(state: typeof this.currentTabState) {
        if (this.loadedCount===0) {
            if (state!=="main") {
                this.loadedCount++;
            }
            else {
                el.headingDetails.open = true;
            }
        }
        if (this.loadedCount===1) {
            el.headingDetails.open = false;
        }
        if (this.loadedCount<2) {
            this.loadedCount++;
        }
        
        el.galleryCatalog.replaceChildren();
        this.currentTabState = state;
        // прокручиваем страницу наверх
        window.scrollTo({top: 0, behavior: "smooth"});
    }
    foundPictures: PictureEntryWithID[] = [];


    private obtainTags(galleryDirectory: FlatGalleryDirectory) {
        // СГЕНЕРИРОВАНО ИИ //
        // Подсчёт количества тегов
        const tagCounts: Record<string, number> = galleryDirectory.content
            .flatMap(contentItem => contentItem.tags ?? [])
            .reduce((acc: Record<string, number>, tag: string) => {
                acc[tag] = (acc[tag] || 0) + 1;
                return acc;
            }, {});
        
        // Запись тегов в массив и сортировка по количеству
        const tagProperties = Object.entries(tagCounts)
            .sort(([tagA, countA], [tagB, countB]) => {
                // Сначала сортируем по количеству (от большего к меньшему)
                if (countB !== countA) {
                    return countB - countA;
                }
                // Если количество одинаковое, сортируем по алфавиту (localeCompare учитывает кириллицу)
                return tagA.localeCompare(tagB);
            })
            .map(([tag]) => (tag))
            
            .map((tag)=>(CatalogBuilder.paintTag(tag)));
        
        return tagProperties;
    }


    constructor(directory: GalleryDirectory) {
        // Переструктурирование данных
        const tempContentList: (PictureEntry & {folder_index: number})[] = [];
        const foldersList: FolderEntry[] = [];

        // Присваиваем каждому вложению свой ID

        directory.forEach((folderItem, folderIndex) => {

            foldersList.push({
                name: folderItem.folder,
                description: folderItem.description,
                id: folderIndex,
                yearRange: ((!folderItem.no_period)
                    ? CatalogBuilder.getYearRange(folderItem.content)
                    : undefined),
                length: folderItem.content.length
            });

            folderItem.content.forEach((item) => {
                tempContentList.push({
                    ...item,
                    folder_index: folderIndex
                });
            });
        });

        // Сортируем по дате
        tempContentList.sort((a, b)=>(
            B.getIntegerTime(b.date_end) - B.getIntegerTime(a.date_end)
        ));
        
        const contentLength = tempContentList.length;

        this.galleryDirectory = {
            folders: foldersList,
            content: tempContentList.map((item, index)=>({
                ...item,
                id: contentLength-index
            }))
        };

        this.tags = this.obtainTags(this.galleryDirectory);
    }

    showCatalog() {
        if (this.currentTabState !== "main") {
            this.switchTabState("main");
            this.showCatalogP();
        }
    }

    showFolderContent(folderIndex: number) {
        this.switchTabState("results");

        if (folderIndex > 0) {
            this.showFolderContentP(folderIndex-1);
        }
        else {
            this.showAllPicturesP();
        }
    }

    search(query: string) {
        if (query!=="") {
            this.switchTabState("results");

            this.searchP(query);
        }
        else {
            this.showCatalog();
        }
    }


    private recordFoundPictures(items: PictureEntryWithID[]) {
        this.foundPictures.splice(0);
        this.foundPictures.push( ...items );
    }

    private showCatalogP() {
        // меняем заголовок на вкладке
        document.title = `Галерея - Сайт pacee4`;

        const f = document.createDocumentFragment();

        f.append(
            // Недавние
            CatalogBuilder.buildSection(({heading, content})=>{
                heading.textContent = "Недавние";

                const f = CatalogBuilder.buildImageSection(this.galleryDirectory.content.slice(0, 5), true);
                {
                    const clone = templates.cardAllPictures.content.cloneNode(true) as DocumentFragment;
                    (clone.querySelector(".count") as HTMLElement).textContent = `(${this.galleryDirectory.content.length})`
                    f.querySelector(".grid")!.appendChild(clone);
                }

                content.appendChild(f);
                content.addEventListener("click", CatalogBuilder.imageCardClickEvent);
            }),

            // Папки
            CatalogBuilder.buildSection(({heading, content})=>{
                heading.textContent = "Папки";

                content.appendChild( CatalogBuilder.buildFolderList(this.galleryDirectory.folders, this) );
            }),

            // Теги
            CatalogBuilder.buildSection(({heading, content})=>{
                heading.textContent = "Теги";

                const elTags = CatalogBuilder.buildTagList(this.tags, "t-center", true);
                // Делегирование события нажатия
                elTags.addEventListener("click", (event)=>{
                    const elTag = (event.target as HTMLElement).closest(".tag.clickable") as HTMLElement;
                    if (!elTag) return;

                    SearchBar.submitQuery(elTag.textContent);
                });

                content.appendChild(elTags);
            })
        )

        el.galleryCatalog.appendChild(f);

        this.recordFoundPictures(this.galleryDirectory.content);
    }

    private showFolderContentP(folderIndex: number) {
        const folder = this.galleryDirectory.folders[folderIndex];

        const pictures = this.galleryDirectory.content
            .filter((item)=>(item.folder_index === folderIndex));
        const length = pictures.length;

        // Меняем заголовок на вкладке
        document.title = `${folder.name} - Галерея - Сайт pacee4`;


        el.galleryCatalog.append(
            CatalogBuilder.buildSection(({heading, content})=>{
                // Заголовок
                heading.textContent = folder.name;

                // период
                heading.appendChild(CatalogBuilder.writePeriod(folder));
                
                // Количество картинок
                heading.after( CatalogBuilder.createPicturesLengthInfo(length) );

                // Описание
                const description = folder.description;
                if (description) {
                    const elDescription = document.createElement("p");
                    elDescription.classList.add("pre-line");
                    B.formatText(description, elDescription);
                    heading.after(elDescription);
                }

                // Контент
                content.appendChild(CatalogBuilder.buildImageSection(pictures));
                content.addEventListener("click", CatalogBuilder.imageCardClickEvent);
            })
        );

        this.recordFoundPictures(pictures);
    }

    private showAllPicturesP() {
        const pictures = this.galleryDirectory.content;
        const length = pictures.length;

        this.recordFoundPictures(pictures);

        // Меняем заголовок на вкладке
        document.title = `Все картинки - Галерея - Сайт pacee4`;

        el.galleryCatalog.append(
            CatalogBuilder.buildSection(({heading, content})=>{
                // Заголовок
                heading.textContent = "Все картинки";
                
                // Количество картинок
                heading.after( CatalogBuilder.createPicturesLengthInfo(length) );

                // Контент
                content.appendChild(CatalogBuilder.buildImageSection(pictures));
                content.addEventListener("click", CatalogBuilder.imageCardClickEvent);
            })
        );

        this.recordFoundPictures(pictures);
    }

    private searchP(query: string) {
        // поиск
        const results = SearchEngine.search(this.galleryDirectory, this.tags.map(tag => tag.tag), query);
        const pictures = results.content;
        const picturesWithoutTags = pictures.slice(0, results.searchFromPictureId);
        const picturesWithTags = pictures.slice(results.searchFromPictureId);

        const matchedFolders = results.folders;
        const matchedTags = results.matchedTags;

        this.recordFoundPictures(pictures);


        // меняем заголовок на вкладке
        document.title = `${capitalize(query)} - Галерея - Сайт pacee4`;

        const f = document.createDocumentFragment();  
        // поиск без тегов
        if (picturesWithoutTags.length > 0 || matchedFolders.length > 0) {
            f.appendChild(
                // Результаты поиска (Образец)
                CatalogBuilder.buildSection(({heading, content})=>{
                    heading.classList.add("italic");
                    heading.textContent = `«${query}»`;

                    // Количество картинок
                    if (picturesWithoutTags.length > 0)
                        heading.after( CatalogBuilder.createPicturesLengthInfo(picturesWithoutTags.length) );

                    // Папки
                    if (matchedFolders.length>0) {
                        heading.after( CatalogBuilder.buildFolderList(
                            this.galleryDirectory.folders
                                .filter((folder)=>(matchedFolders.includes(folder))),
                            this
                        ));
                    }

                    // Контент
                    content.appendChild(CatalogBuilder.buildImageSection(picturesWithoutTags));
                    content.addEventListener("click", CatalogBuilder.imageCardClickEvent);
                
                })
                // Поиск по тегам (Образец)
            );
        }

        // поиск по тегам
        if (picturesWithTags.length > 0) {
            f.appendChild(
                CatalogBuilder.buildSection(({heading, content})=>{
                    // Заголовок
                    heading.classList.add("flex", "center");
                    const elTags = CatalogBuilder.buildTagList(this.tags.filter((tag)=> matchedTags.includes(tag.tag)), "t-big-1 regular")
                    heading.append(
                        B.createEl("div", {
                            class:"tagsHeading pre", 
                            text: ((matchedTags.length > 1) ? "Теги: " : "Тег: ")
                        }),
                        elTags
                    )
                    
                    // Количество картинок
                    heading.after( CatalogBuilder.createPicturesLengthInfo(picturesWithTags.length) );

                    // Контент
                    content.appendChild(CatalogBuilder.buildImageSection(picturesWithTags, false, picturesWithoutTags.length));
                    content.addEventListener("click", CatalogBuilder.imageCardClickEvent);
                })
            );
        }

        // если ничего не найдено
        if (!f.firstChild) {
            f.appendChild(B.createEl("p", {text:"Ничего не найдено", class:"t-center"}));
        }

        el.galleryCatalog.appendChild(f);
        
        this.recordFoundPictures(pictures);
    }


    recoverState() {
        // Чтение поисковой строки
        if (SearchBar.currentQuery !== "") {
            this.search(SearchBar.currentQuery);
        }
        else {
            // Чтение параметров URL: "folder"
            const folderIndexStr = getUrlQuery("folder");
            const folderIndex = folderIndexStr ? Number(folderIndexStr) : -1;

            if (folderIndex!==-1) {
                this.showFolderContent(folderIndex);
            }
            else {
                this.showCatalog();
            }
        }
    }
}

class CatalogBuilder {

    // ПРИМЕЧАНИЕ: кастомный атрибут id на карточке картинки может не понадобиться
    static imageCardClickEvent = (event: PointerEvent)=>{
        const elTarget = (event.target as HTMLElement).closest(".clickable") as HTMLElement;
        if (!elTarget) return;

        if (elTarget.classList.contains("all-pictures")) {
            // Открываем раздел "все картинки"
            pushUrlQuery([
                {name: "folder", value: "0"},
                {name: "search", value: ""}
            ]);
            c!.showFolderContent(0);
        }
        else {
            // Открываем картинку
            const elCard = elTarget.closest(".card-image") as HTMLElement;
            if (!elCard) return;
            
            slideshow.open(Number(elCard.dataset.pos));
        }
    }

    static buildSection(changeElements: (els: {
        heading: HTMLHeadingElement,
        content: HTMLUListElement
    })=>void) {
        const clone = templates.section.content.cloneNode(true) as DocumentFragment;

        const heading = clone.querySelector(".heading") as HTMLHeadingElement;
        const content = clone.querySelector(".content") as HTMLUListElement;

        changeElements({heading: heading, content: content});

        return clone;
    }

    static buildFolderList(folders: FolderEntry[], c: CatalogS) {
        const ul = B.createEl("ul", {class:"no-bullets flex column", style:{"text-align": "initial"}}) as HTMLUListElement;

        // Создание папок в фрагменте
        folders.forEach((folder)=>{
            const clone = (templates.folder.content.cloneNode(true)) as DocumentFragment;
            
            (clone.querySelector(".folder") as HTMLLIElement).dataset.index = String(folder.id+1);


            const elName = clone.querySelector(".name") as HTMLHeadingElement;
            elName.textContent = folder.name;
            
            // период
            elName.appendChild(CatalogBuilder.writePeriod(folder));
            

            const elCount = clone.querySelector(".count") as HTMLParagraphElement;
            elCount.textContent = `${folder.length} ${B.sklonenieNoun(folder.length, "картинка", "картинки", "картинок")}`;

            ul.appendChild(clone);
        });

        // Делегирование события нажатия
        ul.addEventListener("click", (event)=>{
            const elFolder = (event.target as HTMLElement).closest(".folder") as HTMLElement;
            if (!elFolder) return;

            const indexStr = elFolder.dataset.index!;

            pushUrlQuery([
                {name: "folder", value: indexStr},
                {name: "search", value: ""}
            ]);
            SearchBar.recoverSearchBar("");

            c.showFolderContent(Number(indexStr));
        });

        return ul;
    }

    static buildImageSection(items: PictureEntryWithID[], asSingleGrid=false, startPos=0) {
        const f = document.createDocumentFragment();
        if (!asSingleGrid) {
            // А также группировка по годам
            let yearH = 0;
            let currentSection: HTMLElement|null = null;
            let currentGridElement: HTMLDivElement|null = null;

            items.forEach((item, pos)=>{
                const year = B.getDaysFromDate(item.date_end).year;
                if (yearH !== year) {
                    if (currentGridElement && currentSection) {
                        f.appendChild(currentSection);
                    }
                    currentSection = document.createElement("section");
                    currentSection.classList.add("group-by-year-instance");
                    currentSection.appendChild(B.createEl("h3", {"text": `${year} г.`}));

                    currentGridElement = document.createElement("div");
                    currentGridElement.classList.add("grid");
                    currentSection.appendChild(currentGridElement);

                    yearH = year;
                }

                currentGridElement!.appendChild(
                    CatalogBuilder.buildImageCard(item, pos+startPos)
                );
            });
            if (currentSection) {
                f.appendChild(currentSection);
            }
        }
        else {
            const div = document.createElement("div");
            div.classList.add("grid");
            items.forEach((item, pos)=>{
                div.appendChild(CatalogBuilder.buildImageCard(item, pos+startPos));
            });
            f.appendChild(div);
        }

        return f;
    }

    static buildImageCard(item: PictureEntryWithID, pos: number) {
        const clone = templates.card.content.cloneNode(true) as DocumentFragment;

        {
            const card = (clone.querySelector(".card") as HTMLElement);
            card.dataset.id = String(item.id);
            card.dataset.pos = String(pos);
        }

        (clone.querySelector(".name") as HTMLElement).textContent = item.name;

        {
            const image = clone.querySelector(".image") as HTMLImageElement;

            image.loading = "lazy";
            image.src = item.thumb_src ?? item.src.replace("directory", "thumbnails");
            image.alt = item.name;
        }

        return clone;
    }

    static buildTagList(tagProperties: TagProperty[], classes="", clickable=false) {
        const ul = B.createEl("ul", {class:"tags "+classes}) as HTMLUListElement;
        tagProperties.forEach((tagProperty, i)=>{
            ul.append(B.createEl("li", {
                text: tagProperty.tag,
                class: `tag ${clickable?"clickable":""}`,
                style: {
                    "background-color": tagProperty.bgColor,
                    "border-color": tagProperty.borderColor
                }
            }));
            if (i < tagProperties.length-1) {
                ul.append(" ");
            }
        });

        return ul;
    }

    // ПРИМЕЧАНИЕ: может не понадобиться
    static groupByYear(items: PictureEntryWithID[]) {
        // Группировка по годам
        const groupedByYear: GroupedByYear[] = [];

        let yearHolder = 0;
        items.forEach((item, positionIndex) => {
            const year = B.getDaysFromDate(item.date_end).year;
            if (yearHolder !== year) {
                groupedByYear.push({year: year, fromPositionIndex: positionIndex});
                yearHolder = year;
            }
        });
    }



    static getYearRange(pictureEntries: PictureEntry[]): {begin: number, end: number} {
        const years = pictureEntries
            .map((contentItem) => contentItem.date_end)
            .filter((dateStr) => dateStr.includes('.'))
            .map((dateStr: string) => {
                // Разбиваем строку "05.10.2020" по точкам и берем последний элемент (год)
                const parts = dateStr.split('.');
                return parseInt(parts[parts.length - 1], 10);
            })
            .filter((year: number) => !isNaN(year)); // Убираем некорректно спарсенные числа

        return {
            begin: (years.length>0) ? Math.min(...years) : 0,
            end: (years.length>0) ? Math.max(...years) : 0
        }
    }

    static paintTag(tag: string) {
        const text = tag.trim();
        const hash = stringToHash(text);

        const hue = hash % 360;
        const saturation = 70 + (Math.floor(hash/360) % 15);
        
        // Сгенерировано ИИ //
        let lightness: number
        const high = 65;
        const low = 48;
        // Реализация графика изменения яркости
        if (hue >= 0 && hue < 60) {
            // Плавный спад от 65% до 48% в красно-желтой зоне
            lightness = high - (hue / 60) * (high - low);
        } else if (hue >= 60 && hue < 180) {
            // Стабильное плато 48% в желто-зеленой и бирюзовой зоне
            lightness = low;
        } else if (hue >= 180 && hue < 240) {
            // Плавный подъем от 48% до 65% в синей зоне
            lightness = low + ((hue - 180) / 60) * (high - low);
        } else {
            // Стабильные 65% для пурпурного, фиолетового и розового (240° - 360°)
            lightness = high;
        }
        
        return {
            tag: text,
            bgColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
            borderColor: `hsl(${hue}, ${saturation}%, ${ Math.round(lightness / 3) }%)`
        };
    }

    static createPicturesLengthInfo(length: number) {
        return B.createEl("p", {
            text: `${length} ${B.sklonenieNoun(length, "картинка", "картинки", "картинок")}`
        });
    }

    static writePeriod(folder: FolderEntry) {
        const f = document.createDocumentFragment();

        if (folder.yearRange && folder.yearRange.begin !== 0) {
            f.append(" ");

            const years = folder.yearRange;
            
            f.appendChild(B.createEl("span", {
                class: "t-green regular",

                children: (
                    (years.begin !== years.end)
                    ? [
                        "(",
                        B.createTimeEl(String(years.begin), String(years.begin)),
                        "-",
                        B.createTimeEl(String(years.end), String(years.end)),
                        ")"
                    ]
                    : [
                        "(",
                        B.createTimeEl(String(years.begin), String(years.begin)),
                        ")"
                    ]
                )
            }));
        }

        return f;
    }
}

class SearchEngine {
    static search(galleryDirectory: FlatGalleryDirectory, tags: string[], query: string): {
        content: PictureEntryWithID[],
        folders: FolderEntry[],
        matchedTags: string[],
        searchFromPictureId: number
    } {
        const normQuery = this.normalizeText(query);
        const items = galleryDirectory.content;
        const folders = galleryDirectory.folders;

        if (!normQuery) return { content: [], folders: [], matchedTags: [], searchFromPictureId: 0 };

        // Разделяем запрос на отдельные слова
        const {queryYears, queryWords, queryTags} = this.parseTokens(normQuery.split(' '), tags);

        // Ищем картинки
        const content: PictureEntryWithID[] = [];
        const contentWithTags: PictureEntryWithID[] = [];
        items.forEach(item => {
            const fullName = this.normalizeText(item.name);
            const year = B.getDaysFromDate(item.date_end).year;
            const itemTags = item.tags ?? [];

            if (
                (queryTags.length > 0 && queryTags.every(tag => itemTags.includes(tag)))
                && this.matchesTitleQuery(fullName, queryWords)
            ) {
                contentWithTags.push(item);
            }
            else if (
                this.matchesTitleQuery(fullName, [...queryWords, ...queryTags]) 
                && ((queryYears.length>0) ? queryYears.includes(String(year)) : true)
            ) {
                content.push(item);
            }
        });
        
        return { 
            content: [...content, ...contentWithTags],
            // Ищем папки
            folders: folders.filter(folder => {
                const fullName = this.normalizeText(folder.name);
                return this.matchesTitleQuery(fullName, [...queryWords, ...queryTags]);
            }),
            matchedTags: queryTags,
            searchFromPictureId: content.length
        };
    }

    private static parseTokens(tokens: string[], tags: string[]) {
        const queryYears: string[] = [];
        const queryTags: string[] = [];
        const queryWords: string[] = [];

        const yearRegex = /^\d{4}$/;

        tokens.forEach((token)=>{
            // если это год
            if (yearRegex.test(token)) {
                queryYears.push(token);
                return;
            }

            const matchedTag = tags.find(tag => tag === token) || tags.find(tag => this.matchesTypos([tag], token, 3));

            // если это тег
            if (matchedTag) {
                queryTags.push(matchedTag);
            }
            // иначе это год
            else {
                queryWords.push(token);
            }
            
        });

        return {queryYears, queryWords, queryTags};
    }


    private static matchesTitleQuery(fullName: string, queryWords: string[]) {
        const itemWords = fullName.split(/\s+/);
        
        if (queryWords.length === 1 && queryWords[0].length === 1)
            return this.matchesFirstLetters(
                [fullName.replace(/[^a-zA-Zа-яА-Я\s]/g, '').trim()],
                queryWords[0]
            );
        else {
            return queryWords.every(queryWord => {

                // Если слово состоит из 1 буквы — ищем строго по 1-й категории (начало любого слова или строки)
                if (queryWord.length === 1) {
                    return this.matchesFirstLetters(itemWords, queryWord);
                }
                else {
                // Для длинных слов проверяем все 4 категории
                    return (
                        this.matchesFirstLetters(itemWords, queryWord) ||
                        this.matchesSubstring(fullName, queryWord) ||
                        this.matchesTypos(itemWords, queryWord)
                    );
                }


            });
        }
    }


    private static getLevenshteinDistance(a: string, b: string): number {
        const matrix = Array.from({ length: a.length + 1 }, (_, i) => 
            Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
        );

        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                if (a[i - 1] === b[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,    // удаление
                    matrix[i][j - 1] + 1,    // вставка
                    matrix[i - 1][j - 1] + 1 // замена
                    );
                }
            }
        }
        return matrix[a.length][b.length];
    }

    private static normalizeText(text: string) {
        return text
            .toLowerCase()
            .replace(/ё/g, 'е')
            .replace(/[^\w\sа-яА-Я]/g, '')
            .replace(/\s+/g, ' ');
    }


    // Категории поиска
    private static matchesFirstLetters(itemWords: string[], queryWord: string): boolean {
        return itemWords.some(word => word.startsWith(queryWord));
    }

    private static matchesSubstring(fullName: string, queryWord: string): boolean {
        return fullName.includes(queryWord);
    }

    private static matchesTypos(itemWords: string[], queryWord: string, minLetters=4): boolean {
        const qLen = queryWord.length;
        if (qLen < minLetters) return false;
        const maxErrors = qLen === minLetters ? 1 : 2;

        return itemWords.some(word => {
            if (Math.abs(word.length - qLen) > maxErrors) return false;
            return this.getLevenshteinDistance(word, queryWord) <= maxErrors;
        });
    }
}



/* Слайд-шоу */
class SliderInSlideshowS {
    readonly elSlider = document.getElementById("mwSlider") as HTMLDivElement;
    private readonly divLeft = this.elSlider.querySelector(".e-left") as HTMLDivElement;
    private readonly divRight = this.elSlider.querySelector(".e-right") as HTMLDivElement;
    private readonly divCenter = this.elSlider.querySelector(".e-center") as HTMLDivElement;
    
    img = this.divCenter.querySelector("img") as HTMLImageElement;
    private readonly imgLeft = this.divLeft.querySelector("img") as HTMLImageElement;
    private readonly imgRight = this.divRight.querySelector("img") as HTMLImageElement;
    
    private scale = 1;
    private translateX = 0;
    private translateY = 0;
    private startSlideTranslateX = 0;
    private slideTranslateX = 0;

    // Управление указателей
    activePointers = new Map<number, PointerEvent>();

    // Состояния взаимодействия
    private isSwiping = false;
    private isDragging = false;
    hasMoved = false;
    
    // Границы для свайпа
    private isAtLeftBoundary = false;
    private isAtRightBoundary = false;

    // Константы для свайпа
    private readonly SWIPE_THRESHOLD = 0.3; // 30% ширины экрана
    private readonly MOVEMENT_THRESHOLD = 5; // пикселей для определения движения

    // Начальные координаты
    private startX = 0;
    private startY = 0;
    private globalTouchStartX = 0;
    private globalTouchStartY = 0;
    
    // Для зума двумя пальцами
    private distanceH = -1;
    private centerH: {x: number, y: number}|null = null;
    // Для зума
    private zoomLevel = 2;
    private readonly ZOOM_LEVELS = [ 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3 ];
    private readonly ZOOM_COEFFICIENT = 0.005;

    //#region 
    private transformedAdjacentImg: HTMLImageElement|null = null;
    animSlide = {
        startTime: 0,
        running: false,
        startX: 0
    }
    private startAnimSlide(startX: number) {
        this.animSlide.running = true;
        this.animSlide.startTime = performance.now();
        this.animSlide.startX = startX;

        window.requestAnimationFrame(this.animSlideF);
    }
    private endAnimSlide() {
        this.animSlide.running = false;
        if (this.transformedAdjacentImg) {
            this.transformedAdjacentImg.style.transform = "";
            this.transformedAdjacentImg = null;
        }
    }
    private animSlideF = ()=>{
        const time = performance.now();
        const duration = (time-this.animSlide.startTime) / 1000;
        let targetTranslateX;
        if (duration >= 0.5) {
            this.endAnimSlide();
            targetTranslateX = 0;
        }
        else {
            targetTranslateX = easeQuadOut(this.animSlide.startX, 0, duration/0.5);
        }

        this.setSliderTransform(targetTranslateX);

        if (this.animSlide.running) {
            window.requestAnimationFrame(this.animSlideF);
        }
    }
    //#endregion


    windowWidthH = 0;

    constructor(private readonly parent: SlideshowS) {
        this.setEvents();
    }

    slide(byPos: -1|1) {
        const prevPos = this.parent.currentPos;
        this.parent.currentPos = clamp(this.parent.currentPos+byPos, 0, this.parent.pictures.length-1);
        if (prevPos !== this.parent.currentPos) {
            this.slideTranslateX += this.windowWidthH*byPos;
            this.parent.updateContent();

            this.transformedAdjacentImg = (byPos === 1) ? this.imgLeft : this.imgRight;
            // Перенос трансформации на соседнюю картинку
            this.transformedAdjacentImg.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
            this.resetTransform();

            this.startAnimSlide(clamp(this.slideTranslateX, -this.windowWidthH*2, this.windowWidthH*2));
        }
    }
    

    resetState() {
        this.activePointers.clear();
        this.hasMoved = false;
        this.isSwiping = false;
        this.isDragging = false;
        this.distanceH = -1;
        this.centerH = null;
        
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.zoomLevel = 2;

        this.windowWidthH = window.innerWidth;
        this.updateImageTransform();
    }
    

    updateThreeImages() {
        const currentPos = this.parent.currentPos;

        // 1. Обновляем центральное изображение (оно гарантированно есть)
        this.updateImage(this.img, currentPos);

        // 2. Обновляем левое изображение или скрываем его контейнер
        this.updateSideZone(this.divLeft, this.imgLeft, currentPos-1);

        // 3. Обновляем правое изображение или скрываем его контейнер
        this.updateSideZone(this.divRight, this.imgRight, currentPos+1);
    }


    private updateImage(img: HTMLImageElement, index: number): void {
        const picture = this.parent.pictures[index];
        img.src = ""; // Чтобы картинка изначально была пустой
        img.src = picture.src;
        img.alt = picture.name;
    }

    private updateSideZone(zoneDiv: HTMLElement, img: HTMLImageElement, index: number): void {
        const pictures = this.parent.pictures;

        // Проверяем, входит ли индекс в границы массива
        if (index >= 0 && index < pictures.length) {
            this.updateImage(img, index);
            B.showEl(zoneDiv);
        } else {
            B.hideEl(zoneDiv);
        }
    }
    

    private setEvents() {
        // Обновление свойства windowWidthH
        window.addEventListener("resize", ()=>{
            if (!this.parent.elModal.classList.contains("hide")) {
                this.windowWidthH = window.innerWidth;
            }
        });

        this.elSlider.addEventListener("pointerdown", this.handlePointerDown);
        this.elSlider.addEventListener("pointermove", this.handlePointerMove);
        this.elSlider.addEventListener('pointerup', this.handlePointerUp);
        this.elSlider.addEventListener('pointercancel', this.handlePointerCancel);

        // Зум колёсиком мыши
        this.img.addEventListener("wheel", (event)=>{
            event.preventDefault();

            // Определение направления зума
            const direction = event.deltaY < 0 ? 1 : -1;
            this.zoomLevel = clamp(this.zoomLevel + direction, 0, this.ZOOM_LEVELS.length - 1);

            const oldScale = this.scale;
            const targetScale = this.ZOOM_LEVELS[this.zoomLevel];
            if (targetScale === oldScale) return;

            // Находим координаты курсора мыши относительно самой картинки
            const rect = this.img.getBoundingClientRect();
            const mouseXOnImg = (event.clientX - rect.left) - (rect.width/2);
            const mouseYOnImg = (event.clientY - rect.top) - (rect.height/2);

            // Рассчитываем, насколько сдвинется точка под курсором при изменении масштаба
            const scaleRatio = targetScale / oldScale;
            const targetX = this.translateX - (mouseXOnImg * scaleRatio - mouseXOnImg);
            const targetY = this.translateY - (mouseYOnImg * scaleRatio - mouseYOnImg);

            this.applyBoundedTransform(targetX, targetY, targetScale);

        }, {passive: false});
    }


    private handlePointerDown = (event: PointerEvent)=>{
        if (this.activePointers.size === 0) {
            this.globalTouchStartX = event.clientX;
            this.globalTouchStartY = event.clientY;
            this.hasMoved = false;

            // прервать анимацию
            this.endAnimSlide();
            this.startSlideTranslateX = this.slideTranslateX;
        }
        this.activePointers.set(event.pointerId, event);
        
        if ((event.target as HTMLElement) !== this.img) return;

        this.img.setPointerCapture(event.pointerId);
        
        if (this.activePointers.size === 1) {
            // Один палец: перемещение
            this.isDragging = true;
            this.startX = event.clientX - this.translateX;
            this.startY = event.clientY - this.translateY;
        }
        
        else if (this.activePointers.size === 2) {
            // Два пальца: перемещение и масштабирование
            this.isDragging = false;
            const [p1, p2] = Array.from(this.activePointers.values());
            this.distanceH = this.getDistance(p1, p2);
            this.centerH = this.getCenter(p1, p2);
        }
    }
    private handlePointerMove = (event: PointerEvent)=>{
        if (!this.activePointers.has(event.pointerId)) return;
        this.activePointers.set(event.pointerId, event);


        if (!this.hasMoved) {
            const relX = this.globalTouchStartX - event.clientX;
            const absRelY = Math.abs(this.globalTouchStartY - event.clientY);
            if (Math.abs(relX) >= this.MOVEMENT_THRESHOLD || absRelY >= this.MOVEMENT_THRESHOLD) {
                this.hasMoved = true;
                
                const isHorizontalGesture = absRelY < Math.abs(relX) * 0.3;
                const isAtBoundary = 
                    (relX > 0 && this.isAtRightBoundary) || (relX < 0 && this.isAtLeftBoundary);

                this.isSwiping = (this.activePointers.size === 1 && (this.scale === 1) || (isHorizontalGesture && isAtBoundary));
            }
        }
        
        if (!this.hasMoved) return;

        // Свайп
        if (this.isSwiping) {
            this.setSliderTransform(event.clientX-this.globalTouchStartX+this.startSlideTranslateX);
        }
        // Перетаскивание
        else if ((event.target as HTMLElement) === this.img) {
            if (this.activePointers.size === 1 && this.isDragging) {
                this.applyBoundedTransform(
                    event.clientX - this.startX,
                    event.clientY - this.startY,
                    this.scale
                );
            }
            // Два пальца: перемещение и масштабирование
            else if (this.activePointers.size === 2) {
                this.handleTwoFingerGesture();
            }
        }

    }
    private handleTwoFingerGesture() {
        const [p1, p2] = Array.from(this.activePointers.values());

        // 1. Потенциальный сдвиг
        let targetX = this.translateX;
        let targetY = this.translateY;
        const center = this.getCenter(p1, p2);

        if (this.centerH) {
            targetX += center.x - this.centerH.x;
            targetY += center.y - this.centerH.y;
        }
        this.centerH = center;

        // 2. Потенциальное масштабирование
        let targetScale = this.scale;
        const distance = this.getDistance(p1, p2);
        if (this.distanceH > 0) {
            const delta = distance - this.distanceH;
            targetScale += delta * this.ZOOM_COEFFICIENT;
            targetScale = clamp(targetScale, 0.5, 3); // Ограничения
        }
        this.distanceH = distance;

        this.applyBoundedTransform(targetX, targetY, targetScale);
    }
    private handlePointerUp = (event: PointerEvent)=>{ 
        this.img.releasePointerCapture(event.pointerId);
        this.removePointer(event);

        if(!this.isSwiping) {
            if (this.activePointers.size === 0) {
                this.applyBoundedTransform(
                    this.translateX,
                    this.translateY,
                    snap(this.scale, 0.15, 1) || this.scale
                );
            }
        }
        else {
            // Завершение свайпа
            const threshold = Math.min(this.windowWidthH * this.SWIPE_THRESHOLD, 150);
            const relX = this.globalTouchStartX - event.clientX;
            
            if (relX < -threshold) {
                // Налево
                this.slide(-1);
            }
            else if (relX > threshold) {
                // Направо
                this.slide(1);
            }
        }

        if (!this.hasMoved || this.isSwiping) {
            this.startAnimSlide(clamp(this.slideTranslateX, -this.windowWidthH*2, this.windowWidthH*2));
        }

        this.isSwiping = false;
    }
    private handlePointerCancel = (event: PointerEvent)=>{ 
        this.handlePointerUp(event);
    }

    private removePointer(event: PointerEvent) {
        this.activePointers.delete(event.pointerId);

        if (!this.isSwiping) {
            // Сбрасываем данные жеста двумя пальцами
            if (this.activePointers.size < 2) {
                this.distanceH = -1;
                this.centerH = null;
            }

            // Плавный возврат к одиночному перемещению, если остался один палец
            if (this.activePointers.size === 1) {
                const p1 = Array.from(this.activePointers.values())[0];

                this.isDragging = true;
                this.startX = p1.clientX - this.translateX;
                this.startY = p1.clientY - this.translateY;

            } else {
                this.isDragging = false;
            }
        }
    }


    private applyBoundedTransform(targetX: number, targetY: number, targetScale: number) {
        // Шаг 1: Применяем гипотетические стили для замера реальных границ
        
        this.scale = targetScale;
        this.translateX = targetX;
        this.translateY = targetY;
        this.updateImageTransform();


        // Шаг 2: Получаем текущие экранные координаты углов картинки после трансформации
        const rect = this.img.getBoundingClientRect();
        const viewW = this.windowWidthH;
        const viewH = window.innerHeight;

        let correctedX = targetX;
        let correctedY = targetY;
        let canBeDraggable = false;
        this.isAtLeftBoundary = false;
        this.isAtRightBoundary = false;

        // --- Ограничения по оси X ---
        if (rect.width <= viewW) {
            correctedX = 0;
            this.isAtLeftBoundary = true;
            this.isAtRightBoundary = true;
        } else {
            canBeDraggable = true;
            if (rect.left >= 0) {
                correctedX -= rect.left;
                this.isAtLeftBoundary = true;
            }
            if (rect.right <= viewW) {
                correctedX += (viewW - rect.right);
                this.isAtRightBoundary = true;
            }
        }

        // --- Ограничения по оси Y ---
        if (rect.height <= viewH) {
            correctedY = 0;
        } else {
            canBeDraggable = true;
            if (rect.top > 0) correctedY -= rect.top;
            if (rect.bottom < viewH) correctedY += (viewH - rect.bottom);
        }

        // Шаг 3: Применяем скорректированные значения
        this.translateX = correctedX;
        this.translateY = correctedY;
        this.updateImageTransform();

        // Обновляем класс элемента
        this.img.classList.toggle("js-draggable", canBeDraggable);
    }

    private updateImageTransform() {
        this.img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
    private resetTransform() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.zoomLevel = 2;
        this.img.style.transform = "";
    }

    private setSliderTransform(x: number) {
        this.slideTranslateX = x;
        this.elSlider.style.transform = `translateX(${x}px)`;
    }

    // Вспомогательные функции
    private getDistance(p1: PointerEvent, p2: PointerEvent) {
        const dx = p1.clientX - p2.clientX;
        const dy = p1.clientY - p2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private getCenter(p1: PointerEvent, p2: PointerEvent) {
        return {
            x: (p1.clientX + p2.clientX) / 2,
            y: (p1.clientY + p2.clientY) / 2
        };
    }

}

class SlideshowS extends B.AModal {
    readonly elModal = document.getElementById("modal") as HTMLDivElement;
    readonly elWindow = document.getElementById("modalContent") as HTMLDivElement;
    readonly mw = {
        name: document.getElementById("mwName") as HTMLHeadingElement,
        date: document.getElementById("mwDate") as HTMLParagraphElement,
        divTags: document.getElementById("mwDivTags") as HTMLDivElement,
        descriptionP: document.getElementById("mwDescriptionP") as HTMLDetailsElement,
        description: document.getElementById("mwDescription") as HTMLParagraphElement,

        bClose: document.getElementById("mwBClose") as HTMLButtonElement,
        bLeft: document.getElementById("mwBLeft") as HTMLButtonElement,
        bRight: document.getElementById("mwBRight") as HTMLButtonElement,
    }

    pictures: PictureEntryWithID[] = [];
    currentPos = 0;

    private readonly slider = new SliderInSlideshowS(this);

    constructor() {
        super({modal: "modal", window: "modalContent"});
        this.setUIEvents();
    }

    private setUIEvents() {
        document.addEventListener("keydown", (event)=>{
            if (!this.elModal.classList.contains("hide") && !event.repeat) {
                if (event.key === "ArrowLeft") this.slider.slide(-1);
                else if (event.key === "ArrowRight") this.slider.slide(1);
            }
        });

        // Клик по тегам
        this.mw.divTags.addEventListener("click", async (event)=>{
            const elTag = (event.target as HTMLElement).closest(".tag.clickable") as HTMLElement;
            if (!elTag) return;

            await this.close();
            SearchBar.submitQuery(elTag.textContent);
        });
        
        // Кнопки
        this.mw.bClose.addEventListener("click", ()=>{
            this.close();
        });
        this.mw.bLeft.addEventListener("click", ()=>{
            this.slider.slide(-1);
        });
        this.mw.bRight.addEventListener("click", ()=>{
            this.slider.slide(1);
        })

        // Переключение режима слайд-шоу
        this.elWindow.addEventListener("click", (event)=>{
            const target = event.target as HTMLElement;

            if (target.closest("#mwSlider") && !this.slider.hasMoved) {
                this.elModal.classList.toggle("slideshow");
            }
        });
    }

    /** Действует с обновлённым свойством `this.currentPos` */
    updateContent() {
        this.slider.updateThreeImages();

        const picture = this.pictures[this.currentPos];

        // Название
        this.mw.name.textContent = picture.name;
        // Период
        {
            const dateBegin = picture.date_begin ? B.formatToRuDate(picture.date_begin) : null;
            const dateEnd = B.formatToRuDate(picture.date_end);

            this.mw.date.replaceChildren();

            this.mw.date.append(
                ...
                (dateBegin && (dateBegin !== dateEnd))
                ? [
                    B.createTimeEl(dateBegin, B.formatToISODate(picture.date_begin!)),
                    " - ",
                    B.createTimeEl(dateEnd, B.formatToISODate(picture.date_end))
                ]
                : [
                    B.createTimeEl(dateEnd, B.formatToISODate(picture.date_end))
                ]
            );


            this.mw.date.append(
                " ",
                B.createEl("span", {
                    class: "date-period t-light-green",
                    text: `(${B.getApproximatePeriodUntilToday(dateEnd)})`
                })
            );
        }

        // Описание
        if (picture.description) {
            B.showEl(this.mw.descriptionP);
            this.mw.descriptionP.open = false;
            B.formatText(picture.description, this.mw.description);
        }
        else {
            B.hideEl(this.mw.descriptionP);
        }

        // Теги
        this.mw.divTags.replaceChildren();
        this.mw.divTags.appendChild( CatalogBuilder.buildTagList(
            c!.tags
                .filter((tag)=>picture.tags?.includes(tag.tag))
                // сортировка по алфавиту в новом массиве
                .sort((a, b)=>(a.tag.localeCompare(b.tag))),
            "",
            true
        ) );

        // Видимость кнопок
        if (this.currentPos > 0) { B.showEl(this.mw.bLeft); } else { B.hideEl(this.mw.bLeft); }
        if (this.currentPos < this.pictures.length-1) { B.showEl(this.mw.bRight); } else { B.hideEl(this.mw.bRight); }
    }

    openFunction(pos: number) {
        this.pictures = c!.foundPictures;
        this.currentPos = pos;

        this.slider.resetState();
        this.updateContent();

        // Показать модальное окно
        B.showEl(this.elModal); 
    }
}
const slideshow = new SlideshowS();






// ЗАГРУЗИТЬ gallery_directory.json

type GalleryDirectory = PictureFolderEntry[];
interface PictureFolderEntry {
    folder: string,
    description?: string,
    no_period?: boolean,
    content: PictureEntry[]
}
interface PictureEntry {
    name: string,
    src: string,
    thumb_src?: string,
    date_begin?: string,
    date_end: string,
    tags?: string[],
    description?: string
}

interface FolderEntry {
    name: string,
    description?: string,
    // вычисляются автоматически
    readonly id: number,
    yearRange?: {  
        begin: number,
        end: number
    },
    length: number
}
interface FlatGalleryDirectory {
    folders: FolderEntry[],
    content: PictureEntryWithID[]
}
interface PictureEntryWithID extends PictureEntry {
    readonly id: number,
    folder_index: number
}


B.loadJSON("gallery_directory.json")
.then((output)=>{
    const galleryDirectory = (output as GalleryDirectory);

    c = new CatalogS(galleryDirectory);

    // Инициализация поисковой строки
    el.formSearch.addEventListener("submit", (event)=>{
        event.preventDefault();
        SearchBar.submitQuery();
    });

    
    c.recoverState();
})
.catch((e)=>{
    // не удалось загрузить файл
    console.error(e);
    el.galleryCatalog.appendChild(B.createEl("p", {class:"t-center", text: "Не удалось загрузить каталог"}));
});


// ЗАГРУЗИТЬ
{
    // когда страница открыта или перезагружена
    SearchBar.recoverSearchBar();

    // когда пользователь нажал «Назад»/«Вперёд» во вкладке
    window.addEventListener("popstate", (event)=>{
        SearchBar.recoverSearchBar();
        if (c) {
            c.recoverState();
        }
    });

    // когда нажата вкладка «Галерея», перейти в главную страницу
    (document.querySelector("nav > a.active") as HTMLAnchorElement)
        .addEventListener("click", (event)=>{
            event.preventDefault();
            if (c) {
                pushUrlQuery([
                    {name: "folder", value: ""},
                    {name: "search", value: ""}
                ]);
                SearchBar.recoverSearchBar("");
                c.showCatalog();
            }
        }
    );
}
