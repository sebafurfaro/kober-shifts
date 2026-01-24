import Link from "next/link";

export const CallToAction = () => {
    return (
        <div hidden className="block md:hidden fixed bottom-1 left-0 right-0 z-9999 p-1 mx-auto w-full flex items-center justify-center">
            <div className="w-full bg-slate-200 p-2 mx-auto w-full flex items-center justify-center rounded-lg flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-800">20% OFF el primer mes</h1>
                <Link
                    href="/login"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                    Registrate Ya!
                </Link>
            </div>
        </div>
    )
}