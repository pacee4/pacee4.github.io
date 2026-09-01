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
    // AI GENERATED
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
    // limit the progress t in the range 0 to 1
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


// CLASSES
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
            // Set delay
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
        // Change the placeholder
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
        // scroll the page to the top
        window.scrollTo({top: 0, behavior: "smooth"});
    }
    foundPictures: PictureEntryWithID[] = [];


    private obtainTags(galleryDirectory: FlatGalleryDirectory) {
        // AI GENERATED
        // Count the tags
        const tagCounts: Record<string, number> = galleryDirectory.content
            .flatMap(contentItem => contentItem.tags ?? [])
            .reduce((acc: Record<string, number>, tag: string) => {
                acc[tag] = (acc[tag] || 0) + 1;
                return acc;
            }, {});
        
        // Record the tags to the array and sort by amount
        const tagProperties = Object.entries(tagCounts)
            .sort(([tagA, countA], [tagB, countB]) => {
                // First sort by amount (descending)
                if (countB !== countA) {
                    return countB - countA;
                }
                // If amount is equal, sort alphabetically (`localeCompare` includes cyrillic)
                return tagA.localeCompare(tagB);
            })
            .map(([tag]) => (tag))
            
            .map((tag)=>(CatalogBuilder.paintTag(tag)));
        
        return tagProperties;
    }


    constructor(directory: GalleryDirectory) {
        // Restructure data
        const tempContentList: (PictureEntry & {folder_index: number})[] = [];
        const foldersList: FolderEntry[] = [];

        // Assign ID to each entry
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

        // Sort by date
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
        // change the document title
        document.title = `Галерея - Сайт pacee4`;

        const f = document.createDocumentFragment();

        f.append(
            // Recent
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

            // Folders
            CatalogBuilder.buildSection(({heading, content})=>{
                heading.textContent = "Папки";

                content.appendChild( CatalogBuilder.buildFolderList(this.galleryDirectory.folders, this) );
            }),

            // Tags
            CatalogBuilder.buildSection(({heading, content})=>{
                heading.textContent = "Теги";

                const elTags = CatalogBuilder.buildTagList(this.tags, "t-center", true);
                // Click event delegation
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

        // Change the document title
        document.title = `${folder.name} - Галерея - Сайт pacee4`;


        el.galleryCatalog.append(
            CatalogBuilder.buildSection(({heading, content})=>{
                // Heading (folder name)
                heading.textContent = folder.name;

                // Period
                heading.appendChild(CatalogBuilder.writePeriod(folder));
                
                // Amount of pictures
                heading.after( CatalogBuilder.createPicturesLengthInfo(length) );

                // Description
                const description = folder.description;
                if (description) {
                    const elDescription = document.createElement("p");
                    elDescription.classList.add("pre-line");
                    B.formatText(description, elDescription);
                    heading.after(elDescription);
                }

                // Content
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

        // Change the document title
        document.title = `Все картинки - Галерея - Сайт pacee4`;

        el.galleryCatalog.append(
            CatalogBuilder.buildSection(({heading, content})=>{
                // Heading
                heading.textContent = "Все картинки";
                
                // Amount of pictures
                heading.after( CatalogBuilder.createPicturesLengthInfo(length) );

                // Content
                content.appendChild(CatalogBuilder.buildImageSection(pictures));
                content.addEventListener("click", CatalogBuilder.imageCardClickEvent);
            })
        );

        this.recordFoundPictures(pictures);
    }

    private searchP(query: string) {
        // Search
        const results = SearchEngine.search(this.galleryDirectory, this.tags.map(tag => tag.tag), query);
        const pictures = results.content;
        const picturesWithoutTags = pictures.slice(0, results.searchFromPictureId);
        const picturesWithTags = pictures.slice(results.searchFromPictureId);

        const matchedFolders = results.folders;
        const matchedTags = results.matchedTags;

        this.recordFoundPictures(pictures);


        // Change the document title
        document.title = `${capitalize(query)} - Галерея - Сайт pacee4`;

        const f = document.createDocumentFragment();  
        // Search without tags
        if (picturesWithoutTags.length > 0 || matchedFolders.length > 0) {
            f.appendChild(
                // Search results (example)
                CatalogBuilder.buildSection(({heading, content})=>{
                    heading.classList.add("italic");
                    heading.textContent = `«${query}»`;

                    // Amount of pictures
                    if (picturesWithoutTags.length > 0)
                        heading.after( CatalogBuilder.createPicturesLengthInfo(picturesWithoutTags.length) );

                    // Folders
                    if (matchedFolders.length>0) {
                        heading.after( CatalogBuilder.buildFolderList(
                            this.galleryDirectory.folders
                                .filter((folder)=>(matchedFolders.includes(folder))),
                            this
                        ));
                    }

                    // Content
                    content.appendChild(CatalogBuilder.buildImageSection(picturesWithoutTags));
                    content.addEventListener("click", CatalogBuilder.imageCardClickEvent);
                
                })
            );
        }

        // Search by tags
        if (picturesWithTags.length > 0) {
            f.appendChild(
                CatalogBuilder.buildSection(({heading, content})=>{
                    // Heading
                    heading.classList.add("flex", "center");
                    const elTags = CatalogBuilder.buildTagList(this.tags.filter((tag)=> matchedTags.includes(tag.tag)), "t-big-1 regular")
                    heading.append(
                        B.createEl("div", {
                            class:"tagsHeading pre", 
                            text: ((matchedTags.length > 1) ? "Теги: " : "Тег: ")
                        }),
                        elTags
                    )
                    
                    // Amount of pictures
                    heading.after( CatalogBuilder.createPicturesLengthInfo(picturesWithTags.length) );

                    // Content
                    content.appendChild(CatalogBuilder.buildImageSection(picturesWithTags, false, picturesWithoutTags.length));
                    content.addEventListener("click", CatalogBuilder.imageCardClickEvent);
                })
            );
        }

        // if none found
        if (!f.firstChild) {
            f.appendChild(B.createEl("p", {text:"Ничего не найдено", class:"t-center"}));
        }

        el.galleryCatalog.appendChild(f);
        
        this.recordFoundPictures(pictures);
    }


    recoverState() {
        // Read the search string
        if (SearchBar.currentQuery !== "") {
            this.search(SearchBar.currentQuery);
        }
        else {
            // Read the URL parameter: "folder"
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
    static imageCardClickEvent = (event: PointerEvent)=>{
        const elTarget = (event.target as HTMLElement).closest(".clickable") as HTMLElement;
        if (!elTarget) return;

        if (elTarget.classList.contains("all-pictures")) {
            // Open the section "All pictures"
            pushUrlQuery([
                {name: "folder", value: "0"},
                {name: "search", value: ""}
            ]);
            c!.showFolderContent(0);
        }
        else {
            // Open the picture
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

        // Create folders in a document fragment
        folders.forEach((folder)=>{
            const clone = (templates.folder.content.cloneNode(true)) as DocumentFragment;
            
            (clone.querySelector(".folder") as HTMLLIElement).dataset.index = String(folder.id+1);


            const elName = clone.querySelector(".name") as HTMLHeadingElement;
            elName.textContent = folder.name;
            
            // period
            elName.appendChild(CatalogBuilder.writePeriod(folder));
            

            const elCount = clone.querySelector(".count") as HTMLParagraphElement;
            elCount.textContent = `${folder.length} ${B.sklonenieNoun(folder.length, "картинка", "картинки", "картинок")}`;

            ul.appendChild(clone);
        });

        // Click event delegation
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
            // And also group by year
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

    // MAY NOT BE NEEDED
    static groupByYear(items: PictureEntryWithID[]) {
        // Group by year
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
                // Split the string "DD.MM.YYYY" and take the last element (year)
                const parts = dateStr.split('.');
                return parseInt(parts[parts.length - 1], 10);
            })
            .filter((year: number) => !isNaN(year)); // Remove incorrectly parsed numbers

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
        
        // AI GENERATED
        let lightness: number
        const high = 65;
        const low = 48;
        // Brightness curve implementation
        if (hue >= 0 && hue < 60) {
            // Smooth drop from 65% to 48% in the red-yellow zone
            lightness = high - (hue / 60) * (high - low);
        } else if (hue >= 60 && hue < 180) {
            // Stable 48% in the yellow-green and turquoise zones
            lightness = low;
        } else if (hue >= 180 && hue < 240) {
            // Smooth rise from 48% to 65% in the blue zone
            lightness = low + ((hue - 180) / 60) * (high - low);
        } else {
            // Stable 65% for magenta, violet, and pink (240° - 360°)
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

        // Split the string query by separate words
        const {queryYears, queryWords, queryTags} = this.parseTokens(normQuery.split(' '), tags);

        // Search the pictures
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
            // Search the folders
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
            // if this is a year
            if (yearRegex.test(token)) {
                queryYears.push(token);
                return;
            }

            const matchedTag = tags.find(tag => tag === token) || tags.find(tag => this.matchesTypos([tag], token, 3));

            // if this is a tag
            if (matchedTag) {
                queryTags.push(matchedTag);
            }
            // else this is a picture name
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

                // If the words contains 1 letter, then search according to the 1st category (the beginning of any word or line)
                if (queryWord.length === 1) {
                    return this.matchesFirstLetters(itemWords, queryWord);
                }
                else {
                // For long words check all 4 categories
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
                    matrix[i - 1][j] + 1,    // delete
                    matrix[i][j - 1] + 1,    // paste
                    matrix[i - 1][j - 1] + 1 // replace
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


    // Search categories
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



/** Slide show */
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

    // Pointer control
    activePointers = new Map<number, PointerEvent>();

    // Interaction states
    private isSwiping = false;
    private isDragging = false;
    hasMoved = false;
    
    // Swipe boundaries
    private isAtLeftBoundary = false;
    private isAtRightBoundary = false;

    // Swipe settings constants
    private readonly SWIPE_THRESHOLD = 0.3; // 30% of the screen width
    private readonly MOVEMENT_THRESHOLD = 5; // pixels for detecting movement

    // Initial coordinates
    private startX = 0;
    private startY = 0;
    private globalTouchStartX = 0;
    private globalTouchStartY = 0;
    
    // For pinch zoom
    private distanceH = -1;
    private centerH: {x: number, y: number}|null = null;
    // For zoom
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
            // Transfer the transformation to the adjacent picture
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

        // 1. Update the center image (it's guaranteed to be there)
        this.updateImage(this.img, currentPos);

        // 2. Update the left image or hide its container
        this.updateSideZone(this.divLeft, this.imgLeft, currentPos-1);

        // 3. Update the right image or hide its container
        this.updateSideZone(this.divRight, this.imgRight, currentPos+1);
    }


    private updateImage(img: HTMLImageElement, index: number): void {
        const picture = this.parent.pictures[index];
        img.src = ""; // So that the picture is initially empty
        img.src = picture.src;
        img.alt = picture.name;
    }

    private updateSideZone(zoneDiv: HTMLElement, img: HTMLImageElement, index: number): void {
        const pictures = this.parent.pictures;

        // Check whether the index is inside the array
        if (index >= 0 && index < pictures.length) {
            this.updateImage(img, index);
            B.showEl(zoneDiv);
        } else {
            B.hideEl(zoneDiv);
        }
    }
    

    private setEvents() {
        // update the property `windowWidthH`
        window.addEventListener("resize", ()=>{
            if (!this.parent.elModal.classList.contains("hide")) {
                this.windowWidthH = window.innerWidth;
            }
        });

        this.elSlider.addEventListener("pointerdown", this.handlePointerDown);
        this.elSlider.addEventListener("pointermove", this.handlePointerMove);
        this.elSlider.addEventListener('pointerup', this.handlePointerUp);
        this.elSlider.addEventListener('pointercancel', this.handlePointerCancel);

        // Wheel zoom
        this.img.addEventListener("wheel", (event)=>{
            event.preventDefault();

            // Detect zoom direction
            const direction = event.deltaY < 0 ? 1 : -1;
            this.zoomLevel = clamp(this.zoomLevel + direction, 0, this.ZOOM_LEVELS.length - 1);

            const oldScale = this.scale;
            const targetScale = this.ZOOM_LEVELS[this.zoomLevel];
            if (targetScale === oldScale) return;

            // Find the coordinates of the mouse cursor relative to the image itself
            const rect = this.img.getBoundingClientRect();
            const mouseXOnImg = (event.clientX - rect.left) - (rect.width/2);
            const mouseYOnImg = (event.clientY - rect.top) - (rect.height/2);

            // Calculate how much the point under the cursor will move when the zoom level changes
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

            // stop the animation
            this.endAnimSlide();
            this.startSlideTranslateX = this.slideTranslateX;
        }
        this.activePointers.set(event.pointerId, event);
        
        if ((event.target as HTMLElement) !== this.img) return;

        this.img.setPointerCapture(event.pointerId);
        
        if (this.activePointers.size === 1) {
            // One finger down: movement
            this.isDragging = true;
            this.startX = event.clientX - this.translateX;
            this.startY = event.clientY - this.translateY;
        }
        
        else if (this.activePointers.size === 2) {
            // Two fingers down: movement and zoom
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

        // Swipe
        if (this.isSwiping) {
            this.setSliderTransform(event.clientX-this.globalTouchStartX+this.startSlideTranslateX);
        }
        // Move
        else if ((event.target as HTMLElement) === this.img) {
            if (this.activePointers.size === 1 && this.isDragging) {
                this.applyBoundedTransform(
                    event.clientX - this.startX,
                    event.clientY - this.startY,
                    this.scale
                );
            }
            // Two fingers down: movement and zoom
            else if (this.activePointers.size === 2) {
                this.handleTwoFingerGesture();
            }
        }

    }
    private handleTwoFingerGesture() {
        const [p1, p2] = Array.from(this.activePointers.values());

        // 1. Potential shift
        let targetX = this.translateX;
        let targetY = this.translateY;
        const center = this.getCenter(p1, p2);

        if (this.centerH) {
            targetX += center.x - this.centerH.x;
            targetY += center.y - this.centerH.y;
        }
        this.centerH = center;

        // 2. Potential scale
        let targetScale = this.scale;
        const distance = this.getDistance(p1, p2);
        if (this.distanceH > 0) {
            const delta = distance - this.distanceH;
            targetScale += delta * this.ZOOM_COEFFICIENT;
            targetScale = clamp(targetScale, 0.5, 3); // limits
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
            // Finishing the swipe
            const threshold = Math.min(this.windowWidthH * this.SWIPE_THRESHOLD, 150);
            const relX = this.globalTouchStartX - event.clientX;
            
            if (relX < -threshold) {
                // left
                this.slide(-1);
            }
            else if (relX > threshold) {
                // right
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
            // Reset two-finger gesture data
            if (this.activePointers.size < 2) {
                this.distanceH = -1;
                this.centerH = null;
            }

            // Smoothly revert to single-finger gestures when only one finger remains
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
        
        // 1. Apply hypothetical styles to measure actual boundaries
        
        this.scale = targetScale;
        this.translateX = targetX;
        this.translateY = targetY;
        this.updateImageTransform();


        // 2. Get the current screen coordinates of the image corners after transformation
        const rect = this.img.getBoundingClientRect();
        const viewW = this.windowWidthH;
        const viewH = window.innerHeight;

        let correctedX = targetX;
        let correctedY = targetY;
        let canBeDraggable = false;
        this.isAtLeftBoundary = false;
        this.isAtRightBoundary = false;

        // --- X-axis limits ---
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

        // --- Y-axis limits ---
        if (rect.height <= viewH) {
            correctedY = 0;
        } else {
            canBeDraggable = true;
            if (rect.top > 0) correctedY -= rect.top;
            if (rect.bottom < viewH) correctedY += (viewH - rect.bottom);
        }

        // 3. Apply the adjusted values
        this.translateX = correctedX;
        this.translateY = correctedY;
        this.updateImageTransform();

        // Update the element class
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

    // Helper methods
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

        // Click on tags
        this.mw.divTags.addEventListener("click", async (event)=>{
            const elTag = (event.target as HTMLElement).closest(".tag.clickable") as HTMLElement;
            if (!elTag) return;

            await this.close();
            SearchBar.submitQuery(elTag.textContent);
        });
        
        // Buttons
        this.mw.bClose.addEventListener("click", ()=>{
            this.close();
        });
        this.mw.bLeft.addEventListener("click", ()=>{
            this.slider.slide(-1);
        });
        this.mw.bRight.addEventListener("click", ()=>{
            this.slider.slide(1);
        })

        // Switching slideshow mode
        this.elWindow.addEventListener("click", (event)=>{
            const target = event.target as HTMLElement;

            if (target.closest("#mwSlider") && !this.slider.hasMoved) {
                this.elModal.classList.toggle("slideshow");
            }
        });
    }

    /** Operates on the updated `currentPos` property. */
    updateContent() {
        this.slider.updateThreeImages();

        const picture = this.pictures[this.currentPos];

        // Name
        this.mw.name.textContent = picture.name;
        // Period
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

        // Description
        if (picture.description) {
            B.showEl(this.mw.descriptionP);
            this.mw.descriptionP.open = false;
            B.formatText(picture.description, this.mw.description);
        }
        else {
            B.hideEl(this.mw.descriptionP);
        }

        // Tags
        this.mw.divTags.replaceChildren();
        this.mw.divTags.appendChild( CatalogBuilder.buildTagList(
            c!.tags
                .filter((tag)=>picture.tags?.includes(tag.tag))
                // sort alphabetically in a newly created array
                .sort((a, b)=>(a.tag.localeCompare(b.tag))),
            "",
            true
        ) );

        // Button visibility
        if (this.currentPos > 0) { B.showEl(this.mw.bLeft); } else { B.hideEl(this.mw.bLeft); }
        if (this.currentPos < this.pictures.length-1) { B.showEl(this.mw.bRight); } else { B.hideEl(this.mw.bRight); }
    }

    openFunction(pos: number) {
        this.pictures = c!.foundPictures;
        this.currentPos = pos;

        this.slider.resetState();
        this.updateContent();

        // Show modal window
        B.showEl(this.elModal); 
    }
}
const slideshow = new SlideshowS();






// LOAD gallery_directory.json

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
    // is calculated automatically
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

    // Initialization of the search bar
    el.formSearch.addEventListener("submit", (event)=>{
        event.preventDefault();
        SearchBar.submitQuery();
    });

    
    c.recoverState();
})
.catch((e)=>{
    // couldn't load the file
    console.error(e);
    el.galleryCatalog.appendChild(B.createEl("p", {class:"t-center", text: "Не удалось загрузить каталог"}));
});


// LOAD
{
    // when the doucment is opened or reloaded
    SearchBar.recoverSearchBar();

    // when the user taps on Back/Forward
    window.addEventListener("popstate", (event)=>{
        SearchBar.recoverSearchBar();
        if (c) {
            c.recoverState();
        }
    });

    // when the Gallery tab is clicked, go to the main section
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
