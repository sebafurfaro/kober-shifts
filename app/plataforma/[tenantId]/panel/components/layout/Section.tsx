export const Section = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="max-w-7xl mx-auto md:mt-8">
        <div className="md:py-8 py-3">
            {children}
        </div>
    </div>
  );
}