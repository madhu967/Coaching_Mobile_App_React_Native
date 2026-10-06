import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap');

html, body, #root, div, span, p, a, button, input, textarea {
  font-family: 'Quicksand', sans-serif !important;
}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
