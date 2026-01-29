export const Dashboard = () => {
    return (
        <section className="bg-linear-to-t from-blue-200 via-blue-50 to-white pt-36">
            <div className="max-w-5xl mx-auto w-full px-4 md:px-0">
                <div className="flex flex-col items-center justify-center space-y-6 mb-12">
                    <div className="flex items-center justify-between w-fit px-4 py-2 bg-white rounded-md shadow">
                        <h2 className="text-base font-bold text-center text-primary">Descubri y explora</h2>
                    </div>
                    <h2 className="text-4xl font-bold text-center text-primary">Tu agenda <span className="text-accent">donde la necesites</span> </h2>
                    <p className="text-slate-900 text-base font-medium text-center">NODO App Turnos es la solución perfecta para gestionar tu agenda de manera inteligente y eficiente. <br /> Con una interfaz intuitiva y una amplia gama de funcionalidades, puedes organizar tu tiempo, gestionar tus turnos y maximizar tus ingresos sin complicaciones.</p>
                </div>
            </div>
            <img src="/dashboard.png" alt="Dashboard" className="px-4 md:px-0 max-w-5xl mx-auto w-full h-auto" />
        </section>
    )
}