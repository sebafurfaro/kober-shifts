# Plan de Migración: Material-UI → HeroUI

## 📋 Resumen Ejecutivo

Este documento describe el plan de migración gradual de Material-UI (MUI) a HeroUI en el proyecto `kober-shifts`. La migración se realizará de forma incremental, manteniendo MUI para componentes complejos durante la transición y usando HeroUI para nuevos componentes y refactorizaciones.

**Estrategia**: Migración gradual por componentes, empezando por los más simples y reutilizables.

---

## 🎯 Objetivos

1. **Reducir dependencias**: Eliminar MUI gradualmente para reducir el bundle size
2. **Mejorar consistencia**: Unificar el sistema de diseño con HeroUI + Tailwind
3. **Mantener funcionalidad**: Asegurar que todos los componentes migrados funcionen igual o mejor
4. **Migración gradual**: Permitir desarrollo continuo sin interrupciones

---

## 📊 Inventario de Componentes MUI

### Componentes Identificados (42 archivos)

#### **Layout & Structure**
- `Container` - 15+ usos
- `Box` - 30+ usos
- `Grid` - 20+ usos
- `Stack` - 10+ usos
- `Paper` - 25+ usos

#### **Typography**
- `Typography` - 40+ usos

#### **Buttons & Actions**
- `Button` - 30+ usos
- `IconButton` - 10+ usos

#### **Forms & Inputs**
- `TextField` - 20+ usos
- `Select` / `MenuItem` - 15+ usos
- `FormControl` / `InputLabel` - 10+ usos
- `Switch` - 5+ usos
- `Checkbox` - 3+ usos

#### **Feedback & Dialogs**
- `Alert` - 15+ usos
- `CircularProgress` - 10+ usos
- `Dialog` / `DialogTitle` / `DialogContent` / `DialogActions` - 20+ usos

#### **Data Display**
- `Table` / `TableBody` / `TableCell` / `TableContainer` / `TableHead` / `TableRow` - 10+ usos
- `Chip` - 8+ usos
- `Avatar` - 5+ usos
- `List` / `ListItem` / `ListItemText` - 5+ usos
- `Pagination` - 3+ usos

#### **Navigation**
- `Breadcrumbs` - 2+ usos
- `Divider` - 5+ usos

#### **Icons**
- `@mui/icons-material` - 19 archivos

#### **Theming**
- `ThemeProvider` / `createTheme` / `useTheme` - Sistema completo
- `styled` - 5+ usos
- `CssBaseline` - 2 usos

---

## 🔄 Mapeo MUI → HeroUI

### ✅ Migración Directa (Equivalente Existe)

| MUI Component | HeroUI Component | Notas |
|--------------|------------------|-------|
| `Button` | `Button` | API similar, props diferentes |
| `TextField` | `Input` | HeroUI tiene `Input` con variantes |
| `Select` / `MenuItem` | `Select` / `SelectItem` | API similar |
| `Switch` | `Switch` | Compatible |
| `Checkbox` | `Checkbox` | Compatible |
| `Chip` | `Chip` | Compatible |
| `Avatar` | `Avatar` | Compatible |
| `Dialog` | `Modal` | HeroUI usa `Modal` con `useDisclosure` |
| `Alert` | `Alert` | Compatible |
| `CircularProgress` | `Spinner` | HeroUI usa `Spinner` |
| `Pagination` | `Pagination` | Compatible |
| `Divider` | `Divider` | Compatible |

### ⚠️ Migración con Adaptación (Requiere Cambios)

| MUI Component | HeroUI Alternativa | Estrategia |
|--------------|-------------------|------------|
| `Container` | `div` + Tailwind classes | Usar `max-w-*` de Tailwind |
| `Box` | `div` + Tailwind classes | Reemplazar con `div` + clases Tailwind |
| `Grid` | **Mantener MUI Grid** | MUI Grid es complejo, mantenerlo |
| `Stack` | `div` + Tailwind `flex` | Usar `flex flex-col` o `flex flex-row` |
| `Paper` | `Card` | HeroUI tiene `Card` con elevación |
| `Typography` | `div` / `h1-h6` + Tailwind | Usar elementos semánticos + clases |
| `Table` | `Table` | HeroUI tiene `Table` pero API diferente |
| `List` / `ListItem` | `Listbox` o `div` + Tailwind | Evaluar según uso |
| `Breadcrumbs` | `Breadcrumbs` | HeroUI tiene `Breadcrumbs` |

### 🚫 Sin Equivalente Directo (Mantener MUI)

