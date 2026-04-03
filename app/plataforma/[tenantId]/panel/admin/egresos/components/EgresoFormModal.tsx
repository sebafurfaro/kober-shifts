"use client";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Checkbox,
} from "@heroui/react";
import { EXPENSE_CATEGORY_SUGGESTIONS } from "@/lib/tenant-expense-categories";

export type EgresoFormValues = {
  title: string;
  category: string;
  description: string;
  amount: string;
  expenseDate: string;
  isRecurring: boolean;
};

const emptyValues = (): EgresoFormValues => ({
  title: "",
  category: "",
  description: "",
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  isRecurring: false,
});

export function EgresoFormModal(props: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: EgresoFormValues) => Promise<void>;
  initial?: EgresoFormValues | null;
  title: string;
  submitLabel: string;
  isSubmitting: boolean;
}) {
  const { isOpen, onClose, onSubmit, initial, title, submitLabel, isSubmitting } = props;
  const [values, setValues] = React.useState<EgresoFormValues>(emptyValues);

  React.useEffect(() => {
    if (isOpen) {
      setValues(initial ? { ...initial } : emptyValues());
    }
  }, [isOpen, initial]);

  const handleSubmit = async () => {
    await onSubmit(values);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside" backdrop="blur" className="custom-dialog">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
        <ModalBody className="gap-4">
          <Input
            label="Título"
            placeholder="Ej. Alquiler local"
            value={values.title}
            onValueChange={(v) => setValues((s) => ({ ...s, title: v }))}
            isRequired
          />
          <Select
            label="Categoría"
            placeholder="Elegí una categoría"
            selectedKeys={values.category ? new Set([values.category]) : new Set()}
            onSelectionChange={(keys) => {
              const k = Array.from(keys)[0];
              setValues((s) => ({ ...s, category: typeof k === "string" ? k : "" }));
            }}
            isRequired
          >
            {EXPENSE_CATEGORY_SUGGESTIONS.map((c) => (
              <SelectItem key={c}>{c}</SelectItem>
            ))}
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Fecha"
              value={values.expenseDate}
              onValueChange={(v) => setValues((s) => ({ ...s, expenseDate: v }))}
              isRequired
            />
            <Input
              type="number"
              label="Monto"
              placeholder="0.00"
              min={0}
              step="0.01"
              value={values.amount}
              onValueChange={(v) => setValues((s) => ({ ...s, amount: v }))}
              startContent={<span className="text-default-400 text-sm">$</span>}
              isRequired
            />
          </div>
          <Textarea
            label="Descripción"
            placeholder="Detalle opcional del egreso"
            value={values.description}
            onValueChange={(v) => setValues((s) => ({ ...s, description: v }))}
            minRows={2}
          />
          <Checkbox
            isSelected={values.isRecurring}
            onValueChange={(v) => setValues((s) => ({ ...s, isRecurring: v }))}
          >
            Recurrente (se repite todos los meses)
          </Checkbox>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isSubmitting}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
