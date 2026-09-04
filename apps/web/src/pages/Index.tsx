import { AppShell } from "@/components/layout/AppShell";
import { SectionEmpty } from "@/shared/components/states/QueryState";

const Index = () => (
  <AppShell title="Home">
    <SectionEmpty
      title="Nada por aqui ainda"
      description="Use o menu lateral para acessar os módulos disponíveis."
    />
  </AppShell>
);

export default Index;