| MUI Component | Razón | Estrategia |
|--------------|-------|------------|
| `Grid` | Sistema de grid complejo y bien establecido | **Mantener MUI Grid** |
| `FullCalendar` | No es MUI, es librería externa | Mantener |
| `ThemeProvider` | Sistema de theming diferente | Mantener MUI para Grid, usar HeroUI para resto |

---

## 📅 Plan de Migración por Fases

### **Fase 1: Componentes Base y Utilidades** (Semana 1-2)
**Objetivo**: Migrar componentes simples y reutilizables que no tienen dependencias complejas.

#### Prioridad Alta:
1. ✅ **AlertDialog** → `Modal` + `Alert` de HeroUI
2. ✅ **ConfirmationDialog** → `Modal` + `Button` de HeroUI
3. ✅ **Button** (en componentes simples) → `Button` de HeroUI
4. ✅ **Spinner/CircularProgress** → `Spinner` de HeroUI
5. ✅ **Chip** → `Chip` de HeroUI

#### Archivos a Migrar:
- `app/plataforma/[tenantId]/panel/components/alerts/AlertDialog.tsx`
- `app/plataforma/[tenantId]/panel/components/alerts/ConfirmationDialog.tsx`
- Componentes con `CircularProgress` simples
- Componentes con `Chip` simples

**Estimación**: 2-3 días

---

### **Fase 2: Formularios y Inputs** (Semana 3-4)
**Objetivo**: Migrar componentes de formulario, manteniendo la funcionalidad existente.

#### Prioridad Alta:
1. ✅ **TextField** → `Input` de HeroUI
2. ✅ **Select** → `Select` + `SelectItem` de HeroUI
3. ✅ **Switch** → `Switch` de HeroUI
4. ✅ **Checkbox** → `Checkbox` de HeroUI
5. ✅ **FormControl** → Wrapper con Tailwind

#### Archivos a Migrar:
- `app/plataforma/[tenantId]/panel/admin/page.tsx` (Switch)
- `app/plataforma/[tenantId]/panel/patient/nuevo-turno/page.tsx` (Select, FormControl)
- `app/plataforma/[tenantId]/login/page.tsx` (TextField)
- `app/store/login/page.tsx` (TextField)
- Formularios en componentes de admin

**Estimación**: 4-5 días

---

### **Fase 3: Layout y Estructura** (Semana 5-6)
**Objetivo**: Reemplazar componentes de layout con Tailwind, manteniendo Grid de MUI.

#### Prioridad Alta:
1. ✅ **Container** → `div` + `max-w-*` de Tailwind
2. ✅ **Box** → `div` + clases Tailwind
3. ✅ **Stack** → `div` + `flex` de Tailwind
4. ✅ **Paper** → `Card` de HeroUI
5. ⚠️ **Grid** → **MANTENER MUI** (muy complejo)

#### Archivos a Migrar:
- `app/plataforma/[tenantId]/panel/components/PanelHeader.tsx`
- `app/plataforma/[tenantId]/panel/admin/page.tsx`
- `app/plataforma/[tenantId]/panel/patient/page.tsx`
- Componentes de layout generales

**Estimación**: 5-6 días

---

### **Fase 4: Typography y Texto** (Semana 7)
**Objetivo**: Reemplazar Typography con elementos semánticos + Tailwind.

#### Prioridad Media:
1. ✅ **Typography** → `h1-h6`, `p`, `span` + clases Tailwind

#### Archivos a Migrar:
- Todos los archivos que usan `Typography`

**Estimación**: 3-4 días

---

### **Fase 5: Tablas y Data Display** (Semana 8-9)
**Objetivo**: Migrar tablas y componentes de visualización de datos.

#### Prioridad Media:
1. ✅ **Table** → `Table` de HeroUI
2. ✅ **Avatar** → `Avatar` de HeroUI
3. ✅ **List** → Evaluar `Listbox` o `div` + Tailwind

#### Archivos a Migrar:
- `app/plataforma/[tenantId]/panel/admin/patients/page.tsx`
- `app/plataforma/[tenantId]/panel/professional/patients/page.tsx`
- `app/plataforma/[tenantId]/panel/admin/professionals/page.tsx`
- `app/plataforma/[tenantId]/panel/patient/page.tsx`

**Estimación**: 4-5 días

---

### **Fase 6: Navegación y Componentes Complejos** (Semana 10)
**Objetivo**: Migrar componentes de navegación y componentes más complejos.

#### Prioridad Baja:
1. ✅ **Breadcrumbs** → `Breadcrumbs` de HeroUI
2. ✅ **Pagination** → `Pagination` de HeroUI
3. ⚠️ **Calendar** → Evaluar mantener FullCalendar o migrar

