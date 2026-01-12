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
          <Header />
        </header>

        <main>{children}</main>

        <footer>
          <Footer />
        </footer>
      </body>
    </html>
  );
}
