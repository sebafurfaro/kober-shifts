import Link from "next/link"
import Typography from "./Typography"

export const Footer = () => {
    return(
        <footer className="w-full bg-primary">
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:grid md:grid-cols-2 items-center">
                <Typography variant="h5" color="white" className="font-bold!">NODO App</Typography>
                <ul className="flex items-center md:ml-auto gap-4">
                    <li><Link href="/terminos" className="text-base text-white">Terminos y Condiciones</Link></li>
                    <li className="w-2"></li>
                    <li><Link href="/politicas" className="text-base text-white">Politicas de privacidad</Link></li>
                </ul>
                </div>
            </div>
        </footer>
    )
}