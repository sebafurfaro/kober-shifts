export const CustomSwitch = ({ isSelected, setIsSelected }: { isSelected: boolean, setIsSelected: (selected: boolean) => void }) => {
    return (
        <div
            className="relative inline-flex items-center rounded-full bg-accent-third/10 p-1 cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => setIsSelected(!isSelected)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsSelected(!isSelected);
                }
            }}
        >
            <div className="relative flex">
                <span
                    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 z-10 cursor-pointer ${!isSelected ? 'text-white' : 'text-primary'
                        }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsSelected(false);
                    }}
                >
                    Mensual
                </span>
                <span
                    className={`px-5 py-2 text-sm font-medium transition-colors duration-200 z-10 cursor-pointer ${isSelected ? 'text-white' : 'text-primary'
                        }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsSelected(true);
                    }}
                >
                    Anual
                </span>
                <div
                    className={`absolute top-1 bottom-1 rounded-full transition-all duration-200 ${isSelected
                        ? 'left-1/2 right-1 bg-accent'
                        : 'left-1 right-1/2 bg-accent'
                        }`}
                    style={{
                        width: 'calc(50% - 4px)'
                    }}
                />
            </div>
        </div>
    )
}