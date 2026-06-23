import * as B from "@/base_script.js";

// ЗАГРУЗИТЬ

{
    const vcDatePeriod = document.getElementById("vcDatePeriod") as HTMLSpanElement;
    
    const birthDate = B.getPeriodUntilToday("22.05.2006");
    const years = birthDate.years;
    const periodText = `${years} ${B.sklonenieNoun(years, "год", "года", "лет")}`;
    if (birthDate.days === 0 && birthDate.months === 0) {
        // День рождения
        vcDatePeriod.textContent = `(${periodText}!)`;
        vcDatePeriod.classList.add("js-animatedDatePeriod");
    }
    else {

        // Обычный день
        vcDatePeriod.textContent = `(${periodText})`;
    }
    
}