import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/favicon.svg"
            alt="Kala Karsa Bakery Logo"
            {...props}
        />
    );
}
