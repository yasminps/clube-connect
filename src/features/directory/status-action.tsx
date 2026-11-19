import { DirectoryDialog, DirectoryForm } from "@/components/directory-form";
import { setDirectoryStatus } from "@/lib/directory/actions";

export function StatusAction({ kind, id, name, active }: { kind: "unit" | "member"; id: string; name: string; active: boolean }) {
  const verb = active ? "Desativar" : "Ativar";
  return <DirectoryDialog title={verb + " " + name} trigger={verb}>
    <DirectoryForm action={setDirectoryStatus} submit={verb}>
      <p className="muted">{active ? "O cadastro e seu histórico serão preservados." : "O cadastro voltará a ficar ativo."}</p>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={String(!active)} />
    </DirectoryForm>
  </DirectoryDialog>;
}