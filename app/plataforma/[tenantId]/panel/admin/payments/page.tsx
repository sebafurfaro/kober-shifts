"use client";

import { PanelHeader } from "../../components/PanelHeader";
import { PaymentsForm, PaymentsConfigForm } from "./components";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/react";


export default function AdminPaymentsPage() {
    const router = useRouter();
    const params = useParams();
    const tenantId = params.tenantId as string;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="py-8">
                <PanelHeader
                    title="Pagos"
                    subtitle="Gestion de pagos por pasarelas, transferencias, depocitos, etc."
                    action={{
                        label: "Ver pagos",
                        onClick: () => {
                            router.push(`/plataforma/${tenantId}/panel/admin/payments/details`);
                        },
                    }}
                />
            </div>
            <div className="mt-6">
                <div className="grid gap-6">
                    <Card>
                        <CardBody className="p-6">
                            <PaymentsConfigForm />
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="p-0">
                            <PaymentsForm />
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    )
}