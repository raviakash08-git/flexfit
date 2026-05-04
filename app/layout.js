import './globals.css';

export const metadata = {
  title: 'Flexfit — Member Registration',
  description: 'Register as a Flexfit gym member',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
