export function debounce(func, delay) {
    let timeoutId;

    return function (...args) {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

export function throttle(func, delay) {
    let inThrottle;
    let lastArgs;
    let lastThis;

    return function (...args) {
        lastArgs = args;
        lastThis = this;

        if (!inThrottle) {
            func.apply(lastThis, lastArgs);
            inThrottle = true;

            setTimeout(() => {
                inThrottle = false;

                if (lastArgs) {
                    func.apply(lastThis, lastArgs);
                    lastArgs = null;
                    lastThis = null;
                }
            }, delay);
        }
    };
}

export function roundDecimals(number, precision) {
    if (countDecimalPlaces(number) <= precision) {
        return number;
    }

    const factor = Math.pow(10, precision);
    
    return Math.round(number * factor) / factor;
}

function countDecimalPlaces(number) {
    const numberAsString = number.toString();

    if (numberAsString.includes('.')) {
        return numberAsString.split('.')[1].length;
    } 

    return 0;
}