import { AppShell } from '@/components/layout/app-shell';
import { IntakeWizard } from '@/components/harvest/intake-wizard';

export const instant = false;

export default function NewHarvestPage() {
  return <AppShell><IntakeWizard /></AppShell>;
}
