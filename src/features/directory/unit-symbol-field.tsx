"use client";

import { useEffect, useState } from "react";
import { unitSymbolLimit, unitSymbolMime } from "./unit-symbol-rules";

export function UnitSymbolField({ current }: { current?: string | null }) {
  const [preview, setPreview] = useState<string>();
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const image = preview ?? (remove ? null : current);
  return <div className="form">
    <label>Símbolo da unidade <span className="muted">(opcional)</span>
      <input type="file" name="symbol" accept={unitSymbolMime.join(",")} aria-describedby="unit-symbol-hint" onChange={event => {
        const file = event.currentTarget.files?.[0];
        setPreview(undefined);
        setError("");
        if (!file) return;
        if (file.size > unitSymbolLimit || !unitSymbolMime.some(type => type === file.type)) {
          event.currentTarget.value = "";
          setError("Escolha uma imagem PNG, JPG ou WebP de até 200 KB.");
          return;
        }
        setRemove(false);
        setPreview(URL.createObjectURL(file));
      }} />
    </label>
    <p id="unit-symbol-hint" className="muted">PNG, JPG ou WebP, até 200 KB.</p>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {image && <img src={image} alt="Prévia do símbolo da unidade" className="unit-symbol-preview" width={78} height={78} />}
    {current && !preview && <label className="check-row"><input type="checkbox" name="removeSymbol" checked={remove} onChange={event => setRemove(event.target.checked)} />Remover símbolo atual</label>}
  </div>;
}