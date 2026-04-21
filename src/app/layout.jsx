import { Suspense } from "react";
import { Footer, Header, Provider } from "@/components";
import "../styles/globals.css";

export const metadata = {
    title: "OGC API | Kartverket",
    description: "En generisk front-end for OGC API",
    icons: {
        icon: "/gfx/favicon.png",
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="no">
            <body>
                <header>
                    {/* Suspense needed for static prerender of the Header that uses useSearchParams
          runs in devmode but build fails build without the suspense */}
                    <Suspense>
                        <Header />
                    </Suspense>
                </header>

                <main>
                    <Provider>
                        {children}
                    </Provider>
                </main>

                <footer>
                    <Footer />
                </footer>
            </body>
        </html>
    );
}
