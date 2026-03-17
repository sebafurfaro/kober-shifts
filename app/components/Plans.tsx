"use client";
import { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter, Button, Table, TableHeader, TableBody, TableRow, TableCell, TableColumn, Slider } from "@heroui/react";
import { ChessQueen, Check } from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Link from "next/link";
import Typography from "./Typography";

const BASE_PRICE = 9900;
const PRICE_PER_EXTRA_USER = 3900;

export const Plans = () => {
    const [userCount, setUserCount] = useState(1);

    const monthlyPrice = BASE_PRICE + (userCount - 1) * PRICE_PER_EXTRA_USER;
    const formattedPrice = new Intl.NumberFormat("es-AR", { style: "decimal", minimumFractionDigits: 0 }).format(monthlyPrice);

    const packs = [
        {
          name: "Pack de 50 WhatsApp",
          price: "$1.900/mes",
          costPerMessage: "$38",
          discount: "-"
        },
        {
          name: "Pack de 100 WhatsApp",
          price: "$3.500/mes",
          costPerMessage: "$35",
          discount: "8%"
        },
        {
          name: "Pack de 200 WhatsApp",
          price: "$4.900/mes",
          costPerMessage: "$24.50",
          discount: "36%"
        },
        {
          name: "Pack de 500 WhatsApp",
          price: "$10.900/mes",
          costPerMessage: "$21.80",
          discount: "43%"
        },
        {
          name: "Pack de 1000 WhatsApp",
          price: "$19.900/mes",
          costPerMessage: "$19.90",
          discount: "48%"
        },
        {
          name: "Pack de 1500 WhatsApp",
          price: "$26.900/mes",
          costPerMessage: "$17.93",
          discount: "53%"
        },
        {
          name: "Pack de 2000 WhatsApp",
          price: "$34.900/mes",
          costPerMessage: "$17.45",
          discount: "54%"
        },
        {
          name: "Pack de 5000 WhatsApp",
          price: "$69.900/mes",
          costPerMessage: "$13.98",
          discount: "63%"
        }
      ]

      const message = `Hola, estoy interesado en el plan $ARS ${formattedPrice} para ${userCount} usuarios.`;

      const features = [
        "Turnos ilimitados",
        "Link personalizado de reservas",
        "Métricas de la plataforma",
        "Franjas horarias de disponibilidad",
        "Tiempo de vacaciones",
        "Asistencia técnica",
        "¿Usas planes de cobertura médica? También disponible"
      ];


    return(
      <>
        <section className="bg-gradient-to-b from-gray-900 to-gray-800 relative min-h-screen" id="precios">
          <img src="/glow-hero.svg" alt="" className="absolute bottom-0 z-0" />
          <div className="max-w-7xl w-full mx-auto px-4 flex flex-col items-center gap-8">
            <div className="space-y-4">
              <Typography variant="h2" color="white" className="font-bold text-center">Un plan simple que crece con tu negocio</Typography>
              <Typography variant="p" color="white" className="font-medium! text-center">Empezá con un usuario y sumá colaboradores. Sin límites de turnos. Sin sorpresas.</Typography>
            </div>
            <Card className="max-w-lg mx-auto w-full p-5 bg-white/10 border border-white/10 backdrop-blur-md shadow-xl">
              <CardHeader>
                  <Typography variant="h4" color="white" className="text-center mx-auto">Todo Incluido</Typography>
              </CardHeader>
              <CardBody>
                <ul className="list-none list-inside text-sm font-medium text-slate-800 space-y-1">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-3 w-3 text-green-600 mr-2" />
                      <Typography color="white" variant="p" className="text-sm">{feature}</Typography>
                    </li>
                  ))}
                </ul>
              </CardBody>
              <CardFooter className="flex flex-col gap-4">
                <div className="w-full">
                  <Slider
                    size="sm"
                    className="max-w-full text-white"
                    value={userCount}
                    onChange={(value) => setUserCount(Array.isArray(value) ? value[0] : value)}
                    label={<Typography variant="p" color="white" className="mb-3">Selecciona la cantidad de colaboradores</Typography>}
                    marks={[
                      { value: 1, label: "" },
                      { value: 5, label: "" },
                      { value: 10, label: "" },
                      { value: 15, label: "" },
                      { value: 20, label: "" },
                    ]}
                    maxValue={20}
                    minValue={1}
                    showTooltip={true}
                    step={1}
                  />
                  <div className="w-full flex items-center justify-between mb-2 -mt-3">
                    <span className="text-white text-sm ml-2">1</span>
                    <span className="text-white text-sm">20</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-end gap-2 text-white">
                      <span className="text-sm font-semibold">Desde</span>
                      <span className="text-sm font-medium">$</span>
                      <span className="text-5xl font-semibold">{formattedPrice}</span>
                      <span className="text-sm font-medium">/ mes</span>
                    </div>
                  </div>
                <Button 
                  as={Link} 
                  href={`https://wa.me/5491173740338?text=${message}`} 
                  variant="solid" 
                  className="w-full uppercase font-medium bg-accent text-white">Comprar</Button>
              </CardFooter>
            </Card>
          </div>
        </section>
        <section className="bg-slate-100 py-8 hidden">
          <div className="max-w-7xl mx-auto w-full px-4 md:px-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative flex items-center justify-center min-h-[260px] bg-white rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center justify-center rounded-full">
                    <DotLottieReact src="/chat.lottie" loop autoplay width={300} height={300} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between w-fit px-4 py-2 bg-white rounded-md space-x-1 shadow">
                    <ChessQueen className="w-4 h-4 text-yellow-500" />
                    <h2 className="text-base font-bold text-center text-slate-900">Recordatorios por WhatsApp</h2>
                  </div>
                  <h2 className="text-4xl font-bold text-primary mt-4">Hablales donde ya te están esperando</h2>
                  <h4 className="text-lg font-medium text-slate-900 mt-4">El 98% de las personas usan WhatsApp para comunicarse</h4>
                  <p className="text-base text-slate-800 my-4">Tu agenda puede estar perfecta en el sistema, pero si tus clientes no se acuerdan del turno, ese slot queda vacio. Los recordatorios por WhatsApp resuelven esto llegando directo al lugar donde tus clientes pasan mas tiempo: su celular.</p>
                  <ul className="list-none list-inside text-sm font-medium text-slate-800 space-y-1">
                    <li className="flex items-center"><Check className="h-3 w-3 text-green-600 mr-1" />Lo leen en minutos, no en horas.</li>
                    <li className="flex items-center"><Check className="h-3 w-3 text-green-600 mr-1" />Confirman con un toque.</li>
                    <li className="flex items-center"><Check className="h-3 w-3 text-green-600 mr-1" />No termina en spam.</li>
                    <li className="flex items-center"><Check className="h-3 w-3 text-green-600 mr-1" />El recordatorio 24hs antes, reduce notablemente las ausencias.</li>
                  </ul>
                </div>
              </div>
          </div>
        </section>
        <section className="bg-white py-24 hidden">
          <div className="max-w-7xl mx-auto w-full px-4 md:px-0 space-y-6">
            <h2 className="text-4xl font-bold text-center text-primary">Todos los packs de recordatorios</h2>
            <div className="max-w-2xl mx-auto w-full">
              <Table>
                <TableHeader>
                  <TableColumn>Pack</TableColumn>
                  <TableColumn>Precio</TableColumn>
                  <TableColumn>Costo por mensaje</TableColumn>
                  <TableColumn>Descuento</TableColumn>
                </TableHeader>
                <TableBody>
                  {packs.map((pack) => (
                    <TableRow key={pack.name}>
                      <TableCell>{pack.name}</TableCell>
                      <TableCell>{pack.price}</TableCell>
                      <TableCell className="text-right">{pack.costPerMessage}</TableCell>
                      <TableCell className="text-green-600 text-center font-medium">{pack.discount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </>
    )
}