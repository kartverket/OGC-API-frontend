import { Suspense } from "react";
import "../styles/variables.css";
import { Footer, Header } from "@/components";
import "../styles/globals.css";
import "ol/ol.css";

export const metadata = {
  title: "OGC API | Kartverket",
  description: "En generisk front-end for OGC API",
  icons: {
    icon: "/gfx/favicon.png",
  },
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

        <main>{children}</main>

        <footer>
          <Footer />
        </footer>
      </body>
    </html>
  );
}
