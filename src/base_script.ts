
export async function loadJSON(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Cannot load file: "+url);
    }
    const json = await response.json();
    return json;
}

export function sklonenieNoun(number: number, singular: string, dual: string, plural: string): string {
    const absNumber = Math.abs(number);
    return (
        (absNumber%10 == 1 && !(absNumber%100 > 10 && absNumber%100 < 20)) 
        ? singular 
        : (absNumber%10 > 1 && absNumber%10 < 5 && !(absNumber%100 > 10 && absNumber%100 < 20)) 
        ? dual 
        : plural
    );
}

// DATES

export function formatToRuDate(date: string) {
    const parts = date.split('-');

    if (parts.length === 3) {
        // YYYY-MM-DD -> DD.MM.YYYY
        const [year, month, day] = parts;
        return `${day}.${month}.${year}`;
    }
    else if (parts.length === 2) {
        // YYYY-MM -> MM.YYYY
        const [year, month] = parts;
        return `${month}.${year}`;
    }

    // YYYY -> YYYY
    return date;
}
export function formatToISODate(date: string) {
    const parts = date.split('.');

    if (parts.length === 3) {
        // DD.MM.YYYY -> YYYY-MM-DD
        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
    }
    else if (parts.length === 2) {
        // MM.YYYY -> YYYY-MM
        const [month, year] = parts;
        return `${year}-${month}`;
    }

    return date;
}
export function getDaysFromDate(date: string) {
    const parts: string[] = (
        (date.indexOf(".") !== -1)
        ? date.split(".").reverse()
        : (date.indexOf("-") !== -1)
        ? date.split("-")
        : [date]
    );

    const year = parseInt(parts[0]);
    const month = (parts.length >= 2) ? parseInt(parts[1]) : 1;
    const day = (parts.length >= 3) ? parseInt(parts[2]) : 1;

    return {
        year: year,
        /** Here January is denoted as 0 */
        month: month-1,
        day: day,
        priority: parts.length-1
    };
}

export function getIntegerTime(date: string) {
    const parsedDate = getDaysFromDate(date);
    return (new Date(parsedDate.year, parsedDate.month, parsedDate.day).getTime() + (parsedDate.priority));
}

