"use client";

import * as React from "react";
import {
	Accordion,
	AccordionItem,
	Input,
	Spinner,
	Button,
	Switch,
	Chip,
} from "@heroui/react";
import {
	Search,
	Plus,
} from "lucide-react";
import { ProfessionalFormData, SelectedCoverage } from "./types";
import { useParams } from "next/navigation";

interface CoveragePlan {
	id: string;
	name: string;
}

interface Coverage {
	id: string;
	name: string;
	plans: CoveragePlan[];
}

interface CoveragesTabProps {
	formData: ProfessionalFormData;
	setFormData: React.Dispatch<React.SetStateAction<ProfessionalFormData>>;
}

export function CoveragesTab({ formData, setFormData }: CoveragesTabProps) {
	const [allCoverages, setAllCoverages] = React.useState<Coverage[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [search, setSearch] = React.useState("");

	const params = useParams();
	const tenantId = params.tenantId as string;

	React.useEffect(() => {
		async function fetchCoverages() {
			try {
				const res = await fetch(`/api/plataforma/${tenantId}/admin/coverages`);
				const data = await res.json();
				setAllCoverages(data);
			} catch (error) {
				console.error("Error fetching coverages:", error);
			} finally {
				setLoading(false);
			}
		}
		fetchCoverages();
	}, [tenantId]);

	const getSelectedCoverage = (coverageId: string) => {
		return formData.medicalCoverages?.find((c) => c.coverageId === coverageId);
	};

	const toggleCoverage = (coverage: Coverage) => {
		setFormData((prev) => {
			const currentCoverages = prev.medicalCoverages || [];
			const alreadySelected = currentCoverages.some((c) => c.coverageId === coverage.id);

			if (alreadySelected) {
				return {
					...prev,
					medicalCoverages: currentCoverages.filter((c) => c.coverageId !== coverage.id),
				};
			} else {
				const newSelection: SelectedCoverage = {
					coverageId: coverage.id,
					plans: coverage.plans.map((p) => ({ planId: p.id, active: true })),
				};
				return {
					...prev,
					medicalCoverages: [...currentCoverages, newSelection],
				};
			}
		});
	};

	const togglePlan = (coverageId: string, planId: string) => {
		setFormData((prev) => {
			const currentCoverages = prev.medicalCoverages || [];
			const newCoverages = currentCoverages.map((c) => {
				if (c.coverageId === coverageId) {
					return {
						...c,
						plans: c.plans.map((p) => (p.planId === planId ? { ...p, active: !p.active } : p)),
					};
				}
				return c;
			});
			return { ...prev, medicalCoverages: newCoverages };
		});
	};

	const filteredCoverages = allCoverages.filter((c) =>
		c.name.toLowerCase().includes(search.toLowerCase()) ||
		c.plans.some(p => p.name.toLowerCase().includes(search.toLowerCase()))
	);

	if (loading) {
		return (
			<div className="flex justify-center items-center py-8">
				<Spinner size="md" />
			</div>
		);
	}

	return (
		<div>
			<div className="mb-6">
				<Input
					fullWidth
					size="sm"
					placeholder="Buscar cobertura o plan..."
					value={search}
					onValueChange={setSearch}
					startContent={<Search className="w-4 h-4 text-gray-400" />}
					className="w-full"
					classNames={{
						base: "mb-4",
						inputWrapper: "h-11 border-2 border-gray-200 bg-white focus-within:ring-0 focus-within:outline-none",
						input: "px-4 text-sm text-gray-800 focus:outline-none focus:ring-0",
						label: "text-sm font-medium text-gray-500",
					}}
				/>
			</div>

			<Accordion variant="splitted" className="w-full mt-4 space-y-2 px-0 md:px-2">
				{filteredCoverages.map((coverage) => {
					const selected = getSelectedCoverage(coverage.id);
					const activePlansCount = selected?.plans.filter((p) => p.active).length || 0;
					const totalPlansCount = coverage.plans.length;

					return (
						<AccordionItem
							key={coverage.id}
							aria-label={coverage.name}
							classNames={{
								base: "border-[1px] border-gray-200 rounded-lg px-0",
								indicator: "mr-4 text-slate-800",
							}}
							title={
								<div className="flex flex-col md:flex-row items-center justify-between w-full pl-4">
									<span className="font-semibold flex-1 text-left text-slate-800">{coverage.name}</span>
									<span className="text-xs text-gray-500 mr-4">
										{selected ? `${activePlansCount}/${totalPlansCount}` : totalPlansCount} planes
									</span>
									<div
										onClick={(e) => {
											e.stopPropagation();
											e.preventDefault();
											toggleCoverage(coverage);
										}}
										onMouseDown={(e) => {
											e.stopPropagation();
										}}
										className={`
											min-w-24 px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer
											transition-all duration-200 flex items-center gap-2 justify-center
											${selected 
												? "border-2 border-red-500 text-red-600 hover:bg-red-50" 
												: "button-secondary"
											}
										`}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												e.stopPropagation();
												toggleCoverage(coverage);
											}
										}}
									>
										{!selected && <Plus className="w-4 h-4" />}
										{selected ? "Quitar" : "Agregar"}
									</div>
								</div>
							}
						>
								{!selected ? (
									<div className="p-8 text-center">
										<p className="text-sm text-gray-600 mb-4">
											Esta cobertura no está activa para este profesional.
										</p>
										<Button
											size="sm"
											variant="light"
											onPress={() => toggleCoverage(coverage)}
										>
											Habilitar Cobertura
										</Button>
									</div>
								) : (
									<div>
										<div className="flex flex-col gap-2 py-2 w-full">
											{coverage.plans.map((plan) => {
												const planState = selected.plans.find((p) => p.planId === plan.id);
												const isActive = planState?.active ?? false;

												return (
													<div
														key={plan.id}
														className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
													>
														<div className="flex-1">
															<p className="text-sm font-medium text-gray-900">{plan.name}</p>
															<p className={`text-xs ${isActive ? "text-success font-semibold" : "text-gray-500"}`}>
																{isActive ? "Incluido" : "No incluido"}
															</p>
														</div>
														<Switch
															isSelected={isActive}
															onValueChange={() => togglePlan(coverage.id, plan.id)}
															color="success"
															size="md"
														/>
													</div>
												);
											})}
										</div>
									</div>
								)}
							</AccordionItem>
					);
				})}
			</Accordion>
			{filteredCoverages.length === 0 && (
				<div className="p-8 text-center bg-gray-50 rounded-lg">
					<p className="text-sm text-gray-600">
						No se encontraron coberturas que coincidan con la búsqueda.
					</p>
				</div>
			)}
		</div>
	);
}
