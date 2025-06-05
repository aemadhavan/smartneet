import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        {/* Content for the 404 page */}
        <h1>404 - Page Not Found</h1>
        <p>Sorry, the page you are looking for could not be found.</p>
        <Link href="/">Go back to Home</Link>
      </body>
    </html>
  );
}