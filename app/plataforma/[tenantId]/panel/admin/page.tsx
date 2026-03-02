"use client";

import * as React from "react";
import { Card, CardBody, Alert, Spinner, Button, Select, SelectItem, Textarea, Tabs, Tab } from "@heroui/react";
import { CircleUser, Cog, Settings } from "lucide-react"
import { DetailsTab } from "./components/admin/DetailsTab";
import { SettingsTab } from "./components/admin/SettingsTab";
import { IntegrationsTab } from "./components/admin/IntegrationsTab";
import { PanelHeader } from "../components/PanelHeader";
import { WhatsappTab } from "./components/admin/WhatsappTab";

export default function AdminPage() {
  return (
    <div className="mt-8">
      <PanelHeader title="Administra tu negocio" subtitle="Gestiona los detalles de tu negocio, ajustes y configuraciones." />
      <Card className="p-4">
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
              <CircleUser className="w-5 h-5" />
              <span className="text-medium">Integraciones</span>
            </div>
          }>
            <IntegrationsTab />
          </Tab>
          <Tab key="whatsapp" title={
            <div className="flex items-center gap-1">
              <CircleUser className="w-5 h-5" />
              <span className="text-medium">Recordatorios</span>
            </div>
          }>
            <WhatsappTab />
          </Tab>
        </Tabs>
      </Card>
    </div>
  );
}