"use client";

import * as React from "react";
import { Card, Tabs, Tab, Accordion, AccordionItem } from "@heroui/react";
import { CircleUser, Cog, Blocks, BellRing } from "lucide-react"
import { DetailsTab } from "./components/admin/DetailsTab";
import { SettingsTab } from "./components/admin/SettingsTab";
import { IntegrationsTab } from "./components/admin/IntegrationsTab";
import { PanelHeader } from "../components/PanelHeader";
import { WhatsappTab } from "./components/admin/WhatsappTab";
import { Section } from "../components/layout/Section";

export default function AdminPage() {
  return (
    <Section>
      <PanelHeader title="Administra tu negocio" subtitle="Gestiona los detalles de tu negocio, ajustes y configuraciones." />
      <Card className="p-4 hidden md:block">
        <Tabs classNames={{
          base: "w-full",
          tabList: "gap-2 md:gap-6 w-full relative bg-gray-100 rounded-lg p-1",
          cursor: "bg-white rounded-lg transition-all duration-300 ease-in-out font-medium",
          tab: "md:max-w-fit px-2 md:px-4 h-12 rounded-md text-slate-800",
          tabContent: "group-data-[selected=true]:text-primary",
          panel: "p-0",
        }}>
          <Tab key="details" title={
            <div className="flex items-center gap-1">
              <CircleUser className="w-5 h-5" />
              <span className="text-medium">Detalles</span>
            </div>
          }>
            <DetailsTab />
          </Tab>
          <Tab key="settings" title={
            <div className="flex items-center gap-1">
              <Cog className="w-5 h-5" />
              <span className="text-medium">Ajustes</span>
            </div>
          }>
            <SettingsTab />
          </Tab>
          <Tab key="integrations" title={
            <div className="flex items-center gap-1">
              <Blocks className="w-5 h-5" />
              <span className="text-medium">Integraciones</span>
            </div>
          }>
            <IntegrationsTab />
          </Tab>
          <Tab key="whatsapp" title={
            <div className="flex items-center gap-1">
              <BellRing className="w-5 h-5" />
              <span className="text-medium">Recordatorios</span>
            </div>
          }>
            <WhatsappTab />
          </Tab>
        </Tabs>
      </Card>
      <Accordion variant="splitted" className="flex flex-col md:hidden space-y-2">
        <AccordionItem startContent={<CircleUser className="w-5 h-5" />} title="Detalles">
          <DetailsTab />
        </AccordionItem>
        <AccordionItem startContent={<Cog className="w-5 h-5" />} title="Ajustes">
          <SettingsTab />
        </AccordionItem>
        <AccordionItem startContent={<Blocks className="w-5 h-5" />} title="Integraciones">
          <IntegrationsTab />
        </AccordionItem>
        <AccordionItem startContent={<BellRing className="w-5 h-5" />} title="Recordatorios">
          <WhatsappTab />
        </AccordionItem>
      </Accordion>
    </Section>
  );
}