#### Archivos a Migrar:
- `app/plataforma/[tenantId]/panel/components/PanelLayoutShell.tsx`
- Componentes con Breadcrumbs
- Componentes con Pagination

**Estimación**: 3-4 días

---

### **Fase 7: Limpieza Final** (Semana 11-12)
**Objetivo**: Eliminar dependencias de MUI no utilizadas y optimizar.

#### Tareas:
1. ✅ Remover imports no utilizados de MUI
2. ✅ Remover `@mui/icons-material` (migrar a HeroUI icons o lucide-react)
3. ✅ Optimizar bundle size
4. ✅ Actualizar documentación
5. ✅ Testing completo

**Estimación**: 3-4 días

---

## 🛠️ Guía de Migración por Componente

### Ejemplo 1: Button

**Antes (MUI)**:
```tsx
import { Button } from "@mui/material";

<Button variant="contained" color="primary" onClick={handleClick}>
  Click me
</Button>
```

**Después (HeroUI)**:
```tsx
import { Button } from "@heroui/react";

<Button color="primary" onPress={handleClick}>
  Click me
</Button>
```

**Cambios**:
- `variant="contained"` → Por defecto en HeroUI
- `onClick` → `onPress`
- `color` → Similar pero valores pueden diferir

---

### Ejemplo 2: TextField → Input

**Antes (MUI)**:
```tsx
import { TextField } from "@mui/material";

<TextField
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={!!error}
  helperText={error}
/>
```

**Después (HeroUI)**:
```tsx
import { Input } from "@heroui/react";

<Input
  label="Email"
  type="email"
  value={email}
  onValueChange={setEmail}
  isInvalid={!!error}
  errorMessage={error}
/>
```

**Cambios**:
- `onChange` → `onValueChange` (recibe el valor directamente)
- `error` → `isInvalid`
- `helperText` → `errorMessage`

---

### Ejemplo 3: Dialog → Modal

**Antes (MUI)**:
```tsx
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";

const [open, setOpen] = useState(false);

<Dialog open={open} onClose={() => setOpen(false)}>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>Content</DialogContent>
  <DialogActions>
    <Button onClick={() => setOpen(false)}>Cancel</Button>
  </DialogActions>
</Dialog>
```

**Después (HeroUI)**:
```tsx
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";

const { isOpen, onOpen, onClose } = useDisclosure();

<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    <ModalHeader>Title</ModalHeader>
    <ModalBody>Content</ModalBody>
    <ModalFooter>
      <Button onPress={onClose}>Cancel</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

**Cambios**:
- `open` → `isOpen` con `useDisclosure` hook
- `DialogTitle` → `ModalHeader`
- `DialogContent` → `ModalBody`
- `DialogActions` → `ModalFooter`

---

### Ejemplo 4: Container/Box → Tailwind

**Antes (MUI)**:
```tsx
import { Container, Box } from "@mui/material";

<Container maxWidth="md" sx={{ mt: 4 }}>
  <Box sx={{ p: 2, display: "flex", gap: 2 }}>
    Content
  </Box>
</Container>
```

**Después (Tailwind)**:
```tsx
<div className="max-w-3xl mx-auto mt-8">
  <div className="p-4 flex gap-4">
    Content
  </div>
</div>
```

**Cambios**:
- `Container maxWidth="md"` → `max-w-3xl mx-auto`
- `sx={{ mt: 4 }}` → `mt-8`
- `sx={{ p: 2 }}` → `p-4`
- `sx={{ display: "flex", gap: 2 }}` → `flex gap-4`

---

### Ejemplo 5: Typography → Elementos Semánticos

**Antes (MUI)**:
```tsx
import { Typography } from "@mui/material";

<Typography variant="h1" fontWeight={700} color="text.primary">
  Title
</Typography>
<Typography variant="body1" color="text.secondary">
  Description
</Typography>
```

**Después (Tailwind)**:
```tsx
<h1 className="text-4xl font-bold text-gray-900">
  Title
</h1>
<p className="text-base text-gray-600">
  Description
</p>
```

**Cambios**:
- `variant="h1"` → `<h1>`
- `fontWeight={700}` → `font-bold`
- `color="text.primary"` → `text-gray-900`
- `variant="body1"` → `<p>`
- `color="text.secondary"` → `text-gray-600`

---

## ⚙️ Configuración Necesaria

### 1. Actualizar Providers

Ya está configurado `HeroUIProvider` en `app/providers.tsx`. ✅

### 2. Configurar Tema de HeroUI

Crear archivo `app/heroui-theme.ts`:

```tsx
import { createTheme } from "@heroui/react";

