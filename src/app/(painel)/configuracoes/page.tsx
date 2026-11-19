import { PageTitle, Panel } from "@/components/shared";
import { DirectoryForm } from "@/components/directory-form";
import { saveClubSettings } from "@/lib/directory/actions";
import { panelRoles } from "@/lib/auth/access";
import { requirePageAccess } from "@/lib/auth/page-access";

export default async function SettingsPage() {
  const { client } = await requirePageAccess(panelRoles);
  const { data, error } = await client.from("club_settings").select("name, description").eq("id", 1).single();
  if (error) throw error;
  return <>
    <PageTitle title="Configurações" description="Gerencie a identificação do clube no Clube Connect." />
    <div className="settings-panel"><Panel title="Perfil do clube">
      <DirectoryForm action={saveClubSettings} submit="Salvar alterações">
        <label>Nome do clube<input required name="name" defaultValue={data.name} maxLength={60} /></label>
        <label>Descrição<textarea name="description" defaultValue={data.description} maxLength={300} rows={4} /></label>
      </DirectoryForm>
    </Panel></div>
  </>;
}