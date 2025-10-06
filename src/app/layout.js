import '../styles/globals.scss'

export const metadata = {
    title: 'OGC API front-end',
    description: 'En generisk front-end for OGC API',
};

export default function RootLayout({ children }) {
    return (
        <html lang='no'>
            <body>
                {children}
            </body>
        </html>
    );
}
