import './globals.css';

export const metadata = {
  title: 'Auth Demo',
  description: 'Next.js + Express + Neon + JWT',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
