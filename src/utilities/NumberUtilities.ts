/**
 * Class responsible for operations on numbers
 */
export class NumberUtilities {

    /**
     * Adds leading "zero" before the number and returns it as a string. Example: "1" -> "01"
     * @param number
     */
    public static addLeadingZero(number: number): string {
        if (number < 10) {
            return "0" + number;
        } else {
            return String(number);
        }
    }


    public static isNear(currentBuffer:number, target:number, targetMargin:number):boolean {
        return Math.abs(currentBuffer - target) <= targetMargin;
    }

    public static formatTime(seconds: number): string {
        // Obliczanie godzin, minut i sekund
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        // Ręczne dodawanie wiodących zer, jeśli liczba jest mniejsza niż 10
        const formattedHours = (hours < 10 ? '0' : '') + hours;
        const formattedMinutes = (minutes < 10 ? '0' : '') + minutes;
        const formattedSeconds = (secs < 10 ? '0' : '') + secs;

        // Zwracanie czasu w formacie HH:MM:SS
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }

    public static generateUniqueString(length: number): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    public static fibonacci(n: number): number {
        let a = 0, b = 1, c = 0;
        if (n <= 0) return 0;
        for (let i = 2; i <= n; i++) {
            c = a + b;
            a = b;
            b = c;
        }
        return b;
    }

    public static parseValue = (value: number | string) => {
        if (typeof value === 'string') {

            const isPixels = value.toLowerCase().endsWith('px');
            const numericValue = parseInt(value, 10);

            return {
                value: numericValue,
                isPixels: isPixels
            };
        } else {
            return {
                value: value,
                isPixels: true
            };
        }
    };

}