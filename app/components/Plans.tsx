"use client";
import { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter, Button, Table, TableHeader, TableBody, TableRow, TableCell, TableColumn, Slider } from "@heroui/react";
import { ChessQueen, Check } from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Link from "next/link";

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


    return(
      <>
        <section className="bg-white py-28">
          <div className="max-w-7xl w-full mx-auto px-4 grid grid-cols-1 md:grid-cols-2 items-center md:items-start gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-center md:text-left text-primary">Un plan simple que crece con tu negocio</h2>
              <p className="text-base font-medium text-center md:text-left text-slate-900">Empeza con un usuario y suma profesionales y recordatorios cuando necesites. Sin limites de turnos. Sin sorpresas.</p>
              <p className="italic text-[10px] text-center md:text-left text-slate-900 mt-4">El paquete de WhatsApp tiene un límite mensual segun el plan. Los turnos son ilimitados en todos los casos.</p>
            </div>
            <Card className="max-w-lg mx-auto w-full p-5">
              <CardHeader>
                  <h2 className="text-2xl font-bold text-center text-slate-900">Todo Incluido</h2>
                
              </CardHeader>
              <CardBody>
                <ul className="list-none list-inside text-sm font-medium text-slate-800 space-y-1">
                  <li className="flex items-center"><Check className="h-3 w-3 text-green-600 mr-1" />Turnos ilimitados</li>
                  <li className="flex items-center"><Check className="h-3 w-3 text-green-600 mr-1" />Confirmacion de turno por mail</li>
                  <li className="flex items-center"><Check className="h-3 w-3 text-green-600 mr-1" />1 Pack de 50 recordatorios por WhatsApp de Regalo</li>
                  <li className="flex items-center"><Check className="h-3 w-3 text-green-600 mr-1" />Metricas de la plataforma</li>
                  <li className="flex items-center"><Check className="h-3 w-3 text-green-600 mr-1" />Señas con MercadoPago</li>
                  <li className="flex items-center"><Check className="h-3 w-3 text-green-600 mr-1" />Franjas horarias de disponibilidad</li>
                  <li className="flex items-center"><Check className="h-3 w-3 text-green-600 mr-1" />Tiempo de vacaciones</li>
                  <li className="flex items-center"><Check className="h-3 w-3 text-green-600 mr-1" />Defini tu politica de cancelacion</li>
                </ul>
              </CardBody>
              <CardFooter className="flex flex-col gap-4">
                <div className="w-full">
          
                  <Slider
                    size="sm"
                    className="max-w-full"
                    value={userCount}
                    onChange={(value) => setUserCount(Array.isArray(value) ? value[0] : value)}
                    label=""
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
                </div>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-end gap-1">
                      <span className="text-sm font-medium text-slate-700">$</span>
                      <span className="text-5xl font-semibold text-primary">{formattedPrice}</span>
                      <span className="text-sm font-medium text-slate-700">/ mes</span>
                    </div>
                  </div>
                <Button as={Link} href={`https://wa.me/5491173740338?text=${message}`} variant="solid" color="primary" className="w-full uppercase font-medium">Comprar</Button>
              </CardFooter>
            </Card>
          </div>
        </section>
        <section className="bg-slate-100 py-8">
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
        <section className="bg-white py-24">
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