import './globals.css';

export const metadata = {
  title: 'EcoFoodSync',
  description: 'Perishable food rescue coordination (MySQL + MongoDB)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
