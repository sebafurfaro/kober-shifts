export const Section = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={(`max-w-7xl mx-auto` + ` ` + className).trim()}>
        <div className="py-3">
            {children}
        </div>
    </div>
  );
}