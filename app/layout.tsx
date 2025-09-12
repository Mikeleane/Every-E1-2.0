export const metadata = { title: "Every E1 - Minimal" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><meta charSet="utf-8" /></head>
      <body style={{fontFamily:"system-ui, Segoe UI, Arial, sans-serif", padding: 24}}>
        {children}
      </body>
    </html>
  );
}