export const heroUITheme = createTheme({
  type: "light", // o "dark"
  theme: {
    colors: {
      primary: {
        50: "#e3f2fd",
        100: "#bbdefb",
        // ... colores personalizados
      },
    },
  },
});
```

### 3. Actualizar Providers con Tema

```tsx
import { HeroUIProvider } from "@heroui/react";
import { heroUITheme } from "./heroui-theme";

<HeroUIProvider theme={heroUITheme}>
  {/* ... */}
</HeroUIProvider>
```

---

## 🧪 Estrategia de Testing

### Por Fase:
1. **Unit Tests**: Verificar que componentes migrados funcionen igual
2. **Integration Tests**: Verificar interacciones entre componentes
3. **Visual Regression**: Comparar UI antes/después
4. **E2E Tests**: Verificar flujos completos

### Checklist de Validación:
- [ ] Componente renderiza correctamente
- [ ] Props funcionan como antes
- [ ] Estilos se ven similares o mejores
- [ ] Interacciones (click, hover, focus) funcionan
- [ ] Responsive funciona correctamente
- [ ] Accesibilidad mantenida o mejorada
- [ ] No hay errores en consola

---

## 📦 Gestión de Dependencias

### Durante la Migración:
- **Mantener MUI**: No remover hasta completar migración
- **Agregar HeroUI**: Ya instalado ✅
- **Coexistencia**: Ambos pueden coexistir durante la transición

### Después de la Migración:
- Remover `@mui/material`
- Remover `@mui/icons-material`
- Remover `@emotion/react` y `@emotion/styled` (si no se usan)
- **Mantener**: `@mui/material` solo para `Grid` (opcional)

---

## 🚨 Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Breaking changes en componentes migrados | Media | Alto | Testing exhaustivo, migración gradual |
| Pérdida de funcionalidad | Baja | Alto | Mapeo detallado, pruebas antes de deploy |
| Inconsistencias visuales | Media | Medio | Design system, guías de estilo |
| Tiempo de migración excede estimado | Alta | Medio | Priorización, fases incrementales |
| Conflictos entre MUI y HeroUI | Baja | Bajo | Ya configurado con `StyledEngineProvider` |

---

## 📈 Métricas de Éxito

### Objetivos Cuantitativos:
- [ ] Reducir bundle size en 30-40%
- [ ] Migrar 80%+ de componentes en 12 semanas
- [ ] 0 breaking changes en producción
- [ ] Mejorar Lighthouse score en 10+ puntos

### Objetivos Cualitativos:
- [ ] Código más mantenible
- [ ] Mejor consistencia visual
- [ ] Mejor experiencia de desarrollo
- [ ] Documentación actualizada

---

## 📝 Checklist de Migración por Archivo

Para cada archivo migrado:

- [ ] Reemplazar imports de MUI
- [ ] Actualizar componentes a HeroUI/Tailwind
- [ ] Verificar props y eventos (onClick → onPress, etc.)
- [ ] Verificar estilos y responsive
- [ ] Testing manual
- [ ] Actualizar tipos TypeScript si es necesario
- [ ] Commit con mensaje descriptivo
- [ ] Documentar cambios si son significativos

---

## 🔗 Recursos

- [HeroUI Documentation](https://heroui.com/docs)
- [HeroUI Components](https://heroui.com/docs/components)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MUI to HeroUI Migration Guide](https://heroui.com/docs/guide/migration)

---

## 📅 Timeline Resumido

| Fase | Duración | Componentes |
|------|----------|-------------|
| Fase 1: Base | 2 semanas | AlertDialog, ConfirmationDialog, Button, Spinner, Chip |
| Fase 2: Formularios | 2 semanas | Input, Select, Switch, Checkbox |
| Fase 3: Layout | 2 semanas | Container, Box, Stack, Paper |
| Fase 4: Typography | 1 semana | Typography |
| Fase 5: Tablas | 2 semanas | Table, Avatar, List |
| Fase 6: Navegación | 1 semana | Breadcrumbs, Pagination |
| Fase 7: Limpieza | 2 semanas | Remover dependencias, optimizar |

**Total estimado**: 12 semanas (3 meses)

---

## ✅ Próximos Pasos Inmediatos

1. **Revisar y aprobar este plan**
2. **Crear branch de migración**: `feature/mui-to-heroui-migration`
3. **Comenzar Fase 1**: Migrar AlertDialog y ConfirmationDialog
4. **Establecer sistema de tracking**: Issues o tickets por componente
5. **Configurar tema de HeroUI**: Crear `heroui-theme.ts`

---

**Última actualización**: 2025-01-20
**Versión del plan**: 1.0
