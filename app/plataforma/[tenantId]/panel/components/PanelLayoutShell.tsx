"use client";

import * as React from "react";
import Link from "next/link";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import EventIcon from "@mui/icons-material/Event";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BadgeIcon from "@mui/icons-material/Badge";
import CategoryIcon from "@mui/icons-material/Category";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useTheme } from "@mui/material/styles";
import { useParams } from "next/navigation";
import Logo from "@/app/branding/Logo";

type Role = "PATIENT" | "PROFESSIONAL" | "ADMIN";

const DRAWER_WIDTH = 260;

function NavItem(props: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <ListItemButton
      component={Link}
      href={props.href}
      sx={{
        color: "#ffffff",
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.1)",
        },
        "& .MuiListItemIcon-root": {
          color: "#ffffff",
        },
      }}
    >
      <ListItemIcon>{props.icon}</ListItemIcon>
      <ListItemText primary={props.label} />
    </ListItemButton>
  );
}

export function PanelLayoutShell({
  role,
  userName,
  tenantId,
  children,
}: {
  role: Role;
  userName: string;
  tenantId: string;
  children: React.ReactNode;
}) {
  const params = useParams();
  // Use prop if provided, otherwise fallback to params
  const currentTenantId = tenantId || (params.tenantId as string);
  const theme = useTheme();
  const isMobileQuery = useMediaQuery(theme.breakpoints.down("md"));
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    setIsMobile(isMobileQuery);
  }, [isMobileQuery]);

  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const configSections = { showLocations: true, showSpecialties: true };

  async function logout() {
    await fetch(`/api/plataforma/${currentTenantId}/auth/logout`, { method: "POST" });
    window.location.href = `/plataforma/${currentTenantId}/login`;
  }

  const adminItems = [
    {
      label: "Sedes",
      href: `/plataforma/${currentTenantId}/panel/admin/locations`,
      icon: <LocationOnIcon />,
      show: configSections?.showLocations ?? false,
    },
    {
      label: "Especialidades",
      href: `/plataforma/${currentTenantId}/panel/admin/specialties`,
      icon: <CategoryIcon />,
      show: configSections?.showSpecialties ?? true,
    },
    {
      label: "Profesionales",
      href: `/plataforma/${currentTenantId}/panel/admin/professionals`,
      icon: <BadgeIcon />,
      show: true,
    },
    {
      label: "Pacientes",
      href: `/plataforma/${currentTenantId}/panel/admin/patients`,
      icon: <PersonIcon />,
      show: true,
    },
    {
      label: "Coberturas",
      href: `/plataforma/${currentTenantId}/panel/admin/coberturas`,
      icon: <AssignmentIcon />,
      show: true,
    },
  ].filter(item => item.show);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ backgroundColor: "#ffffff" }}>
          {isMobile ? (
            <IconButton
              edge="start"
              onClick={() => setMobileDrawerOpen((v) => !v)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            <Logo width={40} height={40} />
          </Typography>
          <Typography variant="body2" color="text.primary" sx={{ mr: 2 }}>
            Hola, {userName}
          </Typography>
          <IconButton onClick={logout} title="Cerrar sesión">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileDrawerOpen : true}
        onClose={isMobile ? () => setMobileDrawerOpen(false) : undefined}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            backgroundColor: "#0e5287",
            color: "#ffffff",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {role !== "PATIENT" && (
              <NavItem href={`/plataforma/${currentTenantId}/panel`} label="Calendario" icon={<CalendarMonthIcon />} />
            )}
          </List>

          <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.2)" }} />

          <List>
            {(role === "PATIENT" || role === "ADMIN") && (
              <NavItem href={`/plataforma/${currentTenantId}/panel/patient`} label="Mis turnos" icon={<EventIcon />} />
            )}
            {(role === "PROFESSIONAL" || role === "ADMIN") && (
              <NavItem href={`/plataforma/${currentTenantId}/panel/professional`} label="Profesional" icon={<EventIcon />} />
            )}
            {role === "ADMIN" && <NavItem href={`/plataforma/${currentTenantId}/panel/admin`} label="Admin" icon={<AdminPanelSettingsIcon />} />}
          </List>

          {role === "ADMIN" ? (
            <>
              <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.2)" }} />
              <List>
                {adminItems.map((item) => (
                  <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
                ))}
              </List>
            </>
          ) : null}
          {role === "PROFESSIONAL" && (
            <>
              <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.2)" }} />
              <List>
                <NavItem href={`/plataforma/${currentTenantId}/panel/professional/patients`} label="Pacientes" icon={<PersonIcon />} />
              </List>
            </>
          )}
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 8,
          px: 3,
          ml: 0,
          backgroundImage: "linear-gradient(to bottom, #F3F8FC, #f4f8fa)",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}


