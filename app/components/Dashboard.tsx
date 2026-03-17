import Typography from "./Typography"

export const Dashboard = () => {
    return (
        <section className="bg-linear-to-b from-gray-800 to-gray-900 pt-38 lg:pt-[150px] relative! overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                <div className="max-w-5xl mx-auto w-full px-4 md:px-0">
                    <div className="flex flex-col items-start justify-center space-y-6 px-4 lg:px-10 mb-12">
                        <div className="border border-accent p-1 w-60 rounded-full flex items-center justify-between mb-4 mx-auto lg:mr-auto" data-aos="slide-right">
                            <Typography variant="p" color="white" className="font-inter font-medium! ml-3">
                                NODO App Turnos
                            </Typography>
                            <div className="w-8 h-8 rounded-full flex justify-center items-center bg-accent">
                                <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M2.83398 8.00019L12.9081 8.00019M9.75991 11.778L13.0925 8.44541C13.3023 8.23553 13.4073 8.13059 13.4073 8.00019C13.4073 7.86979 13.3023 7.76485 13.0925 7.55497L9.75991 4.22241"
                                    stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                                />
                                </svg>
                            </div>
                        </div>
                        <Typography variant="h2" className="text-3xl lg:text-4xl font-bold text-center text-white" data-aos="slide-right" data-aos-delay="150">
                            Tu agenda <span className="text-accent">donde la necesites</span>
                        </Typography>
                        <Typography variant="p" color="white" className="font-medium!" data-aos="slide-right" data-aos-delay="300">
                            NODO App Turnos es la solución perfecta para gestionar tu agenda de manera inteligente y eficiente.
                        </Typography>
                        <Typography variant="p" color="white" className="font-medium!" data-aos="slide-right" data-aos-delay="400">Con una interfaz intuitiva y una amplia gama de funcionalidades, puedes organizar tu tiempo, gestionar tus turnos y maximizar tus ingresos sin complicaciones.</Typography>
                    </div>
                </div>
                <div>
                    <img src="/dashboard.png" alt="Dashboard" className="px-4 md:px-0 max-w-5xl mx-auto w-full h-auto"  data-aos="zoom-in" data-aos-delay="300"/>
                    <img src="/login.png" alt="mobile" className="absolute bottom-0 max-w-[100px] lg:max-w-[250px] w-full shadow-2xl" data-aos="zoom-in" data-aos-delay="400"/>
                </div>
            </div>
            <img src="/glow-hero.svg" alt="" className="absolute bottom-0 z-0 lg:h-auto h-screen" />
        </section>
    )
}