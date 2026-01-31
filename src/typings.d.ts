declare module '@/fb.js' {
    export default function initGame(): () => void;
    export function setGameUI(ui: any): void;
}