export function getPeriodUntilToday(dateString: string) {
    const pastDateN = getDaysFromDate(dateString);
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let years = (today.getFullYear() - pastDateN.year);
    let months = (today.getMonth() - pastDateN.month);
    let days = (today.getDate() - pastDateN.day);

    // Period correction
    if (days < 0) {
        months--;
        const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += previousMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    
    return {
        years: years,
        months: months,
        days: days
    }
}

export function getApproximatePeriodUntilToday(dateString: string): string {
    const period = getPeriodUntilToday(dateString);

    if (period.years > 0) {
        return `${period.years} ${sklonenieNoun(period.years, "год", "года", "лет")} назад`;
    }
    else if (period.months > 0) {
        return `${period.months} ${sklonenieNoun(period.months, "месяц", "месяца", "месяцев")} назад`;
    }
    else {
        if (period.days === 0) {
            return "сегодня";
        }
        else if (period.days === 1) {
            return "вчера";
        }
        else {
            return `${period.days} ${sklonenieNoun(period.days, "день", "дня", "дней")} назад`;
        }
    }
}

// HTML ELEMENTS

export function showEl(el: HTMLElement) {
    el.classList.remove("hide");
}
export function hideEl(el: HTMLElement) {
    el.classList.add("hide");
}

interface ElProperties {
    text?: string,
    class?: string,
    id?: string,
    style?: Record<string, string>;
    children?: (Node|string)[]
}

export function createEl(tag: keyof HTMLElementTagNameMap, p: ElProperties): HTMLElement {
    const el = document.createElement(tag);

    if (p.text) {
        el.textContent = p.text;
    }
    if (p.class) {
        el.className = p.class;
    }
    if (p.id) {
        el.id = p.id;
    }
    if (p.style) {
        for (let [styleProperty, value] of Object.entries(p.style)) {
            el.style.setProperty(styleProperty, value);
        }
    }
    if (p.children) {
        el.append(...p.children);
    }

    return el;
}

export function createF(...children: (string|Node)[]) {
    const f = document.createDocumentFragment();
    f.append(...children);
    return f;
}

export function createTimeEl(text: string, dateTime: string): HTMLTimeElement {
    const timeEl = document.createElement("time");
    timeEl.textContent = text;
    timeEl.dateTime = dateTime;
    return timeEl;
}

/**
 * Designations:
 * 
 * **bold**: `**bold**`
 * 
 * *italic*: `*italic*`
 * 
 * hyperlink: `[name](URL link)`
 */
export function formatText(text: string, targetElement: HTMLElement) {
    // AI-GENERATED
    targetElement.textContent = ''; 

    const regex = /(?<!\\)(\*\*.*?(?<!\\)\*\*|(?<!\\)\*.*?(?<!\\)\*|(?<!\\)\[.*?(?<!\\)\]\((?<!\\).*?(?<!\\)\))/g;
    const tokens = text.split(regex);

    tokens.forEach(token => {
        if (token.startsWith('**') && token.endsWith('**')) {
            const boldElement = document.createElement('strong');
            boldElement.textContent = token.slice(2, -2).replace(/\\([\*\*\[\]\(\)])/g, '$1');
            targetElement.appendChild(boldElement);
        } 
        else if (token.startsWith('*') && token.endsWith('*')) {
            const italicElement = document.createElement('em');
            italicElement.textContent = token.slice(1, -1).replace(/\\([\*\*\[\]\(\)])/g, '$1');
            targetElement.appendChild(italicElement);
        } 
        else if (token.startsWith('[') && token.endsWith(')')) {
            const linkElement = document.createElement('a');

            const match = token.match(/^\[(.*?(?<!\\))\]\((.*?(?<!\\))\)$/);
            
            if (match) {
                const linkText = match[1];
                const linkUrl = match[2];
                
                linkElement.textContent = linkText.replace(/\\([\*\*\[\]\(\)])/g, '$1');
                linkElement.href = linkUrl.replace(/\\([\*\*\[\]\(\)])/g, '$1');
                
                linkElement.target = '_blank';
                linkElement.rel = 'noopener noreferrer';
                
                targetElement.appendChild(linkElement);
            } else {
                const cleanText = token.replace(/\\([\*\*\[\]\(\)])/g, '$1');
                targetElement.appendChild(document.createTextNode(cleanText));
            }
        }
        else if (token) {
            const cleanText = token.replace(/\\([\*\*\[\]\(\)])/g, '$1');
            targetElement.appendChild(document.createTextNode(cleanText));
        }
    });
}

interface CustomHistoryState {
    modalOpen: boolean
}

/**
 * - Selector when the modal window is open: `body.js-modalShow`;
 * 
 * - Selector during a transition: `#modal.js-busy`;
 * 
 * - Selector during a transition of closing the window: `#modal.js-closing`.
 * 
 * Where `modal` is HTML element ID of the modal window.
 */
export abstract class AModal {
    readonly elModal: HTMLElement;
    readonly elWindow: HTMLElement;

    constructor(elIds: {
        modal: string,
        window: string
    }) {
        this.elModal = document.getElementById(elIds.modal)!;
        this.elWindow = document.getElementById(elIds.window)!;

        // Add event listeners

        // when transition started
        this.elModal.addEventListener("transitionstart", (event)=>{
            if (event.target === this.elWindow)   // transition occurs only on #modalWindow
                this.elModal.classList.add("js-busy");
        });
        // whem transition ended
        this.elModal.addEventListener("transitionend", (event)=>{
            if (event.target === this.elWindow) this.handleTransitionEnd();
        });
        this.elModal.addEventListener("transitioncancel", (event)=>{
            if (event.target === this.elWindow) this.handleTransitionEnd();
        });

        // if the user clicked on an overlay, close the modal window
        this.elModal.addEventListener("click", (event)=>{
            if (
                !this.elModal.classList.contains("js-busy")
                && (event.target as HTMLElement).classList.contains("js-closeModal")
            ) {
                this.close();
            }
        });

        // if the user pressed the Esc key, close the modal window
        document.addEventListener("keydown", (event)=>{
            if (this.isShown() && event.key === "Escape") {
                this.close();
            }
        });

        // if the user tapped on a Back button, close the modal window
        window.addEventListener("popstate", ()=>{
            this.closeModalP();
        });
        
    }

    private handleTransitionEnd = ()=>{
        this.elModal.classList.remove("js-busy");

        if (this.elModal.classList.contains("js-closing")) {
            /* Закрыть модальное окно */
            hideEl(this.elModal);
            this.elModal.classList.remove("js-closing");
            document.body.classList.remove("js-modalShow");
        }
    };

    abstract openFunction(...parameters: any[]): void;

    // AI GENERATED
    private getScrollBarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    }

    open(...parameters: any[]) {
        this.elModal.classList.remove("js-closing");
        showEl(this.elModal);

        // Calculate the width of the scroll bar
        const scrollbarWidth = this.getScrollBarWidth();
        document.body.style.setProperty("--scrollbar-width", `${scrollbarWidth}px`);
        document.body.classList.add("js-modalShow");

        this.openFunction(...parameters);

        // Push the history state
        const state: CustomHistoryState = {modalOpen: true};
        window.history.pushState(state, "");
    }
    close(): Promise<void> {
        // Obtain the history state
        return new Promise((resolve)=>{
            const currentState = history.state as CustomHistoryState|null;
            if (currentState?.modalOpen) {
                window.addEventListener("popstate", ()=>{
                    resolve();
                }, {once: true});
                history.back();
            }
            // Close the modal window
            else {
                this.closeModalP();
                resolve();
            }
        });
    }
    isShown() {
        return !this.elModal.classList.contains("hide");
    }

    private closeModalP() {
        if (this.isShown()) {
            this.elModal.classList.add("js-closing");
        }
    }
}