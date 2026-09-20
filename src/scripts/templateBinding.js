import globalVariables from '../config/globalVariables.js';
import fonts from '../config/fonts.js';

// Sets the main font for the application
document.documentElement.style.setProperty(
    '--main-font',
    fonts[globalVariables.FONT] || fonts.handwritten
);

// Template variables are injected from `src/config/globalVariables.js` into
// HTML elements using the `data-variable` attribute.
document.querySelectorAll("[data-variable]").forEach(element => {
    const value = globalVariables[element.dataset.variable];

    //Checks if the value is to be interpreted as literal HTML or pure text
    if (typeof value === 'string' && (value.includes('&') || value.includes('<') || value.includes('>'))) {
        element.innerHTML = value;
    } else {
        element.textContent = value;
    }
});