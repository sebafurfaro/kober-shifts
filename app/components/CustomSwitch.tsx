export const CustomSwitch = ({ isSelected, setIsSelected }: { isSelected: boolean, setIsSelected: (selected: boolean) => void }) => {
    return (
        <div
            className="relative inline-flex items-center rounded-lg border border-gray-700 bg-gray-800/50 p-1 cursor-pointer"
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
                    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 z-10 cursor-pointer ${!isSelected ? 'text-white' : 'text-gray-400'
                        }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsSelected(false);
                    }}
                >
                    Mensual
                </span>
                <span
                    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 z-10 cursor-pointer ${isSelected ? 'text-white' : 'text-gray-400'
                        }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsSelected(true);
                    }}
                >
                    Anual
                </span>
                <div
                    className={`absolute top-1 bottom-1 rounded-md transition-all duration-200 ${isSelected
                        ? 'left-1/2 right-1 bg-[#9333ea]'
                        : 'left-1 right-1/2 bg-[#9333ea]'
                        }`}
                    style={{
                        width: 'calc(50% - 4px)'
                    }}
                />
            </div>
        </div>
    )
}