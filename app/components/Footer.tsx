import Link from "next/link"
import Typography from "./Typography"
import { Divider } from "@heroui/react"

export const Footer = () => {
    return(
        <footer className="w-full bg-gray-900">
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:grid md:grid-cols-2 items-center">
                <Typography variant="h5" color="white" className="font-bold!">NODO App</Typography>
                <Divider className="block md:hidden bg-white/20 my-4" />
                <ul className="flex items-center flex-col md:flex-row md:ml-auto gap-4">
                    <li><Link href="/terminos" className="text-base text-white">Terminos y Condiciones</Link></li>
                    <li className="w-2 hidden md:block"></li>
                    <li><Link href="/politicas" className="text-base text-white">Politicas de privacidad</Link></li>
                </ul>
                </div>
            </div>
        </footer>
    )
}