"use client";

import { Tabs, Tab, Card, CardBody, Input, Button } from "@heroui/react";
import { useParams } from "next/navigation";
import * as React from "react";

export function PaymentsForm() {
    const params = useParams();
    const tenantId = params.tenantId as string;
    const [selectedTab, setSelectedTab] = React.useState<"bank" | "mercadopago">("bank");
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [formData, setFormData] = React.useState({
        bank: {
            bankName: "",
            accountHolder: "",
            accountNumber: "",
            cbu: "",
            alias: "",
        },
        mercadoPago: {
            publicKey: "",
            accessToken: "",
            webhookSecret: "",
        },
    });

    React.useEffect(() => {
        async function loadPayments() {
            try {
                setLoading(true);
                const res = await fetch(`/api/plataforma/${tenantId}/admin/payments`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to load payments");
                const data = await res.json();
                setFormData({
                    bank: {
                        bankName: data?.bank?.bankName || "",
                        accountHolder: data?.bank?.accountHolder || "",
                        accountNumber: data?.bank?.accountNumber || "",
                        cbu: data?.bank?.cbu || "",
                        alias: data?.bank?.alias || "",
                    },
                    mercadoPago: {
                        publicKey: data?.mercadoPago?.publicKey || "",
                        accessToken: data?.mercadoPago?.accessToken || "",
                        webhookSecret: data?.mercadoPago?.webhookSecret || "",
                    },
                });
            } catch (error) {
                console.error("Error loading payments:", error);
            } finally {
                setLoading(false);
            }
        }
        loadPayments();
    }, [tenantId]);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        try {
            setSaving(true);
            const res = await fetch(`/api/plataforma/${tenantId}/admin/payments`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error("Failed to save payments");
        } catch (error) {
            console.error("Error saving payments:", error);
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="flex w-full flex-col card" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-4">Metodos de cobro</h2>
            <Tabs
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(key as "bank" | "mercadopago")}
                aria-label="Tabs Pagos"
                className="w-full"
                classNames={{
                    base: "w-full",
                    tabList: "gap-2 md:gap-6 w-full relative bg-gray-100 rounded-lg p-1",
                    cursor: "bg-white rounded-lg transition-all duration-300 ease-in-out font-medium",
                    tab: "md:max-w-fit px-2 md:px-4 h-12 rounded-md text-slate-800",
                    tabContent: "group-data-[selected=true]:text-primary",
                    panel: "p-0",
                }}>
                <Tab key="bank" title="Transferencia Bancaria">
                    <Card>
                        <CardBody className="p-6 space-y-4">
                            <Input
                                label="Banco"
                                value={formData.bank.bankName}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    bank: { ...formData.bank, bankName: value },
                                })}
                                isDisabled={loading}
                            />
                            <Input
                                label="Titular"
                                value={formData.bank.accountHolder}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    bank: { ...formData.bank, accountHolder: value },
                                })}
                                isDisabled={loading}
                            />
                            <Input
                                label="Número de cuenta"
                                value={formData.bank.accountNumber}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    bank: { ...formData.bank, accountNumber: value },
                                })}
                                isDisabled={loading}
                            />
                            <Input
                                label="CBU"
                                value={formData.bank.cbu}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    bank: { ...formData.bank, cbu: value },
                                })}
                                isDisabled={loading}
                            />
                            <Input
                                label="Alias"
                                value={formData.bank.alias}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    bank: { ...formData.bank, alias: value },
                                })}
                                isDisabled={loading}
                            />
                        </CardBody>
                    </Card>
                </Tab>
                <Tab key="mercadopago" title="MercadoPago">
                    <Card>
                        <CardBody className="p-6 space-y-4">
                            <Input
                                label="Public key"
                                value={formData.mercadoPago.publicKey}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    mercadoPago: { ...formData.mercadoPago, publicKey: value },
                                })}
                                isDisabled={loading}
                            />
                            <Input
                                label="Access token"
                                type="password"
                                value={formData.mercadoPago.accessToken}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    mercadoPago: { ...formData.mercadoPago, accessToken: value },
                                })}
                                isDisabled={loading}
                            />
                            <Input
                                label="Webhook secret"
                                type="password"
                                value={formData.mercadoPago.webhookSecret}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    mercadoPago: { ...formData.mercadoPago, webhookSecret: value },
                                })}
                                isDisabled={loading}
                            />
                        </CardBody>
                    </Card>
                </Tab>
            </Tabs>
            <div className="mt-6 flex justify-end gap-3">
                <Button
                    type="submit"
                    color="success"
                    isDisabled={loading || saving}
                    isLoading={saving}
                    className="button button-success"
                >
                    {saving ? "Guardando..." : "Guardar"}
                </Button>
            </div>
        </form>
    )
}