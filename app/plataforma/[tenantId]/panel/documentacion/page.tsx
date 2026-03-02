"use client";

import { Accordion, AccordionItem } from "@heroui/react";
import { PanelHeader } from "../components/PanelHeader";
import docs from "./docs.json";

export default function Documentacion() {
    return (
        <div className="mt-8">
            <PanelHeader title="Documentación" />
            {docs.map((doc) => (
                <Accordion key={doc.id} className="mb-4 last:mb-0">
                    <AccordionItem title={doc.titulo}>{doc.descripcion}</AccordionItem>
                </Accordion>
            ))}
        </div>
    )
}