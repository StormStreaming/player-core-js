/**
 * Class responsible for operations on numbers
 */
export class DomUtilities {

    /**
     * Calculates element dimensions including margins
     * @param element
     */
    public static calculateDimensionsWithMargins(element: HTMLElement): { width: number, height: number } {

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        const paddingLeft = parseFloat(style.paddingLeft);
        const paddingRight = parseFloat(style.paddingRight);
        const paddingTop = parseFloat(style.paddingTop);
        const paddingBottom = parseFloat(style.paddingBottom);

        const borderLeft = parseFloat(style.borderLeftWidth);
        const borderRight = parseFloat(style.borderRightWidth);
        const borderTop = parseFloat(style.borderTopWidth);
        const borderBottom = parseFloat(style.borderBottomWidth);

        const width = rect.width - paddingLeft - paddingRight - borderLeft - borderRight;
        const height = rect.height - paddingTop - paddingBottom - borderTop - borderBottom;

        return { width, height };

    }
}
