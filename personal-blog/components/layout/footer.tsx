export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
          <p className="text-sm text-muted-foreground">
            © {currentYear} My Blog. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
