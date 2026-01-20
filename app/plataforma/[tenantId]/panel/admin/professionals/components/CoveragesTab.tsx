"use client";

import * as React from "react";
import {
	Box,
	Typography,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Stack,
	TextField,
	InputAdornment,
	CircularProgress,
	Button,
	Switch,
	Divider,
	List,
	ListItem,
	ListItemText,
} from "@mui/material";
import {
	ExpandMore as ExpandMoreIcon,
	Search as SearchIcon,
	Add as AddIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { SwitchProps } from "@mui/material";
import { ProfessionalFormData, SelectedCoverage } from "./types";

const IOSSwitch = styled((props: SwitchProps) => (
	<Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
	width: 42,
	height: 26,
	padding: 0,
	'& .MuiSwitch-switchBase': {
		padding: 0,
		margin: "2px",
		transitionDuration: '300ms',
		'&.Mui-checked': {
			transform: 'translateX(16px)',
			color: '#fff',
			'& + .MuiSwitch-track': {
				backgroundColor: '#2e72caff',
				opacity: 1,
				border: 0,
				...theme.applyStyles('dark', {
					backgroundColor: '#2e72caff',
				}),
			},
			'&.Mui-disabled + .MuiSwitch-track': {
				opacity: 0.5,
			},
		},
		'&.Mui-focusVisible .MuiSwitch-thumb': {
			color: '#2e72ca',
			border: '6px solid #fff',
		},
		'&.Mui-disabled .MuiSwitch-thumb': {
			color: theme.palette.grey[100],
			...theme.applyStyles('dark', {
				color: theme.palette.grey[600],
			}),
		},
		'&.Mui-disabled + .MuiSwitch-track': {
			opacity: 0.7,
			...theme.applyStyles('dark', {
				opacity: 0.3,
			}),
		},
	},
	'& .MuiSwitch-thumb': {
		boxSizing: 'border-box',
		width: 22,
		height: 22,
	},
	'& .MuiSwitch-track': {
		borderRadius: 26 / 2,
		backgroundColor: '#E9E9EA',
		opacity: 1,
		transition: theme.transitions.create(['background-color'], {
			duration: 500,
		}),
		...theme.applyStyles('dark', {
			backgroundColor: '#39393D',
		}),
	},
}));

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

	React.useEffect(() => {
		async function fetchCoverages() {
			try {
				const res = await fetch("/api/admin/coverages");
				const data = await res.json();
				setAllCoverages(data);
			} catch (error) {
				console.error("Error fetching coverages:", error);
			} finally {
				setLoading(false);
			}
		}
		fetchCoverages();
	}, []);

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
			<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
				<CircularProgress size={24} />
			</Box>
		);
	}

	return (
		<Box>
			<Box sx={{ mb: 3 }}>
				<TextField
					fullWidth
					size="small"
					placeholder="Buscar cobertura o plan..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon fontSize="small" color="action" />
							</InputAdornment>
						),
					}}
				/>
			</Box>

			<Stack spacing={1}>
				{filteredCoverages.map((coverage) => {
					const selected = getSelectedCoverage(coverage.id);
					const activePlansCount = selected?.plans.filter((p) => p.active).length || 0;
					const totalPlansCount = coverage.plans.length;

					return (
						<Accordion key={coverage.id} variant="outlined" disableGutters>
							<AccordionSummary expandIcon={<ExpandMoreIcon />}>
								<Box sx={{ display: "flex", alignItems: "center", width: "100%", pr: 2 }}>
									<Typography sx={{ flexGrow: 1, fontWeight: 600 }}>
										{coverage.name}
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
										{selected ? `${activePlansCount}/${totalPlansCount}` : totalPlansCount} planes
									</Typography>
									<Button
										size="small"
										variant={selected ? "outlined" : "contained"}
										color={selected ? "error" : "success"}
										startIcon={selected ? null : <AddIcon />}
										onClick={(e) => {
											e.stopPropagation();
											toggleCoverage(coverage);
										}}
										sx={{ minWidth: 100 }}
									>
										{selected ? "Quitar" : "Agregar"}
									</Button>
								</Box>
							</AccordionSummary>
							<AccordionDetails sx={{ bgcolor: "white", p: 1 }}>
								{!selected ? (
									<Box sx={{ p: 4, textAlign: "center" }}>
										<Typography variant="body2" color="text.secondary" gutterBottom>
											Esta cobertura no está activa para este profesional.
										</Typography>
										<Button
											size="small"
											variant="text"
											onClick={() => toggleCoverage(coverage)}
										>
											Habilitar Cobertura
										</Button>
									</Box>
								) : (
									<Box>
										<List dense sx={{ py: 0, display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
											{coverage.plans.map((plan) => {
												const planState = selected.plans.find((p) => p.planId === plan.id);
												const isActive = planState?.active ?? false;

												return (
													<ListItem
														key={plan.id}
														secondaryAction={
															<IOSSwitch
																edge="end"
																checked={isActive}
																onChange={() => togglePlan(coverage.id, plan.id)}
															/>
														}
														sx={{
															transitionDuration: '300ms',
															bgcolor: "#f8fafc",
															p: 1,
															borderRadius: 1,
															"&:hover": { bgcolor: "#f1f5f9" }
														}}
													>
														<ListItemText
															primary={plan.name}
															secondary={isActive ? "Incluido" : "No incluido"}
															secondaryTypographyProps={{
																color: isActive ? "success.main" : "text.secondary",
																sx: { fontWeight: isActive ? 600 : 400, fontSize: "12px" }
															}}
														/>
													</ListItem>
												);
											})}
										</List>
									</Box>
								)}
							</AccordionDetails>
						</Accordion>
					);
				})}
				{filteredCoverages.length === 0 && (
					<Box sx={{ p: 4, textAlign: "center", bgcolor: "background.default", borderRadius: 1 }}>
						<Typography color="text.secondary">
							No se encontraron coberturas que coincidan con la búsqueda.
						</Typography>
					</Box>
				)}
			</Stack>
		</Box>
	);
}
